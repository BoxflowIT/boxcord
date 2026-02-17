import { useState } from 'react';
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
  const [isDeleting, setIsDeleting] = useState(false);

  const resourceLabels = {
    channel: { single: 'kanal', plural: 'kanalen' },
    workspace: { single: 'workspace', plural: 'workspacen' },
    message: { single: 'meddelande', plural: 'meddelandet' },
    user: { single: 'användare', plural: 'användaren' }
  };

  const label = resourceLabels[resourceType];

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
      title={`Ta bort ${label.single}?`}
      message={
        dangerMessage ||
        `Är du säker på att du vill ta bort ${label.plural} "${resourceName}"? Detta går inte att ångra.`
      }
      confirmText="Ta bort"
      cancelText="Avbryt"
      variant="danger"
      onConfirm={handleConfirm}
      onClose={onClose}
      isLoading={isDeleting}
    />
  );
}
