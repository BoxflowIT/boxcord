/**
 * Message Density Selector Component
 * Allows users to choose message display density: compact, cozy, or spacious
 */
import { cn } from '../../utils/classNames';

export type MessageDensity = 'compact' | 'cozy' | 'spacious';

interface MessageDensitySelectorProps {
  density: MessageDensity;
  onDensityChange: (density: MessageDensity) => void;
}

const DENSITIES: { value: MessageDensity; label: string }[] = [
  { value: 'compact', label: 'Compact' },
  { value: 'cozy', label: 'Cozy' },
  { value: 'spacious', label: 'Spacious' }
];

export default function MessageDensitySelector({
  density,
  onDensityChange
}: MessageDensitySelectorProps) {
  return (
    <div className="flex gap-2">
      {DENSITIES.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onDensityChange(value)}
          className={cn(
            'px-4 py-2 rounded-lg transition-colors',
            density === value
              ? 'gradient-primary text-white shadow-primary'
              : 'bg-boxflow-hover text-boxflow-muted hover:brightness-110'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
