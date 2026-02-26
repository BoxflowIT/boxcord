// Thread Store - State management for threads
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { castDraft } from 'immer';

export interface Thread {
  id: string;
  messageId: string;
  channelId: string;
  title: string | null;
  replyCount: number;
  participantCount: number;
  lastReplyAt: string | null;
  lastReplyBy: string | null;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
  isFollowing?: boolean;
  unreadCount?: number;
  message?: {
    id: string;
    content: string;
    authorId: string;
    author: {
      id: string;
      firstName?: string | null;
      lastName?: string | null;
      email: string;
    };
  };
}

export interface ThreadReply {
  id: string;
  content: string;
  authorId: string;
  createdAt: string;
  edited: boolean;
  author: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  attachments?: Array<{
    url: string;
    type: string;
    name: string;
  }>;
  reactions?: Array<{
    emoji: string;
    count: number;
    users: string[];
  }>;
}

interface ThreadState {
  // Thread data
  threads: Record<string, Thread[]>; // channelId -> threads[]
  activeThreadId: string | null;
  threadReplies: Record<string, ThreadReply[]>; // threadId -> replies[]

  // UI state
  isSidebarOpen: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setThreads: (channelId: string, threads: Thread[]) => void;
  addThread: (thread: Thread) => void;
  updateThread: (threadId: string, updates: Partial<Thread>) => void;
  removeThread: (threadId: string) => void;

  setActiveThread: (threadId: string | null) => void;
  openThreadSidebar: (threadId: string) => void;
  closeThreadSidebar: () => void;

  setThreadReplies: (threadId: string, replies: ThreadReply[]) => void;
  addThreadReply: (threadId: string, reply: ThreadReply) => void;

  markThreadAsRead: (threadId: string) => void;
  setFollowing: (threadId: string, isFollowing: boolean) => void;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  threads: {},
  activeThreadId: null,
  threadReplies: {},
  isSidebarOpen: false,
  isLoading: false,
  error: null
};

export const useThreadStore = create<ThreadState>()(
  immer((set) => ({
    ...initialState,

    setThreads: (channelId: string, threads: Thread[]) =>
      set((state) => {
        state.threads[channelId] = castDraft(threads);
      }),

    addThread: (thread: Thread) =>
      set((state) => {
        if (!state.threads[thread.channelId]) {
          state.threads[thread.channelId] = castDraft([]);
        }
        // Add to beginning (most recent first)
        const threads = castDraft(state.threads[thread.channelId]) as Thread[];
        const existingIndex = threads.findIndex(
          (t: Thread) => t.id === thread.id
        );
        if (existingIndex >= 0) {
          threads[existingIndex] = thread;
        } else {
          threads.unshift(thread);
        }
        state.threads[thread.channelId] = castDraft(threads);
      }),

    updateThread: (threadId: string, updates: Partial<Thread>) =>
      set((state) => {
        // Update thread in its channel array
        Object.keys(state.threads).forEach((channelId) => {
          const threads = castDraft(state.threads[channelId]) as Thread[];
          const index = threads.findIndex((t: Thread) => t.id === threadId);
          if (index >= 0) {
            threads[index] = {
              ...threads[index],
              ...updates
            };
            state.threads[channelId] = castDraft(threads);
          }
        });
      }),

    removeThread: (threadId: string) =>
      set((state) => {
        // Remove thread from all channels
        Object.keys(state.threads).forEach((channelId) => {
          const threads = castDraft(state.threads[channelId]) as Thread[];
          state.threads[channelId] = castDraft(
            threads.filter((t: Thread) => t.id !== threadId)
          );
        });
        // Clean up cached replies
        delete state.threadReplies[threadId];
        // Close sidebar if this thread was active
        if (state.activeThreadId === threadId) {
          state.activeThreadId = null;
          state.isSidebarOpen = false;
        }
      }),

    setActiveThread: (threadId: string | null) =>
      set((state) => {
        state.activeThreadId = threadId;
      }),

    openThreadSidebar: (threadId: string) =>
      set((state) => {
        state.activeThreadId = threadId;
        state.isSidebarOpen = true;
      }),

    closeThreadSidebar: () =>
      set((state) => {
        state.isSidebarOpen = false;
        state.activeThreadId = null;
      }),

    setThreadReplies: (threadId: string, replies: ThreadReply[]) =>
      set((state) => {
        state.threadReplies[threadId] = replies;
      }),

    addThreadReply: (threadId: string, reply: ThreadReply) =>
      set((state) => {
        if (!state.threadReplies[threadId]) {
          state.threadReplies[threadId] = [];
        }
        state.threadReplies[threadId].push(reply);

        // Update thread reply count
        Object.keys(state.threads).forEach((channelId) => {
          const threads = castDraft(state.threads[channelId]) as Thread[];
          const thread = threads.find((t: Thread) => t.id === threadId);
          if (thread) {
            thread.replyCount += 1;
            thread.lastReplyAt = reply.createdAt;
            thread.lastReplyBy = reply.authorId;
            // Increment unread if not viewing this thread
            if (state.activeThreadId !== threadId) {
              thread.unreadCount = (thread.unreadCount || 0) + 1;
            }
            state.threads[channelId] = castDraft(threads);
          }
        });
      }),

    markThreadAsRead: (threadId: string) =>
      set((state) => {
        Object.keys(state.threads).forEach((channelId) => {
          const threads = castDraft(state.threads[channelId]) as Thread[];
          const thread = threads.find((t: Thread) => t.id === threadId);
          if (thread) {
            thread.unreadCount = 0;
            state.threads[channelId] = castDraft(threads);
          }
        });
      }),

    setFollowing: (threadId: string, isFollowing: boolean) =>
      set((state) => {
        Object.keys(state.threads).forEach((channelId) => {
          const threads = castDraft(state.threads[channelId]) as Thread[];
          const thread = threads.find((t: Thread) => t.id === threadId);
          if (thread) {
            thread.isFollowing = isFollowing;
            state.threads[channelId] = castDraft(threads);
          }
        });
      }),

    setLoading: (loading: boolean) =>
      set((state) => {
        state.isLoading = loading;
      }),

    setError: (error: string | null) =>
      set((state) => {
        state.error = error;
      }),

    reset: () => set(initialState)
  }))
);
