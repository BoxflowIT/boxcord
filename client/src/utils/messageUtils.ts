// Message Utility Functions
// Reusable helpers for message processing and memoization

import type { MessageReaction } from '../components/MessageItem';

interface RawReaction {
  emoji: string;
  userId: string;
}

/**
 * Groups raw reactions by emoji and calculates counts
 * Used by ChannelView and DMView to prepare reaction data for MessageItem
 */
export function groupReactionsByEmoji(
  reactions: RawReaction[] | undefined,
  currentUserId: string | undefined
): MessageReaction[] {
  if (!reactions || reactions.length === 0) return [];

  return reactions.reduce<MessageReaction[]>((acc, r) => {
    const existing = acc.find((x) => x.emoji === r.emoji);
    if (existing) {
      existing.count++;
      if (r.userId === currentUserId) existing.hasReacted = true;
    } else {
      acc.push({
        emoji: r.emoji,
        count: 1,
        hasReacted: r.userId === currentUserId
      });
    }
    return acc;
  }, []);
}

/**
 * Determines if message header should be shown
 * Based on author change or time gap (5 minutes)
 */
export function shouldShowMessageHeader(
  currentAuthorId: string,
  currentCreatedAt: string,
  prevAuthorId: string | undefined,
  prevCreatedAt: string | undefined
): boolean {
  if (!prevAuthorId || !prevCreatedAt) return true;
  if (prevAuthorId !== currentAuthorId) return true;

  const timeDiff =
    new Date(currentCreatedAt).getTime() - new Date(prevCreatedAt).getTime();
  return timeDiff > 300000; // 5 minutes
}
