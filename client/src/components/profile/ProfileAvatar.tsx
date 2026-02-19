// Profile Avatar Component with edit functionality
import { useTranslation } from 'react-i18next';
import { useImageUpload } from '../../hooks/useImageUpload';
import { cn } from '../../utils/classNames';
import CameraIcon from '../ui/CameraIcon';
import CloseIcon from '../ui/CloseIcon';

interface ProfileAvatarProps {
  avatarUrl?: string | null;
  firstName?: string | null;
  email: string;
  editing: boolean;
  presence?: {
    status: 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE';
  };
  onAvatarChange: (url: string) => void;
  onRemoveAvatar: () => void;
}

const STATUS_COLORS = {
  ONLINE: 'bg-green-500',
  AWAY: 'bg-yellow-500',
  BUSY: 'bg-red-500',
  OFFLINE: 'bg-gray-500'
};

const OVERLAY_CLASSES = cn(
  'absolute inset-0',
  'bg-black/70 opacity-0 group-hover:opacity-100',
  'transition-opacity',
  'flex flex-col items-center justify-center',
  'cursor-pointer'
);

const OVERLAY_LABEL_CLASSES = cn(
  'cursor-pointer text-white text-center',
  'w-full h-full',
  'flex flex-col items-center justify-center'
);

const REMOVE_BUTTON_CLASSES = cn(
  'absolute top-0 right-0',
  'flex items-center justify-center',
  'w-8 h-8',
  'bg-red-500 hover:bg-red-600',
  'text-white rounded-full shadow-lg',
  'transition-colors z-10'
);

const STATUS_BADGE_BASE = cn(
  'absolute bottom-1 right-1',
  'w-6 h-6 rounded-full',
  'border-4 border-discord-dark'
);

export default function ProfileAvatar({
  avatarUrl,
  firstName,
  email,
  editing,
  presence,
  onAvatarChange,
  onRemoveAvatar
}: ProfileAvatarProps) {
  const { t } = useTranslation();
  const { uploading, handleFileInput } = useImageUpload({
    maxSizeMB: 5
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = await handleFileInput(e);
    if (url) {
      onAvatarChange(url);
    }
  };

  const displayInitial = firstName?.charAt(0) ?? email.charAt(0) ?? '?';

  return (
    <div className="relative -mt-12 mb-4 group">
      <div className="profile-avatar-large relative overflow-hidden">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          displayInitial
        )}

        {/* Edit overlay */}
        {editing && (
          <div className={OVERLAY_CLASSES}>
            <label htmlFor="avatar-upload" className={OVERLAY_LABEL_CLASSES}>
              <CameraIcon className="w-12 h-12 mb-2" />
              <span className="text-sm font-bold">
                {uploading
                  ? t('common.loading')
                  : t('profile.clickToChangeImage')}
              </span>
            </label>
            <input
              type="file"
              id="avatar-upload"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        )}
      </div>

      {/* Remove button */}
      {editing && avatarUrl && (
        <button
          onClick={onRemoveAvatar}
          className={REMOVE_BUTTON_CLASSES}
          title={t('profile.removeImage')}
        >
          <CloseIcon className="w-4 h-4" />
        </button>
      )}

      {/* Status badge */}
      {presence && (
        <div
          className={cn(
            STATUS_BADGE_BASE,
            STATUS_COLORS[presence.status] ?? STATUS_COLORS.OFFLINE
          )}
        />
      )}
    </div>
  );
}
