// Add Button - Reusable + button for adding items
import { PlusIcon } from '../ui/Icons';

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
  const variantClass =
    variant === 'workspace' ? 'workspace-icon-add' : 'btn-icon-primary';

  const iconSize = variant === 'workspace' ? 'lg' : size;

  return (
    <button
      onClick={onClick}
      className={`${variantClass} ${className}`}
      title={title}
    >
      <PlusIcon size={iconSize} />
    </button>
  );
}
