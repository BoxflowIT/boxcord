// Microsoft 365 React Query hooks
import { useCallback, useRef } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  type QueryClient
} from '@tanstack/react-query';
import { microsoft365Api } from '../../services/api';
import { isDesktop } from '../../utils/platform';
import { openExternalUrl } from '../../utils/platform';
import { toast } from '../../store/notification';
import type { OneDriveItemList, UpdateEventInput } from '../../types';

// ─── Sync intervals ─────────────────────────────────────────────────────────
// Polling keeps Boxcord in sync with changes made externally (Teams, web, mobile)
const FAST_POLL = 30 * 1000; // 30s — files: users expect near-instant sync
const NORMAL_POLL = 60 * 1000; // 60s — calendar: changes are less frequent
const SLOW_POLL = 5 * 60 * 1000; // 5m  — sites list: rarely changes

// Query keys
export const microsoftKeys = {
  status: ['microsoft', 'status'] as const,
  profile: ['microsoft', 'profile'] as const,
  oneDriveFiles: (folderId?: string) =>
    ['microsoft', 'onedrive', 'files', folderId] as const,
  oneDriveSearch: (query: string) =>
    ['microsoft', 'onedrive', 'search', query] as const,
  calendarEvents: (days?: number, start?: string, end?: string) =>
    ['microsoft', 'calendar', 'events', days, start, end] as const,
  sharePointSites: ['microsoft', 'sharepoint', 'sites'] as const,
  sharePointFiles: (siteId: string, folderId?: string) =>
    ['microsoft', 'sharepoint', siteId, 'files', folderId] as const,
  sharePointSearch: (siteId: string, query: string) =>
    ['microsoft', 'sharepoint', siteId, 'search', query] as const
};

/**
 * Wraps an async function so that on error the Microsoft status query is
 * invalidated (sidebar switches back to "Anslut Microsoft 365").
 */
function withAuthInvalidation<T>(
  qc: QueryClient,
  fn: () => Promise<T>
): () => Promise<T> {
  return async () => {
    try {
      return await fn();
    } catch (error) {
      qc.invalidateQueries({ queryKey: microsoftKeys.status });
      throw error;
    }
  };
}

// ─── Connection Status ───────────────────────────────────────────────────────

export function useMicrosoftStatus() {
  return useQuery({
    queryKey: microsoftKeys.status,
    queryFn: () => microsoft365Api.getStatus(),
    staleTime: 5 * 60 * 1000,
    retry: 1
  });
}

export function useMicrosoftDisconnect() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => microsoft365Api.disconnect(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['microsoft'] });
    }
  });
}

/**
 * Hook for initiating Microsoft 365 OAuth connection.
 * On desktop: opens external browser and polls for connection status,
 * since the OAuth callback lands in the browser, not the Electron app.
 * On web: just opens the URL (callback handles the rest via query params).
 */
export function useMicrosoftConnect() {
  const queryClient = useQueryClient();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const connect = useCallback(async () => {
    try {
      const { url } = await microsoft365Api.getConnectUrl();
      openExternalUrl(url);

      // On desktop, poll for status since callback goes to browser
      if (isDesktop()) {
        stopPolling();
        let attempts = 0;
        const maxAttempts = 60; // 3 min max (60 × 3s)

        pollRef.current = setInterval(async () => {
          attempts++;
          if (attempts > maxAttempts) {
            stopPolling();
            return;
          }
          try {
            const status = await microsoft365Api.getStatus();
            if (status.connected) {
              stopPolling();
              queryClient.invalidateQueries({ queryKey: ['microsoft'] });
              toast.success('Microsoft 365 ansluten!');
            }
          } catch {
            // Ignore errors, keep polling
          }
        }, 3000);
      }
    } catch {
      toast.error('Kunde inte starta anslutningen');
    }
  }, [queryClient, stopPolling]);

  return { connect, stopPolling };
}

// ─── OneDrive ────────────────────────────────────────────────────────────────

export function useOneDriveFiles(folderId?: string, enabled = true) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: microsoftKeys.oneDriveFiles(folderId),
    queryFn: withAuthInvalidation(qc, () =>
      microsoft365Api.listOneDriveFiles(folderId)
    ),
    enabled,
    staleTime: 15 * 1000,
    refetchInterval: FAST_POLL,
    refetchOnWindowFocus: true,
    retry: false
  });
}

