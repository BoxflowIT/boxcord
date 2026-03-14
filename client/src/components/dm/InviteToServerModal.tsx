// Invite To Server Modal — Pick a workspace and send invite via DM
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { api } from '../../services/api';
import { useWorkspaces } from '../../hooks/useQuery';
import { socketService } from '../../services/socket';
import { toast } from '../../store/notification';
import { logger } from '../../utils/logger';
import Avatar from '../ui/Avatar';

interface InviteToServerModalProps {
  isOpen: boolean;
  targetUserId: string;
  onClose: () => void;
}

export function InviteToServerModal({
  isOpen,
  targetUserId,
  onClose
}: InviteToServerModalProps) {
  const { t } = useTranslation();
  const { data: workspaces = [] } = useWorkspaces();
  const [sending, setSending] = useState<string | null>(null);

  const handlePickWorkspace = async (workspaceId: string) => {
    setSending(workspaceId);
    try {
      // 1. Create invite for the chosen workspace
      const invite = await api.createInvite(workspaceId);
      const inviteLink = `${window.location.origin}/join/${invite.code}`;

      // 2. Get or create DM channel with the target user
      const dmChannel = await api.getOrCreateDM(targetUserId);

      // 3. Find the workspace name for the message
      const workspace = workspaces.find((w) => w.id === workspaceId);
      const serverName = workspace?.name ?? 'server';

      // 4. Send invite as a DM message
      const content = `📨 ${t('invite.sentInvite', { server: serverName })}\n${inviteLink}`;
      const message = await api.sendDM(dmChannel.id, content);

      // 5. Broadcast via socket so recipient sees it in real-time
      socketService.getSocket()?.emit('dm:new', message);

      toast.success(t('invite.inviteSent'));
      onClose();
    } catch (err) {
      logger.error('Failed to send invite:', err);
      toast.error(t('invite.failedToSend'));
    } finally {
      setSending(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('invite.pickServer')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-1 max-h-72 overflow-y-auto">
          {workspaces.length === 0 ? (
            <p className="text-center text-boxflow-muted py-4">
              {t('invite.noServers')}
            </p>
          ) : (
            workspaces.map((workspace) => (
              <button
                key={workspace.id}
                onClick={() => handlePickWorkspace(workspace.id)}
                disabled={sending !== null}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-boxflow-hover transition-colors text-left disabled:opacity-50"
              >
                <Avatar size="sm" src={workspace.iconUrl || undefined}>
                  {workspace.name.charAt(0).toUpperCase()}
                </Avatar>
                <span className="text-boxflow-light font-medium truncate flex-1">
                  {workspace.name}
                </span>
                {sending === workspace.id && (
                  <span className="text-xs text-boxflow-muted">
                    {t('common.sending')}...
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
