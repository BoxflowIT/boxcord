// Reusable Radio Options Component
import { cn } from '../../utils/classNames';

interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

interface RadioOptionsProps {
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function RadioOptions({
  options,
  value,
  onChange,
  disabled = false
}: RadioOptionsProps) {
  return (
    <div className="space-y-2">
      {options.map((option) => (
        <label
          key={option.value}
          className={cn(
            'flex items-start p-3 bg-boxflow-darker rounded-lg border-2 transition-all',
            value === option.value
              ? 'border-boxflow-primary bg-boxflow-primary/10'
              : 'border-transparent hover:bg-boxflow-hover',
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          )}
        >
          <input
            type="radio"
            value={option.value}
            checked={value === option.value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="mt-1 text-boxflow-primary focus:ring-boxflow-primary"
          />
          <div className="ml-3 flex-1">
            <div className="text-sm font-medium text-boxflow-light">
              {option.label}
            </div>
            {option.description && (
              <div className="text-xs text-boxflow-muted mt-0.5">
                {option.description}
              </div>
            )}
          </div>
        </label>
      ))}
    </div>
  );
}
