// Reusable Icon Button Component
import { ReactNode } from 'react';

interface IconButtonProps {
  /** Icon or button content */
  children: ReactNode;
  /** Click handler */
  onClick: () => void;
  /** Button variant */
  variant?: 'default' | 'danger';
  /** Custom className */
  className?: string;
  /** Accessible label */
  'aria-label': string;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Icon Button Component
 * Used for icon-only buttons (edit, delete, etc.)
 * Uses CSS classes from index.css for consistent styling
 */
export default function IconButton({
  children,
  onClick,
  variant = 'default',
  className = '',
  'aria-label': ariaLabel,
  disabled = false
}: IconButtonProps) {
  const variantClass = variant === 'danger' ? 'btn-icon-danger' : 'btn-icon';

  return (
    <button
      onClick={onClick}
      className={`${variantClass} ${className}`}
      aria-label={ariaLabel}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
