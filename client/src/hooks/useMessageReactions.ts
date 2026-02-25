// Custom hook for message reactions logic
import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { logger } from '../utils/logger';

interface Reaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

interface UseMessageReactionsProps {
  messageId: string;
  initialReactions?: Reaction[];
  isDM?: boolean;
}

export function useMessageReactions({
  messageId,
  initialReactions = [],
  isDM = false
}: UseMessageReactionsProps) {
  // Deduplicate initial reactions
  const deduplicatedInitial = initialReactions.reduce((acc, reaction) => {
    const existing = acc.find((r) => r.emoji === reaction.emoji);
    if (existing) {
      existing.count += reaction.count;
      existing.hasReacted = existing.hasReacted || reaction.hasReacted;
    } else {
      acc.push({ ...reaction });
    }
    return acc;
  }, [] as Reaction[]);

  const [reactions, setReactions] = useState<Reaction[]>(deduplicatedInitial);
  const [showPicker, setShowPicker] = useState(false);

  // Update reactions when initialReactions changes (from WebSocket)
  useEffect(() => {
    // Deduplicate before setting
    const deduplicated = initialReactions.reduce((acc, reaction) => {
      const existing = acc.find((r) => r.emoji === reaction.emoji);
      if (existing) {
        existing.count += reaction.count;
        existing.hasReacted = existing.hasReacted || reaction.hasReacted;
      } else {
        acc.push({ ...reaction });
      }
      return acc;
    }, [] as Reaction[]);
    setReactions(deduplicated);
  }, [initialReactions]);

  const handleToggleReaction = async (emoji: string) => {
    try {
      const { added } = isDM
        ? await api.toggleDMReaction(messageId, emoji)
        : await api.toggleReaction(messageId, emoji);

      setReactions((prev) => {
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

      setShowPicker(false);
    } catch (err) {
      logger.error('Failed to toggle reaction:', err);
    }
  };

  return {
    reactions,
    showPicker,
    setShowPicker,
    handleToggleReaction
  };
}
