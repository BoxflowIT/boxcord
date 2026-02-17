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
import { signOut } from '../services/cognito';
import { useWorkspaces, useChannels } from '../hooks/useQuery';
import { useWorkspaceOperations } from '../hooks/useWorkspaceOperations';
import { useChannelOperations } from '../hooks/useChannelOperations';
import { useModalWithData } from '../hooks/useModalState';
import DeleteConfirmModal from './DeleteConfirmModal';
import EditModal from './EditModal';
import CreateModal from './CreateModal';
import DMList from './DMList';
import WorkspaceSidebar from './sidebar/WorkspaceSidebar';
import ChannelSection from './sidebar/ChannelSection';
import UserBar from './sidebar/UserBar';
import type { Workspace, Channel } from '../types';

interface SidebarProps {
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
}

export default function Sidebar({
  onProfileClick,
  onSettingsClick
}: SidebarProps) {
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

  const { user, logout } = useAuthStore();

  // Modal state
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [showNewWorkspace, setShowNewWorkspace] = useState(false);

  const editChannelModal = useModalWithData<{
    id: string;
    name: string;
    description: string;
  }>();
  const editWorkspaceModal = useModalWithData<{
    id: string;
    name: string;
    description: string;
    iconUrl: string;
  }>();
  const deleteChannelModal = useModalWithData<{ id: string; name: string }>();
  const deleteWorkspaceModal = useModalWithData<{ id: string; name: string }>();

  // Handlers (declared before operations hooks)
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

  // Operations
  const workspaceOps = useWorkspaceOperations({
    workspaces,
    currentWorkspace,
    onWorkspaceSelect: handleWorkspaceSelect
  });

  const channelOps = useChannelOperations({
    channels,
    currentWorkspaceId: currentWorkspace?.id,
    currentChannel,
    onChannelSelect: handleChannelSelect
  });

  const handleCreateWorkspace = async (name: string) => {
    try {
      await workspaceOps.createWorkspace(name);
      setShowNewWorkspace(false);
    } catch {
      // Error already logged in hook
    }
  };

  const handleCreateChannel = async (name: string) => {
    try {
      await channelOps.createChannel(name);
      setShowNewChannel(false);
    } catch {
      // Error already logged in hook
    }
  };

  const handleDeleteChannel = (
    channel: Channel | null,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (channel) {
      deleteChannelModal.open({ id: channel.id, name: channel.name });
    }
  };

  const handleDeleteConfirmChannel = async () => {
    if (!deleteChannelModal.data) return;

    try {
      await channelOps.deleteChannel(deleteChannelModal.data.id);
      deleteChannelModal.close();
    } catch {
      // Error already logged in hook
    }
  };

  const handleDeleteWorkspace = (
    workspace: Workspace | null,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (workspace) {
      deleteWorkspaceModal.open({ id: workspace.id, name: workspace.name });
    }
  };

  const handleDeleteConfirmWorkspace = async () => {
    if (!deleteWorkspaceModal.data) return;

    try {
      await workspaceOps.deleteWorkspace(deleteWorkspaceModal.data.id);
      deleteWorkspaceModal.close();
    } catch {
      // Error already logged in hook
    }
  };

  const handleEditChannel = (channel: Channel | null, e: React.MouseEvent) => {
    e.stopPropagation();
    if (channel) {
      editChannelModal.open({
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
    if (!editChannelModal.data) return;
    try {
      await channelOps.updateChannel(editChannelModal.data.id, data);
      editChannelModal.close();
    } catch {
      // Error already logged in hook
    }
  };

  const handleEditWorkspace = (
    workspace: Workspace | null,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (workspace) {
      editWorkspaceModal.open({
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
    if (!editWorkspaceModal.data) return;
    try {
      await workspaceOps.updateWorkspace(editWorkspaceModal.data.id, data);
      editWorkspaceModal.close();
    } catch {
      // Error already logged in hook
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
        <WorkspaceSidebar
          workspaces={workspaces}
          currentWorkspaceId={currentWorkspace?.id}
          onWorkspaceSelect={handleWorkspaceSelect}
          onEditWorkspace={handleEditWorkspace}
          onDeleteWorkspace={handleDeleteWorkspace}
          onCreateWorkspace={() => setShowNewWorkspace(true)}
          onSettingsClick={onSettingsClick}
        />

        {/* Channel list */}
        <div className="sidebar-main">
          {/* Workspace header */}
          <div className="panel-header">
            <h2 className="text-heading truncate">
              {currentWorkspace?.name ?? 'Välj workspace'}
            </h2>
          </div>

          {/* Channels */}
          <div className="panel-content flex-1 min-h-0 overflow-y-auto">
            {currentWorkspace && (
              <ChannelSection
                channels={channels}
                currentChannelId={currentChannel?.id}
                onChannelSelect={handleChannelSelect}
                onEditChannel={handleEditChannel}
                onDeleteChannel={handleDeleteChannel}
                onCreateChannel={() => setShowNewChannel(true)}
              />
            )}
          </div>

          {/* Direct Messages */}
          <DMList
            onSelectDM={(channelId, _otherUser) => {
              navigate(`/chat/dm/${channelId}`);
            }}
          />

          {/* User info */}
          <UserBar
            user={user}
            onProfileClick={onProfileClick}
            onLogout={handleLogout}
          />
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
        isOpen={editChannelModal.isOpen}
        title="Redigera kanal"
        name={editChannelModal.data?.name || ''}
        description={editChannelModal.data?.description || ''}
        onSave={handleSaveChannel}
        onCancel={editChannelModal.close}
      />

      <EditModal
        isOpen={editWorkspaceModal.isOpen}
        title="Redigera server"
        name={editWorkspaceModal.data?.name || ''}
        description={editWorkspaceModal.data?.description || ''}
        iconUrl={editWorkspaceModal.data?.iconUrl || ''}
        showIcon
        onSave={handleSaveWorkspace}
        onCancel={editWorkspaceModal.close}
      />

      <DeleteConfirmModal
        isOpen={deleteChannelModal.isOpen}
        title="Ta bort kanal"
        message={
          <>
            Är du säker på att du vill ta bort{' '}
            <strong>{deleteChannelModal.data?.name}</strong>?
          </>
        }
        onConfirm={handleDeleteConfirmChannel}
        onCancel={deleteChannelModal.close}
      />

      <DeleteConfirmModal
        isOpen={deleteWorkspaceModal.isOpen}
        title="Ta bort server"
        message={
          <>
            Är du säker på att du vill ta bort{' '}
            <strong>{deleteWorkspaceModal.data?.name}</strong>? Alla kanaler och
            meddelanden kommer att raderas.
          </>
        }
        onConfirm={handleDeleteConfirmWorkspace}
        onCancel={deleteWorkspaceModal.close}
      />
    </>
  );
}
