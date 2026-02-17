// Reusable Message Reaction Bubbles Component
import { cn } from '../../utils/classNames';

export interface MessageReaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

interface MessageReactionBubblesProps {
  reactions: MessageReaction[];
  onToggle: (emoji: string) => void;
}

export function MessageReactionBubbles({
  reactions,
  onToggle
}: MessageReactionBubblesProps) {
  if (reactions.length === 0) return null;

  return (
    <div className="flex items-center gap-1 flex-wrap mt-1">
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          onClick={() => onToggle(reaction.emoji)}
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors border',
            reaction.hasReacted
              ? 'bg-boxflow-primary/20 text-boxflow-primary border-boxflow-primary'
              : 'bg-boxflow-darker hover:bg-boxflow-hover text-boxflow-muted border-transparent'
          )}
        >
          <span>{reaction.emoji}</span>
          <span>{reaction.count}</span>
        </button>
      ))}
    </div>
  );
}
