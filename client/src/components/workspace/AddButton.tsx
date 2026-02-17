// Add Button - Reusable + button for adding items
import { PlusIcon } from '../ui/Icons';
import { cn } from '../../utils/classNames';

interface AddButtonProps {
  onClick: () => void;
  title?: string;
  variant?: 'workspace' | 'inline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function AddButton({
  onClick,
  title = 'Lägg till',
  variant = 'inline',
  size = 'sm',
  className = ''
}: AddButtonProps) {
  const iconSize = variant === 'workspace' ? 'lg' : size;

  return (
    <button
      onClick={onClick}
      className={cn(
        variant === 'workspace' ? 'workspace-icon-add' : 'btn-icon-primary',
        className
      )}
      title={title}
    >
      <PlusIcon size={iconSize} />
    </button>
  );
}
