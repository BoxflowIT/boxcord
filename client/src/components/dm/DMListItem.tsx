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
        {hasUnread && (
          <span className="px-1.5 py-0.5 text-xs font-bold bg-white text-discord-dark rounded-full">
            {unreadCount}
          </span>
        )}
      </button>
    </ContextMenu>
  );
}
