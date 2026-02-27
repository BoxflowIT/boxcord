// Thread Sidebar - Refactored to use smaller components
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useThreadStore } from '../../store/thread';
import { useAuthStore } from '../../store/auth';
import type { ThreadReply } from '../../store/thread';
import { ForwardMessageModal } from '../message/ForwardMessageModal';
import DeleteConfirmModal from '../DeleteConfirmModal';
import ReactionEmojiPicker from '../reactions/ReactionEmojiPicker';
import { ThreadHeader } from './ThreadHeader';
import { ThreadInfo } from './ThreadInfo';
import { ThreadReplyList } from './ThreadReplyList';
import { ThreadComposer } from './ThreadComposer';
import {
  getThreadReplies,
  addThreadReply,
  markThreadAsRead,
  toggleThreadFollow,
  editThreadReply,
  deleteThreadReply,
  addThreadReplyReaction,
  removeThreadReplyReaction,
  updateThread,
  deleteThread
} from '../../hooks/useThreads';
import { toast } from '../../store/notification';
import { api } from '../../services/api';

export function ThreadSidebar() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [forwardReply, setForwardReply] = useState<ThreadReply | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [reactionPickerReplyId, setReactionPickerReplyId] = useState<
    string | null
  >(null);
  const [reactionPickerRect, setReactionPickerRect] = useState<
    DOMRect | undefined
  >();

  const {
    activeThreadId,
    isSidebarOpen,
    threads,
    threadReplies,
    closeThreadSidebar,
    setThreadReplies,
    markThreadAsRead: markRead,
    setFollowing,
    updateThread: updateThreadInStore,
    removeThread
  } = useThreadStore();

  // Find active thread from all channels
  const activeThread = activeThreadId
    ? Object.values(threads)
        .flat()
        .find((t) => t.id === activeThreadId) || null
    : null;

  const replies = activeThreadId ? threadReplies[activeThreadId] || [] : [];
  // Allow CRUD if user is the original message author OR the thread creator (isFollowing)
  const isOwner = !!(
    user?.id &&
    activeThread &&
    (user.id === activeThread.message?.author?.id ||
      user.id === activeThread.message?.authorId ||
      activeThread.isFollowing)
  );

  // Fetch thread replies when sidebar opens
  useEffect(() => {
    if (!activeThreadId || !isSidebarOpen) return;

    const fetchReplies = async () => {
      setLoading(true);
      try {
        const data = await getThreadReplies(activeThreadId);
        setThreadReplies(activeThreadId, data.items || []);

        // Mark as read
        await markThreadAsRead(activeThreadId);
        markRead(activeThreadId);
      } catch (err) {
        console.error('Failed to fetch thread replies:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReplies();
  }, [activeThreadId, isSidebarOpen, setThreadReplies, markRead]);

  // Handler: Edit thread title
  const handleEditTitle = async (title: string) => {
    if (!activeThread) return;
    try {
      const updated = await updateThread(activeThread.id, { title });
      updateThreadInStore(activeThread.id, updated);
      toast.success('Thread title updated');
    } catch (err) {
      console.error('Failed to update thread title:', err);
      toast.error('Failed to update title');
    }
  };

  // Handler: Delete thread
  const handleDeleteThread = async () => {
    if (!activeThread) return;
    setDeleteModalOpen(false);

    try {
      await deleteThread(activeThread.id);
      removeThread(activeThread.id);
      closeThreadSidebar();
      toast.success('Thread deleted');
    } catch (err) {
      console.error('Failed to delete thread:', err);
      toast.error('Failed to delete thread');
    }
  };

  // Handler: Toggle follow
  const handleToggleFollow = async () => {
    if (!activeThread) return;

    const shouldFollow = !activeThread.isFollowing;
    try {
      setFollowing(activeThread.id, shouldFollow);
      await toggleThreadFollow(activeThread.id, shouldFollow);
    } catch (err) {
      console.error('Failed to toggle follow:', err);
      setFollowing(activeThread.id, !shouldFollow);
      toast.error('Failed to toggle follow');
    }
  };

  // Handler: Toggle archive
  const handleToggleArchive = async () => {
    if (!activeThread) return;
    const newArchived = !activeThread.isArchived;
    try {
      const updated = await updateThread(activeThread.id, {
        isArchived: newArchived
      });
      updateThreadInStore(activeThread.id, updated);
      toast.success(
        newArchived
          ? t('threads.archivedSuccess')
          : t('threads.unarchivedSuccess')
      );
    } catch (err) {
      console.error('Failed to toggle archive:', err);
      toast.error(t('threads.archiveFailed'));
    }
  };

  // Handler: Toggle resolve
  const handleToggleResolve = async () => {
    if (!activeThread) return;
    const newResolved = !activeThread.isResolved;
    try {
      const updated = await updateThread(activeThread.id, {
        isResolved: newResolved
      });
      updateThreadInStore(activeThread.id, updated);
      toast.success(
        newResolved
          ? t('threads.resolvedSuccess')
          : t('threads.unresolvedSuccess')
      );
    } catch (err) {
      console.error('Failed to toggle resolve:', err);
      toast.error(t('threads.resolveFailed'));
    }
  };

  // Handler: Send reply
  const handleSendReply = async (content: string) => {
    if (!activeThreadId) return;
    try {
      const newReply = await addThreadReply(activeThreadId, content);
      // Add the new reply to the store immediately for instant feedback
      if (newReply) {
        setThreadReplies(activeThreadId, [...replies, newReply]);
      }
    } catch (err) {
      console.error('Failed to send reply:', err);
      toast.error('Failed to send reply');
    }
  };

  // Handler: React to reply (true optimistic update)
  const handleReaction = async (replyId: string, emoji: string) => {
    if (!activeThreadId || !user?.id) return;
    const currentReplies =
      useThreadStore.getState().threadReplies[activeThreadId] || [];
    const reply = currentReplies.find((r) => r.id === replyId);
    const isRemoving = !!reply?.reactions?.find(
      (r) => r.emoji === emoji && r.users?.includes(user.id)
    );

    // Optimistic update FIRST
    const updatedReplies = currentReplies.map((r) => {
      if (r.id !== replyId) return r;
      if (isRemoving) {
        const reactions = (r.reactions || [])
          .map((reaction) => {
            if (reaction.emoji !== emoji) return reaction;
            const newUsers = (reaction.users || []).filter(
              (id) => id !== user.id
            );
            return { ...reaction, count: newUsers.length, users: newUsers };
          })
          .filter((reaction) => reaction.count > 0);
        return { ...r, reactions };
      } else {
        const reactions = r.reactions || [];
        const existingIdx = reactions.findIndex(
          (reaction) => reaction.emoji === emoji
        );
        if (existingIdx >= 0) {
          const updated = [...reactions];
          const existing = updated[existingIdx];
          updated[existingIdx] = {
            ...existing,
            count: existing.count + 1,
            users: [...(existing.users || []), user.id]
          };
          return { ...r, reactions: updated };
        } else {
          return {
            ...r,
            reactions: [...reactions, { emoji, count: 1, users: [user.id] }]
          };
        }
      }
    });
    setThreadReplies(activeThreadId, updatedReplies);

    // Then call API, rollback on failure
    try {
      if (isRemoving) {
        await removeThreadReplyReaction(activeThreadId, replyId, emoji);
      } else {
        await addThreadReplyReaction(activeThreadId, replyId, emoji);
      }
    } catch (error) {
      console.error('Failed to react to reply:', error);
      // Rollback: restore previous state
      setThreadReplies(activeThreadId, currentReplies);
      toast.error('Failed to add reaction');
    }
  };

  // Handler: Save edit
  const handleSaveEdit = async (replyId: string, newContent: string) => {
    if (!activeThreadId) return;
    try {
      await editThreadReply(activeThreadId, replyId, newContent);
      toast.success('Reply updated');
    } catch (error) {
      console.error('Failed to edit reply:', error);
      toast.error('Failed to edit reply');
    }
  };

  // Handler: Delete reply
  const handleDeleteReply = async (replyId: string) => {
    if (!activeThreadId) return;
    try {
      await deleteThreadReply(activeThreadId, replyId);
      setThreadReplies(
        activeThreadId,
        replies.filter((r) => r.id !== replyId)
      );
      // Decrement reply count
      if (activeThread) {
        updateThreadInStore(activeThreadId, {
          replyCount: Math.max(0, (activeThread.replyCount || 1) - 1)
        });
      }
      toast.success('Reply deleted');
    } catch (error) {
      console.error('Failed to delete reply:', error);
      toast.error('Failed to delete reply');
    }
  };

  // Handler: Forward reply
  const handleForwardReply = async (
    targetId: string,
    targetType: 'channel' | 'dm'
  ) => {
    if (!forwardReply) return;

    try {
      if (targetType === 'dm') {
        // DM: POST /dm/channels/:channelId/messages with { content }
        await api.post(`/dm/channels/${targetId}/messages`, {
          content: forwardReply.content
        });
      } else {
        // Channel: POST /messages with { channelId, content }
        await api.post('/messages', {
          channelId: targetId,
          content: forwardReply.content
        });
      }
      setForwardReply(null);
      toast.success('Message forwarded');
    } catch (err) {
      console.error('Failed to forward message:', err);
      toast.error('Failed to forward message');
    }
  };

  // Handler: More reactions picker (true optimistic update)
  const handleMoreReactionSelect = async (emoji: string) => {
    if (!activeThreadId || !reactionPickerReplyId || !user?.id) return;
    const replyId = reactionPickerReplyId;
    const currentReplies =
      useThreadStore.getState().threadReplies[activeThreadId] || [];

    // Optimistic update FIRST
    const updatedReplies = currentReplies.map((r) => {
      if (r.id !== replyId) return r;
      const reactions = r.reactions || [];
      const existingIdx = reactions.findIndex(
        (reaction) => reaction.emoji === emoji
      );
      if (existingIdx >= 0) {
        const updated = [...reactions];
        const existing = updated[existingIdx];
        updated[existingIdx] = {
          ...existing,
          count: existing.count + 1,
          users: [...(existing.users || []), user.id]
        };
        return { ...r, reactions: updated };
      } else {
        return {
          ...r,
          reactions: [...reactions, { emoji, count: 1, users: [user.id] }]
        };
      }
    });
    setThreadReplies(activeThreadId, updatedReplies);
    setReactionPickerReplyId(null);

    // Then call API, rollback on failure
    try {
      await addThreadReplyReaction(activeThreadId, replyId, emoji);
    } catch (error) {
      console.error('Failed to add reaction:', error);
      setThreadReplies(activeThreadId, currentReplies);
      toast.error('Failed to add reaction');
    }
  };

  if (!isSidebarOpen) return null;

  return (
    <div className="fixed top-0 right-0 h-screen w-[480px] bg-boxflow-darkest border-l border-boxflow-border shadow-2xl flex flex-col z-50 overflow-hidden">
      {/* Header */}
      <ThreadHeader
        thread={activeThread}
        isOwner={isOwner}
        onEditTitle={handleEditTitle}
        onDelete={() => setDeleteModalOpen(true)}
        onClose={closeThreadSidebar}
        onToggleArchive={handleToggleArchive}
        onToggleResolve={handleToggleResolve}
      />

      {/* Thread info */}
      {activeThread && (
        <ThreadInfo
          thread={activeThread}
          isFollowing={activeThread.isFollowing || false}
          onToggleFollow={handleToggleFollow}
        />
      )}

      {/* Replies list */}
      <ThreadReplyList
        replies={replies}
        loading={loading}
        currentUserId={user?.id}
        onReaction={handleReaction}
        onMoreReactions={(replyId, rect) => {
          setReactionPickerReplyId(replyId);
          setReactionPickerRect(rect);
        }}
        onEdit={() => {}}
        onSaveEdit={handleSaveEdit}
        onCancelEdit={() => {}}
        onDelete={handleDeleteReply}
        onForward={(reply) => setForwardReply(reply)}
      />

      {/* Reaction Emoji Picker */}
      {reactionPickerReplyId && (
        <ReactionEmojiPicker
          onEmojiSelect={handleMoreReactionSelect}
          onClose={() => setReactionPickerReplyId(null)}
          buttonRect={reactionPickerRect}
        />
      )}

      {/* Reply composer */}
      {activeThread && !activeThread.isLocked && !activeThread.isArchived ? (
        <ThreadComposer onSend={handleSendReply} />
      ) : activeThread?.isArchived ? (
        <div className="p-4 border-t border-boxflow-border bg-boxflow-darker text-center text-boxflow-muted text-sm">
          📦 {t('threads.archivedMessage')}
        </div>
      ) : activeThread?.isLocked ? (
        <div className="p-4 border-t border-boxflow-border bg-boxflow-darker text-center text-boxflow-muted text-sm">
          🔒 {t('threads.lockedMessage')}
        </div>
      ) : null}

      {/* Forward Modal */}
      {forwardReply && (
        <ForwardMessageModal
          messageContent={forwardReply.content}
          onForward={handleForwardReply}
          onClose={() => setForwardReply(null)}
        />
      )}

      {/* Delete Thread Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Thread"
        message="Are you sure you want to delete this thread? All replies will be permanently deleted."
        onConfirm={handleDeleteThread}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </div>
  );
}
