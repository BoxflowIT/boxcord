// Search Input - Reusable search input with icon
import { SearchIcon } from './Icons';

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
  placeholder = 'Sök...',
  autoFocus = false,
  className = ''
}: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        <SearchIcon size="sm" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-boxflow-dark text-boxflow-light border border-boxflow-border rounded pl-9 pr-3 py-2 text-sm outline-none focus:border-boxflow-primary"
        autoFocus={autoFocus}
      />
    </div>
  );
}
