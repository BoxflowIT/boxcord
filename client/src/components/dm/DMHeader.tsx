// Reusable DM Header Component
import Avatar from '../ui/Avatar';
import { PhoneIcon, PhoneHangUpIcon, PhoneIncomingIcon } from '../ui/Icons';
import { useDMCallStore } from '../../store/dmCallStore';

interface DMHeaderProps {
  channelId: string;
  otherUserId: string;
  userName: string;
  userInitial: string;
  avatarUrl?: string | null;
  status?: string;
  isOnline?: boolean;
  onStartCall?: () => void;
}

export function DMHeader({
  channelId,
  otherUserId,
  userName,
  userInitial,
  avatarUrl,
  status,
  isOnline = false,
  onStartCall
}: DMHeaderProps) {
  const { callState } = useDMCallStore();
  const isInCall =
    callState === 'connected' ||
    callState === 'calling' ||
    callState === 'ringing';

  // Show different button based on call state
  const renderCallButton = () => {
    if (callState === 'connected') {
      return (
        <button
          onClick={onStartCall}
          className="p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
          title="Avsluta samtal"
        >
          <PhoneHangUpIcon size="md" />
        </button>
      );
    }

    if (callState === 'calling') {
      return (
        <button
          onClick={onStartCall}
          className="p-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white transition-colors animate-pulse"
          title="Ringer..."
        >
          <PhoneIcon size="md" />
        </button>
      );
    }

    if (callState === 'ringing') {
      return (
        <button
          onClick={onStartCall}
          className="p-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors animate-pulse"
          title="Inkommande samtal"
        >
          <PhoneIncomingIcon size="md" />
        </button>
      );
    }

    // Idle - show call button
    return (
      <button
        onClick={onStartCall}
        className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-colors"
        title="Ring"
        disabled={!isOnline}
      >
        <PhoneIcon size="md" />
      </button>
    );
  };

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
        <div className="flex-1">
          <h2 className="text-heading">{userName}</h2>
          {status && <p className="text-sm text-boxflow-muted">{status}</p>}
          {isInCall && (
            <p className="text-xs text-green-400 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              {callState === 'connected'
                ? 'I samtal'
                : callState === 'calling'
                  ? 'Ringer...'
                  : 'Inkommande'}
            </p>
          )}
        </div>
      </div>

      {onStartCall && renderCallButton()}
    </div>
  );
}
