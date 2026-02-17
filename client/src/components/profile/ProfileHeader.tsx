// Reusable Profile Header Component with Avatar
import React from 'react';
import Avatar from '../ui/Avatar';
import { RoleBadge, type UserRole } from './RoleBadge';
import { EditIcon, TrashIcon } from '../ui/Icons';

interface ProfileHeaderProps {
  avatarUrl?: string | null;
  firstName?: string;
  lastName?: string;
  email: string;
  role?: UserRole;
  isEditing?: boolean;
  isOwnProfile?: boolean;
  onEdit?: () => void;
  onRemoveAvatar?: () => void;
  onUploadAvatar?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadingAvatar?: boolean;
}

export function ProfileHeader({
  avatarUrl,
  firstName,
  lastName,
  email,
  role,
  isEditing = false,
  isOwnProfile = false,
  onEdit,
  onRemoveAvatar,
  onUploadAvatar,
  uploadingAvatar = false
}: ProfileHeaderProps) {
  const displayName =
    firstName && lastName ? `${firstName} ${lastName}` : firstName || email;
  const initial = firstName?.charAt(0) || email.charAt(0);

  return (
    <div className="flex-col-centered p-6 bg-boxflow-darker border-b border-boxflow-border">
      {/* Avatar with edit overlay */}
      <div className="relative group mb-4">
        <Avatar size="xl" src={avatarUrl || undefined} alt={displayName}>
          {initial.toUpperCase()}
        </Avatar>

        {isEditing && isOwnProfile && (
          <div className="absolute inset-0 flex-col-centered bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
            <label className="cursor-pointer p-2 hover:bg-white/10 rounded-full transition-colors">
              <EditIcon />
              <input
                type="file"
                accept="image/*"
                onChange={onUploadAvatar}
                className="hidden"
                disabled={uploadingAvatar}
              />
            </label>
            {avatarUrl && onRemoveAvatar && (
              <button
                onClick={onRemoveAvatar}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-red-400"
                disabled={uploadingAvatar}
              >
                <TrashIcon size="sm" />
              </button>
            )}
          </div>
        )}

        {uploadingAvatar && (
          <div className="absolute inset-0 flex-col-centered bg-black/60 rounded-full">
            <div className="animate-spin h-8 w-8 border-4 border-boxflow-primary border-t-transparent rounded-full" />
          </div>
        )}
      </div>

      {/* Name and role */}
      <h2 className="text-2xl font-bold text-boxflow-light mb-1">
        {displayName}
      </h2>
      <p className="text-boxflow-muted text-sm mb-2">{email}</p>
      {role && <RoleBadge role={role} size="md" />}
    </div>
  );
}
