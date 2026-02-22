/**
 * useBookmarks hook
 * Manage saved/bookmarked messages
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const API_BASE = '/api/v1';

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
        credentials: 'include'
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
  return useQuery<boolean>({
    queryKey: ['bookmark-check', messageId, dmMessageId],
    queryFn: async () => {
      if (!messageId && !dmMessageId) {
        return false;
      }

      const params = new URLSearchParams();
      if (messageId) params.set('messageId', messageId);
      if (dmMessageId) params.set('dmMessageId', dmMessageId);

      const response = await fetch(`${API_BASE}/bookmarks/check?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to check bookmark status');
      }

      const data = await response.json();
      return data.data.bookmarked;
    },
    enabled: !!(messageId || dmMessageId)
  });
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
        credentials: 'include'
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
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(input)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add bookmark');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate bookmarks queries
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['bookmark-check'] });
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
        credentials: 'include'
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
      const endpoint = messageId
        ? `${API_BASE}/bookmarks/message/${messageId}`
        : `${API_BASE}/bookmarks/dm/${dmMessageId}`;

      const response = await fetch(endpoint, {
        method: 'DELETE',
        credentials: 'include'
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
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
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
