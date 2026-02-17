// Reusable Divider Component
import { cn } from '../../utils/classNames';

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'sm' | 'md' | 'lg';
}

export function Divider({
  orientation = 'horizontal',
  spacing = 'md'
}: DividerProps) {
  const spacingClasses = {
    sm: orientation === 'horizontal' ? 'my-2' : 'mx-2',
    md: orientation === 'horizontal' ? 'my-4' : 'mx-4',
    lg: orientation === 'horizontal' ? 'my-6' : 'mx-6'
  };

  if (orientation === 'vertical') {
    return (
      <div className={cn('w-px bg-boxflow-border', spacingClasses[spacing])} />
    );
  }

  return (
    <div className={cn('h-px bg-boxflow-border', spacingClasses[spacing])} />
  );
}
