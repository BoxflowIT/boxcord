// User Bar - Bottom user info bar with avatar, name, role
import Avatar from '../ui/Avatar';
import { LogoutIcon } from '../ui/Icons';

interface UserBarProps {
  avatarUrl?: string;
  displayName: string;
  subtitle?: string; // e.g., role or email
  onProfileClick?: () => void;
  onLogoutClick?: () => void;
  actions?: React.ReactNode; // Additional action buttons
}

export default function UserBar({
  avatarUrl,
  displayName,
  subtitle,
  onProfileClick,
  onLogoutClick,
  actions
}: UserBarProps) {
  return (
    <div className="user-bar">
      <button onClick={onProfileClick} className="user-bar-button">
        <Avatar size="sm" src={avatarUrl} alt={displayName}>
          {displayName.charAt(0).toUpperCase()}
        </Avatar>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-medium text-boxflow-light truncate">
            {displayName}
          </p>
          {subtitle && <p className="text-subtle truncate">{subtitle}</p>}
        </div>
      </button>

      {/* Actions */}
      {actions}

      {/* Logout button */}
      {onLogoutClick && (
        <button onClick={onLogoutClick} className="btn-icon" title="Logga ut">
          <LogoutIcon />
        </button>
      )}
    </div>
  );
}
