// Reusable Message Actions Bar - Quick reactions + edit/delete
import React from 'react';
import { EditIcon, TrashIcon } from '../ui/Icons';

interface MessageActionsProps {
  onQuickReaction: (emoji: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isOwnMessage: boolean;
  quickReactions?: string[];
}

const DEFAULT_QUICK_REACTIONS = ['👍', '❤️', '😂', '🎉', '🔥'];

export function MessageActions({
  onQuickReaction,
  onEdit,
  onDelete,
  isOwnMessage,
  quickReactions = DEFAULT_QUICK_REACTIONS
}: MessageActionsProps) {
  return (
    <div className="action-bar">
      {/* Quick reactions */}
      {quickReactions.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onQuickReaction(emoji)}
          className="p-1 hover:bg-boxflow-hover rounded text-lg transition-transform hover:scale-125"
          title={`Reagera med ${emoji}`}
        >
          {emoji}
        </button>
      ))}

      {/* Divider */}
      <div className="w-px h-4 bg-boxflow-hover mx-1" />

      {/* Edit/Delete for own messages */}
      {isOwnMessage && (
        <>
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-1 hover:bg-boxflow-hover rounded"
              title="Redigera"
            >
              <EditIcon size="sm" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1 hover:bg-red-500/20 rounded text-red-400"
              title="Ta bort"
            >
              <TrashIcon size="sm" />
            </button>
          )}
        </>
      )}
    </div>
  );
}
