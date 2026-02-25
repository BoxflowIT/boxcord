// Message Reactions Component
import { useTranslation } from 'react-i18next';
import { useMessageReactions } from '../hooks/useMessageReactions';
import { EmojiIcon } from './ui/Icons';
import ReactionButton from './reactions/ReactionButton';
import ReactionEmojiPicker from './reactions/ReactionEmojiPicker';

interface Reaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

interface MessageReactionsProps {
  messageId: string;
  initialReactions?: Reaction[];
  isDM?: boolean; // Is this a DM message? (uses different reaction endpoint)
}

export default function MessageReactions({
  messageId,
  initialReactions = [],
  isDM = false
}: MessageReactionsProps) {
  const { t } = useTranslation();
  const { reactions, showPicker, setShowPicker, handleToggleReaction } =
    useMessageReactions({
      messageId,
      initialReactions,
      isDM
    });

  // Deduplicate reactions by emoji (in case of any backend issues)
  const uniqueReactions = reactions.reduce<Reaction[]>((acc, reaction) => {
    const existing = acc.find((r) => r.emoji === reaction.emoji);
    if (existing) {
      // Merge counts if duplicate exists
      existing.count += reaction.count;
      existing.hasReacted = existing.hasReacted || reaction.hasReacted;
    } else {
      acc.push(reaction);
    }
    return acc;
  }, []);

  return (
    <div className="flex items-center gap-1 flex-wrap mt-1">
      {/* Existing reactions */}
      {uniqueReactions.map((reaction) => (
        <ReactionButton
          key={reaction.emoji}
          emoji={reaction.emoji}
          count={reaction.count}
          hasReacted={reaction.hasReacted}
          onClick={() => handleToggleReaction(reaction.emoji)}
        />
      ))}

      {/* Add reaction button */}
      <div className="relative inline-block">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="p-1.5 rounded-lg hover:bg-boxflow-hover text-boxflow-subtle hover:text-white transition-colors"
          title={t('messages.react')}
        >
          <EmojiIcon size="sm" />
        </button>

        {/* Full emoji picker */}
        {showPicker && (
          <ReactionEmojiPicker
            onEmojiSelect={handleToggleReaction}
            onClose={() => setShowPicker(false)}
          />
        )}
      </div>
    </div>
  );
}
