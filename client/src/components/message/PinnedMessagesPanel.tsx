// Pinned Messages Panel - Show pinned messages at the top of a channel
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PinIcon,
  CloseIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '../ui/Icons';

interface PinnedMessage {
  id: string;
  content: string;
  authorId: string;
  author?: {
    firstName?: string | null;
    lastName?: string | null;
    email: string;
  };
  createdAt: string | Date;
  isPinned: boolean;
  pinnedAt?: string | Date | null;
}

interface PinnedMessagesPanelProps {
  pinnedMessages: PinnedMessage[];
  onMessageClick?: (messageId: string) => void;
  onUnpin?: (messageId: string) => void;
  canUnpin?: boolean;
}

export function PinnedMessagesPanel({
  pinnedMessages,
  onMessageClick,
  onUnpin,
  canUnpin = false
}: PinnedMessagesPanelProps) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);

  if (pinnedMessages.length === 0) return null;

  const currentMessage = pinnedMessages[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % pinnedMessages.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? pinnedMessages.length - 1 : prev - 1
    );
  };

  const getAuthorName = (msg: PinnedMessage) => {
    if (msg.author?.firstName || msg.author?.lastName) {
      return `${msg.author.firstName || ''} ${msg.author.lastName || ''}`.trim();
    }
    return msg.author?.email || 'Unknown';
  };

  return (
    <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2">
      <div className="flex items-center gap-3">
        {/* Pin Icon */}
        <PinIcon size="sm" className="text-yellow-400 flex-shrink-0" />

        {/* Pinned Message Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <span>
              {t('messages.pinnedBy', {
                author: getAuthorName(currentMessage)
              })}
            </span>
            {pinnedMessages.length > 1 && (
              <span>
                {currentIndex + 1} / {pinnedMessages.length}
              </span>
            )}
          </div>
          <button
            onClick={() => onMessageClick?.(currentMessage.id)}
            className="text-sm text-left hover:underline truncate max-w-full block"
          >
            {currentMessage.content}
          </button>
        </div>

        {/* Navigation Buttons (if multiple pinned) */}
        {pinnedMessages.length > 1 && (
          <div className="flex gap-1">
            <button
              onClick={handlePrev}
              className="p-1 hover:bg-boxflow-hover rounded"
              title={t('messages.previousPinned')}
            >
              <ChevronUpIcon size="sm" />
            </button>
            <button
              onClick={handleNext}
              className="p-1 hover:bg-boxflow-hover rounded"
              title={t('messages.nextPinned')}
            >
              <ChevronDownIcon size="sm" />
            </button>
          </div>
        )}

        {/* Unpin Button (if permission) */}
        {canUnpin && onUnpin && (
          <button
            onClick={() => onUnpin(currentMessage.id)}
            className="p-1 hover:bg-red-500/20 rounded text-red-400"
            title={t('messages.unpin')}
          >
            <CloseIcon size="sm" />
          </button>
        )}
      </div>
    </div>
  );
}
