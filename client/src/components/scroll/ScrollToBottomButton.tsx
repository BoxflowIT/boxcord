// Scroll To Bottom Button - Floating button to scroll to bottom
import { cn } from '../../utils/classNames';

interface ScrollToBottomButtonProps {
  onClick: () => void;
  visible: boolean;
  unreadCount?: number;
  className?: string;
}

export default function ScrollToBottomButton({
  onClick,
  visible,
  unreadCount,
  className = ''
}: ScrollToBottomButtonProps) {
  if (!visible) return null;

  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed bottom-24 right-8 z-10',
        'w-12 h-12 rounded-full',
        'bg-boxflow-primary hover:bg-boxflow-primary/90',
        'text-white shadow-lg',
        'flex items-center justify-center',
        'transition-all duration-200',
        className
      )}
      title="Scrolla till botten"
    >
      {unreadCount && unreadCount > 0 ? (
        <span className="font-semibold text-sm">{unreadCount}</span>
      ) : (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      )}
    </button>
  );
}
