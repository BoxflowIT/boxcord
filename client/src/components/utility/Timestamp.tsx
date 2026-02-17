// Timestamp - Format and display timestamp

interface TimestampProps {
  date: string | Date;
  format?: 'relative' | 'short' | 'long' | 'time';
  className?: string;
}

export default function Timestamp({
  date,
  format = 'relative',
  className = ''
}: TimestampProps) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const formatTimestamp = () => {
    switch (format) {
      case 'relative': {
        const now = new Date();
        const diffMs = now.getTime() - dateObj.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'nu';
        if (diffMins < 60) return `${diffMins}m sedan`;
        if (diffHours < 24) return `${diffHours}h sedan`;
        if (diffDays < 7) return `${diffDays}d sedan`;
        return dateObj.toLocaleDateString('sv-SE', {
          month: 'short',
          day: 'numeric'
        });
      }
      case 'short':
        return dateObj.toLocaleDateString('sv-SE', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      case 'long':
        return dateObj.toLocaleDateString('sv-SE', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      case 'time':
        return dateObj.toLocaleTimeString('sv-SE', {
          hour: '2-digit',
          minute: '2-digit'
        });
      default:
        return dateObj.toLocaleString('sv-SE');
    }
  };

  return (
    <time
      dateTime={dateObj.toISOString()}
      title={dateObj.toLocaleString('sv-SE')}
      className={`text-xs text-muted ${className}`}
    >
      {formatTimestamp()}
    </time>
  );
}
