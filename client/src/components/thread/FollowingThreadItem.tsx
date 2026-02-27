// Following Thread Item - Individual thread in following list
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ThreadIcon } from '../ui/Icons';
import { cn } from '../../utils/classNames';
import type { Thread } from '../../store/thread';

interface FollowingThreadItemProps {
  thread: Thread;
  isActive: boolean;
  isOwner: boolean;
  isEditing?: boolean;
  onSelect: () => void;
  onContextMenu: (x: number, y: number) => void;
  onEditTitle: (newTitle: string) => void;
  onEditComplete?: () => void;
}

export function FollowingThreadItem({
  thread,
  isActive,
  isOwner: _isOwner,
  isEditing: externalIsEditing = false,
  onSelect,
  onContextMenu,
  onEditTitle,
  onEditComplete
}: FollowingThreadItemProps) {
  // isOwner reserved for future use (e.g., showing owner badge)
  const { t } = useTranslation();
  const [editTitle, setEditTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const unreadCount = thread.unreadCount || 0;
  const hasUnread = unreadCount > 0;

  // Start editing when externalIsEditing becomes true
  useEffect(() => {
    if (externalIsEditing) {
      setEditTitle(thread.title || '');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [externalIsEditing, thread.title]);

  const handleSaveEdit = () => {
    if (editTitle.trim()) {
      onEditTitle(editTitle.trim());
    }
    onEditComplete?.();
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenu(e.clientX, e.clientY);
  };

  if (externalIsEditing) {
    return (
      <div className="flex items-center gap-2 px-2 py-2">
        <ThreadIcon size="sm" className="flex-shrink-0 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSaveEdit();
            if (e.key === 'Escape') onEditComplete?.();
          }}
          onBlur={handleSaveEdit}
          className="flex-1 bg-gray-700 text-white text-sm px-2 py-1 rounded border border-gray-600 focus:border-gray-500 outline-none"
        />
      </div>
    );
  }

  return (
    <button
      onClick={onSelect}
      onContextMenu={handleContextMenu}
      className={cn(
        'w-full flex items-center gap-2 px-2 py-2 rounded text-sm transition-all group',
        isActive
          ? 'bg-gray-600 text-white shadow-sm'
          : hasUnread
            ? 'text-white hover:bg-gray-700/70 hover:scale-[1.01]'
            : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-300'
      )}
    >
      <ThreadIcon
        size="sm"
        className={cn(
          'flex-shrink-0 transition-colors',
          isActive
            ? 'text-gray-300'
            : hasUnread
              ? 'text-gray-300'
              : 'text-gray-500'
        )}
      />
      <span
        className={cn(
          'flex-1 truncate text-left',
          isActive || hasUnread ? 'font-semibold' : 'font-medium'
        )}
      >
        {thread.title || t('threads.thread')}
      </span>
      {thread.isResolved && (
        <span
          className="flex-shrink-0 text-green-400 text-xs"
          title={t('threads.resolved')}
        >
          ✓
        </span>
      )}
      {thread.isArchived && (
        <span
          className="flex-shrink-0 text-yellow-400 text-xs"
          title={t('threads.archived')}
        >
          📦
        </span>
      )}
      {hasUnread && (
        <span className="flex-shrink-0 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[22px] text-center shadow-sm">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
      <span
        className={cn(
          'flex-shrink-0 text-xs transition-colors',
          isActive ? 'text-gray-400' : 'text-gray-500 group-hover:text-gray-400'
        )}
      >
        {thread.replyCount}
      </span>
    </button>
  );
}
