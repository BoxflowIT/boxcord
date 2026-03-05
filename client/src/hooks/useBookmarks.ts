/**
 * useBookmarks hook
 * Manage saved/bookmarked messages
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

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
    queryFn: () => api.getBookmarks(workspaceId) as Promise<Bookmark[]>,
    staleTime: 30 * 1000 // 30s - mutations invalidate on change
  });
}

/**
 * Check if a message is bookmarked
 * Derives status from the bookmarks list instead of a per-message API call
 */
export function useIsBookmarked(messageId?: string, dmMessageId?: string) {
  const { data: bookmarks = [] } = useBookmarks();

  const isBookmarked =
    messageId || dmMessageId
      ? bookmarks.some(
          (b) =>
            (messageId && b.messageId === messageId) ||
            (dmMessageId && b.dmMessageId === dmMessageId)
        )
      : false;

  return { data: isBookmarked, isLoading: false };
}

/**
 * Get bookmark count
 */
export function useBookmarkCount(workspaceId?: string) {
  return useQuery<number>({
    queryKey: ['bookmark-count', workspaceId],
    queryFn: async () => {
      const result = await api.getBookmarkCount(workspaceId);
      return result.count;
    },
    staleTime: 30 * 1000 // 30s - mutations invalidate on change
  });
}

/**
 * Add bookmark mutation
 */
export function useAddBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddBookmarkInput) => {
      try {
        return await api.addBookmark(input);
      } catch (error: unknown) {
        // "Already bookmarked" is not really an error - treat as success
        if (
          error instanceof Error &&
          error.message?.includes('already bookmarked')
        ) {
          return { success: true, data: null };
        }
        throw error;
      }
    },
    onMutate: async (variables: AddBookmarkInput) => {
      // Cancel any ongoing bookmark queries to avoid stale overwrites
      await queryClient.cancelQueries({ queryKey: ['bookmarks'] });

      // Snapshot previous bookmarks list for rollback
      const previousBookmarks =
        queryClient.getQueryData<Bookmark[]>(['bookmarks', undefined]) ?? [];

      // Optimistically add a placeholder bookmark to the list
      queryClient.setQueryData<Bookmark[]>(['bookmarks', undefined], (old) => {
        const placeholder: Bookmark = {
          id: `optimistic-${Date.now()}`,
          userId: '',
          messageId: variables.messageId ?? null,
          dmMessageId: variables.dmMessageId ?? null,
          workspaceId: variables.workspaceId ?? null,
          note: variables.note ?? null,
          createdAt: new Date().toISOString()
        };
        return [...(old ?? []), placeholder];
      });

      return { previousBookmarks };
    },
    onError: async (
      _err: Error,
      _variables: AddBookmarkInput,
      context?: { previousBookmarks: Bookmark[] }
    ) => {
      // Rollback to previous bookmarks on error
      if (context) {
        queryClient.setQueryData<Bookmark[]>(
          ['bookmarks', undefined],
          context.previousBookmarks
        );
      }
    },
    onSuccess: async () => {
      // Refetch to get the real bookmark data from server
      await queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      await queryClient.invalidateQueries({ queryKey: ['bookmark-count'] });
    }
  });
}

/**
 * Remove bookmark mutation (by bookmark ID)
 */
export function useRemoveBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookmarkId: string) => api.removeBookmark(bookmarkId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      await queryClient.invalidateQueries({ queryKey: ['bookmark-check'] });
      await queryClient.invalidateQueries({ queryKey: ['bookmark-count'] });
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
      if (messageId) {
        return api.removeBookmarkByMessage(messageId);
      }
      return api.removeBookmarkByDM(dmMessageId!);
    },
    onMutate: async (variables) => {
      // Cancel any ongoing bookmark queries
      await queryClient.cancelQueries({ queryKey: ['bookmarks'] });

      // Snapshot previous bookmarks list for rollback
      const previousBookmarks =
        queryClient.getQueryData<Bookmark[]>(['bookmarks', undefined]) ?? [];

      // Optimistically remove the bookmark from the list
      queryClient.setQueryData<Bookmark[]>(['bookmarks', undefined], (old) => {
        if (!old) return old;
        return old.filter((b) => {
          if (variables.messageId) return b.messageId !== variables.messageId;
          if (variables.dmMessageId)
            return b.dmMessageId !== variables.dmMessageId;
          return true;
        });
      });

      return { previousBookmarks };
    },
    onError: async (
      _err: Error,
      _variables: { messageId?: string; dmMessageId?: string },
      context?: { previousBookmarks: Bookmark[] }
    ) => {
      // Rollback to previous bookmarks on error
      if (context) {
        queryClient.setQueryData<Bookmark[]>(
          ['bookmarks', undefined],
          context.previousBookmarks
        );
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      await queryClient.invalidateQueries({ queryKey: ['bookmark-count'] });
    }
  });
}

/**
 * Update bookmark note
 */
export function useUpdateBookmarkNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookmarkId, note }: { bookmarkId: string; note: string }) =>
      api.updateBookmarkNote(bookmarkId, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    }
  });
}
