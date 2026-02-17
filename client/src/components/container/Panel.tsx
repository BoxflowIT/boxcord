// Panel - Reusable panel container with header and content
import React from 'react';

interface PanelProps {
  header?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export default function Panel({
  header,
  children,
  footer,
  className = '',
  contentClassName = ''
}: PanelProps) {
  return (
    <div className={`flex flex-col h-full ${className}`}>
      {header && <div className="panel-header">{header}</div>}

      <div
        className={`panel-content flex-1 min-h-0 overflow-y-auto ${contentClassName}`}
      >
        {children}
      </div>

      {footer && (
        <div className="flex-shrink-0 border-t border-boxflow-border">
          {footer}
        </div>
      )}
    </div>
  );
}
