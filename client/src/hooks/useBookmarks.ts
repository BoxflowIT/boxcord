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
      const queryKey = [
        'bookmark-check',
        variables.messageId,
        variables.dmMessageId
      ];
      await queryClient.cancelQueries({ queryKey });
      const previousValue =
        queryClient.getQueryData<boolean>(queryKey) ?? false;
      queryClient.setQueryData<boolean>(queryKey, true);
      return { previousValue, queryKey };
    },
    onError: async (
      _err: Error,
      _variables: AddBookmarkInput,
      context?: { previousValue: boolean; queryKey: unknown[] }
    ) => {
      if (context) {
        await queryClient.invalidateQueries({ queryKey: context.queryKey });
      }
    },
    onSuccess: async (_data, variables) => {
      const queryKey = [
        'bookmark-check',
        variables.messageId,
        variables.dmMessageId
      ];
      queryClient.setQueryData<boolean>(queryKey, true);
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
      const queryKey = [
        'bookmark-check',
        variables.messageId,
        variables.dmMessageId
      ];
      await queryClient.cancelQueries({ queryKey });
      const previousValue =
        queryClient.getQueryData<boolean>(queryKey) ?? false;
      queryClient.setQueryData<boolean>(queryKey, false);
      return { previousValue, queryKey };
    },
    onError: async (
      _err: Error,
      _variables: { messageId?: string; dmMessageId?: string },
      context?: { previousValue: boolean; queryKey: unknown[] }
    ) => {
      if (context) {
        await queryClient.invalidateQueries({ queryKey: context.queryKey });
      }
    },
    onSuccess: async (_data, variables) => {
      const queryKey = [
        'bookmark-check',
        variables.messageId,
        variables.dmMessageId
      ];
      queryClient.setQueryData<boolean>(queryKey, false);
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
