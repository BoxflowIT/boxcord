// Dialog Footer - Reusable dialog footer with actions
import React from 'react';

interface DialogFooterProps {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right' | 'between';
  className?: string;
}

const alignClasses: Record<string, string> = {
  left: 'justify-start',
  center: 'justify-center',
  right: 'justify-end',
  between: 'justify-between'
};

export default function DialogFooter({
  children,
  align = 'right',
  className = ''
}: DialogFooterProps) {
  return (
    <div
      className={`flex gap-3 ${alignClasses[align]} p-6 border-t border-boxflow-border ${className}`}
    >
      {children}
    </div>
  );
}
