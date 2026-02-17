// Toggle switch component
import { cn } from '../../utils/classNames';

interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export default function Toggle({ enabled, onChange }: ToggleProps) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={cn(
        'toggle-track w-12 h-6',
        enabled && 'toggle-track-checked'
      )}
    >
      <span
        className={cn(
          'absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform',
          enabled && 'translate-x-6'
        )}
      />
    </button>
  );
}
