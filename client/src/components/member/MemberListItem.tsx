// Member List Item - Individual member row with avatar, name, status, and DM button
import React from 'react';
import Avatar from '../ui/Avatar';
import { ChatIcon } from '../ui/Icons';
import StatusIndicator, { UserStatus } from './StatusIndicator';

interface MemberListItemProps {
  userId: string;
  avatarUrl?: string;
  displayName: string;
  customStatus?: string;
  status: UserStatus;
  isCurrentUser?: boolean;
  onClick: () => void;
  onStartDM?: (e: React.MouseEvent) => void;
}

export default function MemberListItem({
  userId,
  avatarUrl,
  displayName,
  customStatus,
  status,
  isCurrentUser = false,
  onClick,
  onStartDM
}: MemberListItemProps) {
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
          {customStatus && (
            <p className="text-subtle truncate">{customStatus}</p>
          )}
        </div>
      </button>

      {/* DM button - only show for other users */}
      {!isCurrentUser && onStartDM && (
        <button
          onClick={onStartDM}
          className="btn-icon-primary hover-group-visible"
          title="Skicka direktmeddelande"
        >
          <ChatIcon size="sm" />
        </button>
      )}
    </div>
  );
}
