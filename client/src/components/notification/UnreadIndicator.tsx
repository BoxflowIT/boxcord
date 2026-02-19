// Unread Indicator - Show unread message badge
import { useTranslation } from 'react-i18next';

interface UnreadIndicatorProps {
  count: number;
  isMention?: boolean;
  className?: string;
}

export function UnreadIndicator({
  count,
  isMention = false,
  className = ''
}: UnreadIndicatorProps) {
  const { t } = useTranslation();

  if (count === 0) return null;

  const displayCount = count > 99 ? '99+' : count.toString();

  return (
    <div
      className={`
        inline-flex items-center justify-center
        min-w-[20px] h-5 px-1.5
        text-xs font-bold rounded-full
        ${isMention ? 'bg-red-500 text-white' : 'bg-gray-500 text-white'}
        ${className}
      `}
      title={
        isMention
          ? t('notifications.unreadMentions', { count })
          : t('notifications.unreadMessages', { count })
      }
    >
      {displayCount}
    </div>
  );
}

// Unread Divider - Show "NEW" divider between read and unread messages
export function UnreadDivider() {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2 my-4">
      <div className="flex-1 h-px bg-red-500" />
      <span className="text-xs font-semibold text-red-500 uppercase">
        {t('messages.new')}
      </span>
      <div className="flex-1 h-px bg-red-500" />
    </div>
  );
}

// Unread Dot - Small dot for unread indicator
export function UnreadDot({ className = '' }: { className?: string }) {
  return (
    <div
      className={`w-2 h-2 rounded-full bg-blue-500 ${className}`}
      aria-label="Unread"
    />
  );
}
