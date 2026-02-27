// Thread Header - Title, edit, follow, close controls
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ThreadIcon,
  EditIcon,
  TrashIcon,
  CloseIcon,
  ArchiveIcon,
  CheckCircleIcon
} from '../ui/Icons';
import type { Thread } from '../../store/thread';

interface ThreadHeaderProps {
  thread: Thread | null;
  isOwner: boolean;
  onEditTitle: (title: string) => Promise<void>;
  onDelete: () => void;
  onClose: () => void;
  onToggleArchive?: () => void;
  onToggleResolve?: () => void;
}

export function ThreadHeader({
  thread,
  isOwner,
  onEditTitle,
  onDelete,
  onClose,
  onToggleArchive,
  onToggleResolve
}: ThreadHeaderProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    setEditedTitle(thread?.title || '');
    setIsEditing(true);
  };

  const handleSaveTitle = async () => {
    if (!editedTitle.trim()) {
      setIsEditing(false);
      return;
    }

    await onEditTitle(editedTitle.trim());
    setIsEditing(false);
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-boxflow-border bg-boxflow-darker flex-shrink-0">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <ThreadIcon size="md" className="text-boxflow-muted flex-shrink-0" />
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveTitle();
              if (e.key === 'Escape') setIsEditing(false);
            }}
            className="flex-1 bg-boxflow-darker text-boxflow-light border border-boxflow-border rounded px-2 py-1 text-sm focus:outline-none focus:border-boxflow-primary"
            placeholder="Thread title..."
          />
        ) : (
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="font-semibold text-lg truncate">
              {thread?.title || t('threads.thread')}
            </h2>
            {thread?.isResolved && (
              <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
                <CheckCircleIcon size="sm" />
                {t('threads.resolved')}
              </span>
            )}
            {thread?.isArchived && (
              <span className="flex items-center gap-1 text-xs text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
                <ArchiveIcon size="sm" />
                {t('threads.archived')}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {!isEditing && thread && isOwner && (
          <>
            <button
              onClick={onToggleResolve}
              className={`p-1.5 hover:bg-boxflow-hover rounded transition-colors ${
                thread.isResolved
                  ? 'text-green-400 hover:text-green-300'
                  : 'text-boxflow-muted hover:text-boxflow-light'
              }`}
              title={
                thread.isResolved
                  ? t('threads.unresolve')
                  : t('threads.resolve')
              }
            >
              <CheckCircleIcon size="sm" />
            </button>
            <button
              onClick={onToggleArchive}
              className={`p-1.5 hover:bg-boxflow-hover rounded transition-colors ${
                thread.isArchived
                  ? 'text-yellow-400 hover:text-yellow-300'
                  : 'text-boxflow-muted hover:text-boxflow-light'
              }`}
              title={
                thread.isArchived
                  ? t('threads.unarchive')
                  : t('threads.archive')
              }
            >
              <ArchiveIcon size="sm" />
            </button>
            <button
              onClick={handleStartEdit}
              className="p-1.5 hover:bg-boxflow-hover rounded transition-colors text-boxflow-muted hover:text-boxflow-light"
              title="Edit thread title"
            >
              <EditIcon size="sm" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 hover:bg-red-500/20 rounded transition-colors text-red-400 hover:text-red-300"
              title="Delete thread"
            >
              <TrashIcon size="sm" />
            </button>
          </>
        )}
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-boxflow-hover rounded transition-colors text-boxflow-muted hover:text-boxflow-light"
          title={t('common.close')}
        >
          <CloseIcon size="sm" />
        </button>
      </div>
    </div>
  );
}
