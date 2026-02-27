// WebSocket Hook for Threads - Real-time thread updates
import { useEffect } from 'react';
import { useThreadStore } from '../store/thread';
import { useAuthStore } from '../store/auth';
import type { Thread, ThreadReply } from '../store/thread';
import type { Socket } from 'socket.io-client';
import { playMessageNotification } from '../utils/notificationSound';

export function useThreadSocket(socket: Socket | null) {
  // Use individual selectors to prevent re-renders of the parent component
  // when unrelated thread store state changes (e.g. threadReplies from reactions)
  const addThread = useThreadStore((s) => s.addThread);
  const updateThread = useThreadStore((s) => s.updateThread);
  const removeThread = useThreadStore((s) => s.removeThread);
  const addThreadReply = useThreadStore((s) => s.addThreadReply);
  const setThreadReplies = useThreadStore((s) => s.setThreadReplies);
  const addThreadNotification = useThreadStore((s) => s.addThreadNotification);

  useEffect(() => {
    if (!socket) return;

    // Thread created
    const handleThreadCreated = (data: { thread: Thread }) => {
      console.log('[Thread Socket] Thread created:', data.thread);
      addThread(data.thread);
    };

    // Thread reply added
    const handleThreadReply = (data: {
      threadId: string;
      reply: ThreadReply;
      mentionedUserId?: string;
    }) => {
      console.log('[Thread Socket] Thread reply:', data);
      addThreadReply(data.threadId, data.reply);

      // Check if this is from another user and thread is not active
      const currentUserId = useAuthStore.getState().user?.id;
      const currentUserEmail = useAuthStore.getState().user?.email;
      const activeThreadId = useThreadStore.getState().activeThreadId;
      const isFromOtherUser = data.reply.authorId !== currentUserId;
      const isNotActiveThread = activeThreadId !== data.threadId;

      if (isFromOtherUser) {
        // Play notification sound
        playMessageNotification();

        // Create thread notification for replies on followed threads
        const threads = useThreadStore.getState().threads;
        let threadTitle: string | null = null;
        let isFollowing = false;
        for (const channelId in threads) {
          const thread = threads[channelId]?.find(
            (t) => t.id === data.threadId
          );
          if (thread) {
            threadTitle = thread.title;
            isFollowing = !!thread.isFollowing;
            break;
          }
        }

        // Check if user was mentioned in this reply
        const isMentioned =
          data.mentionedUserId === currentUserId ||
          (currentUserEmail &&
            data.reply.content.includes(`@${currentUserEmail}`));

        if (isMentioned) {
          addThreadNotification({
            id: `mention-${data.reply.id}`,
            type: 'mention',
            threadId: data.threadId,
            threadTitle,
            actorId: data.reply.authorId,
            actorName:
              data.reply.author?.firstName ||
              data.reply.author?.email ||
              'Unknown',
            message:
              data.reply.content.slice(0, 100) +
              (data.reply.content.length > 100 ? '...' : ''),
            createdAt: data.reply.createdAt,
            read: false
          });
        } else if (isFollowing) {
          addThreadNotification({
            id: `reply-${data.reply.id}`,
            type: 'reply',
            threadId: data.threadId,
            threadTitle,
            actorId: data.reply.authorId,
            actorName:
              data.reply.author?.firstName ||
              data.reply.author?.email ||
              'Unknown',
            message:
              data.reply.content.slice(0, 100) +
              (data.reply.content.length > 100 ? '...' : ''),
            createdAt: data.reply.createdAt,
            read: false
          });
        }

        // Increment unread count if thread is not currently open
        if (isNotActiveThread) {
          for (const channelId in threads) {
            const thread = threads[channelId]?.find(
              (t) => t.id === data.threadId
            );
            if (thread) {
              updateThread(data.threadId, {
                unreadCount: (thread.unreadCount || 0) + 1
              });
              break;
            }
          }
        }
      }
    };

    // Thread reply edited
    const handleThreadReplyEdited = (data: {
      threadId: string;
      replyId: string;
      content: string;
      userId: string;
    }) => {
      console.log('[Thread Socket] Thread reply edited:', data);
      const replies =
        useThreadStore.getState().threadReplies[data.threadId] || [];
      const updatedReplies = replies.map((reply) =>
        reply.id === data.replyId
          ? { ...reply, content: data.content, edited: true }
          : reply
      );
      setThreadReplies(data.threadId, updatedReplies);
    };

    // Thread reply deleted
    const handleThreadReplyDeleted = (data: {
      threadId: string;
      replyId: string;
    }) => {
      console.log('[Thread Socket] Thread reply deleted:', data);
      const replies =
        useThreadStore.getState().threadReplies[data.threadId] || [];
      const updatedReplies = replies.filter(
        (reply) => reply.id !== data.replyId
      );
      setThreadReplies(data.threadId, updatedReplies);

      // Decrement thread reply count in the thread list
      const threads = useThreadStore.getState().threads;
      for (const channelId in threads) {
        const thread = threads[channelId]?.find((t) => t.id === data.threadId);
        if (thread) {
          updateThread(data.threadId, {
            replyCount: Math.max(0, (thread.replyCount || 1) - 1)
          });
          break;
        }
      }
    };

    // Thread reply reaction
    const handleThreadReplyReaction = (data: {
      threadId: string;
      replyId: string;
      emoji: string;
      action: 'add' | 'remove';
      userId: string;
    }) => {
      console.log('[Thread Socket] Thread reply reaction:', data);

      // Skip if this is from the current user — already handled optimistically
      const currentUserId = useAuthStore.getState().user?.id;
      if (data.userId === currentUserId) return;

      const replies =
        useThreadStore.getState().threadReplies[data.threadId] || [];
      const updatedReplies = replies.map((reply) => {
        if (reply.id !== data.replyId) return reply;

        const reactions = reply.reactions || [];
        if (data.action === 'add') {
          // Add or increment reaction
          const existingReaction = reactions.find(
            (r) => r.emoji === data.emoji
          );
          if (existingReaction) {
            return {
              ...reply,
              reactions: reactions.map((r) =>
                r.emoji === data.emoji
                  ? {
                      ...r,
                      count: r.count + 1,
                      users: [...(r.users || []), data.userId]
                    }
                  : r
              )
            };
          } else {
            return {
              ...reply,
              reactions: [
                ...reactions,
                { emoji: data.emoji, count: 1, users: [data.userId] }
              ]
            };
          }
        } else {
          // Remove or decrement reaction
          return {
            ...reply,
            reactions: reactions
              .map((r) =>
                r.emoji === data.emoji
                  ? {
                      ...r,
                      count: r.count - 1,
                      users: (r.users || []).filter((id) => id !== data.userId)
                    }
                  : r
              )
              .filter((r) => r.count > 0)
          };
        }
      });
      setThreadReplies(data.threadId, updatedReplies);
    };

    // Thread updated
    const handleThreadUpdated = (data: { thread: Thread }) => {
      console.log('[Thread Socket] Thread updated:', data.thread);

      // Generate notification for status changes from other users
      const currentUserId = useAuthStore.getState().user?.id;
      const oldThreads = useThreadStore.getState().threads;
      let oldThread: Thread | undefined;
      for (const channelId in oldThreads) {
        oldThread = oldThreads[channelId]?.find((t) => t.id === data.thread.id);
        if (oldThread) break;
      }

      if (oldThread && currentUserId) {
        // Resolved status changed
        if (data.thread.isResolved && !oldThread.isResolved) {
          addThreadNotification({
            id: `resolved-${data.thread.id}-${Date.now()}`,
            type: 'resolved',
            threadId: data.thread.id,
            threadTitle: data.thread.title,
            actorId: '',
            actorName: '',
            createdAt: new Date().toISOString(),
            read: false
          });
        }
        // Archived status changed
        if (data.thread.isArchived && !oldThread.isArchived) {
          addThreadNotification({
            id: `archived-${data.thread.id}-${Date.now()}`,
            type: 'archived',
            threadId: data.thread.id,
            threadTitle: data.thread.title,
            actorId: '',
            actorName: '',
            createdAt: new Date().toISOString(),
            read: false
          });
        }
      }

      updateThread(data.thread.id, data.thread);
    };

    // Thread deleted
    const handleThreadDeleted = (data: { threadId: string }) => {
      console.log('[Thread Socket] Thread deleted:', data);
      removeThread(data.threadId);
    };

    // Register listeners
    socket.on('thread:created', handleThreadCreated);
    socket.on('thread:reply', handleThreadReply);
    socket.on('thread:reply:edited', handleThreadReplyEdited);
    socket.on('thread:reply:deleted', handleThreadReplyDeleted);
    socket.on('thread:reply:reaction', handleThreadReplyReaction);
    socket.on('thread:updated', handleThreadUpdated);
    socket.on('thread:deleted', handleThreadDeleted);

    // Cleanup
    return () => {
      socket.off('thread:created', handleThreadCreated);
      socket.off('thread:reply', handleThreadReply);
      socket.off('thread:reply:edited', handleThreadReplyEdited);
      socket.off('thread:reply:deleted', handleThreadReplyDeleted);
      socket.off('thread:reply:reaction', handleThreadReplyReaction);
      socket.off('thread:updated', handleThreadUpdated);
      socket.off('thread:deleted', handleThreadDeleted);
    };
  }, [
    socket,
    addThread,
    updateThread,
    removeThread,
    addThreadReply,
    setThreadReplies,
    addThreadNotification
  ]);
}
