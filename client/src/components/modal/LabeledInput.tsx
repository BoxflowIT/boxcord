// Labeled Input - Input field with label on top
import { Input } from '../ui/input';

interface LabeledInputProps {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  required?: boolean;
  disabled?: boolean;
}

export default function LabeledInput({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoFocus = false,
  required = false,
  disabled = false
}: LabeledInputProps) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        disabled={disabled}
      />
    </div>
  );
}
