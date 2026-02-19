// Member List Header - Shows member count and search toggle
import { useTranslation } from 'react-i18next';
import { SearchIcon, CloseIcon } from '../ui/Icons';

interface MemberListHeaderProps {
  memberCount: number;
  showSearch: boolean;
  onSearchToggle: () => void;
}

export default function MemberListHeader({
  memberCount,
  showSearch,
  onSearchToggle
}: MemberListHeaderProps) {
  const { t } = useTranslation();
  return (
    <div className="panel-header">
      <h3 className="text-subtle uppercase font-semibold flex-1">
        {t('common.members')} — {memberCount}
      </h3>
      <button
        onClick={onSearchToggle}
        className="btn-icon"
        title={t('members.searchMembers')}
      >
        {showSearch ? <CloseIcon size="sm" /> : <SearchIcon size="sm" />}
      </button>
    </div>
  );
}
