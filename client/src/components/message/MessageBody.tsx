// Message Body - Content + Actions hover bar
import React from 'react';
import { MessageContent } from './MessageContent';
import { MessageReactionBubbles } from './MessageReactionBubbles';
import { MessageActions } from './MessageActions';
import { ThreadIcon } from '../ui/Icons';
import type { MessageAttachment, MessageReaction } from './index';

interface MessageBodyProps {
  messageId?: string;
  dmMessageId?: string;
  content: string;
  attachments?: MessageAttachment[];
  reactions: MessageReaction[];
  compact: boolean;
  renderContent?: (content: string) => React.ReactNode;
  // Action bar props
  showActions: boolean;
  onQuickReaction: (emoji: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onForward?: () => void;
  onStartThread?: () => void;
  onPin?: () => void;
  hasThread?: boolean;
  threadReplyCount?: number;
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
  showActions,
  onQuickReaction,
  onEdit,
  onDelete,
  onForward,
  onStartThread,
  hasThread,
  threadReplyCount,
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
            onStartThread={onStartThread}
            hasThread={hasThread}
            threadReplyCount={threadReplyCount}
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

      {/* Thread indicator - shown permanently when message has a thread */}
      {hasThread && (threadReplyCount ?? 0) > 0 && onStartThread && (
        <button
          onClick={onStartThread}
          className="inline-flex items-center gap-1.5 mt-2 px-2 py-1 text-xs text-gray-400 hover:text-gray-300 hover:bg-gray-800/50 rounded transition-colors"
        >
          <ThreadIcon size="sm" className="text-gray-500" />
          <span className="font-medium">{threadReplyCount}</span>
          <span>{threadReplyCount === 1 ? 'reply' : 'replies'}</span>
        </button>
      )}

      <MessageReactionBubbles
        reactions={reactions}
        onToggle={onQuickReaction}
      />
    </div>
  );
}
