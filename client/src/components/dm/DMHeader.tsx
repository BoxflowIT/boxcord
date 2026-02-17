// Reusable DM Header Component
import Avatar from '../ui/Avatar';

interface DMHeaderProps {
  userName: string;
  userInitial: string;
  avatarUrl?: string | null;
  status?: string;
  isOnline?: boolean;
}

export function DMHeader({
  userName,
  userInitial,
  avatarUrl,
  status,
  isOnline = false
}: DMHeaderProps) {
  return (
    <div className="panel-header">
      <div className="flex-row-3">
        <div className="relative">
          <Avatar size="md" src={avatarUrl || undefined} alt={userName}>
            {userInitial}
          </Avatar>
          {isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-boxflow-darker rounded-full" />
          )}
        </div>
        <div>
          <h2 className="text-heading">{userName}</h2>
          {status && <p className="text-sm text-boxflow-muted">{status}</p>}
        </div>
      </div>
    </div>
  );
}
