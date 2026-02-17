// Card - Flexible card container with optional header and footer
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClasses: Record<string, string> = {
  none: '',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6'
};

export default function Card({
  children,
  header,
  footer,
  className = '',
  padding = 'md'
}: CardProps) {
  return (
    <div
      className={`bg-boxflow-darker border border-boxflow-border rounded-lg overflow-hidden ${className}`}
    >
      {header && (
        <div className="border-b border-boxflow-border px-4 py-3 font-semibold">
          {header}
        </div>
      )}
      <div className={paddingClasses[padding]}>{children}</div>
      {footer && (
        <div className="border-t border-boxflow-border px-4 py-3">{footer}</div>
      )}
    </div>
  );
}
