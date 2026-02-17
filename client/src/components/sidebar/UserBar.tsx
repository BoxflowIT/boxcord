// Reusable User Bar Component
import Avatar from '../ui/Avatar';
import { LogoutIcon } from '../ui/Icons';

interface UserBarProps {
  user?: {
    firstName?: string;
    email?: string;
    avatarUrl?: string;
    role?: string;
  } | null;
  onProfileClick?: () => void;
  onLogout: () => void;
}

export default function UserBar({
  user,
  onProfileClick,
  onLogout
}: UserBarProps) {
  return (
    <div className="user-bar">
      <button onClick={onProfileClick} className="user-bar-button">
        <Avatar
          size="sm"
          src={user?.avatarUrl}
          alt={user?.firstName || user?.email}
        >
          {user?.firstName?.charAt(0) ?? user?.email?.charAt(0) ?? '?'}
        </Avatar>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-medium text-boxflow-light truncate">
            {user?.firstName ?? user?.email}
          </p>
          <p className="text-subtle truncate">{user?.role}</p>
        </div>
      </button>
      <button onClick={onLogout} className="btn-icon" title="Logga ut">
        <LogoutIcon />
      </button>
    </div>
  );
}
