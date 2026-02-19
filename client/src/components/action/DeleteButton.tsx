// Delete Button - Quick delete action button
import { useTranslation } from 'react-i18next';
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
  title,
  size = 'sm',
  disabled = false,
  className = ''
}: DeleteButtonProps) {
  const { t } = useTranslation();
  return (
    <ActionButton
      icon={<CloseIcon size={size} />}
      onClick={onClick}
      title={title ?? t('common.delete')}
      variant="danger"
      disabled={disabled}
      className={className}
    />
  );
}
