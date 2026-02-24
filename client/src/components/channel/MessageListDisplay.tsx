// Message List Component - Displays messages with loading and empty states
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LoadingState } from '../ui/LoadingSpinner';
import ChannelEmptyState from '../channel/ChannelEmptyState';
import { MessageItem } from '../MessageItem';
import { ForwardMessageModal } from '../message/ForwardMessageModal';
import { renderEnhancedMessage } from '../../utils/messageRendering';
import { api } from '../../services/api';
import { toast } from '../../store/notification';
import { getUserDisplayName, getUserInitials } from '../../utils/user';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  edited: boolean;
  authorId: string;
  isPinned?: boolean;
  attachments?: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }>;
  reactionCounts: Array<{ emoji: string; count: number; hasReacted: boolean }>;
  showHeader: boolean;
  author?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    avatarUrl?: string;
  };
}

interface MessageListDisplayProps {
  messages: Message[];
  loading: boolean;
  channelName?: string;
  currentUserId?: string;
  currentUserAvatar?: string;
  editingMessageId: string | null;
  editContent: string;
  editTextareaRef: React.RefObject<HTMLTextAreaElement>;
  compactMode: boolean;
  isDM?: boolean;
  onEditContentChange: (value: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEdit: (messageId: string, content: string) => void;
  onDelete: (messageId: string) => void;
  onPin?: (messageId: string) => void;
  canPin?: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export default function MessageListDisplay({
  messages,
  loading,
  channelName,
  currentUserId,
  currentUserAvatar,
  editingMessageId,
  editContent,
  editTextareaRef,
  compactMode,
  isDM = false,
  onEditContentChange,
  onSaveEdit,
  onCancelEdit,
  onEdit,
  onDelete,
  onPin,
  canPin = false,
  messagesEndRef
}: MessageListDisplayProps) {
  const { t } = useTranslation();

  // Forward message state
  const [forwardingMessage, setForwardingMessage] = useState<{
    id: string;
    content: string;
  } | null>(null);

  const handleForward = async (
    targetId: string,
    targetType: 'channel' | 'dm'
  ) => {
    if (!forwardingMessage) return;

    try {
      if (targetType === 'channel') {
        // Use REST API for reliable message forwarding
        await api.createMessage(targetId, forwardingMessage.content);
      } else {
        await api.sendDM(targetId, forwardingMessage.content);
      }
      setForwardingMessage(null);
      toast.success(t('messages.forwardSuccess'));
    } catch (error) {
      console.error('Failed to forward message:', error);
      toast.error(t('messages.forwardError'));
    }
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <LoadingState text={t('common.loadingMessages')} />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <ChannelEmptyState channelName={channelName ?? t('channels.channel')} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {messages.map((message) => (
          <MessageItem
            key={message.id}
            messageId={message.id}
            content={message.content}
            createdAt={message.createdAt}
            edited={message.edited}
            attachments={message.attachments}
            reactionCounts={message.reactionCounts}
            showHeader={message.showHeader}
            isEditing={editingMessageId === message.id}
            isOwnMessage={message.authorId === currentUserId}
            authorName={
              message.authorId === currentUserId
                ? 'Du'
                : message.author
                  ? getUserDisplayName(message.author)
                  : 'Unknown'
            }
            authorInitial={
              message.author ? getUserInitials(message.author) : '?'
            }
            authorAvatarUrl={
              message.authorId === currentUserId
                ? currentUserAvatar
                : message.author?.avatarUrl
            }
            editContent={editingMessageId === message.id ? editContent : ''}
            editTextareaRef={editTextareaRef}
            onEditContentChange={onEditContentChange}
            onSaveEdit={onSaveEdit}
            onCancelEdit={onCancelEdit}
            onEdit={onEdit}
            onDelete={onDelete}
            onForward={(messageId, content) =>
              setForwardingMessage({ id: messageId, content })
            }
            onPin={onPin}
            isPinned={message.isPinned}
            canPin={canPin}
            renderContent={renderEnhancedMessage}
            compact={compactMode}
            isDM={isDM}
          />
        ))}
        <div ref={messagesEndRef} />

        {/* Forward Message Modal */}
        {forwardingMessage && (
          <ForwardMessageModal
            messageContent={forwardingMessage.content}
            onForward={handleForward}
            onClose={() => setForwardingMessage(null)}
          />
        )}
      </div>
    </div>
  );
}
