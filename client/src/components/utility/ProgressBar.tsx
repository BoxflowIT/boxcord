// Progress Bar - Linear progress indicator
import { cn } from '../../utils/classNames';

interface ProgressBarProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const variantClasses: Record<string, string> = {
  default: 'bg-boxflow-primary',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  danger: 'bg-red-500'
};

const sizeClasses: Record<string, string> = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3'
};

export default function ProgressBar({
  value,
  max = 100,
  showLabel = false,
  variant = 'default',
  size = 'md',
  className = ''
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between mb-1">
          <span className="text-sm text-muted">{Math.round(percentage)}%</span>
        </div>
      )}
      <div
        className={cn(
          'w-full bg-boxflow-darker rounded-full overflow-hidden',
          sizeClasses[size]
        )}
      >
        <div
          className={cn(
            variantClasses[variant],
            sizeClasses[size],
            'rounded-full transition-all duration-300'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
