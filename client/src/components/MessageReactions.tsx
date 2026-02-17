// Message Reactions Component
import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { logger } from '../utils/logger';
import { EmojiIcon } from './ui/Icons';

interface Reaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

interface MessageReactionsProps {
  messageId: string;
  initialReactions?: Reaction[];
}

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '👀'];

export default function MessageReactions({
  messageId,
  initialReactions = []
}: MessageReactionsProps) {
  const [reactions, setReactions] = useState<Reaction[]>(initialReactions);
  const [showPicker, setShowPicker] = useState(false);

  // Uppdatera reactions när initialReactions ändras (från WebSocket)
  useEffect(() => {
    setReactions(initialReactions);
  }, [initialReactions]);

  const handleToggle = async (emoji: string) => {
    try {
      const { added } = await api.toggleReaction(messageId, emoji);

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

  return (
    <div className="flex items-center gap-1 flex-wrap mt-1">
      {/* Existing reactions */}
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          onClick={() => handleToggle(reaction.emoji)}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors border ${
            reaction.hasReacted
              ? 'bg-boxflow-primary/20 text-boxflow-primary border-boxflow-primary'
              : 'bg-boxflow-darker hover:bg-boxflow-hover text-boxflow-muted border-transparent'
          }`}
        >
          <span>{reaction.emoji}</span>
          <span>{reaction.count}</span>
        </button>
      ))}

      {/* Add reaction button */}
      <div className="relative inline-block">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="p-1.5 rounded-lg hover:bg-[#404249] text-[#80848e] hover:text-white transition-colors"
          title="Lägg till reaktion"
        >
          <EmojiIcon size="sm" />
        </button>

        {/* Quick emoji picker */}
        {showPicker && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-[#1e1f22] border border-[#404249] rounded-lg shadow-2xl flex gap-1 z-50">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleToggle(emoji)}
                className="p-1 hover:bg-[#404249] rounded-lg text-lg transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
