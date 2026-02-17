// Checkbox Input - Checkbox with label
import { cn } from '../../utils/classNames';

interface CheckboxInputProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export default function CheckboxInput({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className = ''
}: CheckboxInputProps) {
  return (
    <label
      className={cn(
        'flex items-start gap-3 cursor-pointer',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="mt-1 w-4 h-4 text-boxflow-primary bg-boxflow-dark border-boxflow-border rounded focus:ring-2 focus:ring-boxflow-primary"
      />
      {(label || description) && (
        <div className="flex-1">
          {label && (
            <p className="text-sm text-boxflow-light font-medium">{label}</p>
          )}
          {description && (
            <p className="text-xs text-muted mt-0.5">{description}</p>
          )}
        </div>
      )}
    </label>
  );
}
