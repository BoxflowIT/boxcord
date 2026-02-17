// Reusable Toggle Switch Component
import { cn } from '../../utils/classNames';

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export function ToggleSwitch({
  enabled,
  onChange,
  disabled = false,
  size = 'md'
}: ToggleSwitchProps) {
  const sizeClasses = size === 'sm' ? 'w-10 h-5' : 'w-12 h-6';
  const dotClasses = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      disabled={disabled}
      className={cn(
        sizeClasses,
        'relative inline-flex items-center rounded-full transition-colors',
        enabled ? 'bg-boxflow-primary' : 'bg-boxflow-hover',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      )}
    >
      <span
        className={cn(
          dotClasses,
          'inline-block rounded-full bg-white transition-transform',
          enabled ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  );
}
