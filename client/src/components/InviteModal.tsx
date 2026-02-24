// Invite Modal - Create and manage workspace invites
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { api } from '../services/api';
import { logger } from '../utils/logger';
import type { WorkspaceInvite } from '../types';

interface InviteModalProps {
  isOpen: boolean;
  workspaceId: string;
  workspaceName: string;
  onClose: () => void;
}

export default function InviteModal({
  isOpen,
  workspaceId,
  workspaceName,
  onClose
}: InviteModalProps) {
  const { t } = useTranslation();
  const [invites, setInvites] = useState<WorkspaceInvite[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const loadInvites = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getWorkspaceInvites(workspaceId);
      setInvites(data);
    } catch (err) {
      logger.error('Failed to load invites:', err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (isOpen) {
      loadInvites();
    }
  }, [isOpen, loadInvites]);

  const createInvite = async () => {
    setCreating(true);
    try {
      const invite = await api.createInvite(workspaceId);
      setInvites([invite, ...invites]);
    } catch (err) {
      logger.error('Failed to create invite:', err);
    } finally {
      setCreating(false);
    }
  };

  const deleteInvite = async (inviteId: string) => {
    try {
      await api.deleteInvite(workspaceId, inviteId);
      setInvites(invites.filter((i) => i.id !== inviteId));
    } catch (err) {
      logger.error('Failed to delete invite:', err);
    }
  };

  const copyInviteLink = (code: string) => {
    const link = `${window.location.origin}/join/${code}`;
    navigator.clipboard.writeText(link);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatExpiry = (expiresAt: string | null) => {
    if (!expiresAt) return t('common.never');
    const date = new Date(expiresAt);
    return date.toLocaleDateString('sv-SE');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t('workspace.inviteTo', { workspace: workspaceName })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Create new invite button */}
          <Button onClick={createInvite} disabled={creating} className="w-full">
            {creating ? t('common.creating') : t('workspace.createNewInvite')}
          </Button>

          {/* Existing invites */}
          {loading ? (
            <p className="text-center text-boxflow-muted py-4">
              {t('common.loading')}
            </p>
          ) : invites.length === 0 ? (
            <p className="text-center text-boxflow-muted py-4">
              {t('invite.noActiveInvites')}
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-3 bg-boxflow-darker rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <code className="text-sm font-mono text-boxflow-primary">
                      {invite.code}
                    </code>
                    <div className="text-xs text-boxflow-muted mt-1">
                      {t('invite.uses')}: {invite.uses}
                      {invite.maxUses && ` / ${invite.maxUses}`}
                      {' • '}
                      {t('invite.expires')}: {formatExpiry(invite.expiresAt)}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyInviteLink(invite.code)}
                    >
                      {copied === invite.code
                        ? t('common.copiedCheck')
                        : t('common.copy')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteInvite(invite.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      {t('common.remove')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Help text */}
          <p className="text-xs text-boxflow-subtle text-center">
            {t('invite.shareInviteHelp')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
