// Reusable Modal Component
import { ReactNode } from 'react';
import { CloseIcon } from './Icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
  showCloseButton?: boolean;
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl'
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'md',
  showCloseButton = true
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className={`bg-boxflow-dark rounded-2xl shadow-2xl ${maxWidthClasses[maxWidth]} w-full max-h-[90vh] overflow-hidden border border-boxflow-hover/50`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showCloseButton) && (
          <div className="px-4 py-3 border-b border-boxflow-darkest flex items-center justify-between">
            {title && (
              <h2 className="text-xl font-bold text-boxflow-light">{title}</h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-boxflow-muted hover:text-boxflow-light transition-colors p-1"
                aria-label="Close modal"
              >
                <CloseIcon size="md" />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
