// Alert Banner - Inline alert/info banner
import { CloseIcon } from '../ui/Icons';
import { cn } from '../../utils/classNames';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertBannerProps {
  message: string | React.ReactNode;
  variant?: AlertVariant;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: React.ReactNode;
}

const variantClasses: Record<
  AlertVariant,
  { bg: string; border: string; text: string }
> = {
  info: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400'
  },
  success: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    text: 'text-green-400'
  },
  warning: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    text: 'text-yellow-400'
  },
  error: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400'
  }
};

export default function AlertBanner({
  message,
  variant = 'info',
  dismissible = false,
  onDismiss,
  icon
}: AlertBannerProps) {
  const classes = variantClasses[variant];

  return (
    <div
      className={cn(
        classes.bg,
        classes.border,
        classes.text,
        'border-l-4 rounded px-4 py-3 flex items-start gap-3'
      )}
    >
      {icon && <div className="flex-shrink-0 mt-0.5">{icon}</div>}
      <div className="flex-1 text-sm">{message}</div>
      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
        >
          <CloseIcon size="sm" />
        </button>
      )}
    </div>
  );
}
