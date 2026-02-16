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
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors ${
            reaction.hasReacted
              ? 'bg-discord-blurple/30 text-discord-blurple border border-discord-blurple'
              : 'bg-discord-darker hover:bg-discord-dark text-gray-300'
          }`}
        >
          <span>{reaction.emoji}</span>
          <span>{reaction.count}</span>
        </button>
      ))}

      {/* Add reaction button */}
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="p-1 rounded hover:bg-discord-darker text-gray-400 hover:text-white"
          title="Lägg till reaktion"
        >
          <EmojiIcon size="sm" />
        </button>

        {/* Quick emoji picker */}
        {showPicker && (
          <div className="emoji-picker-popup">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleToggle(emoji)}
                className="p-1 hover:bg-discord-dark rounded text-lg"
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
