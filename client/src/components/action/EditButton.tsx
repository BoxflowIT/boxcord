// Edit Button - Quick edit action button
import { useTranslation } from 'react-i18next';
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
  title,
  size = 'sm',
  variant = 'default',
  disabled = false,
  className = ''
}: EditButtonProps) {
  const { t } = useTranslation();
  return (
    <ActionButton
      icon={<EditIcon size={size} />}
      onClick={onClick}
      title={title ?? t('common.edit')}
      variant={variant}
      disabled={disabled}
      className={className}
    />
  );
}
