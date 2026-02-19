// Reusable Profile Actions Component (Edit, Save, Logout, Delete)
import { useTranslation } from 'react-i18next';
import { Button } from '../form';

interface ProfileActionsProps {
  isOwnProfile: boolean;
  isEditing: boolean;
  saving?: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onLogout?: () => void;
  onDelete?: () => void;
}

export function ProfileActions({
  isOwnProfile,
  isEditing,
  saving = false,
  onEdit,
  onSave,
  onCancel,
  onLogout,
  onDelete
}: ProfileActionsProps) {
  const { t } = useTranslation();
  if (!isOwnProfile) return null;

  return (
    <div className="p-4 border-t border-boxflow-border space-y-2">
      {isEditing ? (
        <div className="flex-row">
          <Button
            variant="primary"
            onClick={onSave}
            loading={saving}
            disabled={saving}
            fullWidth
          >
            {t('profile.saveChanges')}
          </Button>
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={saving}
            fullWidth
          >
            {t('common.cancel')}
          </Button>
        </div>
      ) : (
        <>
          <Button variant="secondary" onClick={onEdit} fullWidth>
            {t('profile.editProfile')}
          </Button>
          {onLogout && (
            <Button variant="ghost" onClick={onLogout} fullWidth>
              {t('auth.logout')}
            </Button>
          )}
          {onDelete && (
            <Button variant="danger" onClick={onDelete} fullWidth>
              {t('profile.deleteAccount')}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
