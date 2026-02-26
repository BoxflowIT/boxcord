// Thread Header - Title, edit, follow, close controls
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ThreadIcon, EditIcon, TrashIcon, CloseIcon } from '../ui/Icons';
import type { Thread } from '../../store/thread';

interface ThreadHeaderProps {
  thread: Thread | null;
  isOwner: boolean;
  onEditTitle: (title: string) => Promise<void>;
  onDelete: () => void;
  onClose: () => void;
}

export function ThreadHeader({
  thread,
  isOwner,
  onEditTitle,
  onDelete,
  onClose
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
          <h2 className="font-semibold text-lg truncate">
            {thread?.title || t('threads.thread')}
          </h2>
        )}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {!isEditing && thread && isOwner && (
          <>
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
