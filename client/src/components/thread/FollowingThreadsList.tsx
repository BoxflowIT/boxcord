// Following Threads List - Refactored to use smaller components
import { useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useThreadStore } from '../../store/thread';
import { useAuthStore } from '../../store/auth';
import { FollowingThreadItem } from './FollowingThreadItem';
import { ThreadContextMenu } from './ThreadContextMenu';
import DeleteConfirmModal from '../DeleteConfirmModal';
import { CloseIcon, PlusIcon } from '../ui/Icons';
import {
  updateThread,
  deleteThread,
  markThreadAsRead,
  toggleThreadFollow,
  searchThreads
} from '../../hooks/useThreads';
import { toast } from '../../store/notification';
import type { Thread } from '../../store/thread';

interface FollowingThreadsListProps {
  onSelectThread: (threadId: string, channelId: string) => void;
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
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Thread[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

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

  // Filter threads by search query (client-side for quick filtering)
  const filteredThreads = useMemo(() => {
    if (!searchQuery.trim()) return followingThreads;
    const q = searchQuery.toLowerCase();
    return followingThreads.filter(
      (thread) =>
        thread.title?.toLowerCase().includes(q) ||
        thread.message?.content?.toLowerCase().includes(q)
    );
  }, [followingThreads, searchQuery]);

  // Server-side search for broader results (includes threads not followed)
  const handleServerSearch = useCallback(async () => {
    if (searchQuery.trim().length < 2) {
      setSearchResults(null);
      return;
    }
    setIsSearching(true);
    try {
      const result = await searchThreads(searchQuery.trim());
      setSearchResults(result.items);
    } catch {
      toast.error(t('threads.searchFailed'));
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, t]);

  // Threads to display: show server search results if active, otherwise filtered following threads
  const displayThreads = searchResults ?? filteredThreads;

  const contextMenuThread = contextMenu
    ? displayThreads.find((t) => t.id === contextMenu.threadId)
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

  const handleToggleArchive = async (threadId: string) => {
    const thread = displayThreads.find((t) => t.id === threadId);
    if (!thread) return;
    try {
      const updated = await updateThread(threadId, {
        isArchived: !thread.isArchived
      });
      updateThreadInStore(threadId, updated);
      toast.success(
        !thread.isArchived
          ? t('threads.archivedSuccess')
          : t('threads.unarchivedSuccess')
      );
    } catch (err) {
      console.error('Failed to toggle archive:', err);
      toast.error(t('threads.archiveFailed'));
    }
  };

  const handleToggleResolve = async (threadId: string) => {
    const thread = displayThreads.find((t) => t.id === threadId);
    if (!thread) return;
    try {
      const updated = await updateThread(threadId, {
        isResolved: !thread.isResolved
      });
      updateThreadInStore(threadId, updated);
      toast.success(
        !thread.isResolved
          ? t('threads.resolvedSuccess')
          : t('threads.unresolvedSuccess')
      );
    } catch (err) {
      console.error('Failed to toggle resolve:', err);
      toast.error(t('threads.resolveFailed'));
    }
  };

  if (followingThreads.length === 0 && !searchResults) return null;

  return (
    <div className="flex flex-col min-h-0 border-t border-discord-darkest">
      {/* Header with plus/close toggle — same pattern as DM */}
      <div className="px-3 py-2 flex items-center justify-between flex-shrink-0">
        <span className="text-xs font-semibold text-gray-400 uppercase">
          {t('threads.following')}
        </span>
        <button
          onClick={() => {
            setShowSearch(!showSearch);
            if (showSearch) {
              setSearchQuery('');
              setSearchResults(null);
            }
          }}
          className="text-gray-400 hover:text-white"
          title={t('threads.searchPlaceholder')}
        >
          {showSearch ? <CloseIcon size="sm" /> : <PlusIcon size="sm" />}
        </button>
      </div>

      {/* Collapsible search panel — same style as DMSearchPanel */}
      {showSearch && (
        <div className="p-2 border-b border-discord-darkest flex-shrink-0">
          <div className="flex-row mb-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!e.target.value.trim()) setSearchResults(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleServerSearch();
              }}
              placeholder={t('threads.searchPlaceholder')}
              className="input-base text-sm flex-1"
              autoFocus
            />
            {(searchQuery || searchResults) && (
              <button
                onClick={() => {
                  setSearchResults(null);
                  setSearchQuery('');
                }}
                className="text-gray-400 hover:text-white p-1"
                title={t('threads.clearSearch')}
              >
                <CloseIcon size="sm" />
              </button>
            )}
          </div>
          {searchQuery.trim().length >= 2 && !searchResults && (
            <button
              onClick={handleServerSearch}
              disabled={isSearching}
              className="text-xs text-boxflow-primary hover:text-boxflow-primary/80 mt-1 px-1 flex items-center gap-1"
            >
              {isSearching && (
                <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
              )}
              {t('threads.searchAll')}
            </button>
          )}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto p-2">
        {displayThreads.length === 0 ? (
          <p className="text-xs text-gray-500 px-2 py-1">
            {t('threads.noResults')}
          </p>
        ) : (
          displayThreads.map((thread) => (
            <FollowingThreadItem
              key={thread.id}
              thread={thread}
              isActive={activeThreadId === thread.id}
              isOwner={user?.id === thread.message?.author?.id}
              isEditing={editingThreadId === thread.id}
              onSelect={() => {
                openThreadSidebar(thread.id);
                onSelectThread(thread.id, thread.channelId);
              }}
              onContextMenu={(x, y) =>
                setContextMenu({ x, y, threadId: thread.id })
              }
              onEditTitle={(newTitle) => handleEditTitle(thread.id, newTitle)}
              onEditComplete={() => setEditingThreadId(null)}
            />
          ))
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ThreadContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          isOwner={isContextMenuOwner}
          isArchived={contextMenuThread?.isArchived}
          isResolved={contextMenuThread?.isResolved}
          onEditTitle={() => setEditingThreadId(contextMenu.threadId)}
          onMarkAsRead={() => handleMarkAsRead(contextMenu.threadId)}
          onUnfollow={() => handleUnfollow(contextMenu.threadId)}
          onToggleArchive={() => handleToggleArchive(contextMenu.threadId)}
          onToggleResolve={() => handleToggleResolve(contextMenu.threadId)}
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
