// Member List Item - Individual member row with avatar, name, status, and DM button
import { useTranslation } from 'react-i18next';
import Avatar from '../ui/Avatar';
import { ChatIcon, MoreIcon } from '../ui/Icons';
import StatusIndicator, { UserStatus } from './StatusIndicator';

interface MemberListItemProps {
  userId: string;
  avatarUrl?: string;
  displayName: string;
  customStatus?: string;
  statusEmoji?: string;
  status: UserStatus;
  isCurrentUser?: boolean;
  onClick: () => void;
  onStartDM?: (e: React.MouseEvent) => void;
  onModerate?: (e: React.MouseEvent) => void;
}

export default function MemberListItem({
  avatarUrl,
  displayName,
  customStatus,
  statusEmoji,
  status,
  isCurrentUser = false,
  onClick,
  onStartDM,
  onModerate
}: MemberListItemProps) {
  const { t } = useTranslation();
  return (
    <div className="group list-item-interactive">
      <button
        onClick={onClick}
        className="flex-1 flex items-center gap-3 min-w-0"
      >
        {/* Avatar with status indicator */}
        <div className="relative">
          <Avatar size="sm" src={avatarUrl}>
            {displayName[0].toUpperCase()}
          </Avatar>
          <div className="absolute bottom-0 right-0">
            <StatusIndicator status={status} />
          </div>
        </div>

        {/* Name and custom status */}
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm text-boxflow-light truncate">{displayName}</p>
          {(customStatus || statusEmoji) && (
            <p className="text-subtle truncate">
              {statusEmoji && <span className="mr-1">{statusEmoji}</span>}
              {customStatus}
            </p>
          )}
        </div>
      </button>

      {/* Action buttons - only show for other users */}
      {!isCurrentUser && (
        <div className="flex gap-1">
          {onStartDM && (
            <button
              onClick={onStartDM}
              className="btn-icon-primary hover-group-visible"
              title={t('dm.sendDirectMessage')}
            >
              <ChatIcon size="sm" />
            </button>
          )}
          {onModerate && (
            <button
              onClick={onModerate}
              className="btn-icon-primary hover-group-visible"
              title={t('moderation.title')}
            >
              <MoreIcon size="sm" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
