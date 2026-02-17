// Select Input - Dropdown select input

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectInputProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  error?: string;
  className?: string;
}

export default function SelectInput({
  value,
  onChange,
  options,
  placeholder = 'Välj...',
  disabled = false,
  label,
  error,
  className = ''
}: SelectInputProps) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm text-gray-400 mb-1">{label}</label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full bg-boxflow-dark text-boxflow-light border border-boxflow-border rounded px-3 py-2 text-sm outline-none focus:border-boxflow-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}
