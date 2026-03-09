// Message With Header - Full message display with avatar
import React from 'react';
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
  authorId: string;
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
  onStartThread?: () => void;
  onPin?: () => void;
  onQuickReaction: (emoji: string) => void;

  // Thread state
  hasThread?: boolean;
  threadReplyCount?: number;

  // Pin state
  isPinned?: boolean;
  canPin?: boolean;

  // Bot
  isBot?: boolean;

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
  authorId,
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
  onStartThread,
  hasThread,
  threadReplyCount,
  onPin,
  isPinned,
  canPin,
  onQuickReaction,
  isBot,
  renderContent
}: MessageWithHeaderProps) {
  return (
    <div className="message-wrapper flex items-start gap-4">
      <MessageAvatar
        avatarUrl={authorAvatarUrl}
        initial={authorInitial}
        userName={authorName}
        userId={authorId}
        size="md"
      />
      <div className="flex-1 min-w-0">
        <MessageHeader
          authorName={authorName}
          createdAt={createdAt}
          edited={edited}
          compact={compact}
          isBot={isBot}
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
            showActions={!isEditing}
            onQuickReaction={onQuickReaction}
            onEdit={onEdit}
            onDelete={onDelete}
            onForward={onForward}
            onStartThread={onStartThread}
            hasThread={hasThread}
            threadReplyCount={threadReplyCount}
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
