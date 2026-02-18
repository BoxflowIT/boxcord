// Reusable Channel Section Component
import { useQuery } from '@tanstack/react-query';
import { PlusIcon, EditIcon, CloseIcon, VoiceChannelIcon, AnnouncementIcon, HashIcon, MicOffIcon, HeadphonesOffIcon } from '../ui/Icons';
import { api } from '../../services/api';
import type { Channel } from '../../types';
import { cn } from '../../utils/classNames';

// ============================================================================
// TYPES
// ============================================================================

interface VoiceUser {
  userId: string;
  sessionId: string;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
}

interface UserInfo {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  avatarUrl?: string | null;
}

// ============================================================================
// CHANNEL ICON
// ============================================================================

function ChannelIcon({ type }: { type?: string }) {
  if (type === 'VOICE') {
    return <VoiceChannelIcon size="sm" className="text-gray-400" />;
  }
  if (type === 'ANNOUNCEMENT') {
    return <AnnouncementIcon size="sm" className="text-gray-400" />;
  }
  return <HashIcon size="sm" className="text-gray-400" />;
}

// ============================================================================
// VOICE USER ITEM (shown under voice channel)
// ============================================================================

function VoiceUserItem({ user, userInfo }: { user: VoiceUser; userInfo?: UserInfo }) {
  const displayName = userInfo 
    ? `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim() || userInfo.email
    : 'Laddar...';

  return (
    <div className="flex items-center gap-2 pl-7 pr-2 py-0.5 text-sm text-gray-400">
      {/* Avatar */}
      <div className={cn(
        'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium',
        user.isSpeaking ? 'ring-2 ring-green-500 ring-offset-1 ring-offset-gray-800' : ''
      )} style={{ backgroundColor: '#4f46e5' }}>
        {userInfo?.avatarUrl ? (
          <img src={userInfo.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
        ) : (
          displayName.charAt(0).toUpperCase()
        )}
      </div>
      
      {/* Name */}
      <span className={cn('truncate flex-1', user.isSpeaking && 'text-green-400')}>
        {displayName}
      </span>
      
      {/* Status icons */}
      <div className="flex items-center gap-0.5">
        {user.isDeafened && <HeadphonesOffIcon size="sm" className="text-red-400 w-3.5 h-3.5" />}
        {user.isMuted && <MicOffIcon size="sm" className="text-red-400 w-3.5 h-3.5" />}
      </div>
    </div>
  );
}

// ============================================================================
// VOICE CHANNEL WITH USERS
// ============================================================================

function VoiceChannelWithUsers({
  channel,
  isSelected,
  onSelect,
  onEdit,
  onDelete
}: {
  channel: Channel;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  // Fetch voice users for this channel (updated via socket events)
  const { data: voiceUsers = [] } = useQuery({
    queryKey: ['voiceChannelUsers', channel.id],
    queryFn: () => api.getVoiceChannelUsers(channel.id),
    staleTime: 0, // Always fresh, refetch on mount
    refetchOnMount: true,
    refetchOnWindowFocus: false
  });

  // Fetch user info for all users
  const { data: onlineUsers = [] } = useQuery<UserInfo[]>({
    queryKey: ['users', 'online'],
    queryFn: () => api.getOnlineUsers() as Promise<UserInfo[]>,
    staleTime: 30000
  });

  return (
    <div>
      {/* Channel row */}
      <div
        className={cn(
          'group w-full flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm transition-colors cursor-pointer',
          isSelected ? 'nav-item-active' : 'nav-item-default'
        )}
        onClick={onSelect}
      >
        <ChannelIcon type={channel.type} />
        <span className="truncate flex-1">{channel.name}</span>
        {voiceUsers.length > 0 && (
          <span className="text-xs text-green-400 font-medium px-1">{voiceUsers.length}</span>
        )}
        <button
          onClick={onEdit}
          className="btn-icon hover-group-visible"
          title="Redigera kanal"
        >
          <EditIcon size="sm" />
        </button>
        <button
          onClick={onDelete}
          className="btn-icon-danger hover-group-visible"
          title="Ta bort kanal"
        >
          <CloseIcon size="sm" />
        </button>
      </div>

      {/* Voice users list */}
      {voiceUsers.length > 0 && (
        <div className="ml-3 space-y-0.5 mb-1">
          {voiceUsers.map((user) => (
            <VoiceUserItem
              key={user.userId}
              user={user}
              userInfo={onlineUsers.find((u) => u.id === user.userId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// TEXT CHANNEL ITEM
// ============================================================================

function TextChannelItem({
  channel,
  isSelected,
  onSelect,
  onEdit,
  onDelete
}: {
  channel: Channel;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const hasUnread = (channel.unreadCount ?? 0) > 0;

  return (
    <div
      className={cn(
        'group w-full flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm transition-colors cursor-pointer',
        isSelected ? 'nav-item-active' : 'nav-item-default'
      )}
      onClick={onSelect}
    >
      <ChannelIcon type={channel.type} />
      <span className={cn('truncate flex-1', hasUnread && 'text-white font-semibold')}>
        {channel.name}
      </span>
      {hasUnread && (
        <span className="px-1.5 py-0.5 text-xs font-bold bg-white text-discord-dark rounded-full">
          {channel.unreadCount}
        </span>
      )}
      <button
        onClick={onEdit}
        className="btn-icon hover-group-visible"
        title="Redigera kanal"
      >
        <EditIcon size="sm" />
      </button>
      <button
        onClick={onDelete}
        className="btn-icon-danger hover-group-visible"
        title="Ta bort kanal"
      >
        <CloseIcon size="sm" />
      </button>
    </div>
  );
}

// ============================================================================
// SECTION HEADER
// ============================================================================

function SectionHeader({ title, onAdd }: { title: string; onAdd?: () => void }) {
  return (
    <div className="flex items-center justify-between px-2 mb-1 mt-3 first:mt-0">
      <span className="text-subtle uppercase font-semibold text-xs">{title}</span>
      {onAdd && (
        <button onClick={onAdd} className="btn-icon-primary">
          <PlusIcon size="sm" />
        </button>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface ChannelSectionProps {
  channels: Channel[];
  currentChannelId?: string;
  onChannelSelect: (channel: Channel) => void;
  onEditChannel: (channel: Channel, e: React.MouseEvent) => void;
  onDeleteChannel: (channel: Channel, e: React.MouseEvent) => void;
  onCreateChannel: () => void;
}

export default function ChannelSection({
  channels,
  currentChannelId,
  onChannelSelect,
  onEditChannel,
  onDeleteChannel,
  onCreateChannel
}: ChannelSectionProps) {
  // Deduplicate and sort channels
  const uniqueChannels = channels.reduce<Channel[]>((acc, channel) => {
    if (!acc.some((ch) => ch.id === channel.id)) {
      acc.push(channel);
    }
    return acc;
  }, []);

  // Separate by type
  const textChannels = uniqueChannels.filter((ch) => ch.type === 'TEXT' || ch.type === 'ANNOUNCEMENT' || !ch.type);
  const voiceChannels = uniqueChannels.filter((ch) => ch.type === 'VOICE');

  return (
    <>
      {/* Text Channels */}
      <SectionHeader title="Text Kanaler" onAdd={onCreateChannel} />
      {textChannels.length === 0 ? (
        <p className="text-xs text-gray-500 px-2 py-1">Inga textkanaler</p>
      ) : (
        textChannels.map((channel) => (
          <TextChannelItem
            key={channel.id}
            channel={channel}
            isSelected={currentChannelId === channel.id}
            onSelect={() => onChannelSelect(channel)}
            onEdit={(e) => onEditChannel(channel, e)}
            onDelete={(e) => onDeleteChannel(channel, e)}
          />
        ))
      )}

      {/* Voice Channels */}
      <SectionHeader title="Röst Kanaler" />
      {voiceChannels.length === 0 ? (
        <p className="text-xs text-gray-500 px-2 py-1">Inga röstkanaler</p>
      ) : (
        voiceChannels.map((channel) => (
          <VoiceChannelWithUsers
            key={channel.id}
            channel={channel}
            isSelected={currentChannelId === channel.id}
            onSelect={() => onChannelSelect(channel)}
            onEdit={(e) => onEditChannel(channel, e)}
            onDelete={(e) => onDeleteChannel(channel, e)}
          />
        ))
      )}
    </>
  );
}
