// Welcome View - Shown when no channel is selected
import { useChatStore } from '../store/chat';
import { useAuthStore } from '../store/auth';
import { api } from '../services/api';
import { useState } from 'react';

export default function WelcomeView() {
  const { currentWorkspace, setWorkspaces, setCurrentWorkspace } =
    useChatStore();
  const { user } = useAuthStore();
  const [showCreate, setShowCreate] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreateWorkspace = async () => {
    if (!workspaceName.trim()) return;

    setCreating(true);
    try {
      const workspace = await api.createWorkspace(workspaceName.trim());
      const workspaces = await api.getWorkspaces();
      setWorkspaces(workspaces);
      setCurrentWorkspace(workspace);
      setShowCreate(false);
      setWorkspaceName('');
    } catch (err) {
      console.error('Failed to create workspace:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-discord-blurple rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          Välkommen till Boxcord, {user?.firstName ?? 'du'}!
        </h1>

        <p className="text-discord-light mb-8">
          {currentWorkspace
            ? 'Välj en kanal i sidofältet för att börja chatta med ditt team.'
            : 'Skapa eller gå med i en workspace för att komma igång.'}
        </p>

        {!currentWorkspace && (
          <>
            {showCreate ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && handleCreateWorkspace()
                  }
                  placeholder="Workspace namn, t.ex. Boxflow Team"
                  className="w-full px-4 py-3 bg-discord-darker border border-discord-darkest rounded text-white placeholder-gray-500 focus:outline-none focus:border-discord-blurple"
                  autoFocus
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCreate(false)}
                    className="flex-1 py-2 border border-gray-600 text-gray-400 hover:text-white hover:border-gray-500 rounded transition-colors"
                  >
                    Avbryt
                  </button>
                  <button
                    onClick={handleCreateWorkspace}
                    disabled={creating || !workspaceName.trim()}
                    className="flex-1 py-2 bg-discord-blurple hover:bg-discord-blurple/80 text-white font-semibold rounded transition-colors disabled:opacity-50"
                  >
                    {creating ? 'Skapar...' : 'Skapa'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowCreate(true)}
                className="px-6 py-3 bg-discord-blurple hover:bg-discord-blurple/80 text-white font-semibold rounded transition-colors"
              >
                Skapa ny workspace
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
