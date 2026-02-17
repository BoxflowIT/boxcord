// List Item Wrapper - Generic list item with hover and click
import { cn } from '../../utils/classNames';

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

  return (
    <Component
      onClick={onClick}
      className={cn(
        'w-full px-3 py-2 rounded transition-colors',
        hoverable && 'hover:bg-boxflow-hover',
        active && 'bg-boxflow-hover',
        onClick && 'cursor-pointer text-left',
        className
      )}
    >
      {children}
    </Component>
  );
}
