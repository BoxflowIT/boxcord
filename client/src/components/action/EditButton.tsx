// Edit Button - Quick edit action button
import { EditIcon } from '../ui/Icons';
import ActionButton from './ActionButton';

interface EditButtonProps {
  onClick: (e: React.MouseEvent) => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary';
  disabled?: boolean;
  className?: string;
}

export default function EditButton({
  onClick,
  title = 'Redigera',
  size = 'sm',
  variant = 'default',
  disabled = false,
  className = ''
}: EditButtonProps) {
  return (
    <ActionButton
      icon={<EditIcon size={size} />}
      onClick={onClick}
      title={title}
      variant={variant}
      disabled={disabled}
      className={className}
    />
  );
}
