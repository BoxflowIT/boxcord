// Toast Notification - Temporary notification popup
import React, { useEffect, useState } from 'react';
import { CloseIcon } from '../ui/Icons';

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

interface ToastProps {
  message: string;
  variant?: ToastVariant;
  duration?: number; // ms, 0 = no auto-dismiss
  onClose: () => void;
  showClose?: boolean;
}

const variantClasses: Record<ToastVariant, string> = {
  info: 'bg-boxflow-primary border-blue-500',
  success: 'bg-green-600 border-green-500',
  warning: 'bg-yellow-600 border-yellow-500',
  error: 'bg-red-600 border-red-500'
};

export default function Toast({
  message,
  variant = 'info',
  duration = 5000,
  onClose,
  showClose = true
}: ToastProps) {
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsLeaving(true);
        setTimeout(onClose, 300); // Wait for animation
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className={`
        ${variantClasses[variant]}
        border-l-4 rounded-lg shadow-lg px-4 py-3 flex items-center gap-3
        transition-all duration-300
        ${isLeaving ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
      `}
    >
      <p className="flex-1 text-white font-medium">{message}</p>
      {showClose && (
        <button
          onClick={handleClose}
          className="text-white/80 hover:text-white transition-colors"
        >
          <CloseIcon size="sm" />
        </button>
      )}
    </div>
  );
}
