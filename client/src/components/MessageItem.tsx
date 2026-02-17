// Message Item Component - Reusable message display
import React, { memo, useState } from 'react';
import { formatTime } from '../lib/formatters';
import MessageReactions from './MessageReactions';
import { AttachmentPreview } from './FileUpload';
import { EditIcon, TrashIcon } from './ui/Icons';
import { api } from '../services/api';
import { logger } from '../utils/logger';

export interface MessageAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

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
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '🎉', '🔥'];

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
  editContent,
  editTextareaRef,
  onEditContentChange,
  onSaveEdit,
  onCancelEdit,
  onEdit,
  onDelete,
  renderContent,
  compact = false
}) => {
  const [localReactions, setLocalReactions] = useState(reactionCounts);

  const handleQuickReaction = async (emoji: string) => {
    try {
      const { added } = await api.toggleReaction(messageId, emoji);
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
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSaveEdit();
    } else if (e.key === 'Escape') {
      onCancelEdit();
    }
  };

  // IMPORTANT: This is a JSX element, NOT a function component!
  // Using a function component here would cause remount on every render, losing focus
  const editTextareaElement = (
    <div className="mt-1">
      <textarea
        ref={editTextareaRef}
        value={editContent}
        onChange={(e) => onEditContentChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full bg-boxflow-darkest text-boxflow-light rounded-lg p-3 resize-none outline-none focus:bg-boxflow-darker focus:ring-2 focus:ring-boxflow-primary/50 transition-all"
        rows={compact ? 2 : 3}
      />
      <div
        className={
          compact ? 'flex gap-2 mt-1 text-xs' : 'flex gap-2 mt-2 text-xs'
        }
      >
        <button
          onClick={onSaveEdit}
          className="px-3 py-1 bg-gradient-to-r from-[#5865f2] to-[#4752c4] hover:from-[#4752c4] hover:to-[#3c44a8] text-white rounded-lg shadow-lg shadow-[#5865f2]/25 transition-all"
        >
          Spara
        </button>
        <button
          onClick={onCancelEdit}
          className="px-3 py-1 hover:bg-[#404249] text-[#80848e] hover:text-white rounded-lg transition-colors"
        >
          Avbryt
        </button>
        {compact && (
          <span className="text-[#80848e] pt-1">
            Escape för att <strong>avbryta</strong> • Enter för att{' '}
            <strong>spara</strong>
          </span>
        )}
      </div>
    </div>
  );

  const QuickReactionsBar = () => (
    <div className="absolute -top-2 right-4 opacity-0 group-hover:opacity-100 bg-boxflow-darker border border-boxflow-hover rounded-lg shadow-xl px-2 py-1 flex items-center gap-1 z-50 transition-opacity duration-150">
      {/* Quick reactions */}
      {QUICK_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => handleQuickReaction(emoji)}
          className="p-1 hover:bg-[#404249] rounded text-lg transition-transform hover:scale-125"
          title={`Reagera med ${emoji}`}
        >
          {emoji}
        </button>
      ))}

      {/* Divider */}
      <div className="w-px h-4 bg-[#404249] mx-1" />

      {/* Edit/Delete for own messages */}
      {isOwnMessage && (
        <>
          <button
            onClick={() => onEdit(messageId, content)}
            className="p-1 hover:bg-[#404249] rounded"
            title="Redigera"
          >
            <EditIcon size="sm" />
          </button>
          <button
            onClick={() => onDelete(messageId)}
            className="p-1 hover:bg-red-500/20 rounded text-red-400"
            title="Ta bort"
          >
            <TrashIcon size="sm" />
          </button>
        </>
      )}
    </div>
  );

  return (
    <div
      className={`group relative hover:bg-[#404249]/40 -mx-4 px-4 rounded transition-all duration-100 ${
        compact ? 'py-0.5' : 'py-1'
      }`}
    >
      {/* Message actions - Quick reactions bar (positioned absolutely) */}
      {!isEditing && <QuickReactionsBar />}
      
      {showHeader ? (
        <div className={`flex items-start gap-4 ${compact ? 'mt-2' : 'mt-4'}`}>
          <div className="message-author-avatar">{authorInitial}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span
                className={`message-author-name ${
                  compact ? 'text-sm' : 'text-base'
                }`}
              >
                {authorName}
              </span>
              <span className="text-xs text-[#80848e]">
                {formatTime(createdAt)}
              </span>
              {edited && (
                <span className="text-xs text-[#80848e]">(redigerad)</span>
              )}
            </div>

            {isEditing ? (
              editTextareaElement
            ) : (
              <>
                <p
                  className={`text-[#f2f3f5] break-words ${
                    compact ? 'text-sm leading-5' : 'text-base'
                  }`}
                >
                  {renderContent ? renderContent(content) : content}
                </p>

                {/* Attachments */}
                {attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {attachments.map((att) => (
                      <AttachmentPreview
                        key={att.id}
                        fileName={att.fileName}
                        fileUrl={att.fileUrl}
                        fileType={att.fileType}
                        fileSize={att.fileSize}
                      />
                    ))}
                  </div>
                )}

                {/* Reactions */}
                {localReactions.length > 0 && (
                  <MessageReactions
                    messageId={messageId}
                    initialReactions={localReactions}
                  />
                )}
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
          <span className="text-xs text-[#80848e] opacity-0 group-hover:opacity-100 -ml-10 w-10 text-right">
            {formatTime(createdAt)}
          </span>
          <div className="flex-1">
            {isEditing ? (
              editTextareaElement
            ) : (
              <>
                <p
                  className={`text-[#f2f3f5] break-words ${
                    compact ? 'text-sm' : 'text-base'
                  }`}
                >
                  {renderContent ? renderContent(content) : content}
                </p>
                {attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {attachments.map((att) => (
                      <AttachmentPreview
                        key={att.id}
                        fileName={att.fileName}
                        fileUrl={att.fileUrl}
                        fileType={att.fileType}
                        fileSize={att.fileSize}
                      />
                    ))}
                  </div>
                )}
                {localReactions.length > 0 && (
                  <MessageReactions
                    messageId={messageId}
                    initialReactions={localReactions}
                  />
                )}
              </>
            )}
          </div>

          {/* Message actions - Quick reactions bar (Teams style) */}
          {!isEditing && <QuickReactionsBar />}
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
  if (prevProps.compact !== nextProps.compact) return false;

  // Shallow compare arrays by reference (they should be memoized in parent)
  if (prevProps.attachments !== nextProps.attachments) return false;
  if (prevProps.reactionCounts !== nextProps.reactionCounts) return false;

  // Callbacks are NOT compared - they don't affect render output
  return true;
};

export const MessageItem = memo(MessageItemComponent, areEqual);
