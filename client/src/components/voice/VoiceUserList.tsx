import { useVoiceStore } from '../../store/voiceStore';
import { useCurrentUser, useOnlineUsers } from '../../hooks/useQuery';
import { MicIcon, MicOffIcon, HeadphonesOffIcon } from '../ui/Icons';
import { UserVolumeMenu } from './UserVolumeMenu';
import { useState } from 'react';
import { getUserDisplayName } from '../../utils/user';

interface VoiceUser {
  userId: string;
  sessionId: string;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
}

export function VoiceUserList() {
  const {
    users,
    isConnected,
    currentChannelId,
    currentSessionId,
    isMuted: localIsMuted,
    isDeafened: localIsDeafened,
    isSpeaking: localIsSpeaking
  } = useVoiceStore();

  // Volume menu state
  const [volumeMenuState, setVolumeMenuState] = useState<{
    userId: string;
    displayName: string;
    position: { x: number; y: number };
  } | null>(null);

  // Use cached current user to avoid duplicate API calls
  const { data: currentUser } = useCurrentUser();

  // Fetch user details for all voice users - use shared hook
  const { data: onlineUsers = [] } = useOnlineUsers();

  if (!isConnected || !currentChannelId) return null;

  const otherUsers = Array.from(users.values());

  // Create local user entry
  const localUser: VoiceUser | null =
    currentUser && currentSessionId
      ? {
          userId: currentUser.id,
          sessionId: currentSessionId,
          isMuted: localIsMuted,
          isDeafened: localIsDeafened,
          isSpeaking: localIsSpeaking
        }
      : null;

  // Combine local user with other users (local user first)
  const allUsers = localUser
    ? [localUser, ...otherUsers.filter((u) => u.userId !== currentUser?.id)]
    : otherUsers;

  if (allUsers.length === 0) {
    return (
      <div className="p-4 text-center text-gray-400">
        <p className="text-sm">No users in voice channel</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2">
      <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">
        In Voice — {allUsers.length}
      </h3>

      <div className="space-y-2">
        {allUsers.map((voiceUser) => {
          const isLocalUser = voiceUser.userId === currentUser?.id;
          const user = isLocalUser
            ? currentUser
            : onlineUsers.find((u) => u.id === voiceUser.userId);
          const displayName = user ? getUserDisplayName(user) : 'Unknown User';

          return (
            <VoiceUserItem
              key={voiceUser.userId}
              user={voiceUser}
              displayName={isLocalUser ? `${displayName} (You)` : displayName}
              avatarUrl={user?.avatarUrl}
              isLocalUser={isLocalUser}
              onShowVolumeMenu={(position) =>
                setVolumeMenuState({
                  userId: voiceUser.userId,
                  displayName,
                  position
                })
              }
            />
          );
        })}
      </div>

      {/* Volume menu popup */}
      {volumeMenuState && (
        <UserVolumeMenu
          userId={volumeMenuState.userId}
          displayName={volumeMenuState.displayName}
          position={volumeMenuState.position}
          onClose={() => setVolumeMenuState(null)}
        />
      )}
    </div>
  );
}

interface VoiceUserItemProps {
  user: VoiceUser;
  displayName: string;
  avatarUrl?: string | null;
  isLocalUser?: boolean;
  onShowVolumeMenu: (position: { x: number; y: number }) => void;
}

function VoiceUserItem({
  user,
  displayName,
  avatarUrl,
  isLocalUser,
  onShowVolumeMenu
}: VoiceUserItemProps) {
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isLocalUser) {
      // Don't allow volume control for yourself
      onShowVolumeMenu({ x: e.clientX, y: e.clientY });
    }
  };

  return (
    <div
      className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
        isLocalUser ? 'bg-gray-750/50' : 'hover:bg-gray-750 cursor-pointer'
      }`}
      onContextMenu={handleContextMenu}
      title={isLocalUser ? undefined : 'Right-click to adjust volume'}
    >
      {/* Avatar with speaking indicator */}
      <div className="relative">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
            user.isSpeaking
              ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-gray-800'
              : ''
          }`}
          style={{
            backgroundColor: avatarUrl ? 'transparent' : '#4f46e5',
            color: avatarUrl ? 'transparent' : 'white'
          }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            initials
          )}
        </div>
      </div>

      {/* User info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-200 truncate">
          {displayName}
        </p>
      </div>

      {/* Status icons */}
      <div className="flex items-center gap-1">
        {user.isDeafened && (
          <span className="text-red-400" title="Deafened">
            <HeadphonesOffIcon size="sm" />
          </span>
        )}
        {user.isMuted && (
          <span className="text-red-400" title="Muted">
            <MicOffIcon size="sm" />
          </span>
        )}
        {!user.isMuted && !user.isDeafened && (
          <span className="text-gray-400" title="Connected">
            <MicIcon size="sm" />
          </span>
        )}
      </div>
    </div>
  );
}
