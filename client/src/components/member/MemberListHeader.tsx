// Member List Header - Shows member count and search toggle
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
  return (
    <div className="panel-header">
      <h3 className="text-subtle uppercase font-semibold flex-1">
        Medlemmar — {memberCount}
      </h3>
      <button
        onClick={onSearchToggle}
        className="btn-icon"
        title="Sök medlemmar"
      >
        {showSearch ? <CloseIcon size="sm" /> : <SearchIcon size="sm" />}
      </button>
    </div>
  );
}
