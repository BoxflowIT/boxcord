// Loading Spinner - Small inline spinner for button/inline loading states
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses: Record<string, string> = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8'
};

export default function LoadingSpinner({
  size = 'md',
  className = ''
}: LoadingSpinnerProps) {
  return <div className={`spinner-ring ${sizeClasses[size]} ${className}`} />;
}
