// Status Indicator - Shows online/away/busy/offline status dot

export type UserStatus = 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE';

interface StatusIndicatorProps {
  status: UserStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusColors: Record<UserStatus, string> = {
  ONLINE: 'status-online',
  AWAY: 'status-away',
  BUSY: 'status-busy',
  OFFLINE: 'status-offline'
};

const sizeClasses: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'w-2.5 h-2.5',
  md: 'w-3 h-3',
  lg: 'w-4 h-4'
};

export default function StatusIndicator({
  status,
  size = 'sm',
  className = ''
}: StatusIndicatorProps) {
  return (
    <div
      className={`${statusColors[status]} ${sizeClasses[size]} ${className}`}
      title={status}
    />
  );
}
