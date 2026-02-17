/**
 * useProcessedMessages - Pre-process messages with reactions and header grouping
 * Shared logic between ChannelView and DMView
 */
import { useMemo } from 'react';
import {
  groupReactionsByEmoji,
  shouldShowMessageHeader
} from '../utils/messageUtils';

interface BaseMessage {
  id: string;
  authorId: string;
  createdAt: string;
  reactions?: Array<{ emoji: string; userId: string }>;
}

export function useProcessedMessages<T extends BaseMessage>(
  messages: T[] | undefined,
  userId: string | undefined,
  messageGrouping: boolean
) {
  return useMemo(() => {
    const rawMessages = messages ?? [];
    return rawMessages.map((message, index) => {
      const prevMessage = rawMessages[index - 1];

      return {
        ...message,
        reactionCounts: groupReactionsByEmoji(message.reactions, userId),
        showHeader: messageGrouping
          ? shouldShowMessageHeader(
              message.authorId,
              message.createdAt,
              prevMessage?.authorId,
              prevMessage?.createdAt
            )
          : true
      };
    });
  }, [messages, userId, messageGrouping]);
}
