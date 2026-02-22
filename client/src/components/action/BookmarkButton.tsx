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
  const { data: isBookmarked, isLoading } = useIsBookmarked(
    messageId,
    dmMessageId
  );
  const addBookmark = useAddBookmark();
  const removeBookmark = useRemoveBookmarkByMessage();
  const currentWorkspace = useChatStore((state) => state.currentWorkspace);

  const handleToggleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isBookmarked) {
      await removeBookmark.mutateAsync({ messageId, dmMessageId });
    } else {
      await addBookmark.mutateAsync({
        messageId,
        dmMessageId,
        workspaceId: currentWorkspace?.id
      });
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
