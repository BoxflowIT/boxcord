// Webhook Management Modal - Create, view, edit, delete channel webhooks
import { useState, useEffect, useCallback } from 'react';
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
import { EditIcon, TrashIcon, PlusIcon, CopyIcon } from './ui/Icons';
import Toggle from './ui/Toggle';
import { api } from '../services/api';

interface Webhook {
  id: string;
  channelId: string;
  name: string;
  avatarUrl: string | null;
  token: string;
  createdBy: string;
  isActive: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

interface WebhookManagementModalProps {
  channelId: string;
  channelName: string;
  onClose: () => void;
}

type View = 'list' | 'create' | 'edit';

export function WebhookManagementModal({
  channelId,
  channelName,
  onClose
}: WebhookManagementModalProps) {
  const { t } = useTranslation();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('list');
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showToken, setShowToken] = useState<string | null>(null);

  const fetchWebhooks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getChannelWebhooks(channelId);
      setWebhooks(data);
    } catch (err) {
      console.error('[Webhooks] Failed to load:', err);
      setError(err instanceof Error ? err.message : t('webhooks.loadError'));
    } finally {
      setLoading(false);
    }
  }, [channelId, t]);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await api.createChannelWebhook(channelId, {
        name: name.trim(),
        description: description.trim() || undefined
      });
      setName('');
      setDescription('');
      setView('list');
      await fetchWebhooks();
    } catch {
      setError(t('webhooks.createError'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingWebhook || !name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await api.updateChannelWebhook(editingWebhook.id, {
        name: name.trim(),
        description: description.trim() || null,
        isActive
      });
      setView('list');
      setEditingWebhook(null);
      await fetchWebhooks();
    } catch {
      setError(t('webhooks.updateError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteChannelWebhook(id);
      setDeleteConfirm(null);
      await fetchWebhooks();
    } catch {
      setError(t('webhooks.deleteError'));
    }
  };

  const handleRegenerate = async (id: string) => {
    try {
      await api.regenerateWebhookToken(id);
      await fetchWebhooks();
    } catch {
      setError(t('webhooks.regenerateError'));
    }
  };

  const copyToClipboard = (text: string, webhookId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(webhookId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const startEdit = (webhook: Webhook) => {
    setEditingWebhook(webhook);
    setName(webhook.name);
    setDescription(webhook.description || '');
    setIsActive(webhook.isActive);
    setView('edit');
  };

  const startCreate = () => {
    setName('');
    setDescription('');
    setIsActive(true);
    setView('create');
  };

  const getWebhookUrl = (token: string) => {
    const base = window.location.origin;
    return `${base}/api/webhooks/execute/${token}`;
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {view === 'list' && `${t('webhooks.title')} — #${channelName}`}
            {view === 'create' && t('webhooks.create')}
            {view === 'edit' && t('webhooks.edit')}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="px-3 py-2 bg-red-500/20 border border-red-500 rounded-md text-sm text-red-300">
            {error}
          </div>
        )}

        {/* LIST VIEW */}
        {view === 'list' && (
          <div className="space-y-3">
            <button
              onClick={startCreate}
              className="flex w-full items-center gap-2 rounded-lg border border-dashed border-boxflow-border-50 p-3 text-sm text-boxflow-muted transition-colors hover:border-boxflow-primary hover:text-boxflow-primary"
            >
              <PlusIcon className="h-4 w-4" />
              {t('webhooks.create')}
            </button>

            {loading ? (
              <div className="py-6 text-center text-sm text-boxflow-muted">
                {t('webhooks.loading')}
              </div>
            ) : webhooks.length === 0 ? (
              <div className="py-6 text-center text-sm text-boxflow-muted">
                <p>{t('webhooks.empty')}</p>
                <p className="mt-1 text-xs text-boxflow-subtle">
                  {t('webhooks.emptyHint')}
                </p>
              </div>
            ) : (
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {webhooks.map((webhook) => (
                  <div
                    key={webhook.id}
                    className="group relative rounded-lg border border-boxflow-border-50 bg-boxflow-darker p-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-boxflow-light">
                            {webhook.name}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              webhook.isActive
                                ? 'bg-boxflow-success-20 text-boxflow-success'
                                : 'bg-boxflow-danger-20 text-boxflow-danger'
                            }`}
                          >
                            {webhook.isActive
                              ? t('webhooks.active')
                              : t('webhooks.inactive')}
                          </span>
                        </div>
                        {webhook.description && (
                          <p className="mt-1 text-xs text-boxflow-muted">
                            {webhook.description}
                          </p>
                        )}

                        {/* Token section */}
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center gap-1">
                            <code className="max-w-[250px] truncate rounded-md bg-boxflow-darkest px-2 py-0.5 text-xs text-boxflow-subtle">
                              {showToken === webhook.id
                                ? webhook.token
                                : '••••••••••••'}
                            </code>
                            {webhook.token !== '••••••••' && (
                              <>
                                <button
                                  onClick={() =>
                                    setShowToken(
                                      showToken === webhook.id
                                        ? null
                                        : webhook.id
                                    )
                                  }
                                  className="rounded p-0.5 text-xs text-boxflow-muted hover:text-boxflow-light"
                                  title={
                                    showToken === webhook.id
                                      ? t('webhooks.hideToken')
                                      : t('webhooks.showToken')
                                  }
                                >
                                  {showToken === webhook.id ? '🙈' : '👁️'}
                                </button>
                                <button
                                  onClick={() =>
                                    copyToClipboard(
                                      getWebhookUrl(webhook.token),
                                      webhook.id
                                    )
                                  }
                                  className="rounded p-0.5 text-xs text-boxflow-muted hover:text-boxflow-light"
                                  title={t('webhooks.copyUrl')}
                                >
                                  {copiedId === webhook.id ? (
                                    '✓'
                                  ) : (
                                    <CopyIcon className="h-3 w-3" />
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => startEdit(webhook)}
                          className="rounded p-1 text-boxflow-muted hover:bg-boxflow-hover hover:text-boxflow-light"
                          title={t('webhooks.edit')}
                        >
                          <EditIcon className="h-3.5 w-3.5" />
                        </button>

                        {deleteConfirm === webhook.id ? (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(webhook.id)}
                              className="h-6 px-2 text-xs"
                            >
                              {t('webhooks.confirmDelete')}
                            </Button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="rounded px-2 py-0.5 text-xs text-boxflow-muted hover:text-boxflow-light"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(webhook.id)}
                            className="rounded p-1 text-boxflow-muted hover:bg-boxflow-danger-10 hover:text-boxflow-danger"
                            title={t('webhooks.delete')}
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CREATE / EDIT VIEW */}
        {(view === 'create' || view === 'edit') && (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-boxflow-normal">
                {t('webhooks.nameLabel')}
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('webhooks.namePlaceholder')}
                maxLength={80}
                autoFocus
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-boxflow-normal">
                {t('webhooks.descriptionLabel')}
              </label>
              <Input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('webhooks.descriptionPlaceholder')}
                maxLength={200}
              />
            </div>

            {view === 'edit' && (
              <div className="flex items-center justify-between">
                <label className="text-sm text-boxflow-normal">
                  {t('webhooks.activeLabel')}
                </label>
                <Toggle enabled={isActive} onChange={setIsActive} />
              </div>
            )}

            {view === 'edit' && editingWebhook && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-boxflow-normal">
                  {t('webhooks.tokenLabel')}
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate rounded-md bg-boxflow-darkest px-3 py-2 text-xs text-boxflow-subtle">
                    {showToken === editingWebhook.id
                      ? editingWebhook.token
                      : '••••••••••••••••'}
                  </code>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleRegenerate(editingWebhook.id)}
                  >
                    {t('webhooks.regenerate')}
                  </Button>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => {
                  setView('list');
                  setEditingWebhook(null);
                }}
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={view === 'create' ? handleCreate : handleUpdate}
                disabled={!name.trim() || saving}
              >
                {saving
                  ? '...'
                  : view === 'create'
                    ? t('webhooks.create')
                    : t('webhooks.save')}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
