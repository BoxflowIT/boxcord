// Message List Component - Displays messages with loading and empty states
import { LoadingState } from '../ui/LoadingSpinner';
import ChannelEmptyState from '../channel/ChannelEmptyState';
import { MessageItem } from '../MessageItem';
import { parseMentions } from '../MentionAutocomplete';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  edited: boolean;
  authorId: string;
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
  messagesEndRef
}: MessageListDisplayProps) {
  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <LoadingState text="Laddar meddelanden..." />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <ChannelEmptyState channelName={channelName ?? 'kanal'} />
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
                : message.author?.firstName && message.author?.lastName
                  ? `${message.author.firstName} ${message.author.lastName}`
                  : (message.author?.firstName ?? message.authorId.slice(0, 8))
            }
            authorInitial={(
              message.author?.firstName?.[0] ?? message.authorId[0]
            ).toUpperCase()}
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
            renderContent={(content) => parseMentions(content)}
            compact={compactMode}
            isDM={isDM}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
