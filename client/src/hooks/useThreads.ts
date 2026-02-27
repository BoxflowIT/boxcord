// Thread Data Hook - Fetch and manage thread data
import { useEffect, useState } from 'react';
import { useThreadStore } from '../store/thread';
import { useAuthStore } from '../store/auth';
import type { Thread } from '../store/thread';

const API_BASE = '/api/v1';

export function useThreads(channelId: string | undefined) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const threads = useThreadStore((state) =>
    channelId ? state.threads[channelId] || [] : []
  );
  const setThreads = useThreadStore((state) => state.setThreads);

  useEffect(() => {
    if (!channelId) return;

    const fetchThreads = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = useAuthStore.getState().token;
        const response = await fetch(
          `${API_BASE}/threads?channelId=${channelId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch threads: ${response.statusText}`);
        }

        const result = await response.json();
        // Backend returns { success: true, data: { items: [], hasMore, nextCursor } }
        const threadsData = result.data?.items || result.items || [];
        setThreads(channelId, threadsData);
      } catch (err) {
        console.error('Error fetching threads:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchThreads();
  }, [channelId, setThreads]);

  return { threads, loading, error };
}

export async function getThreadByMessageId(
  messageId: string
): Promise<Thread | null> {
  const token = useAuthStore.getState().token;
  const response = await fetch(`${API_BASE}/threads/by-message/${messageId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) return null;
  const result = await response.json();
  return result.data ?? null;
}

export async function createThread(
  messageId: string,
  title: string
): Promise<Thread> {
  const token = useAuthStore.getState().token;
  const response = await fetch(`${API_BASE}/threads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ messageId, title })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Create thread error:', {
      messageId,
      title,
      status: response.status,
      statusText: response.statusText,
      errorData: JSON.stringify(errorData, null, 2)
    });

    // Extract meaningful error message
    const errorMessage =
      errorData?.error?.message || errorData?.message || response.statusText;
    throw new Error(`Failed to create thread: ${errorMessage}`);
  }

  const result = await response.json();
  return result.data;
}

export async function searchThreads(
  query: string,
  channelId?: string
): Promise<{ items: Thread[]; hasMore: boolean; nextCursor?: string }> {
  const token = useAuthStore.getState().token;
  const params = new URLSearchParams({ q: query });
  if (channelId) params.set('channelId', channelId);

  const response = await fetch(`${API_BASE}/threads/search?${params}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error(`Failed to search threads: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}

export async function getThreadReplies(threadId: string, page = 1, limit = 50) {
  const token = useAuthStore.getState().token;
  const response = await fetch(
    `${API_BASE}/threads/${threadId}/replies?page=${page}&limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch thread replies: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data || result;
}

export async function addThreadReply(
  threadId: string,
  content: string,
  attachments?: Array<{ url: string; type: string; name: string }>
) {
  const token = useAuthStore.getState().token;
  const response = await fetch(`${API_BASE}/threads/${threadId}/replies`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ content, attachments })
  });

  if (!response.ok) {
    throw new Error(`Failed to add thread reply: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}

export async function toggleThreadFollow(
  threadId: string,
  shouldFollow: boolean
) {
  const token = useAuthStore.getState().token;
  const response = await fetch(`${API_BASE}/threads/${threadId}/follow`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ shouldFollow })
  });

  if (!response.ok) {
    throw new Error(`Failed to toggle thread follow: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}

export async function markThreadAsRead(threadId: string) {
  const token = useAuthStore.getState().token;
  const response = await fetch(`${API_BASE}/threads/${threadId}/read`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to mark thread as read: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Edit a thread reply
 */
export async function editThreadReply(
  threadId: string,
  replyId: string,
  content: string
): Promise<any> {
  try {
    const token = useAuthStore.getState().token;
    const result = await fetch(
      `${API_BASE}/threads/${threadId}/replies/${replyId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content })
      }
    ).then((res) => res.json());

    return result.data;
  } catch (error) {
    console.error('Error editing thread reply:', error);
    throw error;
  }
}

/**
 * Delete a thread reply
 */
export async function deleteThreadReply(
  threadId: string,
  replyId: string
): Promise<void> {
  try {
    const token = useAuthStore.getState().token;
    await fetch(`${API_BASE}/threads/${threadId}/replies/${replyId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  } catch (error) {
    console.error('Error deleting thread reply:', error);
    throw error;
  }
}

/**
 * Add reaction to thread reply
 */
export async function addThreadReplyReaction(
  threadId: string,
  replyId: string,
  emoji: string
): Promise<any> {
  try {
    const token = useAuthStore.getState().token;
    const response = await fetch(
      `${API_BASE}/threads/${threadId}/replies/${replyId}/reactions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ emoji })
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to add reaction: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error adding reaction to thread reply:', error);
    throw error;
  }
}

/**
 * Remove reaction from thread reply
 */
export async function removeThreadReplyReaction(
  threadId: string,
  replyId: string,
  emoji: string
): Promise<void> {
  try {
    const token = useAuthStore.getState().token;
    const response = await fetch(
      `${API_BASE}/threads/${threadId}/replies/${replyId}/reactions/${encodeURIComponent(emoji)}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    if (!response.ok) {
      throw new Error(`Failed to remove reaction: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error removing reaction from thread reply:', error);
    throw error;
  }
}

/**
 * Update thread (title, lock status)
 */
export async function updateThread(
  threadId: string,
  updates: {
    title?: string;
    isLocked?: boolean;
    isArchived?: boolean;
    isResolved?: boolean;
  }
): Promise<Thread> {
  try {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API_BASE}/threads/${threadId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      throw new Error('Failed to update thread');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error updating thread:', error);
    throw error;
  }
}

/**
 * Delete thread
 */
export async function deleteThread(threadId: string): Promise<void> {
  try {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API_BASE}/threads/${threadId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to delete thread');
    }
  } catch (error) {
    console.error('Error deleting thread:', error);
    throw error;
  }
}

export interface ThreadAnalytics {
  threadId: string;
  replyCount: number;
  participantCount: number;
  ageDays: number;
  repliesPerDay: number;
  timeToFirstReplyMs: number | null;
  timeSinceLastActivityMs: number;
  isStale: boolean;
  topParticipants: Array<{ userId: string; replyCount: number }>;
}

export interface ChannelThreadAnalytics {
  totalThreads: number;
  activeThreads: number;
  resolvedThreads: number;
  archivedThreads: number;
  lockedThreads: number;
  totalReplies: number;
  averageRepliesPerThread: number;
  averageParticipantsPerThread: number;
  mostActiveThreads: Array<{
    id: string;
    title: string | null;
    replyCount: number;
  }>;
  staleThreads: number;
}

export async function getThreadAnalytics(
  threadId: string
): Promise<ThreadAnalytics> {
  const token = useAuthStore.getState().token;
  const response = await fetch(`${API_BASE}/threads/${threadId}/analytics`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch thread analytics');
  }

  const result = await response.json();
  return result.data;
}

export async function getChannelThreadAnalytics(
  channelId: string
): Promise<ChannelThreadAnalytics> {
  const token = useAuthStore.getState().token;
  const response = await fetch(
    `${API_BASE}/threads/analytics?channelId=${channelId}`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch channel thread analytics');
  }

  const result = await response.json();
  return result.data;
}
