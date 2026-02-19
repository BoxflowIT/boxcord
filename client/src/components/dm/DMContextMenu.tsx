// DM Context Menu - Right-click menu for DM list items
import { useTranslation } from 'react-i18next';
import { Phone, UserPlus, BellOff, Trash2, MessageSquare } from 'lucide-react';
import MenuItem from '../menu/MenuItem';

interface UserInfo {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
}

interface DMContextMenuProps {
  channelId: string;
  otherUser: UserInfo;
  onStartCall?: () => void;
  onInviteToServer?: () => void;
  onMuteNotifications?: () => void;
  onDeleteConversation?: () => void;
  onMarkAsRead?: () => void;
}

export default function DMContextMenu({
  onStartCall,
  onInviteToServer,
  onMuteNotifications,
  onDeleteConversation,
  onMarkAsRead
}: DMContextMenuProps) {
  const { t } = useTranslation();
  return (
    <div className="py-1">
      {/* Voice Call */}
      <MenuItem
        icon={<Phone size={16} />}
        label={t('dm.startVoiceCall')}
        onClick={onStartCall}
      />

      {/* Mark as read */}
      <MenuItem
        icon={<MessageSquare size={16} />}
        label={t('dm.markAsRead')}
        onClick={onMarkAsRead}
      />

      {/* Divider */}
      <div className="border-t border-boxflow-border my-1" />

      {/* Invite to server */}
      <MenuItem
        icon={<UserPlus size={16} />}
        label={t('dm.inviteToServer')}
        onClick={onInviteToServer}
      />

      {/* Mute notifications */}
      <MenuItem
        icon={<BellOff size={16} />}
        label={t('dm.muteNotifications')}
        onClick={onMuteNotifications}
      />

      {/* Divider */}
      <div className="border-t border-boxflow-border my-1" />

      {/* Delete conversation */}
      <MenuItem
        icon={<Trash2 size={16} />}
        label={t('dm.deleteConversation')}
        onClick={onDeleteConversation}
        variant="danger"
      />
    </div>
  );
}
