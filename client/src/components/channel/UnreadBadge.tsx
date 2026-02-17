// Unread Badge - Show unread count
import { cn } from '../../utils/classNames';

interface UnreadBadgeProps {
  count: number;
  max?: number;
  variant?: 'default' | 'mention';
  pulse?: boolean;
  className?: string;
}

export default function UnreadBadge({
  count,
  max = 99,
  variant = 'default',
  pulse = false,
  className = ''
}: UnreadBadgeProps) {
  if (count <= 0) return null;

  const displayCount = count > max ? `${max}+` : count;

  const variantClasses = {
    default: 'bg-gray-500 text-white',
    mention: 'bg-red-600 text-white'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center',
        'min-w-[20px] h-5 px-1.5',
        'text-xs font-semibold rounded-full',
        variantClasses[variant],
        pulse && 'animate-pulse',
        className
      )}
    >
      {displayCount}
    </span>
  );
}
