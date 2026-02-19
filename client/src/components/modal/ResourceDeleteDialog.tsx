import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '../dialog';

interface ResourceDeleteDialogProps {
  isOpen: boolean;
  resourceType: 'channel' | 'workspace' | 'message' | 'user';
  resourceName: string;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
  dangerMessage?: string;
}

/**
 * Reusable delete confirmation dialog for any resource
 */
export default function ResourceDeleteDialog({
  isOpen,
  resourceType,
  resourceName,
  onConfirm,
  onClose,
  dangerMessage
}: ResourceDeleteDialogProps) {
  const { t } = useTranslation();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      // Error handling done in parent
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      title={t(`delete.${resourceType}Title`)}
      message={
        dangerMessage ||
        t(`delete.${resourceType}Message`, { name: resourceName })
      }
      confirmText={t('common.delete')}
      variant="danger"
      onConfirm={handleConfirm}
      onClose={onClose}
      isLoading={isDeleting}
    />
  );
}
