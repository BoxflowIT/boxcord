// Toast Container - Container for managing multiple toasts
import Toast, { ToastVariant } from './Toast';

export interface ToastItem {
  id: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
  position?:
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-center'
    | 'bottom-center';
}

const positionClasses: Record<string, string> = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2'
};

export default function ToastContainer({
  toasts,
  onRemove,
  position = 'top-right'
}: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      className={`fixed ${positionClasses[position]} z-50 flex flex-col gap-2 max-w-md`}
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          variant={toast.variant}
          duration={toast.duration}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
}
