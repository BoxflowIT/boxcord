// Thread Data Hook - Fetch and manage thread data via React Query
import { useQuery } from '@tanstack/react-query';
import { useThreadStore } from '../store/thread';
import { api } from '../services/api';
import type { Thread, ThreadReply } from '../store/thread';

export function useThreads(channelId: string | undefined) {
  const setThreads = useThreadStore((state) => state.setThreads);

  const query = useQuery({
    queryKey: channelId ? ['threads', channelId] : ['threads-null'],
    queryFn: async () => {
      if (!channelId) return [];
      const result = await api.getThreads(channelId);
      const threadsData = (result?.items || []) as Thread[];
      setThreads(channelId, threadsData);
      return threadsData;
    },
    enabled: !!channelId,
    staleTime: Infinity, // Socket keeps it fresh
    gcTime: 10 * 60 * 1000 // 10 min
  });

  // Also read from thread store for socket-updated data
  const threads = useThreadStore((state) =>
    channelId ? state.threads[channelId] || [] : []
  );

  return {
    threads: threads.length > 0 ? threads : (query.data ?? []),
    loading: query.isLoading,
    error: query.error?.message ?? null
  };
}

export async function getThreadByMessageId(
  messageId: string
): Promise<Thread | null> {
  try {
    const result = await api.getThreadByMessageId(messageId);
    return (result as Thread) ?? null;
  } catch {
    return null;
  }
}

export async function createThread(
  messageId: string,
  title: string
): Promise<Thread> {
  return api.createThread(messageId, title) as Promise<Thread>;
}

export async function searchThreads(
  query: string,
  channelId?: string
): Promise<{ items: Thread[]; hasMore: boolean; nextCursor?: string }> {
  return api.searchThreads(query, channelId) as Promise<{
    items: Thread[];
    hasMore: boolean;
    nextCursor?: string;
  }>;
}

export async function getThreadReplies(threadId: string, page = 1, limit = 50) {
  return api.getThreadReplies(threadId, page, limit) as unknown as Promise<{
    items: ThreadReply[];
    hasMore: boolean;
  }>;
}

export async function addThreadReply(
  threadId: string,
  content: string,
  attachments?: Array<{ url: string; type: string; name: string }>
): Promise<ThreadReply> {
  return api.addThreadReply(threadId, content, attachments) as unknown as Promise<ThreadReply>;
}

export async function toggleThreadFollow(
  threadId: string,
  shouldFollow: boolean
) {
  return api.toggleThreadFollow(threadId, shouldFollow);
}

export async function markThreadAsRead(threadId: string) {
  return api.markThreadAsRead(threadId);
}

export async function editThreadReply(
  threadId: string,
  replyId: string,
  content: string
): Promise<{ id: string; content: string; edited: boolean }> {
  return api.editThreadReply(threadId, replyId, content);
}

export async function deleteThreadReply(
  threadId: string,
  replyId: string
): Promise<void> {
  return api.deleteThreadReply(threadId, replyId);
}

export async function addThreadReplyReaction(
  threadId: string,
  replyId: string,
  emoji: string
): Promise<{ id: string; messageId: string; userId: string; emoji: string }> {
  return api.addThreadReplyReaction(threadId, replyId, emoji);
}

export async function removeThreadReplyReaction(
  threadId: string,
  replyId: string,
  emoji: string
): Promise<void> {
  return api.removeThreadReplyReaction(threadId, replyId, emoji);
}

export async function updateThread(
  threadId: string,
  updates: {
    title?: string;
    isLocked?: boolean;
    isArchived?: boolean;
    isResolved?: boolean;
  }
): Promise<Thread> {
  return api.updateThread(threadId, updates) as Promise<Thread>;
}

export async function deleteThread(threadId: string): Promise<void> {
  return api.deleteThread(threadId);
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
  return api.getThreadAnalytics(threadId) as Promise<ThreadAnalytics>;
}

export async function getChannelThreadAnalytics(
  channelId: string
): Promise<ChannelThreadAnalytics> {
  return api.getChannelThreadAnalytics(
    channelId
  ) as Promise<ChannelThreadAnalytics>;
}
