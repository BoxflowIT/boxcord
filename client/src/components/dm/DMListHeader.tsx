// DM List Header Component
import { useTranslation } from 'react-i18next';
import { PlusIcon, CloseIcon } from '../ui/Icons';

interface DMListHeaderProps {
  isSearchOpen: boolean;
  onToggleSearch: () => void;
}

export default function DMListHeader({
  isSearchOpen,
  onToggleSearch
}: DMListHeaderProps) {
  const { t } = useTranslation();
  return (
    <div className="px-3 py-2 flex items-center justify-between flex-shrink-0">
      <span className="text-xs font-semibold text-gray-400 uppercase">
        {t('dm.title')}
      </span>
      <button
        onClick={onToggleSearch}
        className="text-gray-400 hover:text-white"
        title={isSearchOpen ? t('common.close') : t('dm.newMessage')}
      >
        {isSearchOpen ? <CloseIcon size="sm" /> : <PlusIcon size="sm" />}
      </button>
    </div>
  );
}
