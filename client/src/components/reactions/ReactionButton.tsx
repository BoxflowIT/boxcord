// Individual reaction button component
import { cn } from '../../utils/classNames';

interface ReactionButtonProps {
  emoji: string;
  count: number;
  hasReacted: boolean;
  onClick: () => void;
}

export default function ReactionButton({
  emoji,
  count,
  hasReacted,
  onClick
}: ReactionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors border',
        hasReacted
          ? 'bg-boxflow-primary-20 text-boxflow-primary border-boxflow-primary'
          : 'bg-boxflow-darker hover:bg-boxflow-hover text-boxflow-muted border-transparent'
      )}
    >
      <span>{emoji}</span>
      <span>{count}</span>
    </button>
  );
}
