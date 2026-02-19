// Member Search Input - Search bar for filtering members
import { useTranslation } from 'react-i18next';

interface MemberSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function MemberSearch({
  value,
  onChange,
  placeholder
}: MemberSearchProps) {
  const { t } = useTranslation();
  const displayPlaceholder = placeholder ?? t('members.searchPlaceholder');
  return (
    <div className="px-4 py-2 border-b border-boxflow-border">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={displayPlaceholder}
        className="w-full bg-boxflow-dark text-boxflow-light border border-boxflow-border rounded px-3 py-2 text-sm outline-none focus:border-boxflow-primary"
        autoFocus
      />
    </div>
  );
}
