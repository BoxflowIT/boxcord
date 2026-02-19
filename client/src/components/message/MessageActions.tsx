// Reusable Message Actions Bar - Quick reactions + edit/delete/pin
import { useTranslation } from 'react-i18next';
import { EditIcon, TrashIcon, PinIcon } from '../ui/Icons';

interface MessageActionsProps {
  onQuickReaction: (emoji: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onPin?: () => void;
  isOwnMessage: boolean;
  isPinned?: boolean;
  canPin?: boolean; // Permission to pin messages
  quickReactions?: string[];
}

const DEFAULT_QUICK_REACTIONS = ['👍', '❤️', '😂', '🎉', '🔥'];

export function MessageActions({
  onQuickReaction,
  onEdit,
  onDelete,
  onPin,
  isOwnMessage,
  isPinned = false,
  canPin = false,
  quickReactions = DEFAULT_QUICK_REACTIONS
}: MessageActionsProps) {
  const { t } = useTranslation();
  return (
    <>
      {/* Quick reactions */}
      {quickReactions.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onQuickReaction(emoji)}
          className="p-1 hover:bg-boxflow-hover rounded text-lg transition-transform hover:scale-125"
          title={t('messages.reactWith', { emoji })}
        >
          {emoji}
        </button>
      ))}

      {/* Divider */}
      <div className="w-px h-4 bg-boxflow-hover mx-1" />

      {/* Pin button (for users with permission) */}
      {canPin && onPin && (
        <button
          onClick={onPin}
          className={`p-1 hover:bg-boxflow-hover rounded ${isPinned ? 'text-yellow-400' : ''}`}
          title={isPinned ? t('messages.unpin') : t('messages.pin')}
        >
          <PinIcon size="sm" />
        </button>
      )}

      {/* Edit/Delete for own messages */}
      {isOwnMessage && (
        <>
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-1 hover:bg-boxflow-hover rounded"
              title={t('common.edit')}
            >
              <EditIcon size="sm" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1 hover:bg-red-500/20 rounded text-red-400"
              title={t('common.delete')}
            >
              <TrashIcon size="sm" />
            </button>
          )}
        </>
      )}
    </>
  );
}
