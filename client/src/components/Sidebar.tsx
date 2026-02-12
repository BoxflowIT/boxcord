// Sidebar Component
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { useChatStore } from '../store/chat';
import { useAuthStore } from '../store/auth';
import { api } from '../services/api';
import DeleteConfirmModal from './DeleteConfirmModal';
import EditModal from './EditModal';
import CreateModal from './CreateModal';

interface SidebarProps {
  onProfileClick?: () => void;
}

export default function Sidebar({ onProfileClick }: SidebarProps) {
  const navigate = useNavigate();
  const {
    workspaces,
    currentWorkspace,
    setCurrentWorkspace,
    addWorkspace,
    removeWorkspace,
    updateWorkspace: updateWorkspaceStore,
    channels,
    currentChannel,
    setCurrentChannel,
    addChannel,
    removeChannel,
    updateChannel: updateChannelStore,
    setChannels
  } = useChatStore();
  const { user, logout } = useAuthStore();
  const auth = useAuth();
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

  const handleWorkspaceSelect = async (workspace: typeof currentWorkspace) => {
    setCurrentWorkspace(workspace);
    if (workspace) {
      // Load channels for new workspace
      const channels = await api.getChannels(workspace.id);
      setChannels(channels);
    }
  };

  const handleChannelSelect = (channel: typeof currentChannel) => {
    setCurrentChannel(channel);
    if (channel) {
      navigate(`/chat/channels/${channel.id}`);
    }
  };

  const handleCreateWorkspace = async (name: string) => {
    if (isCreating) return;

    setIsCreating(true);
    try {
      const workspace = await api.createWorkspace(name);
      addWorkspace(workspace);
      setShowNewWorkspace(false);
      handleWorkspaceSelect(workspace);
    } catch (err) {
      console.error('Failed to create workspace:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateChannel = async (name: string) => {
    if (!currentWorkspace || isCreating) return;

    setIsCreating(true);
    try {
      const channel = await api.createChannel(currentWorkspace.id, name);
      addChannel(channel);
      setShowNewChannel(false);
      handleChannelSelect(channel);
    } catch (err) {
      console.error('Failed to create channel:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteChannel = (
    channel: typeof currentChannel,
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
      await api.deleteChannel(deleteChannel.id);
      removeChannel(deleteChannel.id);
      setDeleteChannel(null);
      // Select first channel if available
      const remaining = channels.filter((c) => c.id !== deleteChannel.id);
      if (remaining.length > 0) {
        handleChannelSelect(remaining[0]);
      } else {
        navigate('/chat');
      }
    } catch (err) {
      console.error('Failed to delete channel:', err);
    }
  };

  const handleDeleteWorkspace = (
    workspace: typeof currentWorkspace,
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
      await api.deleteWorkspace(deleteWorkspace.id);
      removeWorkspace(deleteWorkspace.id);
      setDeleteWorkspace(null);
      // Select first remaining workspace
      const remaining = workspaces.filter((w) => w.id !== deleteWorkspace.id);
      if (remaining.length > 0) {
        handleWorkspaceSelect(remaining[0]);
      } else {
        navigate('/chat');
      }
    } catch (err) {
      console.error('Failed to delete workspace:', err);
    }
  };

  const handleEditChannel = (
    channel: typeof currentChannel,
    e: React.MouseEvent
  ) => {
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
      const updated = await api.updateChannel(editingChannel.id, data);
      updateChannelStore(updated);
      setEditingChannel(null);
    } catch (err) {
      console.error('Failed to update channel:', err);
    }
  };

  const handleEditWorkspace = (
    workspace: typeof currentWorkspace,
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
      const updated = await api.updateWorkspace(editingWorkspace.id, data);
      updateWorkspaceStore(updated);
      setEditingWorkspace(null);
    } catch (err) {
      console.error('Failed to update workspace:', err);
    }
  };

  const handleLogout = () => {
    logout();
    // Also sign out from OIDC if applicable
    if (auth.isAuthenticated) {
      auth.removeUser();
    }
    navigate('/login');
  };

  return (
    <>
      <div className="flex h-full">
        {/* Workspace list */}
        <div className="w-[72px] bg-discord-darkest flex flex-col items-center py-3 gap-2">
          {workspaces.map((workspace) => (
            <div key={workspace.id} className="relative group">
              <button
                onClick={() => handleWorkspaceSelect(workspace)}
                onDoubleClick={(e) => handleEditWorkspace(workspace, e)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  handleDeleteWorkspace(workspace, e);
                }}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold transition-all overflow-hidden ${
                  currentWorkspace?.id === workspace.id
                    ? 'bg-discord-blurple rounded-2xl'
                    : 'bg-discord-dark hover:bg-discord-blurple hover:rounded-2xl'
                }`}
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
            className="w-12 h-12 rounded-full bg-discord-dark hover:bg-discord-green text-discord-green hover:text-white flex items-center justify-center transition-all"
            title="Lägg till workspace"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>

        {/* Create workspace modal */}
        {showNewWorkspace && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-discord-dark p-6 rounded-lg w-96">
              <h3 className="text-xl font-bold text-white mb-4">
                Skapa workspace
              </h3>
              <input
                type="text"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkspace()}
                placeholder="Workspace namn"
                className="w-full px-3 py-2 bg-discord-darkest rounded text-white placeholder-gray-500 mb-4"
                autoFocus
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowNewWorkspace(false);
                    setNewWorkspaceName('');
                  }}
                  className="px-4 py-2 text-gray-400 hover:text-white"
                >
                  Avbryt
                </button>
                <button
                  onClick={handleCreateWorkspace}
                  className="px-4 py-2 bg-discord-blurple hover:bg-discord-blurple/80 text-white rounded"
                >
                  Skapa
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Channel list */}
        <div className="w-60 bg-discord-darker flex flex-col">
          {/* Workspace header */}
          <div className="h-12 px-4 flex items-center border-b border-discord-darkest shadow">
            <h2 className="font-semibold text-white truncate">
              {currentWorkspace?.name ?? 'Välj workspace'}
            </h2>
          </div>

          {/* Channels */}
          <div className="flex-1 overflow-y-auto p-2">
            {currentWorkspace && (
              <>
                <div className="flex items-center justify-between px-2 mb-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase">
                    Text Kanaler
                  </span>
                  <button
                    onClick={() => setShowNewChannel(true)}
                    className="text-gray-400 hover:text-white"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </button>
                </div>

                {channels.map((channel) => (
                  <div
                    key={channel.id}
                    className={`group w-full flex items-center gap-2 px-2 py-1 rounded text-sm transition-colors cursor-pointer ${
                      currentChannel?.id === channel.id
                        ? 'bg-discord-dark/50 text-white'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-discord-dark/30'
                    }`}
                    onClick={() => handleChannelSelect(channel)}
                  >
                    <span className="text-lg">#</span>
                    <span className="truncate flex-1">{channel.name}</span>
                    <button
                      onClick={(e) => handleEditChannel(channel, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-white transition-opacity"
                      title="Redigera kanal"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => handleDeleteChannel(channel, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-400 transition-opacity"
                      title="Ta bort kanal"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* User info */}
          <div className="h-14 bg-discord-darkest/50 px-2 flex items-center gap-2">
            <button
              onClick={onProfileClick}
              className="flex items-center gap-2 flex-1 min-w-0 hover:bg-discord-dark/50 rounded p-1 -m-1 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-discord-blurple flex items-center justify-center text-white text-sm font-bold">
                {user?.firstName?.charAt(0) ?? user?.email?.charAt(0) ?? '?'}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-white truncate">
                  {user?.firstName ?? user?.email}
                </p>
                <p className="text-xs text-gray-400 truncate">{user?.role}</p>
              </div>
            </button>
            <button
              onClick={handleLogout}
              className="p-1 text-gray-400 hover:text-white"
              title="Logga ut"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
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
