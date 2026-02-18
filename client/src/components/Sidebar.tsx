// ============================================================================
// SIDEBAR COMPONENT - Uses React Query for server data
// ============================================================================
// Server data (workspaces, channels) comes from React Query
// UI state (currentWorkspace, currentChannel) stored in Zustand
// ============================================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import InviteModal from './InviteModal';
import JoinServerModal from './JoinServerModal';
import DMList from './DMList';
import WorkspaceSidebar from './sidebar/WorkspaceSidebar';
import ChannelSection from './sidebar/ChannelSection';
import UserBar from './sidebar/UserBar';
import { UserPlusIcon } from './ui/Icons';
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
  const { t } = useTranslation();

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
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

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
  const leaveWorkspaceModal = useModalWithData<{ id: string; name: string }>();

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
    await workspaceOps.createWorkspace(name);
    setShowNewWorkspace(false);
  };

  const handleCreateChannel = async (
    name: string,
    type?: 'TEXT' | 'ANNOUNCEMENT' | 'VOICE'
  ) => {
    await channelOps.createChannel(name, type);
    setShowNewChannel(false);
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

  const handleLeaveWorkspace = (
    workspace: Workspace | null,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (workspace) {
      leaveWorkspaceModal.open({ id: workspace.id, name: workspace.name });
    }
  };

  const handleLeaveConfirmWorkspace = async () => {
    if (!leaveWorkspaceModal.data) return;

    try {
      await workspaceOps.leaveWorkspace(leaveWorkspaceModal.data.id);
      leaveWorkspaceModal.close();
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
          onLeaveWorkspace={handleLeaveWorkspace}
          onCreateWorkspace={() => setShowNewWorkspace(true)}
          onJoinServer={() => setShowJoinModal(true)}
          onSettingsClick={onSettingsClick}
        />

        {/* Channel list */}
        <div className="sidebar-main">
          {/* Workspace header with invite button */}
          <div className="panel-header flex items-center justify-between">
            <h2 className="text-heading truncate flex-1">
              {currentWorkspace?.name ?? t('workspace.title')}
            </h2>
            {currentWorkspace && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="p-1.5 hover:bg-boxflow-hover rounded transition-colors text-boxflow-muted hover:text-white"
                title={t('common.invite')}
              >
                <UserPlusIcon size="md" className="w-5 h-5" />
              </button>
            )}
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
        title={t('channels.createServer')}
        placeholder={t('channels.name')}
        createButtonText={t('common.create')}
        onCreate={handleCreateWorkspace}
        onCancel={() => setShowNewWorkspace(false)}
      />

      <CreateModal
        isOpen={showNewChannel}
        title={t('channels.create')}
        placeholder={t('channels.name')}
        createButtonText={t('common.create')}
        onCreate={handleCreateChannel}
        onCancel={() => setShowNewChannel(false)}
        showChannelType={true}
      />

      <EditModal
        isOpen={editChannelModal.isOpen}
        title={t('channels.edit')}
        name={editChannelModal.data?.name || ''}
        description={editChannelModal.data?.description || ''}
        onSave={handleSaveChannel}
        onCancel={editChannelModal.close}
      />

      <EditModal
        isOpen={editWorkspaceModal.isOpen}
        title={t('channels.editServer')}
        name={editWorkspaceModal.data?.name || ''}
        description={editWorkspaceModal.data?.description || ''}
        iconUrl={editWorkspaceModal.data?.iconUrl || ''}
        showIcon
        onSave={handleSaveWorkspace}
        onCancel={editWorkspaceModal.close}
      />

      <DeleteConfirmModal
        isOpen={deleteChannelModal.isOpen}
        title={t('channels.delete')}
        message={t('channels.deleteConfirmMessage', { 
          name: deleteChannelModal.data?.name || '' 
        })}
        onConfirm={handleDeleteConfirmChannel}
        onCancel={deleteChannelModal.close}
      />

      <DeleteConfirmModal
        isOpen={deleteWorkspaceModal.isOpen}
        title={t('channels.deleteServer')}
        message={t('channels.deleteServerConfirmMessage', { 
          name: deleteWorkspaceModal.data?.name || '' 
        })}
        onConfirm={handleDeleteConfirmWorkspace}
        onCancel={deleteWorkspaceModal.close}
      />

      <DeleteConfirmModal
        isOpen={leaveWorkspaceModal.isOpen}
        title="Lämna server"
        message={
          <>
            Är du säker på att du vill lämna{' '}
            <strong>{leaveWorkspaceModal.data?.name}</strong>? Du kan gå med
            igen med en inbjudningslänk.
          </>
        }
        confirmText="Lämna"
        onConfirm={handleLeaveConfirmWorkspace}
        onCancel={leaveWorkspaceModal.close}
      />

      {/* Invite Modal */}
      {currentWorkspace && (
        <InviteModal
          isOpen={showInviteModal}
          workspaceId={currentWorkspace.id}
          workspaceName={currentWorkspace.name}
          onClose={() => setShowInviteModal(false)}
        />
      )}

      {/* Join Server Modal */}
      <JoinServerModal
        isOpen={showJoinModal}
        onJoin={(workspace) => {
          handleWorkspaceSelect(workspace);
          // Refresh workspaces list
          window.location.reload();
        }}
        onClose={() => setShowJoinModal(false)}
      />
    </>
  );
}
