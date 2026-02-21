// DM List Item Component
import { cn } from '../../utils/classNames';
import Avatar from '../ui/Avatar';
import ContextMenu from '../menu/ContextMenu';
import DMContextMenu from './DMContextMenu';

interface UserInfo {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
}

interface DMListItemProps {
  channelId: string;
  otherUser: UserInfo;
  unreadCount?: number;
  isSelected: boolean;
  isMuted?: boolean;
  onClick: () => void;
  onStartCall?: () => void;
  onInviteToServer?: () => void;
  onMuteNotifications?: () => void;
  onDeleteConversation?: () => void;
  onMarkAsRead?: () => void;
}

export default function DMListItem({
  channelId,
  otherUser,
  unreadCount = 0,
  isSelected,
  isMuted = false,
  onClick,
  onStartCall,
  onInviteToServer,
  onMuteNotifications,
  onDeleteConversation,
  onMarkAsRead
}: DMListItemProps) {
  const hasUnread = unreadCount > 0;
  const displayName = otherUser.firstName ?? otherUser.email;
  const initial = otherUser.firstName?.charAt(0) ?? otherUser.email.charAt(0);

  return (
    <ContextMenu
      menu={
        <DMContextMenu
          channelId={channelId}
          otherUser={otherUser}
          isMuted={isMuted}
          onStartCall={onStartCall}
          onInviteToServer={onInviteToServer}
          onMuteNotifications={onMuteNotifications}
          onDeleteConversation={onDeleteConversation}
          onMarkAsRead={onMarkAsRead}
        />
      }
    >
      <button
        onClick={onClick}
        className={cn(
          'list-item-interactive w-full',
          isSelected && 'bg-boxflow-hover/60'
        )}
      >
        <Avatar size="sm">{initial}</Avatar>
        <div className="flex-1 min-w-0 text-left">
          <p
            className={cn(
              'text-sm truncate',
              hasUnread ? 'text-white font-semibold' : 'text-body'
            )}
          >
            {displayName}
          </p>
        </div>
        {isMuted && (
          <span className="text-gray-500" title="Notifications muted">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
              />
            </svg>
          </span>
        )}
        {hasUnread && (
          <span className="px-1.5 py-0.5 text-xs font-bold bg-white text-discord-dark rounded-full">
            {unreadCount}
          </span>
        )}
      </button>
    </ContextMenu>
  );
}
