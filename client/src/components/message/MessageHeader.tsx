// Reusable Message Header Component - Author name, timestamp, edited badge
import { formatTime } from '../../lib/formatters';

interface MessageHeaderProps {
  authorName: string;
  createdAt: string;
  edited: boolean;
  compact?: boolean;
}

export function MessageHeader({
  authorName,
  createdAt,
  edited,
  compact = false
}: MessageHeaderProps) {
  return (
    <div className="flex items-baseline gap-2">
      <span
        className={`font-semibold text-boxflow-light ${
          compact ? 'text-sm' : 'text-base'
        }`}
      >
        {authorName}
      </span>
      <span className="text-xs text-boxflow-muted">
        {formatTime(createdAt)}
      </span>
      {edited && (
        <span className="text-xs text-boxflow-muted">(redigerad)</span>
      )}
    </div>
  );
}
