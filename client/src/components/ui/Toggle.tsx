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
        'relative w-12 h-6 rounded-full transition-colors',
        enabled
          ? 'bg-gradient-to-r from-[#5865f2] to-[#4752c4]'
          : 'bg-[#404249]'
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
