// Thread Reply Actions - Hover menu with reactions, edit, delete, forward
import { useRef, useState } from 'react';
import { EditIcon, TrashIcon, SendIcon } from '../ui/Icons';
import DeleteConfirmModal from '../DeleteConfirmModal';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '🎉', '🔥'];

interface ThreadReplyActionsProps {
  replyId: string;
  isOwner: boolean;
  onReaction: (emoji: string) => void;
  onMoreReactions: (rect: DOMRect) => void;
  onEdit: () => void;
  onDelete: () => void;
  onForward: () => void;
}

export function ThreadReplyActions({
  replyId: _replyId,
  isOwner,
  onReaction,
  onMoreReactions,
  onEdit,
  onDelete,
  onForward
}: ThreadReplyActionsProps) {
  // replyId reserved for future use (e.g., tracking)
  const moreReactionsRef = useRef<HTMLButtonElement>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const handleMoreReactions = () => {
    if (moreReactionsRef.current) {
      onMoreReactions(moreReactionsRef.current.getBoundingClientRect());
    }
  };

  const handleDelete = () => {
    setDeleteModalOpen(false);
    onDelete();
  };

  return (
    <>
      <div className="absolute -top-12 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-boxflow-darker border border-boxflow-hover rounded-lg shadow-xl px-2 py-1 z-40">
        {/* Quick reactions */}
        {QUICK_REACTIONS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onReaction(emoji)}
            className="p-1 hover:bg-boxflow-hover rounded text-lg transition-transform hover:scale-125"
            title={`React with ${emoji}`}
          >
            {emoji}
          </button>
        ))}

        {/* More reactions button */}
        <button
          ref={moreReactionsRef}
          onClick={handleMoreReactions}
          className="p-1.5 rounded border-2 bg-boxflow-dark border-boxflow-border hover:bg-boxflow-hover hover:border-boxflow-hover opacity-50 hover:opacity-70 transition-all"
          title="More reactions"
        >
          <span className="text-sm">😀</span>
        </button>

        {/* Divider */}
        <div className="w-px h-4 bg-boxflow-hover my-auto mx-1" />

        {/* Forward button */}
        <button
          onClick={onForward}
          className="p-1 hover:bg-boxflow-hover rounded transition-colors"
          title="Forward message"
        >
          <SendIcon size="sm" />
        </button>

        {isOwner && (
          <>
            <button
              onClick={onEdit}
              className="p-1 hover:bg-boxflow-hover rounded transition-colors"
              title="Edit"
            >
              <EditIcon size="sm" />
            </button>
            <button
              onClick={() => setDeleteModalOpen(true)}
              className="p-1 hover:bg-red-500/20 rounded text-red-400"
              title="Delete"
            >
              <TrashIcon size="sm" />
            </button>
          </>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Reply"
        message="Are you sure you want to delete this reply?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </>
  );
}
