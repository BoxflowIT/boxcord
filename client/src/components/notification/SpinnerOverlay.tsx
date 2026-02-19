// Spinner Overlay - Full screen loading overlay
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/classNames';

interface SpinnerOverlayProps {
  message?: string;
  transparent?: boolean;
}

export default function SpinnerOverlay({
  message,
  transparent = false
}: SpinnerOverlayProps) {
  const { t } = useTranslation();
  const displayMessage = message ?? t('common.loading');
  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex flex-col items-center justify-center',
        transparent ? 'bg-black/30' : 'bg-[var(--color-bg-dark)]/90'
      )}
    >
      <div className="spinner-ring w-12 h-12 mb-4" />
      <p className="text-boxflow-light text-lg">{displayMessage}</p>
    </div>
  );
}
