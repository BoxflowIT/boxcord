// User Profile Modal Component
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
import NotificationSettings from './NotificationSettings';

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    bio: ''
  });

  const isOwnProfile = !userId || userId === currentUser?.id;
  const profile = isOwnProfile ? currentUserData : otherUserData;
  const loading = isOwnProfile ? loadingCurrent : loadingOther;

  useEffect(() => {
    if (!isOpen || !profile) return;

    setFormData({
      firstName: profile.firstName ?? '',
      lastName: profile.lastName ?? '',
      bio: profile.bio ?? ''
    });
  }, [isOpen, profile]);

  const handleSave = () => {
    updateProfile(formData, {
      onSuccess: () => {
        setEditing(false);
        // Cache updated automatically via invalidation
      },
      onError: (err) => {
        logger.error('Failed to save profile:', err);
      }
    });
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.deleteAccount();
      // Sign out from Cognito
      signOut();
      // Clear local auth state
      logout();
      navigate('/login');
    } catch (err) {
      logger.error('Failed to delete account:', err);
    } finally {
      setDeleting(false);
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
        className="bg-discord-dark rounded-lg w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header/Banner */}
        <div className="h-24 bg-discord-blurple" />

        {/* Profile content */}
        <div className="px-4 pb-4">
          {/* Avatar */}
          <div className="relative -mt-12 mb-4">
            <div className="profile-avatar-large">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt=""
                  className="w-full h-full rounded-full"
                />
              ) : (
                (profile?.firstName?.charAt(0) ??
                profile?.email?.charAt(0) ??
                '?')
              )}
            </div>
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
                <span className="inline-block mt-1 px-2 py-0.5 bg-discord-blurple/30 text-discord-blurple text-xs rounded">
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
                <div className="pt-4 border-t border-discord-darkest">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">
                    Rollhantering
                  </h3>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-400 mb-2">
                      Nuvarande roll:{' '}
                      <span className="text-white font-semibold">
                        {profile.role}
                      </span>
                    </p>
                    <div className="flex gap-2">
                      {profile.role !== 'STAFF' && (
                        <button
                          onClick={() => handleChangeRole('STAFF')}
                          disabled={changingRole}
                          className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded disabled:opacity-50"
                        >
                          Gör till Staff
                        </button>
                      )}
                      {profile.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleChangeRole('ADMIN')}
                          disabled={changingRole}
                          className="flex-1 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded disabled:opacity-50"
                        >
                          Gör till Admin
                        </button>
                      )}
                      {profile.role !== 'SUPER_ADMIN' && (
                        <button
                          onClick={() => handleChangeRole('SUPER_ADMIN')}
                          disabled={changingRole}
                          className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded disabled:opacity-50"
                        >
                          Gör till Super Admin
                        </button>
                      )}
                    </div>
                    {changingRole && (
                      <p className="text-xs text-gray-400 italic">
                        Ändrar roll...
                      </p>
                    )}
                  </div>
                </div>
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
                          className="flex-1 px-4 py-2 bg-discord-blurple hover:bg-discord-blurple/80 text-white rounded disabled:opacity-50"
                        >
                          {saving ? 'Sparar...' : 'Spara'}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setEditing(true)}
                        className="flex-1 px-4 py-2 bg-discord-blurple hover:bg-discord-blurple/80 text-white rounded"
                      >
                        Redigera profil
                      </button>
                    )}
                  </div>

                  {/* Delete Account */}
                  {!editing && (
                    <div className="pt-4 border-t border-discord-darkest">
                      {showDeleteConfirm ? (
                        <div className="space-y-2">
                          <p className="text-red-400 text-sm">
                            Är du säker? Detta kan inte ångras.
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setShowDeleteConfirm(false)}
                              className="flex-1 px-4 py-2 bg-discord-darker hover:bg-discord-darkest text-white rounded"
                            >
                              Avbryt
                            </button>
                            <button
                              onClick={handleDelete}
                              disabled={deleting}
                              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded disabled:opacity-50"
                            >
                              {deleting ? 'Raderar...' : 'Radera konto'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="w-full px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                        >
                          Radera mitt konto
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {!isOwnProfile && (
                <button
                  onClick={() => {
                    /* Start DM */
                  }}
                  className="w-full px-4 py-2 bg-discord-blurple hover:bg-discord-blurple/80 text-white rounded"
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
