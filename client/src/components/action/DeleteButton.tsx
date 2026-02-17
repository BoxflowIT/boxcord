// Delete Button - Quick delete action button
import { CloseIcon } from '../ui/Icons';
import ActionButton from './ActionButton';

interface DeleteButtonProps {
  onClick: (e: React.MouseEvent) => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export default function DeleteButton({
  onClick,
  title = 'Ta bort',
  size = 'sm',
  disabled = false,
  className = ''
}: DeleteButtonProps) {
  return (
    <ActionButton
      icon={<CloseIcon size={size} />}
      onClick={onClick}
      title={title}
      variant="danger"
      disabled={disabled}
      className={className}
    />
  );
}
