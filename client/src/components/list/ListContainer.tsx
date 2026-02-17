// List Container - Generic scrollable list container
import { Children } from 'react';

interface ListContainerProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  emptyMessage?: string | React.ReactNode;
  maxHeight?: string;
  className?: string;
}

export default function ListContainer({
  children,
  header,
  footer,
  emptyMessage,
  maxHeight = 'auto',
  className = ''
}: ListContainerProps) {
  const isEmpty = Children.count(children) === 0;

  return (
    <div className={`flex flex-col ${className}`}>
      {header && <div className="flex-shrink-0">{header}</div>}

      <div className="flex-1 overflow-y-auto" style={{ maxHeight }}>
        {isEmpty ? (
          <div className="p-4 text-center text-muted">
            {emptyMessage || 'Inga items'}
          </div>
        ) : (
          children
        )}
      </div>

      {footer && <div className="flex-shrink-0">{footer}</div>}
    </div>
  );
}
