// Skeleton - Loading skeleton placeholder
import { cn } from '../../utils/classNames';

interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  className?: string;
}

export default function Skeleton({
  variant = 'text',
  width = '100%',
  height,
  className = ''
}: SkeletonProps) {
  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded'
  };

  const defaultHeight = {
    text: '1rem',
    circular: '3rem',
    rectangular: '3rem'
  };

  return (
    <div
      className={cn(
        'bg-boxflow-darker animate-pulse',
        variantClasses[variant],
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: height
          ? typeof height === 'number'
            ? `${height}px`
            : height
          : defaultHeight[variant]
      }}
    />
  );
}
