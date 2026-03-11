/**
 * Account Settings Tab
 * Manage account details, password, and account deletion
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/auth';
import { useUpdateProfile } from '../../hooks/useQuery';
import { useImageUpload } from '../../hooks/useImageUpload';
import { api } from '../../services/api';
import { logger } from '../../utils/logger';
import { toast } from '../../store/notification';
import Avatar from '../ui/Avatar';
import { CustomStatusModal } from '../profile/CustomStatusModal';

interface UserWithStatus {
  status?: string;
  statusEmoji?: string;
}

export default function AccountTab() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { mutate: updateProfile, isPending: saving } = useUpdateProfile();
  const { uploading, handleFileInput } = useImageUpload({ maxSizeMB: 5 });
  const [isEditing, setIsEditing] = useState(false);
  const [showCustomStatus, setShowCustomStatus] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    bio: user?.bio || '',
    avatarUrl: user?.avatarUrl || ''
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState('');
  const [deleteError, setDeleteError] = useState('');

  if (!user) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = await handleFileInput(e);
    if (url) {
      setFormData({ ...formData, avatarUrl: url });
    }
  };

  const handleRemoveAvatar = () => {
    setFormData({ ...formData, avatarUrl: '' });
  };

  const handleSaveProfile = () => {
    updateProfile(
      { ...formData },
      {
        onSuccess: () => {
          toast.success('Profile updated successfully');
          setIsEditing(false);
        },
        onError: (error) => {
          logger.error('Failed to update profile:', error);
          toast.error('Failed to update profile');
        }
      }
    );
  };

  const handleCancelEdit = () => {
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      bio: user.bio || '',
      avatarUrl: user.avatarUrl || ''
    });
    setIsEditing(false);
  };

  const handleSaveCustomStatus = async (
    status: string,
    emoji: string,
    dndUntil?: Date
  ) => {
    try {
      await api.updateCustomStatus(status, emoji);

      if (dndUntil) {
        await api.updateDNDMode(true, dndUntil.toISOString());
      } else {
        await api.updateDNDMode(false, undefined);
      }

      toast.success('Status updated successfully');
      setShowCustomStatus(false);
    } catch (err) {
      logger.error('Failed to update status:', err);
      toast.error('Failed to update status');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteEmail !== user.email) {
      setDeleteError('Email does not match');
      return;
    }

    try {
      await api.deleteAccount();
      // Logout will be handled by API response
      window.location.href = '/';
    } catch (error) {
      logger.error('Failed to delete account:', error);
      setDeleteError('Failed to delete account. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* User Profile Section */}
      <div className="bg-boxflow-darkest p-5 rounded-lg border border-boxflow-hover">
        <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">
          👤 {t('settings.userProfile')}
        </h3>

        {!isEditing ? (
          <>
            <div className="flex items-center gap-4">
              <Avatar
                size="lg"
                src={user.avatarUrl || undefined}
                alt={user.firstName || user.email}
              >
                {(
                  user.firstName?.charAt(0) || user.email.charAt(0)
                ).toUpperCase()}
              </Avatar>

              <div className="flex-1">
                <h4 className="text-white font-medium text-lg">
                  {user.firstName || user.lastName
                    ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                    : 'No name set'}
                </h4>
                <p className="text-gray-400 text-sm">{user.email}</p>
                {user.bio && (
                  <p className="text-gray-500 text-sm mt-1">{user.bio}</p>
                )}
                {((user as UserWithStatus).status ||
                  (user as UserWithStatus).statusEmoji) && (
                  <p className="text-gray-400 text-sm mt-1">
                    {(user as UserWithStatus).statusEmoji}{' '}
                    {(user as UserWithStatus).status}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 px-4 py-2 bg-boxflow-hover text-white rounded-lg hover:bg-boxflow-hover-bright transition-colors"
              >
                ✏️ {t('settings.editProfile')}
              </button>
              <button
                onClick={() => setShowCustomStatus(true)}
                className="flex-1 px-4 py-2 bg-boxflow-hover text-white rounded-lg hover:bg-boxflow-hover-bright transition-colors"
              >
                😀 Set Status
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center">
              <div className="relative group">
                <Avatar
                  size="xl"
                  src={formData.avatarUrl || undefined}
                  alt={formData.firstName || user.email}
                >
                  {(
                    formData.firstName?.charAt(0) || user.email.charAt(0)
                  ).toUpperCase()}
                </Avatar>

                {/* Upload overlay */}
                <label
                  htmlFor="avatar-upload-settings"
                  className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer rounded-full"
                >
                  <svg
                    className="w-8 h-8 mb-1 text-white"
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
                  <span className="text-xs font-bold text-white">
                    {uploading ? 'Uploading...' : 'Change Avatar'}
                  </span>
                </label>
                <input
                  type="file"
                  id="avatar-upload-settings"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />

                {/* Remove button */}
                {formData.avatarUrl && (
                  <button
                    onClick={handleRemoveAvatar}
                    className="absolute top-0 right-0 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                    title="Remove avatar"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Name Fields */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  className="w-full bg-boxflow-dark text-white px-3 py-2 rounded-lg border border-boxflow-hover focus:border-boxflow-accent focus:outline-none"
                  placeholder="Your first name"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  className="w-full bg-boxflow-dark text-white px-3 py-2 rounded-lg border border-boxflow-hover focus:border-boxflow-accent focus:outline-none"
                  placeholder="Your last name"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  className="w-full bg-boxflow-dark text-white px-3 py-2 rounded-lg border border-boxflow-hover focus:border-boxflow-accent focus:outline-none resize-none"
                  rows={3}
                  placeholder="Tell us about yourself..."
                  maxLength={500}
                />
                <p className="text-xs text-gray-400 mt-1">
                  {formData.bio.length}/500 characters
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCancelEdit}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-boxflow-darkest text-white rounded-lg hover:bg-boxflow-hover transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-boxflow-accent text-white rounded-lg hover:bg-boxflow-accent-hover transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Account Information */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">
          📧 {t('settings.accountInfo')}
        </h3>

        <div className="space-y-3">
          <div className="p-4 bg-boxflow-darkest rounded-lg border border-boxflow-hover">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p className="text-white">{user.email}</p>
              </div>
              <span className="text-xs text-green-400">✓ Verified</span>
            </div>
          </div>

          <div className="p-4 bg-boxflow-darkest rounded-lg border border-boxflow-hover">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-400">User ID</p>
                <p className="text-white font-mono text-sm">
                  {user.id.slice(0, 8)}...
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-boxflow-darkest rounded-lg border border-boxflow-hover">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-400">Member Since</p>
                <p className="text-white">Unknown</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">
          🔒 {t('settings.security')}
        </h3>

        <div className="p-4 bg-boxflow-darkest rounded-lg border border-boxflow-hover">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-white font-medium">Password</p>
              <p className="text-xs text-gray-400 mt-1">
                Last changed: Never (Managed by Cognito)
              </p>
            </div>
            <button
              className="px-3 py-2 bg-boxflow-hover text-white rounded-lg hover:bg-boxflow-hover-bright transition-colors text-sm"
              onClick={() => {
                const api = (
                  window as {
                    electronAPI?: { openExternal: (url: string) => void };
                  }
                ).electronAPI;
                const url =
                  'https://cognito-idp.eu-north-1.amazonaws.com/change-password';
                if (api) {
                  api.openExternal(url);
                } else {
                  window.open(url, '_blank');
                }
              }}
            >
              Change
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-2">
          💡 Password is managed through AWS Cognito for security
        </p>
      </div>

      {/* Data & Privacy */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">
          📊 {t('settings.dataPrivacy')}
        </h3>

        <div className="space-y-2">
          <button
            className="w-full p-4 bg-boxflow-darkest rounded-lg border border-boxflow-hover hover:bg-boxflow-hover/50 transition-colors text-left"
            onClick={() => {
              /* Download data */
            }}
          >
            <p className="text-white font-medium">📥 Download My Data</p>
            <p className="text-xs text-gray-400 mt-1">
              Export all your messages, files, and account data
            </p>
          </button>

          <button
            className="w-full p-4 bg-boxflow-darkest rounded-lg border border-boxflow-hover hover:bg-boxflow-hover/50 transition-colors text-left"
            disabled
            title="Coming Soon"
          >
            <p className="text-white font-medium">🔐 Privacy Settings</p>
            <p className="text-xs text-gray-400 mt-1">
              Control who can see your information (Coming Soon)
            </p>
          </button>
        </div>
      </div>

      {/* Danger Zone - Delete Account */}
      <div className="border-t border-red-900/50 pt-6">
        <h3 className="text-sm font-semibold text-red-400 uppercase mb-3">
          ⚠️ Danger Zone
        </h3>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full p-4 bg-red-900/20 border-2 border-red-500/50 rounded-lg hover:bg-red-900/30 transition-colors text-left"
          >
            <p className="text-red-400 font-medium">🗑️ Delete Account</p>
            <p className="text-xs text-gray-400 mt-1">
              Permanently delete your account and all associated data
            </p>
          </button>
        ) : (
          <div className="bg-red-900/20 border-2 border-red-500 rounded-lg p-4">
            <h4 className="text-red-400 font-bold mb-2">
              ⚠️ Are you absolutely sure?
            </h4>
            <p className="text-sm text-gray-300 mb-4">
              This action <strong>cannot be undone</strong>. This will
              permanently delete your account, messages, uploaded files, and
              remove you from all workspaces.
            </p>

            <label className="block text-sm text-gray-300 mb-2">
              Type your email <strong>{user.email}</strong> to confirm:
            </label>
            <input
              type="email"
              value={deleteEmail}
              onChange={(e) => setDeleteEmail(e.target.value)}
              placeholder={user.email}
              className="w-full bg-boxflow-darkest text-white px-3 py-2 rounded-lg border border-boxflow-hover focus:border-red-500 focus:outline-none mb-3"
            />

            {deleteError && (
              <p className="text-red-400 text-sm mb-3">⚠️ {deleteError}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteEmail('');
                  setDeleteError('');
                }}
                className="flex-1 px-4 py-2 bg-boxflow-darkest text-white rounded-lg hover:bg-boxflow-hover transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteEmail !== user.email}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-boxflow-dark-lighter p-4 rounded-lg border border-boxflow-hover-50">
        <h3 className="text-sm font-medium text-white mb-2">
          ℹ️ Account Information
        </h3>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• Account data is synchronized with Boxtime</li>
          <li>• Email changes must be done through Cognito</li>
          <li>• Deleted accounts cannot be recovered</li>
          <li>• Contact support for account recovery assistance</li>
        </ul>
      </div>

      {/* Custom Status Modal */}
      {showCustomStatus && (
        <CustomStatusModal
          currentStatus={(user as UserWithStatus).status ?? ''}
          currentEmoji={(user as UserWithStatus).statusEmoji ?? '😀'}
          onSave={handleSaveCustomStatus}
          onClose={() => setShowCustomStatus(false)}
        />
      )}
    </div>
  );
}
