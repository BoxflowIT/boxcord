// Message Item Component - Reusable message display
import React, { memo } from 'react';
import { useMessageReactions } from '../hooks/useMessageReactions';
import { cn } from '../utils/classNames';
import {
  MessageWithHeader,
  MessageCompact,
  type MessageAttachment,
  type MessageReaction
} from './message';

// Re-export types for backward compatibility
export type { MessageAttachment, MessageReaction };

export interface MessageItemProps {
  messageId: string;
  content: string;
  createdAt: string;
  edited: boolean;
  attachments?: MessageAttachment[];
  reactionCounts: MessageReaction[];
  showHeader: boolean;
  isEditing: boolean;
  isOwnMessage: boolean;

  // Display options
  authorName: string;
  authorInitial: string;
  authorAvatarUrl?: string | null;

  // Edit state
  editContent: string;
  editTextareaRef: React.RefObject<HTMLTextAreaElement>;
  onEditContentChange: (value: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;

  // Actions
  onEdit: (messageId: string, content: string) => void;
  onDelete: (messageId: string) => void;

  // Optional customization
  renderContent?: (content: string) => React.ReactNode;
  compact?: boolean; // Use compact styling (like ChannelView)
  isDM?: boolean; // Is this a DM message? (uses different reaction endpoint)
}

const MessageItemComponent: React.FC<MessageItemProps> = ({
  messageId,
  content,
  createdAt,
  edited,
  attachments = [],
  reactionCounts,
  showHeader,
  isEditing,
  isOwnMessage,
  authorName,
  authorInitial,
  authorAvatarUrl,
  editContent,
  editTextareaRef,
  onEditContentChange,
  onSaveEdit,
  onCancelEdit,
  onEdit,
  onDelete,
  renderContent,
  compact = false,
  isDM = false
}) => {
  const { reactions, handleToggleReaction } = useMessageReactions({
    messageId,
    initialReactions: reactionCounts,
    isDM
  });

  return (
    <div
      className={cn(
        'group relative hover:bg-boxflow-hover/40',
        '-mx-4 px-4 rounded transition-all duration-100',
        compact ? 'py-0.5' : 'py-1'
      )}
    >
      {showHeader ? (
        <MessageWithHeader
          messageId={messageId}
          content={content}
          createdAt={createdAt}
          edited={edited}
          attachments={attachments}
          reactions={reactions}
          compact={compact}
          authorName={authorName}
          authorInitial={authorInitial}
          authorAvatarUrl={authorAvatarUrl}
          isEditing={isEditing}
          isOwnMessage={isOwnMessage}
          editContent={editContent}
          editTextareaRef={editTextareaRef}
          onEditContentChange={onEditContentChange}
          onSaveEdit={onSaveEdit}
          onCancelEdit={onCancelEdit}
          onEdit={() => onEdit(messageId, content)}
          onDelete={() => onDelete(messageId)}
          onQuickReaction={handleToggleReaction}
          onToggleReaction={handleToggleReaction}
          renderContent={renderContent}
        />
      ) : (
        <MessageCompact
          messageId={messageId}
          content={content}
          createdAt={createdAt}
          attachments={attachments}
          reactions={reactions}
          compact={compact}
          isEditing={isEditing}
          isOwnMessage={isOwnMessage}
          editContent={editContent}
          editTextareaRef={editTextareaRef}
          onEditContentChange={onEditContentChange}
          onSaveEdit={onSaveEdit}
          onCancelEdit={onCancelEdit}
          onEdit={() => onEdit(messageId, content)}
          onDelete={() => onDelete(messageId)}
          onQuickReaction={handleToggleReaction}
          onToggleReaction={handleToggleReaction}
          renderContent={renderContent}
        />
      )}
    </div>
  );
};

// Custom comparison to prevent unnecessary re-renders
// Only re-render when actual data changes, NOT when callbacks change
const areEqual = (
  prevProps: MessageItemProps,
  nextProps: MessageItemProps
): boolean => {
  // Always re-render if editing state changes
  if (prevProps.isEditing !== nextProps.isEditing) return false;

  // If we're editing THIS message, check edit content
  if (nextProps.isEditing && prevProps.editContent !== nextProps.editContent)
    return false;

  // Check data props
  if (prevProps.messageId !== nextProps.messageId) return false;
  if (prevProps.content !== nextProps.content) return false;
  if (prevProps.createdAt !== nextProps.createdAt) return false;
  if (prevProps.edited !== nextProps.edited) return false;
  if (prevProps.showHeader !== nextProps.showHeader) return false;
  if (prevProps.isOwnMessage !== nextProps.isOwnMessage) return false;
  if (prevProps.authorName !== nextProps.authorName) return false;
  if (prevProps.authorInitial !== nextProps.authorInitial) return false;
  if (prevProps.authorAvatarUrl !== nextProps.authorAvatarUrl) return false;
  if (prevProps.compact !== nextProps.compact) return false;
  if (prevProps.isDM !== nextProps.isDM) return false;

  // Shallow compare arrays by reference (they should be memoized in parent)
  if (prevProps.attachments !== nextProps.attachments) return false;
  if (prevProps.reactionCounts !== nextProps.reactionCounts) return false;

  // Callbacks are NOT compared - they don't affect render output
  return true;
};

export const MessageItem = memo(MessageItemComponent, areEqual);
