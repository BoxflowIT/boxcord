// Reusable Avatar Component
import { ReactNode } from 'react';

interface AvatarProps {
  /** Avatar content - usually initials or icon */
  children: ReactNode;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Custom className for additional styling */
  className?: string;
  /** Image URL - if provided, uses image instead of initials */
  src?: string;
  /** Alt text for image */
  alt?: string;
}

/**
 * Standardized Avatar component
 * Uses CSS classes from index.css for consistent styling
 */
export default function Avatar({
  children,
  size = 'md',
  className = '',
  src,
  alt
}: AvatarProps) {
  const sizeClass = {
    sm: 'avatar-sm',
    md: 'avatar-md',
    lg: 'avatar-lg'
  }[size];

  if (src) {
    return (
      <img
        src={src}
        alt={alt || 'Avatar'}
        className={`${sizeClass} ${className}`}
      />
    );
  }

  return <div className={`${sizeClass} ${className}`}>{children}</div>;
}
