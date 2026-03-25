// Reusable Channel Section Component
import { useTranslation } from 'react-i18next';
import {
  useWorkspaceVoiceUsers,
  useOnlineUsers,
  useWorkspaceMembers
} from '../../hooks/useQuery';
import {
  PlusIcon,
  EditIcon,
  CloseIcon,
  VoiceChannelIcon,
  AnnouncementIcon,
  HashIcon,
  MicOffIcon,
  HeadphonesOffIcon
} from '../ui/Icons';
import type { Channel } from '../../types';
import { cn } from '../../utils/classNames';
import ContextMenu from '../menu/ContextMenu';
import ChannelContextMenu from '../channel/ChannelContextMenu';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useAuthStore } from '../../store/auth';
import { useNotificationStore } from '../../store/notification';
import { api } from '../../services/api';

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

function VoiceUserItem({
  user,
  userInfo
}: {
  user: VoiceUser;
  userInfo?: UserInfo;
}) {
  const { t } = useTranslation();
  const displayName = userInfo
    ? `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim() ||
      userInfo.email
    : t('common.loading');

  return (
    <div className="flex items-center gap-2 pl-7 pr-2 py-0.5 text-sm text-gray-400">
      {/* Avatar */}
      <div
        className={cn(
          'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium',
          user.isSpeaking
            ? 'ring-2 ring-green-500 ring-offset-1 ring-offset-gray-800'
            : ''
        )}
        style={{ backgroundColor: '#4f46e5' }}
      >
        {userInfo?.avatarUrl ? (
          <img
            src={userInfo.avatarUrl}
            alt=""
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          displayName.charAt(0).toUpperCase()
        )}
      </div>

      {/* Name */}
      <span
        className={cn('truncate flex-1', user.isSpeaking && 'text-green-400')}
      >
        {displayName}
      </span>

      {/* Status icons */}
      <div className="flex items-center gap-0.5">
        {user.isDeafened && (
          <HeadphonesOffIcon size="sm" className="text-red-400 w-3.5 h-3.5" />
        )}
        {user.isMuted && (
          <MicOffIcon size="sm" className="text-red-400 w-3.5 h-3.5" />
        )}
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
  isMuted,
  isAdmin,
  onSelect,
  onEdit,
  onDelete,
  onMuteToggle,
  onCopyLink,
  onMarkAsRead,
  voiceUsers = []
}: {
  channel: Channel;
  isSelected: boolean;
  isMuted: boolean;
  isAdmin: boolean;
  onSelect: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onMuteToggle: () => void;
  onCopyLink: () => void;
  onMarkAsRead: () => void;
  voiceUsers?: VoiceUser[];
}) {
  const { t } = useTranslation();
  const hasUnread = (channel.unreadCount ?? 0) > 0;

  // Fetch user info for all users - use shared hook
  const { data: onlineUsers = [] } = useOnlineUsers();

  return (
    <div>
      {/* Channel row */}
      <ContextMenu
        menu={
          <ChannelContextMenu
            channelName={channel.name}
            channelType={channel.type}
            isAdmin={isAdmin}
            isMuted={isMuted}
            onEdit={isAdmin ? () => onEdit({} as React.MouseEvent) : undefined}
            onDelete={
              isAdmin ? () => onDelete({} as React.MouseEvent) : undefined
            }
            onMuteNotifications={onMuteToggle}
            onCopyLink={onCopyLink}
            onMarkAsRead={hasUnread ? onMarkAsRead : undefined}
          />
        }
      >
        <div
          className={cn(
            'group w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm transition-colors cursor-pointer',
            isSelected ? 'nav-item-active' : 'nav-item-default'
          )}
          onClick={onSelect}
        >
          <ChannelIcon type={channel.type} />
          <span className="truncate flex-1">{channel.name}</span>
          {voiceUsers.length > 0 && (
            <span className="text-xs text-green-400 font-medium px-1">
              {voiceUsers.length}
            </span>
          )}
          <button
            onClick={onEdit}
            className="btn-icon hover-group-visible"
            title={t('channels.edit')}
          >
            <EditIcon size="sm" />
          </button>
          <button
            onClick={onDelete}
            className="btn-icon-danger hover-group-visible"
            title={t('channels.delete')}
          >
            <CloseIcon size="sm" />
          </button>
        </div>
      </ContextMenu>

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
  isMuted,
  isAdmin,
  onSelect,
  onEdit,
  onDelete,
  onMuteToggle,
  onCopyLink,
  onMarkAsRead
}: {
  channel: Channel;
  isSelected: boolean;
  isMuted: boolean;
  isAdmin: boolean;
  onSelect: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onMuteToggle: () => void;
  onCopyLink: () => void;
  onMarkAsRead: () => void;
}) {
  const { t } = useTranslation();
  const hasUnread = (channel.unreadCount ?? 0) > 0;

  return (
    <ContextMenu
      menu={
        <ChannelContextMenu
          channelName={channel.name}
          channelType={channel.type}
          isAdmin={isAdmin}
          isMuted={isMuted}
          onEdit={isAdmin ? () => onEdit({} as React.MouseEvent) : undefined}
          onDelete={
            isAdmin ? () => onDelete({} as React.MouseEvent) : undefined
          }
          onMuteNotifications={onMuteToggle}
          onCopyLink={onCopyLink}
          onMarkAsRead={hasUnread ? onMarkAsRead : undefined}
        />
      }
    >
      <div
        className={cn(
          'group w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm transition-colors cursor-pointer',
          isSelected ? 'nav-item-active' : 'nav-item-default'
        )}
        onClick={onSelect}
      >
        <ChannelIcon type={channel.type} />
        <span
          className={cn(
            'truncate flex-1',
            hasUnread && 'text-white font-semibold'
          )}
        >
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
          title={t('channels.edit')}
        >
          <EditIcon size="sm" />
        </button>
        <button
          onClick={onDelete}
          className="btn-icon-danger hover-group-visible"
          title={t('channels.delete')}
        >
          <CloseIcon size="sm" />
        </button>
      </div>
    </ContextMenu>
  );
}

// ============================================================================
// SECTION HEADER
// ============================================================================

function SectionHeader({
  title,
  onAdd
}: {
  title: string;
  onAdd?: () => void;
}) {
  return (
    <div className="px-3 py-2 flex items-center justify-between flex-shrink-0 mt-3 first:mt-0">
      <span className="text-xs font-semibold text-gray-400 uppercase">
        {title}
      </span>
      {onAdd && (
        <button onClick={onAdd} className="text-gray-400 hover:text-white">
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
  workspaceId?: string;
  channels: Channel[];
  currentChannelId?: string;
  onChannelSelect: (channel: Channel) => void;
  onEditChannel: (channel: Channel, e: React.MouseEvent) => void;
  onDeleteChannel: (channel: Channel, e: React.MouseEvent) => void;
  onCreateChannel: () => void;
}

export default function ChannelSection({
  workspaceId,
  channels,
  currentChannelId,
  onChannelSelect,
  onEditChannel,
  onDeleteChannel,
  onCreateChannel
}: ChannelSectionProps) {
  const { t } = useTranslation();

  // Get current user and workspace members
  const { user: currentUser } = useAuthStore();

  // Muted channels (stored in localStorage)
  const [mutedChannels, setMutedChannels] = useLocalStorage<string[]>(
    'mutedChannels',
    []
  );

  // Batch fetch all voice channel users for this workspace (optimization)
  const { data } = useWorkspaceVoiceUsers(workspaceId);
  const workspaceVoiceUsers: Record<string, VoiceUser[]> = data || {};

  // Fetch workspace members to determine admin status - use shared hook
  const { data: members = [] } = useWorkspaceMembers(workspaceId) as {
    data: Array<{ id: string; role: string }>;
  };

  // Check if current user is admin
  const currentUserMember = members.find((m) => m.id === currentUser?.id);
  const isAdmin =
    currentUserMember?.role === 'ADMIN' ||
    currentUserMember?.role === 'SUPER_ADMIN';

  // Handler functions
  const handleMuteToggle = (channelId: string) => {
    const newMutedChannels = mutedChannels.includes(channelId)
      ? mutedChannels.filter((id: string) => id !== channelId)
      : [...mutedChannels, channelId];
    setMutedChannels(newMutedChannels);
  };

  const handleCopyLink = (channelId: string) => {
    const link = `${window.location.origin}/chat/channels/${channelId}`;
    navigator.clipboard.writeText(link);
    const { addToast } = useNotificationStore.getState();
    addToast(
      t('channel.linkCopied', 'Link copied to clipboard'),
      'success',
      2000
    );
  };

  const handleMarkAsRead = (channelId: string) => {
    api
      .post(`/channels/${channelId}/read`)
      .then(() => {
        const { addToast } = useNotificationStore.getState();
        addToast(
          t('channel.markedAsRead', 'Channel marked as read'),
          'success',
          2000
        );
      })
      .catch(() => {
        // Silently ignore errors for non-existent channels
      });
  };

  // Deduplicate and sort channels
  const uniqueChannels = channels.reduce<Channel[]>((acc, channel) => {
    if (!acc.some((ch) => ch.id === channel.id)) {
      acc.push(channel);
    }
    return acc;
  }, []);

  // Separate by type
  const textChannels = uniqueChannels.filter(
    (ch) => ch.type === 'TEXT' || ch.type === 'ANNOUNCEMENT' || !ch.type
  );
  const voiceChannels = uniqueChannels.filter((ch) => ch.type === 'VOICE');

  return (
    <>
      {/* Text Channels */}
      <SectionHeader
        title={t('channels.textChannels')}
        onAdd={onCreateChannel}
      />
      {textChannels.length === 0 ? (
        <p className="text-xs text-gray-500 px-2 py-1">
          {t('channels.noTextChannels')}
        </p>
      ) : (
        textChannels.map((channel) => (
          <TextChannelItem
            key={channel.id}
            channel={channel}
            isSelected={currentChannelId === channel.id}
            isMuted={mutedChannels.includes(channel.id)}
            isAdmin={isAdmin}
            onSelect={() => onChannelSelect(channel)}
            onEdit={(e) => onEditChannel(channel, e)}
            onDelete={(e) => onDeleteChannel(channel, e)}
            onMuteToggle={() => handleMuteToggle(channel.id)}
            onCopyLink={() => handleCopyLink(channel.id)}
            onMarkAsRead={() => handleMarkAsRead(channel.id)}
          />
        ))
      )}

      {/* Voice Channels */}
      <SectionHeader title={t('channels.voiceChannels')} />
      {voiceChannels.length === 0 ? (
        <p className="text-xs text-gray-500 px-2 py-1">
          {t('channels.noVoiceChannels')}
        </p>
      ) : (
        voiceChannels.map((channel) => (
          <VoiceChannelWithUsers
            key={channel.id}
            channel={channel}
            isSelected={currentChannelId === channel.id}
            isMuted={mutedChannels.includes(channel.id)}
            isAdmin={isAdmin}
            onSelect={() => onChannelSelect(channel)}
            onEdit={(e) => onEditChannel(channel, e)}
            onDelete={(e) => onDeleteChannel(channel, e)}
            onMuteToggle={() => handleMuteToggle(channel.id)}
            onCopyLink={() => handleCopyLink(channel.id)}
            onMarkAsRead={() => handleMarkAsRead(channel.id)}
            voiceUsers={workspaceVoiceUsers[channel.id] || []}
          />
        ))
      )}
    </>
  );
}
