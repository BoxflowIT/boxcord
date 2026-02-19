// Profile Edit Actions (Save/Cancel/Edit buttons)
import { useTranslation } from 'react-i18next';

interface ProfileEditActionsProps {
  editing: boolean;
  saving: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function ProfileEditActions({
  editing,
  saving,
  onEdit,
  onSave,
  onCancel
}: ProfileEditActionsProps) {
  const { t } = useTranslation();
  return (
    <div className="flex gap-2">
      {editing ? (
        <>
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-discord-darker hover:bg-discord-darkest text-white rounded"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="flex-1 px-4 py-2 gradient-primary text-white rounded-lg shadow-primary disabled:opacity-50 transition-all"
          >
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </>
      ) : (
        <button
          onClick={onEdit}
          className="flex-1 px-4 py-2 gradient-primary text-white rounded-lg shadow-primary transition-all"
        >
          {t('profile.editProfile')}
        </button>
      )}
    </div>
  );
}
