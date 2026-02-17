// Menu Item - Individual menu item
import { cn } from '../../utils/classNames';

interface MenuItemProps {
  icon?: React.ReactNode;
  label: string;
  onClick?: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
  selected?: boolean;
  className?: string;
}

const variantClasses: Record<string, string> = {
  default: 'hover:bg-boxflow-hover text-boxflow-light hover:text-white',
  danger: 'hover:bg-red-500/10 text-red-400 hover:text-red-300'
};

export default function MenuItem({
  icon,
  label,
  onClick,
  variant = 'default',
  disabled = false,
  selected = false,
  className = ''
}: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 text-sm text-left',
        'transition-colors',
        variantClasses[variant],
        selected && 'bg-boxflow-hover',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        className
      )}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="flex-1">{label}</span>
    </button>
  );
}