export function useOneDriveSearch(query: string, enabled = true) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: microsoftKeys.oneDriveSearch(query),
    queryFn: withAuthInvalidation(qc, () =>
      microsoft365Api.searchOneDrive(query)
    ),
    enabled: enabled && query.length >= 2,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    retry: false
  });
}

export function useShareOneDriveItem() {
  return useMutation({
    mutationFn: (itemId: string) => microsoft365Api.shareOneDriveItem(itemId)
  });
}

export function useUploadOneDriveFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, folderId }: { file: File; folderId?: string }) =>
      microsoft365Api.uploadOneDriveFile(file, folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['microsoft', 'onedrive'] });
    }
  });
}

export function useDeleteOneDriveItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => microsoft365Api.deleteOneDriveItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['microsoft', 'onedrive'] });
    }
  });
}

// ─── Calendar ────────────────────────────────────────────────────────────────

export function useCalendarEvents(
  days?: number,
  enabled = true,
  startDateTime?: string,
  endDateTime?: string
) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: microsoftKeys.calendarEvents(days, startDateTime, endDateTime),
    queryFn: withAuthInvalidation(qc, () =>
      microsoft365Api.getCalendarEvents(days, startDateTime, endDateTime)
    ),
    enabled,
    staleTime: 30 * 1000,
    refetchInterval: NORMAL_POLL,
    refetchOnWindowFocus: true,
    retry: false
  });
}

export function useCreateCalendarEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: microsoft365Api.createCalendarEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['microsoft', 'calendar'] });
    }
  });
}

export function useUpdateCalendarEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      input
    }: {
      eventId: string;
      input: UpdateEventInput;
    }) => microsoft365Api.updateCalendarEvent(eventId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['microsoft', 'calendar'] });
    }
  });
}

export function useDeleteCalendarEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) =>
      microsoft365Api.deleteCalendarEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['microsoft', 'calendar'] });
    }
  });
}

// ─── SharePoint ──────────────────────────────────────────────────────────────

export function useSharePointSites(enabled = true) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: microsoftKeys.sharePointSites,
    queryFn: withAuthInvalidation(qc, () =>
      microsoft365Api.listSharePointSites()
    ),
    enabled,
    staleTime: SLOW_POLL,
    refetchInterval: SLOW_POLL,
    refetchOnWindowFocus: true,
    retry: false
  });
}

export function useSharePointFiles(
  siteId: string,
  folderId?: string,
  enabled = true
) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: microsoftKeys.sharePointFiles(siteId, folderId),
    queryFn: withAuthInvalidation(qc, () =>
      microsoft365Api.listSharePointFiles(siteId, folderId)
    ),
    enabled: enabled && !!siteId,
    staleTime: 15 * 1000,
    refetchInterval: FAST_POLL,
    refetchOnWindowFocus: true,
    retry: false
  });
}

export function useShareSharePointItem() {
  return useMutation({
    mutationFn: ({ siteId, itemId }: { siteId: string; itemId: string }) =>
      microsoft365Api.shareSharePointItem(siteId, itemId)
  });
}

export function useUploadSharePointFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      siteId,
      file,
      folderId
    }: {
      siteId: string;
      file: File;
      folderId?: string;
    }) => microsoft365Api.uploadSharePointFile(siteId, file, folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['microsoft', 'sharepoint'] });
    }
  });
}

export function useDeleteSharePointItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ siteId, itemId }: { siteId: string; itemId: string }) =>
      microsoft365Api.deleteSharePointItem(siteId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['microsoft', 'sharepoint'] });
    }
  });
}

export function useSharePointSearch(
  siteId: string,
  query: string,
  enabled = true
) {
  const qc = useQueryClient();
  return useQuery<OneDriveItemList>({
    queryKey: microsoftKeys.sharePointSearch(siteId, query),
    queryFn: withAuthInvalidation(qc, () =>
      microsoft365Api.searchSharePointFiles(siteId, query)
    ),
    enabled: enabled && !!siteId && query.length >= 2,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    retry: false
  });
}
