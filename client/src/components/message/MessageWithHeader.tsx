// Message With Header - Full message display with avatar
import React from 'react';
import { cn } from '../../utils/classNames';
import { MessageAvatar } from './MessageAvatar';
import { MessageHeader } from './MessageHeader';
import { MessageBody } from './MessageBody';
import { MessageEditForm } from './MessageEditForm';
import type { MessageAttachment, MessageReaction } from './index';

interface MessageWithHeaderProps {
  // Message data
  messageId?: string;
  dmMessageId?: string;
  content: string;
  createdAt: string;
  edited: boolean;
  attachments?: MessageAttachment[];
  reactions: MessageReaction[];
  compact: boolean;

  // Author info
  authorName: string;
  authorInitial: string;
  authorAvatarUrl?: string | null;

  // State
  isEditing: boolean;
  isOwnMessage: boolean;

  // Edit state
  editContent: string;
  editTextareaRef: React.RefObject<HTMLTextAreaElement>;
  onEditContentChange: (value: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;

  // Actions
  onEdit: () => void;
  onDelete: () => void;
  onForward?: () => void;
  onPin?: () => void;
  onQuickReaction: (emoji: string) => void;
  onToggleReaction: (emoji: string) => void;

  // Pin state
  isPinned?: boolean;
  canPin?: boolean;

  // Optional
  renderContent?: (content: string) => React.ReactNode;
}

export function MessageWithHeader({
  messageId,
  dmMessageId,
  content,
  createdAt,
  edited,
  attachments,
  reactions,
  compact,
  authorName,
  authorInitial,
  authorAvatarUrl,
  isEditing,
  isOwnMessage,
  editContent,
  editTextareaRef,
  onEditContentChange,
  onSaveEdit,
  onCancelEdit,
  onEdit,
  onDelete,
  onForward,
  onPin,
  isPinned,
  canPin,
  onQuickReaction,
  onToggleReaction,
  renderContent
}: MessageWithHeaderProps) {
  return (
    <div className={cn('flex items-start gap-4', compact ? 'mt-2' : 'mt-4')}>
      <MessageAvatar
        avatarUrl={authorAvatarUrl}
        initial={authorInitial}
        userName={authorName}
        size="md"
      />
      <div className="flex-1 min-w-0">
        <MessageHeader
          authorName={authorName}
          createdAt={createdAt}
          edited={edited}
          compact={compact}
        />

        {isEditing ? (
          <MessageEditForm
            value={editContent}
            onChange={onEditContentChange}
            onSave={onSaveEdit}
            onCancel={onCancelEdit}
            textareaRef={editTextareaRef}
            compact={compact}
          />
        ) : (
          <MessageBody
            messageId={messageId}
            dmMessageId={dmMessageId}
            content={content}
            attachments={attachments}
            reactions={reactions}
            compact={compact}
            renderContent={renderContent}
            onToggleReaction={onToggleReaction}
            showActions={!isEditing}
            onQuickReaction={onQuickReaction}
            onEdit={onEdit}
            onDelete={onDelete}
            onForward={onForward}
            onPin={onPin}
            isPinned={isPinned}
            canPin={canPin}
            isOwnMessage={isOwnMessage}
          />
        )}
      </div>
    </div>
  );
}
