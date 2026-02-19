import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import { signOut } from '../services/cognito';
import { logger } from '../utils/logger';
import { useAuthStore } from '../store/auth';
import {
  useUser,
  useCurrentUser,
  useUpdateProfile,
  useUpdateUserRole
} from '../hooks/useQuery';
import { RoleManagement, AccountDeletion } from './profile';
import ProfileDisplay from './profile/ProfileDisplay';
import ProfileForm from './profile/ProfileForm';
import ProfileEditActions from './profile/ProfileEditActions';
import ProfileAvatar from './profile/ProfileAvatar';

interface ProfileModalProps {
  userId?: string; // If provided, show other user's profile
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({
  userId,
  isOpen,
  onClose
}: ProfileModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user: currentUser, logout } = useAuthStore();

  // React Query hooks for auto caching
  const { data: otherUserData, isLoading: loadingOther } = useUser(
    userId && userId !== currentUser?.id ? userId : undefined
  );
  const { data: currentUserData, isLoading: loadingCurrent } = useCurrentUser();
  const { mutate: updateProfile, isPending: saving } = useUpdateProfile();
  const { mutate: updateUserRole, isPending: changingRole } =
    useUpdateUserRole();

  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    avatarUrl: ''
  });

  const isOwnProfile = !userId || userId === currentUser?.id;
  const profile = isOwnProfile ? currentUserData : otherUserData;
  const loading = isOwnProfile ? loadingCurrent : loadingOther;

  useEffect(() => {
    if (!isOpen || !profile) return;

    setFormData({
      firstName: profile.firstName ?? '',
      lastName: profile.lastName ?? '',
      bio: profile.bio ?? '',
      avatarUrl: profile.avatarUrl ?? ''
    });
  }, [isOpen, profile]);

  const handleRemoveImage = () => {
    setFormData({ ...formData, avatarUrl: '' });
  };

  const handleSave = () => {
    updateProfile(formData, {
      onSuccess: (updatedProfile) => {
        setEditing(false);
        // Update Zustand auth store with new profile data
        if (isOwnProfile) {
          const { updateUser } = useAuthStore.getState();
          updateUser({
            firstName: updatedProfile.firstName,
            lastName: updatedProfile.lastName,
            avatarUrl: updatedProfile.avatarUrl
          });
        }
        // Cache updated automatically via invalidation
      },
      onError: (err) => {
        logger.error('Failed to save profile:', err);
      }
    });
  };

  const handleDelete = async () => {
    try {
      await api.deleteAccount();
      // Sign out from Cognito
      signOut();
      // Clear local auth state
      logout();
      navigate('/login');
    } catch (err) {
      logger.error('Failed to delete account:', err);
      throw err; // Re-throw so AccountDeletion can handle it
    }
  };

  const handleChangeRole = (newRole: 'SUPER_ADMIN' | 'ADMIN' | 'STAFF') => {
    if (!profile) return;

    updateUserRole(
      { userId: profile.id, role: newRole },
      {
        onError: (err) => {
          logger.error('Failed to change role:', err);
          alert(t('common.couldNotChangeRole'));
        }
        // Cache updated automatically via invalidation
      }
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-boxflow-dark rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-boxflow-hover-50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header/Banner */}
        <div className="h-24 bg-boxflow-darker" />

        {/* Profile content */}
        <div className="px-4 pb-4">
          {/* Avatar */}
          <ProfileAvatar
            avatarUrl={editing ? formData.avatarUrl : profile?.avatarUrl}
            firstName={profile?.firstName}
            email={profile?.email ?? ''}
            editing={editing}
            presence={
              profile?.presence
                ? {
                    status:
                      profile.presence.status === 'IDLE'
                        ? 'AWAY'
                        : profile.presence.status === 'DO_NOT_DISTURB'
                          ? 'BUSY'
                          : (profile.presence.status as 'ONLINE' | 'OFFLINE')
                  }
                : undefined
            }
            onAvatarChange={(url) =>
              setFormData({ ...formData, avatarUrl: url })
            }
            onRemoveAvatar={handleRemoveImage}
          />

          {loading ? (
            <div className="text-gray-400">{t('common.loading')}</div>
          ) : profile ? (
            <div className="space-y-4">
              {/* Profile Display or Edit Form */}
              {editing ? (
                <ProfileForm
                  formData={formData}
                  editing={editing}
                  onFirstNameChange={(value) =>
                    setFormData({ ...formData, firstName: value })
                  }
                  onLastNameChange={(value) =>
                    setFormData({ ...formData, lastName: value })
                  }
                  onBioChange={(value) =>
                    setFormData({ ...formData, bio: value })
                  }
                />
              ) : (
                <ProfileDisplay
                  firstName={profile.firstName}
                  lastName={profile.lastName}
                  email={profile.email}
                  role={profile.role}
                  bio={profile.bio}
                  customStatus={profile.presence?.customStatus}
                />
              )}

              {/* Role Management - Only SUPER_ADMIN can change roles */}
              {!isOwnProfile && currentUser?.role === 'SUPER_ADMIN' && (
                <RoleManagement
                  userId={profile.id}
                  currentRole={
                    profile.role as 'SUPER_ADMIN' | 'ADMIN' | 'STAFF' | 'USER'
                  }
                  onChangeRole={handleChangeRole}
                  isChanging={changingRole}
                />
              )}

              {/* Actions */}
              {isOwnProfile && (
                <div className="space-y-2 pt-2">
                  <ProfileEditActions
                    editing={editing}
                    saving={saving}
                    onEdit={() => setEditing(true)}
                    onSave={handleSave}
                    onCancel={() => setEditing(false)}
                  />

                  {/* Delete Account */}
                  {!editing && <AccountDeletion onDelete={handleDelete} />}
                </div>
              )}

              {!isOwnProfile && (
                <button
                  onClick={() => {
                    /* Start DM */
                  }}
                  className="w-full px-4 py-2 gradient-primary text-white rounded-lg shadow-primary transition-all"
                >
                  {t('profile.sendMessage')}
                </button>
              )}
            </div>
          ) : (
            <p className="text-red-400">{t('errors.couldNotLoadProfile')}</p>
          )}
        </div>
      </div>
    </div>
  );
}
