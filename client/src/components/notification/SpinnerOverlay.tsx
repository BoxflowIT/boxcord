// Spinner Overlay - Full screen loading overlay
import { cn } from '../../utils/classNames';

interface SpinnerOverlayProps {
  message?: string;
  transparent?: boolean;
}

export default function SpinnerOverlay({
  message = 'Laddar...',
  transparent = false
}: SpinnerOverlayProps) {
  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex flex-col items-center justify-center',
        transparent ? 'bg-black/30' : 'bg-[var(--color-bg-dark)]/90'
      )}
    >
      <div className="spinner-ring w-12 h-12 mb-4" />
      <p className="text-boxflow-light text-lg">{message}</p>
    </div>
  );
}
