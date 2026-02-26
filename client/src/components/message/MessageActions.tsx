// Reusable Message Actions Bar - Quick reactions + edit/delete/pin/forward/bookmark
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  EditIcon,
  TrashIcon,
  PinIcon,
  SendIcon,
  ThreadIcon
} from '../ui/Icons';
import { BookmarkButton } from '../action/BookmarkButton';
import ReactionEmojiPicker from '../reactions/ReactionEmojiPicker';

interface MessageActionsProps {
  messageId?: string;
  dmMessageId?: string;
  onQuickReaction: (emoji: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onPin?: () => void;
  onForward?: () => void;
  onStartThread?: () => void; // New: Start or view thread
  hasThread?: boolean; // Whether message already has a thread
  threadReplyCount?: number; // Number of replies in thread
  isOwnMessage: boolean;
  isPinned?: boolean;
  canPin?: boolean; // Permission to pin messages
  quickReactions?: string[];
}

const DEFAULT_QUICK_REACTIONS = ['👍', '❤️', '😂', '🎉', '🔥'];

export function MessageActions({
  messageId,
  dmMessageId,
  onQuickReaction,
  onEdit,
  onDelete,
  onPin,
  onForward,
  onStartThread,
  hasThread = false,
  threadReplyCount = 0,
  isOwnMessage,
  isPinned = false,
  canPin = false,
  quickReactions = DEFAULT_QUICK_REACTIONS
}: MessageActionsProps) {
  const { t } = useTranslation();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const pickerContainerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [buttonRect, setButtonRect] = useState<DOMRect | undefined>();

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerContainerRef.current &&
        !pickerContainerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showEmojiPicker]);

  const handleEmojiSelect = (emoji: string) => {
    onQuickReaction(emoji);
    setShowEmojiPicker(false);
  };

  const handleOpenPicker = () => {
    if (buttonRef.current) {
      setButtonRect(buttonRef.current.getBoundingClientRect());
    }
    setShowEmojiPicker(true);
  };

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

      {/* More reactions button */}
      <div ref={pickerContainerRef} className="relative">
        <button
          ref={buttonRef}
          onClick={handleOpenPicker}
          className={`p-1.5 rounded border-2 transition-all ${
            showEmojiPicker
              ? 'bg-boxflow-primary border-boxflow-primary text-white opacity-100'
              : 'bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-gray-500 opacity-50 hover:opacity-70'
          }`}
          title={t('messages.moreReactions')}
        >
          <span className="text-sm">😀</span>
        </button>
        {showEmojiPicker && (
          <ReactionEmojiPicker
            onEmojiSelect={handleEmojiSelect}
            onClose={() => setShowEmojiPicker(false)}
            buttonRect={buttonRect}
          />
        )}
      </div>

      {/* Divider */}
      <div className="w-px h-4 bg-boxflow-hover mx-1" />

      {/* Thread button (only for channel messages, not DMs) */}
      {messageId && onStartThread && (
        <button
          onClick={onStartThread}
          className={`p-1 hover:bg-boxflow-hover rounded relative ${hasThread ? 'text-boxflow-primary' : ''}`}
          title={hasThread ? t('threads.viewThread') : t('threads.startThread')}
        >
          <ThreadIcon size="sm" />
          {threadReplyCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-boxflow-primary text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {threadReplyCount > 9 ? '9+' : threadReplyCount}
            </span>
          )}
        </button>
      )}

      {/* Bookmark button */}
      <BookmarkButton messageId={messageId} dmMessageId={dmMessageId} />

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

      {/* Forward button */}
      {onForward && (
        <button
          onClick={onForward}
          className="p-1 hover:bg-boxflow-hover rounded"
          title={t('messages.forwardMessage')}
        >
          <SendIcon size="sm" />
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
