import { useTranslation } from 'react-i18next';
import { EditIcon, CloseIcon } from '../ui/Icons';
import { cn } from '../../utils/classNames';

interface EnhancedChannelListItemProps {
  name: string;
  isActive: boolean;
  unreadCount?: number;
  onClick: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

/**
 * Enhanced channel list item with unread badge and actions
 */
export default function EnhancedChannelListItem({
  name,
  isActive,
  unreadCount = 0,
  onClick,
  onEdit,
  onDelete
}: EnhancedChannelListItemProps) {
  const { t } = useTranslation();
  const hasUnread = unreadCount > 0;

  return (
    <div
      className={cn(
        'group w-full flex-row px-2 py-1 rounded-lg text-sm transition-colors cursor-pointer',
        isActive ? 'nav-item-active' : 'nav-item-default'
      )}
      onClick={onClick}
    >
      <span className="text-lg">#</span>
      <span
        className={cn(
          'truncate flex-1',
          hasUnread && 'text-white font-semibold'
        )}
      >
        {name}
      </span>
      {hasUnread && (
        <span className="px-1.5 py-0.5 text-xs font-bold bg-white text-discord-dark rounded-full">
          {unreadCount}
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
  );
}
