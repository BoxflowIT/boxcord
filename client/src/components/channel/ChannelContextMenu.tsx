/**
 * Channel Context Menu - Right-click menu for channel list items
 */
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, Bell, BellOff, Pin, Archive } from 'lucide-react';
import MenuItem from '../menu/MenuItem';

interface ChannelContextMenuProps {
  channelName: string;
  channelType?: string;
  isAdmin?: boolean;
  isMuted?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onMuteNotifications?: () => void;
  onMarkAsRead?: () => void;
  onCopyLink?: () => void;
}

export default function ChannelContextMenu({
  isAdmin = false,
  isMuted = false,
  onEdit,
  onDelete,
  onMuteNotifications,
  onMarkAsRead,
  onCopyLink
}: ChannelContextMenuProps) {
  const { t } = useTranslation();

  return (
    <div className="py-1">
      {/* Mark as Read */}
      {onMarkAsRead && (
        <MenuItem
          icon={<Archive size={16} />}
          label={t('channels.markAsRead')}
          onClick={onMarkAsRead}
        />
      )}

      {/* Mute/Unmute Notifications */}
      {onMuteNotifications && (
        <MenuItem
          icon={isMuted ? <Bell size={16} /> : <BellOff size={16} />}
          label={
            isMuted
              ? t('channels.unmuteNotifications')
              : t('channels.muteNotifications')
          }
          onClick={onMuteNotifications}
        />
      )}

      {/* Copy Link */}
      {onCopyLink && (
        <MenuItem
          icon={<Pin size={16} />}
          label={t('common.copyLink')}
          onClick={onCopyLink}
        />
      )}

      {/* Admin actions */}
      {isAdmin && (
        <>
          <div className="border-t border-boxflow-border my-1" />

          {/* Edit Channel */}
          {onEdit && (
            <MenuItem
              icon={<Edit size={16} />}
              label={t('channels.edit')}
              onClick={onEdit}
            />
          )}

          {/* Delete Channel */}
          {onDelete && (
            <MenuItem
              icon={<Trash2 size={16} />}
              label={t('channels.delete')}
              onClick={onDelete}
              variant="danger"
            />
          )}
        </>
      )}
    </div>
  );
}
