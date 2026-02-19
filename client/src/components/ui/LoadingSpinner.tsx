// Reusable Loading Spinner Component (inline, not fullscreen)
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/classNames';

interface LoadingSpinnerProps {
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Loading text to display */
  text?: string;
  /** Show centered with container */
  centered?: boolean;
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-10 h-10',
  lg: 'w-16 h-16'
};

const textClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base'
};

export default function LoadingSpinner({
  size = 'md',
  text,
  centered = true
}: LoadingSpinnerProps) {
  const spinner = <div className={cn('spinner-ring', sizeClasses[size])} />;

  if (centered) {
    return (
      <div className="flex flex-col items-center justify-center gap-3">
        {spinner}
        {text && <p className={cn('text-muted', textClasses[size])}>{text}</p>}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2">
      {spinner}
      {text && (
        <span className={cn('text-muted', textClasses[size])}>{text}</span>
      )}
    </div>
  );
}

// Variant for full-height container loading
export function LoadingState({ text, size = 'md' }: LoadingSpinnerProps) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center h-full py-8">
      <LoadingSpinner size={size} text={text ?? t('common.loading')} />
    </div>
  );
}
