import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useImageUpload } from '../hooks/useImageUpload';
import NotificationSettings from './NotificationSettings';
import { RoleManagement, AccountDeletion } from './profile';

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
  const { uploading: uploadingImage, handleFileInput } = useImageUpload({
    maxSizeMB: 5
  });
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const avatarUrl = await handleFileInput(e);
    if (avatarUrl) {
      setFormData({ ...formData, avatarUrl });
    }
  };

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
          alert('Kunde inte ändra roll. Kontrollera att du har behörighet.');
        }
        // Cache updated automatically via invalidation
      }
    );
  };

  if (!isOpen) return null;

  const statusColors: Record<string, string> = {
    ONLINE: 'bg-green-500',
    AWAY: 'bg-yellow-500',
    BUSY: 'bg-red-500',
    OFFLINE: 'bg-gray-500'
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-boxflow-dark rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-boxflow-hover/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header/Banner */}
        <div className="h-24 bg-boxflow-darker" />

        {/* Profile content */}
        <div className="px-4 pb-4">
          {/* Avatar */}
          <div className="relative -mt-12 mb-4 group">
            <div className="profile-avatar-large relative overflow-hidden">
              {editing ? (
                formData.avatarUrl ? (
                  <img
                    src={formData.avatarUrl}
                    alt=""
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  (profile?.firstName?.charAt(0) ??
                  profile?.email?.charAt(0) ??
                  '?')
                )
              ) : profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt=""
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                (profile?.firstName?.charAt(0) ??
                profile?.email?.charAt(0) ??
                '?')
              )}

              {/* Edit overlay - hover to show camera */}
              {editing && (
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer">
                  <label
                    htmlFor="avatar-upload"
                    className="cursor-pointer text-white text-center w-full h-full flex flex-col items-center justify-center"
                  >
                    <svg
                      className="w-12 h-12 mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span className="text-sm font-bold">
                      {uploadingImage
                        ? 'Laddar...'
                        : 'Klicka för att byta bild'}
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
            {editing && formData.avatarUrl && (
              <button
                onClick={handleRemoveImage}
                className="absolute top-0 right-0 flex items-center justify-center w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors z-10"
                title="Ta bort bild"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}

            {profile?.presence && (
              <div
                className={`absolute bottom-1 right-1 w-6 h-6 rounded-full border-4 border-discord-dark ${statusColors[profile.presence.status] ?? statusColors.OFFLINE}`}
              />
            )}
          </div>

          {loading ? (
            <div className="text-gray-400">Laddar...</div>
          ) : profile ? (
            <div className="space-y-4">
              {/* Name & Role */}
              <div>
                {editing ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      placeholder="Förnamn"
                      className="w-full px-3 py-2 bg-discord-darkest rounded text-white"
                    />
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      placeholder="Efternamn"
                      className="w-full px-3 py-2 bg-discord-darkest rounded text-white"
                    />
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-bold text-white">
                      {profile.firstName ?? ''} {profile.lastName ?? ''}
                    </h2>
                    <p className="text-gray-400">{profile.email}</p>
                  </>
                )}
                <span className="inline-block mt-1 px-2 py-0.5 bg-boxflow-primary/20 text-boxflow-primary text-xs rounded-lg">
                  {profile.role}
                </span>
              </div>

              {/* Custom status */}
              {profile.presence?.customStatus && (
                <p className="text-sm text-gray-400 italic">
                  "{profile.presence.customStatus}"
                </p>
              )}

              {/* Bio */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase mb-1">
                  Om mig
                </h3>
                {editing ? (
                  <textarea
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    placeholder="Skriv något om dig själv..."
                    className="w-full px-3 py-2 bg-discord-darkest rounded text-white resize-none"
                    rows={3}
                    maxLength={500}
                  />
                ) : (
                  <p className="text-gray-300">{profile.bio || 'Ingen bio'}</p>
                )}
              </div>

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

              {/* Notification Settings - Own profile only */}
              {isOwnProfile && (
                <div className="pt-4 border-t border-discord-darkest">
                  <NotificationSettings />
                </div>
              )}

              {/* Actions */}
              {isOwnProfile && (
                <div className="space-y-2 pt-2">
                  <div className="flex gap-2">
                    {editing ? (
                      <>
                        <button
                          onClick={() => setEditing(false)}
                          className="flex-1 px-4 py-2 bg-discord-darker hover:bg-discord-darkest text-white rounded"
                        >
                          Avbryt
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-[#5865f2] to-[#4752c4] hover:from-[#4752c4] hover:to-[#3c44a8] text-white rounded-lg shadow-lg shadow-[#5865f2]/25 disabled:opacity-50 transition-all"
                        >
                          {saving ? 'Sparar...' : 'Spara'}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setEditing(true)}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-[#5865f2] to-[#4752c4] hover:from-[#4752c4] hover:to-[#3c44a8] text-white rounded-lg shadow-lg shadow-[#5865f2]/25 transition-all"
                      >
                        Redigera profil
                      </button>
                    )}
                  </div>

                  {/* Delete Account */}
                  {!editing && <AccountDeletion onDelete={handleDelete} />}
                </div>
              )}

              {!isOwnProfile && (
                <button
                  onClick={() => {
                    /* Start DM */
                  }}
                  className="w-full px-4 py-2 bg-gradient-to-r from-[#5865f2] to-[#4752c4] hover:from-[#4752c4] hover:to-[#3c44a8] text-white rounded-lg shadow-lg shadow-[#5865f2]/25 transition-all"
                >
                  Skicka meddelande
                </button>
              )}
            </div>
          ) : (
            <p className="text-red-400">Kunde inte ladda profil</p>
          )}
        </div>
      </div>
    </div>
  );
}
