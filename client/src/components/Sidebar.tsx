// Sidebar Component
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../store/chat';
import { useAuthStore } from '../store/auth';
import { api } from '../services/api';

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
    channels,
    currentChannel,
    setCurrentChannel,
    addChannel,
    setChannels
  } = useChatStore();
  const { user, logout } = useAuthStore();
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [showNewWorkspace, setShowNewWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');

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

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;

    try {
      const workspace = await api.createWorkspace(newWorkspaceName.trim());
      addWorkspace(workspace);
      setShowNewWorkspace(false);
      setNewWorkspaceName('');
      handleWorkspaceSelect(workspace);
    } catch (err) {
      console.error('Failed to create workspace:', err);
    }
  };

  const handleCreateChannel = async () => {
    if (!currentWorkspace || !newChannelName.trim()) return;

    try {
      const channel = await api.createChannel(
        currentWorkspace.id,
        newChannelName.trim()
      );
      addChannel(channel);
      setShowNewChannel(false);
      setNewChannelName('');
      handleChannelSelect(channel);
    } catch (err) {
      console.error('Failed to create channel:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-full">
      {/* Workspace list */}
      <div className="w-[72px] bg-discord-darkest flex flex-col items-center py-3 gap-2">
        {workspaces.map((workspace) => (
          <button
            key={workspace.id}
            onClick={() => handleWorkspaceSelect(workspace)}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold transition-all ${
              currentWorkspace?.id === workspace.id
                ? 'bg-discord-blurple rounded-2xl'
                : 'bg-discord-dark hover:bg-discord-blurple hover:rounded-2xl'
            }`}
            title={workspace.name}
          >
            {workspace.iconUrl ? (
              <img
                src={workspace.iconUrl}
                alt=""
                className="w-full h-full rounded-full"
              />
            ) : (
              workspace.name.charAt(0).toUpperCase()
            )}
          </button>
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

              {showNewChannel && (
                <div className="px-2 mb-2">
                  <input
                    type="text"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && handleCreateChannel()
                    }
                    placeholder="kanal-namn"
                    className="w-full px-2 py-1 text-sm bg-discord-darkest rounded text-white placeholder-gray-500"
                    autoFocus
                  />
                </div>
              )}

              {channels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => handleChannelSelect(channel)}
                  className={`w-full flex items-center gap-2 px-2 py-1 rounded text-sm transition-colors ${
                    currentChannel?.id === channel.id
                      ? 'bg-discord-dark/50 text-white'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-discord-dark/30'
                  }`}
                >
                  <span className="text-lg">#</span>
                  <span className="truncate">{channel.name}</span>
                </button>
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
  );
}
