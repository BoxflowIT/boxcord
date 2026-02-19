// Search Input - Reusable search input with icon
import { useTranslation } from 'react-i18next';
import { SearchIcon } from './Icons';
import { cn } from '../../utils/classNames';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

export default function SearchInput({
  value,
  onChange,
  placeholder,
  autoFocus = false,
  className = ''
}: SearchInputProps) {
  const { t } = useTranslation();
  const displayPlaceholder = placeholder ?? t('common.search') + '...';
  return (
    <div className={cn('relative', className)}>
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        <SearchIcon size="sm" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={displayPlaceholder}
        className="w-full bg-boxflow-dark text-boxflow-light border border-boxflow-border rounded pl-9 pr-3 py-2 text-sm outline-none focus:border-boxflow-primary"
        autoFocus={autoFocus}
      />
    </div>
  );
}
