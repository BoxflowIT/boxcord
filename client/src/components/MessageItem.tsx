// Message Item Component - Reusable message display
import React from 'react';
import { formatTime } from '../lib/formatters';
import MessageReactions from './MessageReactions';
import { AttachmentPreview } from './FileUpload';

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
  showMessageMenu?: boolean;
  messageMenuOpen?: boolean;
  onToggleMessageMenu?: (messageId: string) => void;
  compact?: boolean; // Use compact styling (like ChannelView)
}

export const MessageItem: React.FC<MessageItemProps> = ({
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
  showMessageMenu = false,
  messageMenuOpen = false,
  onToggleMessageMenu,
  compact = false
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSaveEdit();
    } else if (e.key === 'Escape') {
      onCancelEdit();
    }
  };

  const EditTextarea = () => (
    <div className={compact ? 'mt-1' : 'mt-1'}>
      <textarea
        ref={editTextareaRef}
        value={editContent}
        onChange={(e) => onEditContentChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full bg-discord-darker text-discord-light rounded p-2 resize-none outline-none"
        rows={compact ? 2 : 3}
      />
      <div
        className={`flex gap-2 mt-${compact ? '2' : '1'} ${compact ? 'text-xs' : 'text-xs'}`}
      >
        <button
          onClick={onSaveEdit}
          className={`px-3 py-1 bg-discord-blurple ${compact ? 'hover:bg-discord-blurple/80' : 'hover:bg-discord-blurple-hover'} text-white rounded`}
        >
          Spara
        </button>
        <button
          onClick={onCancelEdit}
          className="px-3 py-1 hover:bg-discord-darker text-gray-400 hover:text-white rounded"
        >
          Avbryt
        </button>
        {compact && (
          <span className="text-gray-500 pt-1">
            Escape för att <strong>avbryta</strong> • Enter för att{' '}
            <strong>spara</strong>
          </span>
        )}
      </div>
    </div>
  );

  const EditDeleteButtons = () => (
    <div className="opacity-0 group-hover:opacity-100 flex gap-1">
      <button
        onClick={() => onEdit(messageId, content)}
        className="p-1 hover:bg-discord-darker rounded text-gray-400 hover:text-white"
        title="Redigera"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
          />
        </svg>
      </button>
      <button
        onClick={() => onDelete(messageId)}
        className="p-1 hover:bg-discord-darker rounded text-gray-400 hover:text-red-500"
        title="Ta bort"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
    </div>
  );

  const MessageMenu = () => (
    <div className="absolute top-0 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
      <div className="relative">
        <button
          onClick={() => onToggleMessageMenu?.(messageId)}
          className="p-1 hover:bg-discord-dark rounded text-gray-400 hover:text-white"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
        {messageMenuOpen && (
          <div className="absolute right-0 mt-1 w-48 bg-discord-dark border border-discord-darker rounded-lg shadow-xl z-10">
            <button
              onClick={() => onEdit(messageId, content)}
              className="w-full text-left px-4 py-2 hover:bg-discord-darker text-white"
            >
              Redigera
            </button>
            <button
              onClick={() => onDelete(messageId)}
              className="w-full text-left px-4 py-2 hover:bg-discord-darker text-red-500"
            >
              Ta bort
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="group hover:bg-discord-darker/30 -mx-4 px-4 py-0.5 rounded relative">
      {showHeader ? (
        <div className="flex items-start gap-4 mt-4">
          <div className="w-10 h-10 rounded-full bg-discord-blurple flex-shrink-0 flex items-center justify-center text-white font-bold">
            {authorInitial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="font-medium text-white hover:underline cursor-pointer">
                {authorName}
              </span>
              <span className="text-xs text-gray-400">
                {formatTime(createdAt)}
              </span>
              {edited && (
                <span className="text-xs text-gray-500">(redigerad)</span>
              )}
            </div>

            {isEditing ? (
              <EditTextarea />
            ) : (
              <>
                <p className="text-discord-light break-words">
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
                {reactionCounts.length > 0 && (
                  <MessageReactions
                    messageId={messageId}
                    initialReactions={reactionCounts}
                  />
                )}
              </>
            )}
          </div>

          {/* Message actions */}
          {isOwnMessage &&
            !isEditing &&
            (showMessageMenu ? <MessageMenu /> : <EditDeleteButtons />)}
        </div>
      ) : (
        // Compact mode (no header)
        <div className="flex items-start gap-4 pl-14">
          <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 -ml-10 w-10 text-right">
            {formatTime(createdAt)}
          </span>
          <div className="flex-1">
            {isEditing ? (
              <EditTextarea />
            ) : (
              <>
                <p className="text-discord-light break-words">
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
                {reactionCounts.length > 0 && (
                  <MessageReactions
                    messageId={messageId}
                    initialReactions={reactionCounts}
                  />
                )}
              </>
            )}
          </div>

          {/* Message actions for compact view */}
          {isOwnMessage && !isEditing && (
            <div className="absolute top-0 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              {showMessageMenu ? (
                <div className="relative">
                  <button
                    onClick={() => onToggleMessageMenu?.(messageId)}
                    className="p-1 hover:bg-discord-dark rounded text-gray-400 hover:text-white"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                  {messageMenuOpen && (
                    <div className="absolute right-0 mt-1 w-48 bg-discord-dark border border-discord-darker rounded-lg shadow-xl z-10">
                      <button
                        onClick={() => onEdit(messageId, content)}
                        className="w-full text-left px-4 py-2 hover:bg-discord-darker text-white"
                      >
                        Redigera
                      </button>
                      <button
                        onClick={() => onDelete(messageId)}
                        className="w-full text-left px-4 py-2 hover:bg-discord-darker text-red-500"
                      >
                        Ta bort
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <EditDeleteButtons />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
