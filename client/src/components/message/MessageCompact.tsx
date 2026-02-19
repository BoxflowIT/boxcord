// Message Compact - Compact message without header/avatar
import React from 'react';
import { cn } from '../../utils/classNames';
import { formatTime } from '../../lib/formatters';
import { MessageBody } from './MessageBody';
import { MessageEditForm } from './MessageEditForm';
import type { MessageAttachment, MessageReaction } from './index';

interface MessageCompactProps {
  // Message data
  messageId: string;
  content: string;
  createdAt: string;
  attachments?: MessageAttachment[];
  reactions: MessageReaction[];
  compact: boolean;

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

export function MessageCompact({
  content,
  createdAt,
  attachments,
  reactions,
  compact,
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
}: MessageCompactProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-4 pl-14',
        compact ? 'py-0' : 'py-0.5'
      )}
    >
      <span className="text-xs text-boxflow-muted opacity-0 group-hover:opacity-100 -ml-10 w-10 text-right">
        {formatTime(createdAt)}
      </span>
      <div className="flex-1">
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
