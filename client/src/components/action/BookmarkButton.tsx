/**
 * BookmarkButton Component
 * Toggle bookmark status for a message
 */

import { Star } from 'lucide-react';
import {
  useIsBookmarked,
  useAddBookmark,
  useRemoveBookmarkByMessage
} from '../../hooks/useBookmarks';
import { useChatStore } from '../../store/chat';

interface BookmarkButtonProps {
  messageId?: string;
  dmMessageId?: string;
  className?: string;
}

export function BookmarkButton({
  messageId,
  dmMessageId,
  className = ''
}: BookmarkButtonProps) {
  // Only check one of messageId or dmMessageId, not both
  const { data: isBookmarked, isLoading } = useIsBookmarked(
    dmMessageId ? undefined : messageId,
    dmMessageId ? dmMessageId : undefined
  );
  const addBookmark = useAddBookmark();
  const removeBookmark = useRemoveBookmarkByMessage();
  const currentWorkspace = useChatStore((state) => state.currentWorkspace);

  const handleToggleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isBookmarked) {
      // Only send one of messageId or dmMessageId, not both
      const removePayload: { messageId?: string; dmMessageId?: string } = {};
      if (dmMessageId) {
        removePayload.dmMessageId = dmMessageId;
      } else if (messageId) {
        removePayload.messageId = messageId;
      }
      await removeBookmark.mutateAsync(removePayload);
    } else {
      // Only send one of messageId or dmMessageId, not both
      const addPayload: {
        messageId?: string;
        dmMessageId?: string;
        workspaceId?: string;
      } = {};
      if (dmMessageId) {
        addPayload.dmMessageId = dmMessageId;
      } else if (messageId) {
        addPayload.messageId = messageId;
        addPayload.workspaceId = currentWorkspace?.id;
      }
      await addBookmark.mutateAsync(addPayload);
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <button
      onClick={handleToggleBookmark}
      disabled={addBookmark.isPending || removeBookmark.isPending}
      className={`
				p-1 rounded hover:bg-gray-700/50 transition-colors
				${isBookmarked ? 'text-yellow-400' : 'text-gray-400'}
				${className}
			`}
      title={isBookmarked ? 'Remove bookmark' : 'Bookmark message'}
    >
      <Star className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} />
    </button>
  );
}
