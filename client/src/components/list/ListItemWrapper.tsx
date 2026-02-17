// List Item Wrapper - Generic list item with hover and click
import React from 'react';

interface ListItemWrapperProps {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  hoverable?: boolean;
  className?: string;
}

export default function ListItemWrapper({
  children,
  onClick,
  active = false,
  hoverable = true,
  className = ''
}: ListItemWrapperProps) {
  const Component = onClick ? 'button' : 'div';

  const baseClasses = 'w-full px-3 py-2 rounded transition-colors';
  const hoverClasses = hoverable ? 'hover:bg-boxflow-hover' : '';
  const activeClasses = active ? 'bg-boxflow-hover' : '';
  const clickClasses = onClick ? 'cursor-pointer text-left' : '';

  return (
    <Component
      onClick={onClick}
      className={`${baseClasses} ${hoverClasses} ${activeClasses} ${clickClasses} ${className}`}
    >
      {children}
    </Component>
  );
}
