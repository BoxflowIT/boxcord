/**
 * useBookmarks hook
 * Manage saved/bookmarked messages
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth';

const API_BASE = '/api/v1';

// Helper to get auth headers
function getAuthHeaders(): HeadersInit {
  const token = useAuthStore.getState().token;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
}

export interface Bookmark {
  id: string;
  userId: string;
  messageId: string | null;
  dmMessageId: string | null;
  workspaceId: string | null;
  note: string | null;
  createdAt: string;
  message?: {
    id: string;
    content: string;
    authorId: string;
    channelId: string;
    createdAt: string;
    author: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      avatarUrl: string | null;
    };
    channel: {
      id: string;
      name: string;
      workspaceId: string;
    };
  };
  dmMessage?: {
    id: string;
    content: string;
    authorId: string;
    channelId: string;
    createdAt: string;
    author: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      avatarUrl: string | null;
    };
  };
}

interface AddBookmarkInput {
  messageId?: string;
  dmMessageId?: string;
  workspaceId?: string;
  note?: string;
}

/**
 * Fetch user's bookmarks
 */
export function useBookmarks(workspaceId?: string) {
  return useQuery<Bookmark[]>({
    queryKey: ['bookmarks', workspaceId],
    queryFn: async () => {
      const url = workspaceId
        ? `${API_BASE}/bookmarks?workspaceId=${workspaceId}`
        : `${API_BASE}/bookmarks`;

      const response = await fetch(url, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bookmarks');
      }

      const data = await response.json();
      return data.data;
    }
  });
}

/**
 * Check if a message is bookmarked
 */
export function useIsBookmarked(messageId?: string, dmMessageId?: string) {
  const result = useQuery<boolean>({
    queryKey: ['bookmark-check', messageId, dmMessageId],
    queryFn: async () => {
      if (!messageId && !dmMessageId) {
        return false;
      }

      const params = new URLSearchParams();
      if (messageId) params.set('messageId', messageId);
      if (dmMessageId) params.set('dmMessageId', dmMessageId);

      const response = await fetch(`${API_BASE}/bookmarks/check?${params}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to check bookmark status');
      }

      const data = await response.json();
      const isBookmarked = data.data.bookmarked;
      return isBookmarked;
    },
    enabled: !!(messageId || dmMessageId)
  });

  return result;
}

/**
 * Get bookmark count
 */
export function useBookmarkCount(workspaceId?: string) {
  return useQuery<number>({
    queryKey: ['bookmark-count', workspaceId],
    queryFn: async () => {
      const url = workspaceId
        ? `${API_BASE}/bookmarks/count?workspaceId=${workspaceId}`
        : `${API_BASE}/bookmarks/count`;

      const response = await fetch(url, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bookmark count');
      }

      const data = await response.json();
      return data.data.count;
    }
  });
}

/**
 * Add bookmark mutation
 */
export function useAddBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddBookmarkInput) => {
      const response = await fetch(`${API_BASE}/bookmarks`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(input)
      });

      if (!response.ok) {
        const error = await response.json();
        // "Already bookmarked" is not really an error - treat as success
        if (error.message?.includes('already bookmarked')) {
          return { success: true, data: null };
        }
        throw new Error(error.message || 'Failed to add bookmark');
      }

      return response.json();
    },
    onMutate: async (variables: AddBookmarkInput) => {
      // Optimistic update: immediately set bookmark to true
      const queryKey = [
        'bookmark-check',
        variables.messageId,
        variables.dmMessageId
      ];

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value (default to false if undefined)
      const previousValue =
        queryClient.getQueryData<boolean>(queryKey) ?? false;

      // Optimistically update to true
      queryClient.setQueryData<boolean>(queryKey, true);

      // Return context with snapshotted value
      return { previousValue, queryKey };
    },
    onError: async (
      _err: Error,
      _variables: AddBookmarkInput,
      context?: { previousValue: boolean; queryKey: unknown[] }
    ) => {
      // Instead of rolling back, invalidate and refetch to get true state from backend
      if (context) {
        await queryClient.invalidateQueries({ queryKey: context.queryKey });
      }
    },
    onSuccess: (_data, variables) => {
      // Ensure the specific bookmark-check query shows true
      const queryKey = [
        'bookmark-check',
        variables.messageId,
        variables.dmMessageId
      ];
      queryClient.setQueryData<boolean>(queryKey, true);

      // Invalidate list-level queries only (not individual checks)
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['bookmark-count'] });
    }
  });
}

/**
 * Remove bookmark mutation (by bookmark ID)
 */
export function useRemoveBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookmarkId: string) => {
      const response = await fetch(`${API_BASE}/bookmarks/${bookmarkId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to remove bookmark');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['bookmark-check'] });
      queryClient.invalidateQueries({ queryKey: ['bookmark-count'] });
    }
  });
}

/**
 * Remove bookmark by message ID
 */
export function useRemoveBookmarkByMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      messageId,
      dmMessageId
    }: {
      messageId?: string;
      dmMessageId?: string;
    }) => {
      if (!messageId && !dmMessageId) {
        throw new Error('Must provide either messageId or dmMessageId');
      }

      const endpoint = messageId
        ? `${API_BASE}/bookmarks/message/${messageId}`
        : `${API_BASE}/bookmarks/dm/${dmMessageId}`;

      const headers = getAuthHeaders();
      // Remove Content-Type for DELETE requests with no body
      const { 'Content-Type': _, ...headersWithoutContentType } =
        headers as Record<string, string>;

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: headersWithoutContentType
      });

      if (!response.ok) {
        let errorMessage = 'Failed to remove bookmark';
        try {
          const error = await response.json();
          errorMessage = error.message || error.error?.message || errorMessage;

          // "Not found" is not really an error - bookmark is already removed
          if (response.status === 404 || errorMessage.includes('not found')) {
            return { success: true };
          }
        } catch {
          // Response might not have JSON body
          errorMessage = `Failed to remove bookmark: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      return response.json();
    },
    onMutate: async (variables) => {
      // Optimistic update: immediately set bookmark to false
      const queryKey = [
        'bookmark-check',
        variables.messageId,
        variables.dmMessageId
      ];

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value (default to false if undefined)
      const previousValue =
        queryClient.getQueryData<boolean>(queryKey) ?? false;

      // Optimistically update to false
      queryClient.setQueryData<boolean>(queryKey, false);

      // Return context with snapshotted value
      return { previousValue, queryKey };
    },
    onError: async (
      _err: Error,
      _variables: { messageId?: string; dmMessageId?: string },
      context?: { previousValue: boolean; queryKey: unknown[] }
    ) => {
      // Instead of rolling back, invalidate and refetch to get true state from backend
      if (context) {
        await queryClient.invalidateQueries({ queryKey: context.queryKey });
      }
    },
    onSuccess: (_data, variables) => {
      // Ensure the specific bookmark-check query shows false
      const queryKey = [
        'bookmark-check',
        variables.messageId,
        variables.dmMessageId
      ];
      queryClient.setQueryData<boolean>(queryKey, false);

      // Invalidate list-level queries only (not individual checks)
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['bookmark-count'] });
    }
  });
}

/**
 * Update bookmark note
 */
export function useUpdateBookmarkNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookmarkId,
      note
    }: {
      bookmarkId: string;
      note: string;
    }) => {
      const response = await fetch(`${API_BASE}/bookmarks/${bookmarkId}/note`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ note })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update bookmark note');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    }
  });
}
