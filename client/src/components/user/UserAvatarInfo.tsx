// User Avatar Info - Compact user info with avatar
import Avatar from '../ui/Avatar';
import { cn } from '../../utils/classNames';

interface UserAvatarInfoProps {
  avatarUrl?: string;
  name: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  badge?: React.ReactNode; // e.g., status indicator or role badge
}

const sizeMap = {
  sm: { avatar: 'sm' as const, name: 'text-sm', subtitle: 'text-xs' },
  md: { avatar: 'md' as const, name: 'text-base', subtitle: 'text-sm' },
  lg: { avatar: 'lg' as const, name: 'text-lg', subtitle: 'text-base' }
};

export default function UserAvatarInfo({
  avatarUrl,
  name,
  subtitle,
  size = 'md',
  onClick,
  badge
}: UserAvatarInfoProps) {
  const sizes = sizeMap[size];
  const Container = onClick ? 'button' : 'div';

  return (
    <Container
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 min-w-0',
        onClick && 'cursor-pointer hover:opacity-80'
      )}
    >
      <div className="relative">
        <Avatar size={sizes.avatar} src={avatarUrl}>
          {name.charAt(0).toUpperCase()}
        </Avatar>
        {badge && <div className="absolute -bottom-1 -right-1">{badge}</div>}
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p
          className={cn(sizes.name, 'font-medium text-boxflow-light truncate')}
        >
          {name}
        </p>
        {subtitle && (
          <p className={cn(sizes.subtitle, 'text-subtle truncate')}>
            {subtitle}
          </p>
        )}
      </div>
    </Container>
  );
}
