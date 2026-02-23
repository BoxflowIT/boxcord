// Message Body - Content + Actions hover bar
import React from 'react';
import { MessageContent } from './MessageContent';
import { MessageReactionBubbles } from './MessageReactionBubbles';
import { MessageActions } from './MessageActions';
import type { MessageAttachment, MessageReaction } from './index';

interface MessageBodyProps {
  messageId?: string;
  dmMessageId?: string;
  content: string;
  attachments?: MessageAttachment[];
  reactions: MessageReaction[];
  compact: boolean;
  renderContent?: (content: string) => React.ReactNode;
  onToggleReaction: (emoji: string) => void;
  // Action bar props
  showActions: boolean;
  onQuickReaction: (emoji: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onForward?: () => void;
  onPin?: () => void;
  isPinned?: boolean;
  canPin?: boolean;
  isOwnMessage: boolean;
}

export function MessageBody({
  messageId,
  dmMessageId,
  content,
  attachments = [],
  reactions,
  compact,
  renderContent,
  onToggleReaction,
  showActions,
  onQuickReaction,
  onEdit,
  onDelete,
  onForward,
  onPin,
  isPinned,
  canPin,
  isOwnMessage
}: MessageBodyProps) {
  return (
    <div className="message-body">
      {/* Message actions - Quick reactions bar (hover) */}
      {showActions && (
        <div className="message-actions">
          <MessageActions
            messageId={messageId}
            dmMessageId={dmMessageId}
            onQuickReaction={onQuickReaction}
            onEdit={onEdit}
            onDelete={onDelete}
            onForward={onForward}
            onPin={onPin}
            isPinned={isPinned}
            canPin={canPin}
            isOwnMessage={isOwnMessage}
          />
        </div>
      )}

      <MessageContent
        content={content}
        attachments={attachments}
        compact={compact}
        renderContent={renderContent}
      />
      <MessageReactionBubbles
        reactions={reactions}
        onToggle={onToggleReaction}
      />
    </div>
  );
}
