// Join Server Modal - Join a workspace via invite code
import { useState, KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { api } from '../services/api';
import type { InvitePreview, Workspace } from '../types';

interface JoinServerModalProps {
  isOpen: boolean;
  initialCode?: string;
  onJoin: (workspace: Workspace) => void;
  onClose: () => void;
}

export default function JoinServerModal({
  isOpen,
  initialCode = '',
  onJoin,
  onClose
}: JoinServerModalProps) {
  const { t } = useTranslation();
  const [code, setCode] = useState(initialCode);
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCodeChange = async (value: string) => {
    setCode(value);
    setError(null);
    setPreview(null);

    // Extract code from URL if pasted
    const codeMatch = value.match(/\/join\/([A-Za-z0-9]+)/);
    const extractedCode = codeMatch ? codeMatch[1] : value.trim();

    if (extractedCode.length >= 6) {
      setLoading(true);
      try {
        const data = await api.previewInvite(extractedCode);
        setPreview(data);
        setCode(extractedCode);
      } catch {
        setError(t('invite.invalidOrExpired'));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleJoin = async () => {
    if (!preview) return;

    setJoining(true);
    setError(null);

    try {
      const result = await api.joinWithInvite(code);
      onJoin(result.workspace);
      handleClose();
    } catch {
      setError(t('invite.couldNotJoin'));
    } finally {
      setJoining(false);
    }
  };

  const handleClose = () => {
    setCode('');
    setPreview(null);
    setError(null);
    onClose();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && preview) {
      handleJoin();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('invite.joinServer')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-boxflow-muted mb-2">
              {t('invite.inviteLinkOrCode')}
            </label>
            <Input
              type="text"
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="https://... eller AbC123xY"
              autoFocus
            />
          </div>

          {loading && (
            <p className="text-sm text-boxflow-muted text-center py-2">
              {t('invite.searchingServer')}
            </p>
          )}

          {error && (
            <p className="text-sm text-red-400 text-center py-2">{error}</p>
          )}

          {preview && (
            <div className="p-4 bg-boxflow-darker rounded-lg">
              <div className="flex items-center gap-3">
                {preview.workspace.iconUrl ? (
                  <img
                    src={preview.workspace.iconUrl}
                    alt=""
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-boxflow-primary flex items-center justify-center text-white font-bold text-lg">
                    {preview.workspace.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-white">
                    {preview.workspace.name}
                  </h3>
                  {preview.workspace.description && (
                    <p className="text-sm text-boxflow-muted">
                      {preview.workspace.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <p className="text-xs text-boxflow-subtle">
            {t('invite.pasteInviteHelp')}
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleJoin} disabled={!preview || joining}>
            {joining ? t('invite.joining') : t('invite.joinServer')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
