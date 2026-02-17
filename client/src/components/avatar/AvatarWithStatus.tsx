// Avatar With Status - Avatar with online status indicator
import Avatar from '../ui/Avatar';
import StatusIndicator, { UserStatus } from '../member/StatusIndicator';
import { cn } from '../../utils/classNames';

interface AvatarWithStatusProps {
  src?: string;
  alt?: string;
  initial: string;
  status: UserStatus;
  size?: 'sm' | 'md' | 'lg';
  statusSize?: 'sm' | 'md' | 'lg';
  statusPosition?: 'bottom-right' | 'top-right' | 'bottom-left';
  className?: string;
}

const positionClasses: Record<string, string> = {
  'bottom-right': 'bottom-0 right-0',
  'top-right': 'top-0 right-0',
  'bottom-left': 'bottom-0 left-0'
};

export default function AvatarWithStatus({
  src,
  alt,
  initial,
  status,
  size = 'md',
  statusSize = 'sm',
  statusPosition = 'bottom-right',
  className = ''
}: AvatarWithStatusProps) {
  return (
    <div className={cn('relative inline-block', className)}>
      <Avatar size={size} src={src} alt={alt}>
        {initial}
      </Avatar>
      <div className={cn('absolute', positionClasses[statusPosition])}>
        <StatusIndicator status={status} size={statusSize} />
      </div>
    </div>
  );
}
