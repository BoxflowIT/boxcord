// Reusable Dropdown Menu Component
import { ReactNode } from 'react';
import { cn } from '../../utils/classNames';

interface DropdownMenuProps {
  /** Whether the menu is open */
  isOpen: boolean;
  /** Children - typically DropdownMenuItem components */
  children: ReactNode;
  /** Custom className for positioning and additional styling */
  className?: string;
}

interface DropdownMenuItemProps {
  /** Item label */
  children: ReactNode;
  /** Click handler */
  onClick: () => void;
  /** Danger variant (red text) */
  variant?: 'default' | 'danger';
  /** Custom  className */
  className?: string;
}

/**
 * Dropdown Menu Container
 * Uses CSS classes from index.css for consistent styling
 */
export function DropdownMenu({
  isOpen,
  children,
  className = ''
}: DropdownMenuProps) {
  if (!isOpen) return null;

  return <div className={cn('dropdown-menu', className)}>{children}</div>;
}

/**
 * Dropdown Menu Item
 * Uses CSS classes from index.css for consistent styling
 */
export function DropdownMenuItem({
  children,
  onClick,
  variant = 'default',
  className = ''
}: DropdownMenuItemProps) {
  const variantClass =
    variant === 'danger' ? 'dropdown-item-danger' : 'dropdown-item';

  return (
    <button className={cn(variantClass, className)} onClick={onClick}>
      {children}
    </button>
  );
}
