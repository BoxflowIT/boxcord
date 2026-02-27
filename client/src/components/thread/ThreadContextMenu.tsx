// Thread Context Menu - Right-click menu for thread actions
import { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ThreadIcon,
  EditIcon,
  TrashIcon,
  ArchiveIcon,
  CheckCircleIcon
} from '../ui/Icons';

interface ThreadContextMenuProps {
  x: number;
  y: number;
  isOwner: boolean;
  isArchived?: boolean;
  isResolved?: boolean;
  onEditTitle: () => void;
  onMarkAsRead: () => void;
  onUnfollow: () => void;
  onToggleArchive?: () => void;
  onToggleResolve?: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function ThreadContextMenu({
  x,
  y,
  isOwner,
  isArchived = false,
  isResolved = false,
  onEditTitle,
  onMarkAsRead,
  onUnfollow,
  onToggleArchive,
  onToggleResolve,
  onDelete,
  onClose
}: ThreadContextMenuProps) {
  const { t } = useTranslation();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: y,
        left: x,
        zIndex: 9999
      }}
      className="bg-gray-800 border border-gray-600 rounded-lg shadow-xl py-1 min-w-[180px]"
    >
      {isOwner && (
        <button
          onClick={() => {
            onEditTitle();
            onClose();
          }}
          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 transition-colors"
        >
          <EditIcon size="sm" />
          <span>Edit Title</span>
        </button>
      )}
      <button
        onClick={() => {
          onMarkAsRead();
          onClose();
        }}
        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 transition-colors"
      >
        <ThreadIcon size="sm" />
        <span>Mark as Read</span>
      </button>
      <button
        onClick={() => {
          onUnfollow();
          onClose();
        }}
        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 transition-colors"
      >
        <ThreadIcon size="sm" />
        <span>Unfollow</span>
      </button>
      {isOwner && (
        <>
          <div className="h-px bg-gray-700 my-1" />
          <button
            onClick={() => {
              onToggleResolve?.();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 transition-colors"
          >
            <CheckCircleIcon
              size="sm"
              className={isResolved ? 'text-green-400' : undefined}
            />
            <span>
              {isResolved ? t('threads.unresolve') : t('threads.resolve')}
            </span>
          </button>
          <button
            onClick={() => {
              onToggleArchive?.();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 transition-colors"
          >
            <ArchiveIcon
              size="sm"
              className={isArchived ? 'text-yellow-400' : undefined}
            />
            <span>
              {isArchived ? t('threads.unarchive') : t('threads.archive')}
            </span>
          </button>
          <div className="h-px bg-gray-700 my-1" />
          <button
            onClick={() => {
              onDelete();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 transition-colors"
          >
            <TrashIcon size="sm" />
            <span>Delete Thread</span>
          </button>
        </>
      )}
    </div>
  );
}
