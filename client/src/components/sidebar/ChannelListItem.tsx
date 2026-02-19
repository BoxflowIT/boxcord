// Reusable Channel List Item Component
import { useTranslation } from 'react-i18next';
import { SettingsIcon } from '../ui/Icons';
import { cn } from '../../utils/classNames';

interface ChannelListItemProps {
  id?: string;
  name: string;
  isActive: boolean;
  unreadCount?: number;
  onClick: () => void;
  onEdit?: () => void;
}

export function ChannelListItem({
  name,
  isActive,
  unreadCount = 0,
  onClick,
  onEdit
}: ChannelListItemProps) {
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
        <span className="px-1.5 py-0.5 text-xs font-bold bg-white text-boxflow-dark rounded-full">
          {unreadCount}
        </span>
      )}
      {onEdit && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="btn-icon hover-group-visible"
          title={t('channels.edit')}
        >
          <SettingsIcon size="sm" />
        </button>
      )}
    </div>
  );
}
