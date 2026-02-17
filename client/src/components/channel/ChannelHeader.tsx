// Reusable Channel Header Component
import { UsersIcon } from '../ui/Icons';

interface ChannelHeaderProps {
  channelName?: string;
  channelDescription?: string;
  onToggleMemberList?: () => void;
}

export function ChannelHeader({
  channelName,
  channelDescription,
  onToggleMemberList
}: ChannelHeaderProps) {
  return (
    <div className="panel-header justify-between">
      <div>
        <h2 className="text-heading">
          <span className="text-boxflow-muted mr-1">#</span>
          {channelName ?? 'Laddar...'}
        </h2>
        {channelDescription && (
          <p className="text-sm text-boxflow-muted mt-0.5">
            {channelDescription}
          </p>
        )}
      </div>
      {onToggleMemberList && (
        <button
          onClick={onToggleMemberList}
          className="btn-icon"
          title="Visa medlemmar"
        >
          <UsersIcon />
        </button>
      )}
    </div>
  );
}
