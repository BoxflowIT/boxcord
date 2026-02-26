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
import { logger } from '../../utils/logger';
import { useThreadStore } from '../../store/thread';
import { createThread, getThreadByMessageId } from '../../hooks/useThreads';

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
  onMessageHover?: (messageId: string | null) => void;
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
  messagesEndRef,
  onMessageHover
}: MessageListDisplayProps) {
  const { t } = useTranslation();
  // Use individual selectors to prevent re-renders when unrelated thread store
  // state changes (e.g. threadReplies from reactions should not re-render message list)
  const openThreadSidebar = useThreadStore((s) => s.openThreadSidebar);
  const threads = useThreadStore((s) => s.threads);

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
      logger.error('Failed to forward message:', error);
      toast.error(t('messages.forwardError'));
    }
  };

  // Handle starting or viewing a thread
  const handleStartThread = async (messageId: string) => {
    try {
      // Check if thread already exists in local store
      const allThreads = Object.values(threads).filter(Array.isArray).flat();
      const existingThread = allThreads.find((t) => t.messageId === messageId);

      if (existingThread) {
        // Open existing thread
        openThreadSidebar(existingThread.id);
      } else {
        // Try to create new thread
        try {
          const newThread = await createThread(messageId);
          useThreadStore.getState().addThread(newThread);
          openThreadSidebar(newThread.id);
        } catch (createError: any) {
          // If message already has a thread (not in local store), fetch and open it
          if (createError?.message?.includes('already has a thread')) {
            const serverThread = await getThreadByMessageId(messageId);
            if (serverThread) {
              useThreadStore.getState().addThread(serverThread);
              openThreadSidebar(serverThread.id);
              return;
            }
          }
          throw createError;
        }
      }
    } catch (error) {
      logger.error('Failed to start thread:', error);
      toast.error('Failed to start thread');
    }
  };

  // Get thread info for a message
  const getThreadInfo = (messageId: string) => {
    const allThreads = Object.values(threads).filter(Array.isArray).flat();
    const thread = allThreads.find((t) => t.messageId === messageId);
    return {
      hasThread: !!thread,
      threadReplyCount: thread?.replyCount || 0
    };
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
        {messages.map((message) => {
          const threadInfo = getThreadInfo(message.id);
          return (
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
              authorId={message.authorId}
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
              onStartThread={
                !isDM ? () => handleStartThread(message.id) : undefined
              }
              hasThread={threadInfo.hasThread}
              threadReplyCount={threadInfo.threadReplyCount}
              onPin={onPin}
              isPinned={message.isPinned}
              canPin={canPin}
              renderContent={renderEnhancedMessage}
              compact={compactMode}
              isDM={isDM}
              onHover={onMessageHover}
            />
          );
        })}
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
