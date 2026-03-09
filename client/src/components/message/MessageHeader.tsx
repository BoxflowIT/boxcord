// Reusable Message Header Component - Author name, timestamp, edited badge
import { useTranslation } from 'react-i18next';
import { formatTime } from '../../lib/formatters';
import { cn } from '../../utils/classNames';

interface MessageHeaderProps {
  authorName: string;
  createdAt: string;
  edited: boolean;
  compact?: boolean;
  isBot?: boolean;
}

export function MessageHeader({
  authorName,
  createdAt,
  edited,
  compact = false,
  isBot = false
}: MessageHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-baseline gap-2">
      <span
        className={cn(
          'font-semibold text-boxflow-light',
          compact ? 'text-sm' : 'text-base'
        )}
      >
        {authorName}
      </span>
      {isBot && (
        <span className="inline-flex items-center rounded bg-boxflow-accent/20 px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none text-boxflow-accent">
          BOT
        </span>
      )}
      <span className="text-xs text-boxflow-muted">
        {formatTime(createdAt)}
      </span>
      {edited && (
        <span className="text-xs text-boxflow-muted">
          ({t('messages.edited')})
        </span>
      )}
    </div>
  );
}
