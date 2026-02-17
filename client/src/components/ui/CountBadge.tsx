// Count Badge - Shows a numerical count (e.g., unread messages, online users)
import React from 'react';

interface CountBadgeProps {
  count: number;
  variant?: 'default' | 'primary' | 'danger';
  max?: number;
  showZero?: boolean;
  className?: string;
}

const variantClasses: Record<string, string> = {
  default: 'bg-gray-600 text-white',
  primary: 'bg-boxflow-primary text-white',
  danger: 'bg-red-600 text-white'
};

export default function CountBadge({
  count,
  variant = 'default',
  max = 99,
  showZero = false,
  className = ''
}: CountBadgeProps) {
  if (count === 0 && !showZero) return null;

  const displayCount = count > max ? `${max}+` : count;

  return (
    <span
      className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold rounded-full ${variantClasses[variant]} ${className}`}
    >
      {displayCount}
    </span>
  );
}
