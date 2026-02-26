// Following Threads List - Refactored to use smaller components
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useThreadStore } from '../../store/thread';
import { useAuthStore } from '../../store/auth';
import { FollowingThreadItem } from './FollowingThreadItem';
import { ThreadContextMenu } from './ThreadContextMenu';
import DeleteConfirmModal from '../DeleteConfirmModal';
import {
  updateThread,
  deleteThread,
  markThreadAsRead,
  toggleThreadFollow
} from '../../hooks/useThreads';
import { toast } from '../../store/notification';

interface FollowingThreadsListProps {
  onSelectThread: (threadId: string) => void;
}

export function FollowingThreadsList({
  onSelectThread
}: FollowingThreadsListProps) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const {
    threads,
    activeThreadId,
    openThreadSidebar,
    updateThread: updateThreadInStore,
    removeThread,
    markThreadAsRead: markRead,
    setFollowing
  } = useThreadStore();

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    threadId: string;
  } | null>(null);
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null);

  // Get all following threads from all channels
  const followingThreads = useMemo(() => {
    return Object.values(threads)
      .filter(Array.isArray)
      .flat()
      .filter((thread) => thread.isFollowing)
      .sort((a, b) => {
        if (!a.lastReplyAt) return 1;
        if (!b.lastReplyAt) return -1;
        return (
          new Date(b.lastReplyAt).getTime() - new Date(a.lastReplyAt).getTime()
        );
      });
  }, [threads]);

  const contextMenuThread = contextMenu
    ? followingThreads.find((t) => t.id === contextMenu.threadId)
    : null;

  const isContextMenuOwner =
    user?.id === contextMenuThread?.message?.author?.id;

  // Handlers
  const handleEditTitle = async (threadId: string, newTitle: string) => {
    try {
      const updated = await updateThread(threadId, { title: newTitle });
      updateThreadInStore(threadId, updated);
      toast.success('Thread title updated');
    } catch (err) {
      console.error('Failed to update thread title:', err);
      toast.error('Failed to update title');
    }
  };

  const handleDeleteThread = async () => {
    if (!deletingThreadId) return;
    setDeleteModalOpen(false);
    setContextMenu(null);

    try {
      await deleteThread(deletingThreadId);
      removeThread(deletingThreadId);
      toast.success('Thread deleted');
    } catch (err) {
      console.error('Failed to delete thread:', err);
      toast.error('Failed to delete thread');
    } finally {
      setDeletingThreadId(null);
    }
  };

  const handleMarkAsRead = async (threadId: string) => {
    try {
      await markThreadAsRead(threadId);
      markRead(threadId);
      toast.success('Marked as read');
    } catch (err) {
      console.error('Failed to mark as read:', err);
      toast.error('Failed to mark as read');
    }
  };

  const handleUnfollow = async (threadId: string) => {
    try {
      await toggleThreadFollow(threadId, false);
      setFollowing(threadId, false);
      toast.success('Unfollowed thread');
    } catch (err) {
      console.error('Failed to unfollow:', err);
      toast.error('Failed to unfollow');
    }
  };

  if (followingThreads.length === 0) return null;

  return (
    <div className="border-t border-gray-700 py-3 px-3">
      <h3 className="text-xs font-semibold text-gray-400 uppercase px-2 mb-2">
        {t('threads.following')}
      </h3>
      <div className="space-y-1">
        {followingThreads.map((thread) => (
          <FollowingThreadItem
            key={thread.id}
            thread={thread}
            isActive={activeThreadId === thread.id}
            isOwner={user?.id === thread.message?.author?.id}
            isEditing={editingThreadId === thread.id}
            onSelect={() => {
              openThreadSidebar(thread.id);
              onSelectThread(thread.id);
            }}
            onContextMenu={(x, y) =>
              setContextMenu({ x, y, threadId: thread.id })
            }
            onEditTitle={(newTitle) => handleEditTitle(thread.id, newTitle)}
            onEditComplete={() => setEditingThreadId(null)}
          />
        ))}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ThreadContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          isOwner={isContextMenuOwner}
          onEditTitle={() => setEditingThreadId(contextMenu.threadId)}
          onMarkAsRead={() => handleMarkAsRead(contextMenu.threadId)}
          onUnfollow={() => handleUnfollow(contextMenu.threadId)}
          onDelete={() => {
            setDeletingThreadId(contextMenu.threadId);
            setDeleteModalOpen(true);
          }}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Thread"
        message="Are you sure you want to delete this thread? All replies will be permanently deleted."
        onConfirm={handleDeleteThread}
        onCancel={() => {
          setDeleteModalOpen(false);
          setDeletingThreadId(null);
        }}
      />
    </div>
  );
}
