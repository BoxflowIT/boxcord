// ============================================================================
// SIDEBAR COMPONENT - Uses React Query for server data
// ============================================================================
// Server data (workspaces, channels) comes from React Query
// UI state (currentWorkspace, currentChannel) stored in Zustand
// ============================================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../store/chat';
import { useAuthStore } from '../store/auth';
import { api } from '../services/api';
import { signOut } from '../services/cognito';
import { logger } from '../utils/logger';
import {
  useWorkspaces,
  useChannels,
  useCreateWorkspace,
  useCreateChannel,
  useDeleteWorkspace,
  useDeleteChannel
} from '../hooks/useQuery';
import DeleteConfirmModal from './DeleteConfirmModal';
import EditModal from './EditModal';
import CreateModal from './CreateModal';
import Avatar from './ui/Avatar';
import { PlusIcon, EditIcon, CloseIcon, LogoutIcon } from './ui/Icons';
import type { Workspace, Channel } from '../types';

interface SidebarProps {
  onProfileClick?: () => void;
}

export default function Sidebar({ onProfileClick }: SidebarProps) {
  const navigate = useNavigate();

  // UI State from Zustand
  const {
    currentWorkspace,
    setCurrentWorkspace,
    currentChannel,
    setCurrentChannel
  } = useChatStore();

  // Server Data from React Query
  const { data: workspaces = [] } = useWorkspaces();
  const { data: channels = [] } = useChannels(currentWorkspace?.id);

  // Mutations
  const createWorkspaceMutation = useCreateWorkspace();
  const createChannelMutation = useCreateChannel();
  const deleteWorkspaceMutation = useDeleteWorkspace();
  const deleteChannelMutation = useDeleteChannel();

  const { user, logout } = useAuthStore();
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [showNewWorkspace, setShowNewWorkspace] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Edit state
  const [editingChannel, setEditingChannel] = useState<{
    id: string;
    name: string;
    description: string;
  } | null>(null);
  const [editingWorkspace, setEditingWorkspace] = useState<{
    id: string;
    name: string;
    description: string;
    iconUrl: string;
  } | null>(null);

  // Delete state
  const [deleteChannel, setDeleteChannel] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleteWorkspace, setDeleteWorkspace] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const handleWorkspaceSelect = (workspace: Workspace | null) => {
    setCurrentWorkspace(workspace);
    // Channels loaded automatically by useChannels() hook
  };

  const handleChannelSelect = (channel: Channel | null) => {
    setCurrentChannel(channel);
    if (channel) {
      navigate(`/chat/channels/${channel.id}`);
    }
  };

  const handleCreateWorkspace = async (name: string) => {
    if (isCreating) return;

    setIsCreating(true);
    try {
      const workspace = await createWorkspaceMutation.mutateAsync({ name });
      setShowNewWorkspace(false);
      handleWorkspaceSelect(workspace); // Switch to new workspace
    } catch (err) {
      logger.error('Failed to create workspace:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateChannel = async (name: string) => {
    if (!currentWorkspace || isCreating) return;

    setIsCreating(true);
    try {
      const channel = await createChannelMutation.mutateAsync({
        workspaceId: currentWorkspace.id,
        name
      });
      setShowNewChannel(false);
      handleChannelSelect(channel);
    } catch (err) {
      logger.error('Failed to create channel:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteChannel = (
    channel: Channel | null,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (channel) {
      setDeleteChannel({ id: channel.id, name: channel.name });
    }
  };

  const handleDeleteConfirmChannel = async () => {
    if (!deleteChannel) return;

    try {
      await deleteChannelMutation.mutateAsync(deleteChannel.id);
      setDeleteChannel(null);

      // Navigate away if current channel was deleted
      if (currentChannel?.id === deleteChannel.id) {
        const remaining = channels.filter((c) => c.id !== deleteChannel.id);
        if (remaining.length > 0) {
          handleChannelSelect(remaining[0]);
        } else {
          navigate('/chat');
        }
      }
    } catch (err) {
      logger.error('Failed to delete channel:', err);
    }
  };

  const handleDeleteWorkspace = (
    workspace: Workspace | null,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (workspace) {
      setDeleteWorkspace({ id: workspace.id, name: workspace.name });
    }
  };

  const handleDeleteConfirmWorkspace = async () => {
    if (!deleteWorkspace) return;

    try {
      await deleteWorkspaceMutation.mutateAsync(deleteWorkspace.id);
      setDeleteWorkspace(null);

      // Navigate away if current workspace was deleted
      if (currentWorkspace?.id === deleteWorkspace.id) {
        const remaining = workspaces.filter((w) => w.id !== deleteWorkspace.id);
        if (remaining.length > 0) {
          handleWorkspaceSelect(remaining[0]);
        } else {
          navigate('/chat');
        }
      }
    } catch (err) {
      logger.error('Failed to delete workspace:', err);
    }
  };

  const handleEditChannel = (channel: Channel | null, e: React.MouseEvent) => {
    e.stopPropagation();
    if (channel) {
      setEditingChannel({
        id: channel.id,
        name: channel.name,
        description: channel.description || ''
      });
    }
  };

  const handleSaveChannel = async (data: {
    name: string;
    description: string;
  }) => {
    if (!editingChannel) return;
    try {
      await api.updateChannel(editingChannel.id, data);
      // React Query will update cache via invalidation
      setEditingChannel(null);
    } catch (err) {
      logger.error('Failed to update channel:', err);
    }
  };

  const handleEditWorkspace = (
    workspace: Workspace | null,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (workspace) {
      setEditingWorkspace({
        id: workspace.id,
        name: workspace.name,
        description: workspace.description || '',
        iconUrl: workspace.iconUrl || ''
      });
    }
  };

  const handleSaveWorkspace = async (data: {
    name: string;
    description: string;
    iconUrl?: string;
  }) => {
    if (!editingWorkspace) return;
    try {
      await api.updateWorkspace(editingWorkspace.id, data);
      // React Query will update cache via invalidation
      setEditingWorkspace(null);
    } catch (err) {
      logger.error('Failed to update workspace:', err);
    }
  };

  const handleLogout = () => {
    // Sign out from Cognito
    signOut();
    // Clear local auth state
    logout();
    navigate('/login');
  };

  return (
    <>
      <div className="flex h-full">
        {/* Workspace list */}
        <div className="sidebar-icon">
          {workspaces.map((workspace) => (
            <div key={workspace.id} className="relative group">
              <button
                onClick={() => handleWorkspaceSelect(workspace)}
                onDoubleClick={(e) => handleEditWorkspace(workspace, e)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  handleDeleteWorkspace(workspace, e);
                }}
                className={
                  currentWorkspace?.id === workspace.id
                    ? 'workspace-icon-active'
                    : 'workspace-icon-inactive'
                }
                title={`${workspace.name}\nDubbelklick: redigera\nHögerklick: ta bort`}
              >
                {workspace.iconUrl ? (
                  <img
                    src={workspace.iconUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  workspace.name.charAt(0).toUpperCase()
                )}
              </button>
            </div>
          ))}

          {/* Add workspace button */}
          <button
            onClick={() => setShowNewWorkspace(true)}
            className="workspace-icon-add"
            title="Lägg till workspace"
          >
            <PlusIcon size="lg" />
          </button>
        </div>

        {/* Channel list */}
        <div className="sidebar-main">
          {/* Workspace header */}
          <div className="panel-header">
            <h2 className="text-heading truncate">
              {currentWorkspace?.name ?? 'Välj workspace'}
            </h2>
          </div>

          {/* Channels */}
          <div className="panel-content">
            {currentWorkspace && (
              <>
                <div className="flex items-center justify-between px-2 mb-1">
                  <span className="text-subtle uppercase font-semibold">
                    Text Kanaler
                  </span>
                  <button
                    onClick={() => setShowNewChannel(true)}
                    className="btn-icon-primary"
                  >
                    <PlusIcon size="sm" />
                  </button>
                </div>

                {channels.map((channel) => (
                  <div
                    key={channel.id}
                    className={`group w-full flex items-center gap-2 px-2 py-1 rounded-lg text-sm transition-colors cursor-pointer ${
                      currentChannel?.id === channel.id
                        ? 'nav-item-active'
                        : 'nav-item-default'
                    }`}
                    onClick={() => handleChannelSelect(channel)}
                  >
                    <span className="text-lg">#</span>
                    <span className="truncate flex-1">{channel.name}</span>
                    <button
                      onClick={(e) => handleEditChannel(channel, e)}
                      className="btn-icon hover-group-visible"
                      title="Redigera kanal"
                    >
                      <EditIcon size="sm" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteChannel(channel, e)}
                      className="btn-icon-danger hover-group-visible"
                      title="Ta bort kanal"
                    >
                      <CloseIcon size="sm" />
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* User info */}
          <div className="user-bar">
            <button onClick={onProfileClick} className="user-bar-button">
              <Avatar size="sm">
                {user?.firstName?.charAt(0) ?? user?.email?.charAt(0) ?? '?'}
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-boxflow-light truncate">
                  {user?.firstName ?? user?.email}
                </p>
                <p className="text-subtle truncate">{user?.role}</p>
              </div>
            </button>
            <button
              onClick={handleLogout}
              className="btn-icon"
              title="Logga ut"
            >
              <LogoutIcon />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateModal
        isOpen={showNewWorkspace}
        title="Skapa server"
        placeholder="Server namn"
        createButtonText="Skapa"
        onCreate={handleCreateWorkspace}
        onCancel={() => setShowNewWorkspace(false)}
      />

      <CreateModal
        isOpen={showNewChannel}
        title="Skapa kanal"
        placeholder="kanal-namn"
        createButtonText="Skapa"
        onCreate={handleCreateChannel}
        onCancel={() => setShowNewChannel(false)}
      />

      <EditModal
        isOpen={!!editingChannel}
        title="Redigera kanal"
        name={editingChannel?.name || ''}
        description={editingChannel?.description || ''}
        onSave={handleSaveChannel}
        onCancel={() => setEditingChannel(null)}
      />

      <EditModal
        isOpen={!!editingWorkspace}
        title="Redigera server"
        name={editingWorkspace?.name || ''}
        description={editingWorkspace?.description || ''}
        iconUrl={editingWorkspace?.iconUrl || ''}
        showIcon
        onSave={handleSaveWorkspace}
        onCancel={() => setEditingWorkspace(null)}
      />

      <DeleteConfirmModal
        isOpen={!!deleteChannel}
        title="Ta bort kanal"
        message={
          <>
            Är du säker på att du vill ta bort{' '}
            <strong>{deleteChannel?.name}</strong>?
          </>
        }
        onConfirm={handleDeleteConfirmChannel}
        onCancel={() => setDeleteChannel(null)}
      />

      <DeleteConfirmModal
        isOpen={!!deleteWorkspace}
        title="Ta bort server"
        message={
          <>
            Är du säker på att du vill ta bort{' '}
            <strong>{deleteWorkspace?.name}</strong>? Alla kanaler och
            meddelanden kommer att raderas.
          </>
        }
        onConfirm={handleDeleteConfirmWorkspace}
        onCancel={() => setDeleteWorkspace(null)}
      />
    </>
  );
}
