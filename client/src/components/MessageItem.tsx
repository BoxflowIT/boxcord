// Message Item Component - Reusable message display
import React, { memo, useState } from 'react';
import { formatTime } from '../lib/formatters';
import { api } from '../services/api';
import { logger } from '../utils/logger';
import {
  MessageAvatar,
  MessageHeader,
  MessageContent,
  MessageReactionBubbles,
  MessageActions,
  MessageEditForm,
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
  const [localReactions, setLocalReactions] = useState(reactionCounts);

  const handleQuickReaction = async (emoji: string) => {
    try {
      const { added } = isDM
        ? await api.toggleDMReaction(messageId, emoji)
        : await api.toggleReaction(messageId, emoji);
      setLocalReactions((prev) => {
        const existing = prev.find((r) => r.emoji === emoji);
        if (existing) {
          if (added) {
            return prev.map((r) =>
              r.emoji === emoji
                ? { ...r, count: r.count + 1, hasReacted: true }
                : r
            );
          } else {
            const newCount = existing.count - 1;
            if (newCount <= 0) {
              return prev.filter((r) => r.emoji !== emoji);
            }
            return prev.map((r) =>
              r.emoji === emoji
                ? { ...r, count: newCount, hasReacted: false }
                : r
            );
          }
        } else if (added) {
          return [...prev, { emoji, count: 1, hasReacted: true }];
        }
        return prev;
      });
    } catch (err) {
      logger.error('Failed to add quick reaction:', err);
    }
  };

  return (
    <div
      className={`group relative hover:bg-boxflow-hover/40 -mx-4 px-4 rounded transition-all duration-100 ${
        compact ? 'py-0.5' : 'py-1'
      }`}
    >
      {/* Message actions - Quick reactions bar (hover) */}
      {!isEditing && (
        <MessageActions
          onQuickReaction={handleQuickReaction}
          onEdit={() => onEdit(messageId, content)}
          onDelete={() => onDelete(messageId)}
          isOwnMessage={isOwnMessage}
        />
      )}

      {showHeader ? (
        <div className={`flex items-start gap-4 ${compact ? 'mt-2' : 'mt-4'}`}>
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
              <>
                <MessageContent
                  content={content}
                  attachments={attachments}
                  compact={compact}
                  renderContent={renderContent}
                />
                <MessageReactionBubbles
                  reactions={localReactions}
                  onToggle={handleQuickReaction}
                />
              </>
            )}
          </div>
        </div>
      ) : (
        // Compact mode (no header)
        <div
          className={`flex items-start gap-4 pl-14 ${
            compact ? 'py-0' : 'py-0.5'
          }`}
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
              <>
                <MessageContent
                  content={content}
                  attachments={attachments}
                  compact={compact}
                  renderContent={renderContent}
                />
                <MessageReactionBubbles
                  reactions={localReactions}
                  onToggle={handleQuickReaction}
                />
              </>
            )}
          </div>
        </div>
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
