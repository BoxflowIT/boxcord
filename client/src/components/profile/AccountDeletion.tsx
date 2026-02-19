import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface AccountDeletionProps {
  onDelete: () => Promise<void>;
}

/**
 * Two-step account deletion component
 * Shows warning and requires confirmation
 */
export default function AccountDeletion({ onDelete }: AccountDeletionProps) {
  const { t } = useTranslation();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="pt-4 border-t border-discord-darkest">
      {showConfirm ? (
        <div className="space-y-2">
          <p className="text-red-400 text-sm">{t('profile.deleteConfirm')}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 px-4 py-2 bg-discord-darker hover:bg-discord-darkest text-white rounded"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded disabled:opacity-50"
            >
              {isDeleting ? t('profile.deleting') : t('profile.deleteAccount')}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowConfirm(true)}
          className="w-full px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
        >
          {t('profile.deleteMyAccount')}
        </button>
      )}
    </div>
  );
}
