// Dialog Header - Reusable dialog header
import React from 'react';
import { CloseIcon } from '../ui/Icons';

interface DialogHeaderProps {
  title: string;
  subtitle?: string;
  onClose?: () => void;
  className?: string;
}

export default function DialogHeader({
  title,
  subtitle,
  onClose,
  className = ''
}: DialogHeaderProps) {
  return (
    <div
      className={`flex items-start justify-between p-6 border-b border-boxflow-border ${className}`}
    >
      <div className="flex-1">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 ml-4 p-1 hover:bg-boxflow-hover rounded transition-colors"
        >
          <CloseIcon size="md" />
        </button>
      )}
    </div>
  );
}
