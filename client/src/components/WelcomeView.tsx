// Welcome View - Shown when no workspace is selected
import { useChatStore } from '../store/chat';
import { useAuthStore } from '../store/auth';
import { useCreateWorkspace } from '../hooks/useQuery';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChatIcon } from './ui/Icons';
import { logger } from '../utils/logger';

export default function WelcomeView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentWorkspace, setCurrentWorkspace } = useChatStore();
  const { user } = useAuthStore();
  const [mode, setMode] = useState<'none' | 'create' | 'join'>('none');
  const [workspaceName, setWorkspaceName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  // React Query mutation - automatically invalidates workspaces cache
  const { mutate: createWorkspace, isPending: creating } = useCreateWorkspace();

  const handleCreateWorkspace = async () => {
    if (!workspaceName.trim()) return;

    createWorkspace(
      { name: workspaceName.trim() },
      {
        onSuccess: (workspace) => {
          setCurrentWorkspace(workspace);
          setMode('none');
          setWorkspaceName('');
        },
        onError: (err) => {
          logger.error('Failed to create workspace:', err);
        }
      }
    );
  };

  const handleJoinWithInvite = () => {
    const trimmed = inviteCode.trim();
    if (!trimmed) return;

    // Extract code from full URL or use as-is
    const match = trimmed.match(/\/join\/([a-zA-Z0-9_-]+)/);
    const code = match ? match[1] : trimmed;
    navigate(`/join/${encodeURIComponent(code)}`);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="welcome-icon">
          <ChatIcon size="lg" className="text-white" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          {t('workspace.welcome', { workspace: user?.firstName ?? 'Boxcord' })}
        </h1>

        <p className="text-discord-light mb-8">
          {currentWorkspace
            ? t('workspace.selectChannel')
            : t('workspace.welcomeMessage')}
        </p>

        {!currentWorkspace && (
          <>
            {mode === 'create' ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && handleCreateWorkspace()
                  }
                  placeholder={t('workspace.createNew')}
                  className="form-input-large"
                  autoFocus
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setMode('none')}
                    className="btn-secondary flex-1"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleCreateWorkspace}
                    disabled={creating || !workspaceName.trim()}
                    className="btn-primary flex-1"
                  >
                    {creating ? t('common.creating') : t('common.create')}
                  </button>
                </div>
              </div>
            ) : mode === 'join' ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinWithInvite()}
                  placeholder={t('workspace.inviteCodePlaceholder')}
                  className="form-input-large"
                  autoFocus
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setMode('none')}
                    className="btn-secondary flex-1"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleJoinWithInvite}
                    disabled={!inviteCode.trim()}
                    className="btn-primary flex-1"
                  >
                    {t('workspace.joinWorkspace')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setMode('create')}
                  className="btn-primary px-6 py-3"
                >
                  {t('workspace.createWorkspace')}
                </button>
                <button
                  onClick={() => setMode('join')}
                  className="btn-secondary px-6 py-3"
                >
                  {t('workspace.joinWithInvite')}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
