// Badge - Small label for counts, status, or categories
import { cn } from '../../utils/classNames';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  rounded?: boolean;
  className?: string;
}

const variantClasses: Record<string, string> = {
  default: 'bg-boxflow-darker text-boxflow-light',
  primary: 'bg-boxflow-primary text-white',
  success: 'bg-green-600 text-white',
  warning: 'bg-yellow-600 text-white',
  danger: 'bg-red-600 text-white'
};

const sizeClasses: Record<string, string> = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2 py-1',
  lg: 'text-base px-3 py-1.5'
};

export default function Badge({
  children,
  variant = 'default',
  size = 'sm',
  rounded = true,
  className = ''
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium',
        variantClasses[variant],
        sizeClasses[size],
        rounded ? 'rounded-full' : 'rounded',
        className
      )}
    >
      {children}
    </span>
  );
}
