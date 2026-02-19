// Profile Form Component for editing name and bio
import { useTranslation } from 'react-i18next';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  bio: string;
  avatarUrl: string;
}

interface ProfileFormProps {
  formData: ProfileFormData;
  editing: boolean;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onBioChange: (value: string) => void;
}

export default function ProfileForm({
  formData,
  editing,
  onFirstNameChange,
  onLastNameChange,
  onBioChange
}: ProfileFormProps) {
  const { t } = useTranslation();
  if (!editing) return null;

  return (
    <div className="space-y-4">
      {/* Name Fields */}
      <div className="space-y-2">
        <input
          type="text"
          value={formData.firstName}
          onChange={(e) => onFirstNameChange(e.target.value)}
          placeholder={t('profile.firstName')}
          className="w-full px-3 py-2 bg-discord-darkest rounded text-white"
        />
        <input
          type="text"
          value={formData.lastName}
          onChange={(e) => onLastNameChange(e.target.value)}
          placeholder={t('profile.lastName')}
          className="w-full px-3 py-2 bg-discord-darkest rounded text-white"
        />
      </div>

      {/* Bio Field */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase mb-1">
          {t('profile.aboutMe')}
        </h3>
        <textarea
          value={formData.bio}
          onChange={(e) => onBioChange(e.target.value)}
          placeholder={t('profile.writeSomething')}
          className="w-full px-3 py-2 bg-discord-darkest rounded text-white resize-none"
          rows={3}
          maxLength={500}
        />
      </div>
    </div>
  );
}
