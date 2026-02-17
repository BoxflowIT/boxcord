// Reusable Profile Edit Form Component
import React from 'react';
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
  const handleChange = (field: keyof ProfileFormData, value: string) => {
    onChange({ ...formData, [field]: value });
  };

  return (
    <FormGroup spacing="md">
      <TextInput
        label="Förnamn"
        value={formData.firstName}
        onChange={(e) => handleChange('firstName', e.target.value)}
        placeholder="Ditt förnamn"
        disabled={disabled}
        fullWidth
      />
      <TextInput
        label="Efternamn"
        value={formData.lastName}
        onChange={(e) => handleChange('lastName', e.target.value)}
        placeholder="Ditt efternamn"
        disabled={disabled}
        fullWidth
      />
      <TextArea
        label="Bio"
        value={formData.bio}
        onChange={(e) => handleChange('bio', e.target.value)}
        placeholder="Berätta lite om dig själv..."
        rows={4}
        disabled={disabled}
        fullWidth
      />
    </FormGroup>
  );
}
