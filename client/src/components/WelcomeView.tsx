// Welcome View - Shown when no channel is selected
import { useChatStore } from '../store/chat';
import { useAuthStore } from '../store/auth';
import { useCreateWorkspace } from '../hooks/useQuery';
import { useState } from 'react';
import { ChatIcon } from './ui/Icons';

export default function WelcomeView() {
  const { currentWorkspace, setCurrentWorkspace } = useChatStore();
  const { user } = useAuthStore();
  const [showCreate, setShowCreate] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');

  // React Query mutation - automatically invalidates workspaces cache
  const { mutate: createWorkspace, isPending: creating } = useCreateWorkspace();

  const handleCreateWorkspace = async () => {
    if (!workspaceName.trim()) return;

    createWorkspace(
      { name: workspaceName.trim() },
      {
        onSuccess: (workspace) => {
          setCurrentWorkspace(workspace);
          setShowCreate(false);
          setWorkspaceName('');
          // Cache updated automatically via invalidation
        },
        onError: (err) => {
          console.error('Failed to create workspace:', err);
        }
      }
    );
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="welcome-icon">
          <ChatIcon size="lg" className="text-white" />
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
                  className="form-input-large"
                  autoFocus
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCreate(false)}
                    className="btn-secondary flex-1"
                  >
                    Avbryt
                  </button>
                  <button
                    onClick={handleCreateWorkspace}
                    disabled={creating || !workspaceName.trim()}
                    className="btn-primary flex-1"
                  >
                    {creating ? 'Skapar...' : 'Skapa'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowCreate(true)}
                className="btn-primary px-6 py-3"
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
