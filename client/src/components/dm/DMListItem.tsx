// DM List Item Component
import { formatRelativeTime } from '../../utils/dateTime';
import { cn } from '../../utils/classNames';
import Avatar from '../ui/Avatar';

interface UserInfo {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
}

interface DMListItemProps {
  channelId: string;
  otherUser: UserInfo;
  lastMessage?: {
    content: string;
    createdAt: string;
  } | null;
  unreadCount?: number;
  isSelected: boolean;
  onClick: () => void;
}

export default function DMListItem({
  otherUser,
  lastMessage,
  unreadCount = 0,
  isSelected,
  onClick
}: DMListItemProps) {
  const hasUnread = unreadCount > 0;
  const displayName = otherUser.firstName ?? otherUser.email;
  const initial = otherUser.firstName?.charAt(0) ?? otherUser.email.charAt(0);

  return (
    <button
      onClick={onClick}
      className={cn(
        'list-item-interactive w-full',
        isSelected && 'bg-[#404249]/60'
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
        {lastMessage && (
          <p className="text-subtle truncate">{lastMessage.content}</p>
        )}
      </div>
      <div className="flex-row">
        {lastMessage && (
          <span className="text-subtle">
            {formatRelativeTime(lastMessage.createdAt)}
          </span>
        )}
        {hasUnread && (
          <span className="px-1.5 py-0.5 text-xs font-bold bg-white text-discord-dark rounded-full">
            {unreadCount}
          </span>
        )}
      </div>
    </button>
  );
}
