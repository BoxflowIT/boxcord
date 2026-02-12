// Message Reactions Component
import { useState, useEffect } from 'react';
import { api } from '../services/api';

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

  useEffect(() => {
    // Load reactions if not provided
    if (initialReactions.length === 0) {
      api.getReactions(messageId).then(setReactions).catch(console.error);
    }
  }, [messageId, initialReactions.length]);

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
      console.error('Failed to toggle reaction:', err);
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
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>

        {/* Quick emoji picker */}
        {showPicker && (
          <div className="absolute bottom-full left-0 mb-1 p-2 bg-discord-darkest rounded-lg shadow-lg flex gap-1 z-10">
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
