// Member Context Menu - Right-click menu for member list items
import { useTranslation } from 'react-i18next';
import {
  MessageSquare,
  User,
  UserMinus,
  Ban,
  Shield,
  Phone
} from 'lucide-react';
import MenuItem from '../menu/MenuItem';

interface MemberContextMenuProps {
  userId: string;
  displayName: string;
  isCurrentUser?: boolean;
  canModerate?: boolean;
  onViewProfile?: () => void;
  onSendMessage?: () => void;
  onStartCall?: () => void;
  onKick?: () => void;
  onBan?: () => void;
  onChangeRole?: () => void;
}

export default function MemberContextMenu({
  isCurrentUser = false,
  canModerate = false,
  onViewProfile,
  onSendMessage,
  onStartCall,
  onKick,
  onBan,
  onChangeRole
}: MemberContextMenuProps) {
  const { t } = useTranslation();

  return (
    <div className="py-1">
      {/* View Profile */}
      <MenuItem
        icon={<User size={16} />}
        label={t('members.viewProfile')}
        onClick={onViewProfile}
      />

      {/* Send Message - only for other users */}
      {!isCurrentUser && (
        <>
          <MenuItem
            icon={<MessageSquare size={16} />}
            label={t('dm.sendDirectMessage')}
            onClick={onSendMessage}
          />

          {/* Start Call */}
          {onStartCall && (
            <MenuItem
              icon={<Phone size={16} />}
              label={t('dm.startVoiceCall')}
              onClick={onStartCall}
            />
          )}
        </>
      )}

      {/* Moderation section - divider */}
      {canModerate && (
        <>
          <div className="border-t border-boxflow-border my-1" />

          {/* Change Role */}
          <MenuItem
            icon={<Shield size={16} />}
            label={t('moderation.changeRole')}
            onClick={onChangeRole}
          />

          {/* Kick */}
          <MenuItem
            icon={<UserMinus size={16} />}
            label={t('moderation.kick')}
            onClick={onKick}
            variant="danger"
          />

          {/* Ban */}
          <MenuItem
            icon={<Ban size={16} />}
            label={t('moderation.ban')}
            onClick={onBan}
            variant="danger"
          />
        </>
      )}
    </div>
  );
}
