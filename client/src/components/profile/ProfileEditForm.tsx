// Reusable Profile Edit Form Component
import { useTranslation } from 'react-i18next';
import { TextInput, TextArea, FormGroup } from '../form';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  bio: string;
}

interface ProfileEditFormProps {
  formData: ProfileFormData;
  onChange: (data: ProfileFormData) => void;
  disabled?: boolean;
}

export function ProfileEditForm({
  formData,
  onChange,
  disabled = false
}: ProfileEditFormProps) {
  const { t } = useTranslation();
  const handleChange = (field: keyof ProfileFormData, value: string) => {
    onChange({ ...formData, [field]: value });
  };

  return (
    <FormGroup spacing="md">
      <TextInput
        label={t('profile.firstName')}
        value={formData.firstName}
        onChange={(e) => handleChange('firstName', e.target.value)}
        placeholder={t('profile.yourFirstName')}
        disabled={disabled}
        fullWidth
      />
      <TextInput
        label={t('profile.lastName')}
        value={formData.lastName}
        onChange={(e) => handleChange('lastName', e.target.value)}
        placeholder={t('profile.yourLastName')}
        disabled={disabled}
        fullWidth
      />
      <TextArea
        label={t('profile.bio')}
        value={formData.bio}
        onChange={(e) => handleChange('bio', e.target.value)}
        placeholder={t('profile.tellAboutYourself')}
        rows={4}
        disabled={disabled}
        fullWidth
      />
    </FormGroup>
  );
}
