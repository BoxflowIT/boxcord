// Webhook Management Modal - Create, view, edit, delete channel webhooks
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { EditIcon, TrashIcon, PlusIcon, CopyIcon } from './ui/Icons';
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
      const data = await api.getChannelWebhooks(channelId);
      setWebhooks(data);
    } catch {
      setError(t('webhooks.loadError'));
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
          <div className="rounded-md bg-red-500/10 p-2 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* LIST VIEW */}
        {view === 'list' && (
          <div className="space-y-3">
            <button
              onClick={startCreate}
              className="flex w-full items-center gap-2 rounded-md border border-dashed border-boxflow-border p-3 text-sm text-boxflow-muted transition-colors hover:border-boxflow-accent hover:text-boxflow-accent"
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
                <p className="mt-1 text-xs">{t('webhooks.emptyHint')}</p>
              </div>
            ) : (
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {webhooks.map((webhook) => (
                  <div
                    key={webhook.id}
                    className="group relative rounded-md border border-boxflow-border bg-boxflow-bg-secondary p-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-boxflow-light">
                            {webhook.name}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs ${
                              webhook.isActive
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
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
                            <code className="max-w-[250px] truncate rounded bg-boxflow-bg-primary px-1.5 py-0.5 text-xs text-boxflow-muted">
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
                          className="rounded p-1 text-boxflow-muted hover:bg-boxflow-bg-primary hover:text-boxflow-light"
                          title={t('webhooks.edit')}
                        >
                          <EditIcon className="h-3.5 w-3.5" />
                        </button>

                        {deleteConfirm === webhook.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(webhook.id)}
                              className="rounded bg-red-500/20 px-2 py-0.5 text-xs text-red-400 hover:bg-red-500/30"
                            >
                              {t('webhooks.confirmDelete')}
                            </button>
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
                            className="rounded p-1 text-boxflow-muted hover:bg-red-500/20 hover:text-red-400"
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
              <label className="mb-1 block text-sm text-boxflow-muted">
                {t('webhooks.nameLabel')}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('webhooks.namePlaceholder')}
                maxLength={80}
                className="w-full rounded-md border border-boxflow-border bg-boxflow-bg-primary px-3 py-2 text-sm text-boxflow-light placeholder-boxflow-muted focus:border-boxflow-accent focus:outline-none"
                autoFocus
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-boxflow-muted">
                {t('webhooks.descriptionLabel')}
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('webhooks.descriptionPlaceholder')}
                maxLength={200}
                className="w-full rounded-md border border-boxflow-border bg-boxflow-bg-primary px-3 py-2 text-sm text-boxflow-light placeholder-boxflow-muted focus:border-boxflow-accent focus:outline-none"
              />
            </div>

            {view === 'edit' && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-boxflow-muted">
                  {t('webhooks.activeLabel')}
                </label>
                <button
                  onClick={() => setIsActive(!isActive)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    isActive ? 'bg-boxflow-accent' : 'bg-boxflow-border'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      isActive ? 'translate-x-4' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            )}

            {view === 'edit' && editingWebhook && (
              <div>
                <label className="mb-1 block text-sm text-boxflow-muted">
                  {t('webhooks.tokenLabel')}
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate rounded bg-boxflow-bg-primary px-2 py-1.5 text-xs text-boxflow-muted">
                    {showToken === editingWebhook.id
                      ? editingWebhook.token
                      : '••••••••••••••••'}
                  </code>
                  <button
                    onClick={() => handleRegenerate(editingWebhook.id)}
                    className="rounded bg-yellow-500/20 px-2 py-1 text-xs text-yellow-400 hover:bg-yellow-500/30"
                  >
                    {t('webhooks.regenerate')}
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setView('list');
                  setEditingWebhook(null);
                }}
                className="rounded-md px-3 py-1.5 text-sm text-boxflow-muted hover:text-boxflow-light"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={view === 'create' ? handleCreate : handleUpdate}
                disabled={!name.trim() || saving}
                className="rounded-md bg-boxflow-accent px-3 py-1.5 text-sm text-white hover:bg-boxflow-accent/90 disabled:opacity-50"
              >
                {saving
                  ? '...'
                  : view === 'create'
                    ? t('webhooks.create')
                    : t('webhooks.save')}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
