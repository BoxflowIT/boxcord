// Thread Reply Item - Individual reply in thread conversation
import { useState } from 'react';
import type { ThreadReply } from '../../store/thread';
import { MessageContent } from '../message/MessageContent';
import { ThreadReplyActions } from './ThreadReplyActions';

interface ThreadReplyItemProps {
  reply: ThreadReply;
  isOwner: boolean;
  onReaction: (replyId: string, emoji: string) => void;
  onMoreReactions: (replyId: string, rect: DOMRect) => void;
  onEdit: (replyId: string, content: string) => void;
  onSaveEdit: (replyId: string, newContent: string) => void;
  onCancelEdit: () => void;
  onDelete: (replyId: string) => void;
  onForward: (reply: ThreadReply) => void;
}

export function ThreadReplyItem({
  reply,
  isOwner,
  onReaction,
  onMoreReactions,
  onEdit: _onEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onForward
}: ThreadReplyItemProps) {
  // onEdit reserved for future use (external edit trigger)
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');

  const authorName =
    reply.author.firstName && reply.author.lastName
      ? `${reply.author.firstName} ${reply.author.lastName}`
      : reply.author.email;

  const timestamp = new Date(reply.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleStartEdit = () => {
    setEditContent(reply.content);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    onSaveEdit(reply.id, editContent);
    setIsEditing(false);
    setEditContent('');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent('');
    onCancelEdit();
  };

  return (
    <div className="flex gap-3 group hover:bg-[var(--color-bg-hover)]/70 hover:border-l-2 hover:border-boxflow-primary -mx-2 px-2 py-2 rounded relative transition-all duration-100">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-boxflow-hover flex items-center justify-center text-boxflow-light text-sm font-medium flex-shrink-0">
        {authorName.charAt(0).toUpperCase()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-medium text-sm text-boxflow-light">
            {authorName}
          </span>
          <span className="text-xs text-boxflow-subtle">{timestamp}</span>
          {reply.edited && (
            <span className="text-xs text-boxflow-subtle italic">(edited)</span>
          )}
        </div>

        {/* Message content or edit form */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full bg-boxflow-darkest text-boxflow-light border border-boxflow-border rounded px-3 py-2 resize-none focus:outline-none focus:border-boxflow-primary text-sm"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1 bg-boxflow-primary text-white rounded hover:bg-boxflow-primary/80 text-sm transition-colors"
              >
                Save
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1 bg-boxflow-hover text-boxflow-muted rounded hover:bg-boxflow-hover/80 text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <MessageContent content={reply.content} compact />

            {/* Attachments */}
            {reply.attachments && reply.attachments.length > 0 && (
              <div className="mt-2 space-y-1">
                {reply.attachments.map((attachment, idx) => (
                  <a
                    key={idx}
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-xs text-boxflow-muted hover:text-boxflow-light hover:underline transition-colors"
                  >
                    📎 {attachment.name}
                  </a>
                ))}
              </div>
            )}

            {/* Reactions */}
            {reply.reactions && reply.reactions.length > 0 && (
              <div className="flex gap-1 mt-2">
                {reply.reactions.map((reaction) => (
                  <button
                    key={reaction.emoji}
                    onClick={() => onReaction(reply.id, reaction.emoji)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-boxflow-hover rounded text-xs hover:bg-boxflow-hover/80 transition-colors"
                  >
                    {reaction.emoji} {reaction.count}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Action buttons (visible on hover) */}
      {!isEditing && (
        <ThreadReplyActions
          replyId={reply.id}
          isOwner={isOwner}
          onReaction={(emoji) => onReaction(reply.id, emoji)}
          onMoreReactions={(rect) => onMoreReactions(reply.id, rect)}
          onEdit={handleStartEdit}
          onDelete={() => onDelete(reply.id)}
          onForward={() => onForward(reply)}
        />
      )}
    </div>
  );
}
