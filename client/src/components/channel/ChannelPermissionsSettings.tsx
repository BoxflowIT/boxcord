/**
 * ChannelPermissionsSettings Component
 * UI for managing permissions for different roles in a channel
 */

import { useEffect, useState } from 'react';
import {
  useChannelPermissions,
  useSetPermissions,
  useResetPermissions,
  type MemberRole,
  type ChannelPermissions
} from '../../hooks/usePermissions';
import { logger } from '../../utils/logger';
import { Shield, RotateCcw, Save, X } from 'lucide-react';

interface ChannelPermissionsSettingsProps {
  channelId: string;
  onClose: () => void;
}

const PERMISSION_LABELS: Record<keyof ChannelPermissions, string> = {
  canViewChannel: 'View Channel',
  canSendMessages: 'Send Messages',
  canAddReactions: 'Add Reactions',
  canAttachFiles: 'Attach Files',
  canEmbed: 'Embed Links',
  canMentionEveryone: 'Mention @everyone',
  canManageMessages: 'Manage Messages',
  canManageChannel: 'Manage Channel',
  canManageMembers: 'Manage Members'
};

const PERMISSION_DESCRIPTIONS: Record<keyof ChannelPermissions, string> = {
  canViewChannel: 'Can see this channel and read messages',
  canSendMessages: 'Can send messages in this channel',
  canAddReactions: 'Can add emoji reactions to messages',
  canAttachFiles: 'Can upload and share files',
  canEmbed: 'Show rich media previews for links',
  canMentionEveryone: 'Can mention @everyone in messages',
  canManageMessages: 'Can pin and delete messages from others',
  canManageChannel: 'Can edit channel settings',
  canManageMembers: 'Can add/remove members from channel'
};

const ROLES: MemberRole[] = ['OWNER', 'ADMIN', 'MEMBER'];

const ROLE_LABELS: Record<MemberRole, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  MEMBER: 'Member'
};

export default function ChannelPermissionsSettings({
  channelId,
  onClose
}: ChannelPermissionsSettingsProps) {
  const { data: permissions, isLoading } = useChannelPermissions(channelId);
  const setPermissions = useSetPermissions();
  const resetPermissions = useResetPermissions();

  const [selectedRole, setSelectedRole] = useState<MemberRole>('MEMBER');
  const [editedPermissions, setEditedPermissions] =
    useState<ChannelPermissions | null>(null);

  useEffect(() => {
    if (permissions && !editedPermissions) {
      setEditedPermissions(permissions[selectedRole]);
    }
  }, [permissions, selectedRole, editedPermissions]);

  const handlePermissionToggle = (permission: keyof ChannelPermissions) => {
    if (!editedPermissions) return;

    setEditedPermissions({
      ...editedPermissions,
      [permission]: !editedPermissions[permission]
    });
  };

  const handleSave = async () => {
    if (!editedPermissions) return;

    try {
      await setPermissions.mutateAsync({
        channelId,
        role: selectedRole,
        permissions: editedPermissions
      });
      logger.info(`Saved permissions for role ${selectedRole}`);
    } catch (error) {
      logger.error('Failed to save permissions:', error);
    }
  };

  const handleReset = async () => {
    try {
      await resetPermissions.mutateAsync({
        channelId,
        role: selectedRole
      });
      setEditedPermissions(null);
      logger.info(`Reset permissions for role ${selectedRole} to defaults`);
    } catch (error) {
      logger.error('Failed to reset permissions:', error);
    }
  };

  const handleRoleChange = (role: MemberRole) => {
    setSelectedRole(role);
    setEditedPermissions(permissions?.[role] || null);
  };

  if (isLoading || !permissions || !editedPermissions) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-boxcord-primary rounded-lg p-6 max-w-3xl w-full mx-4">
          <div className="text-center py-8">Loading permissions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-boxcord-primary rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-accent-blue" />
            <h2 className="text-xl font-semibold text-text-primary">
              Channel Permissions
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-boxcord-tertiary rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Role Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Select Role
          </label>
          <div className="flex gap-2">
            {ROLES.map((role) => (
              <button
                key={role}
                onClick={() => handleRoleChange(role)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedRole === role
                    ? 'bg-accent-blue text-white'
                    : 'bg-boxcord-secondary text-text-secondary hover:bg-boxcord-tertiary'
                }`}
              >
                {ROLE_LABELS[role]}
              </button>
            ))}
          </div>
        </div>

        {/* Permissions List */}
        <div className="space-y-4 mb-6">
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
            Permissions for {ROLE_LABELS[selectedRole]}
          </h3>

          {(
            Object.keys(PERMISSION_LABELS) as Array<keyof ChannelPermissions>
          ).map((permission) => (
            <div
              key={permission}
              className="flex items-center justify-between p-4 bg-boxcord-secondary rounded-lg hover:bg-boxcord-tertiary transition-colors"
            >
              <div className="flex-1">
                <div className="font-medium text-text-primary">
                  {PERMISSION_LABELS[permission]}
                </div>
                <div className="text-sm text-text-tertiary">
                  {PERMISSION_DESCRIPTIONS[permission]}
                </div>
              </div>
              <button
                onClick={() => handlePermissionToggle(permission)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  editedPermissions[permission]
                    ? 'bg-accent-green'
                    : 'bg-boxcord-tertiary'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    editedPermissions[permission]
                      ? 'translate-x-6'
                      : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={setPermissions.isPending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-accent-blue text-white rounded-lg hover:bg-accent-blue/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            {setPermissions.isPending ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={handleReset}
            disabled={resetPermissions.isPending}
            className="px-4 py-2 bg-boxcord-secondary text-text-secondary rounded-lg hover:bg-boxcord-tertiary transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Default
          </button>
        </div>
      </div>
    </div>
  );
}
