// Message Template Modal - Browse, create, edit, delete and use message templates
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { EditIcon, TrashIcon, PlusIcon, DocumentIcon } from './ui/Icons';
import { api } from '../services/api';

interface Template {
  id: string;
  name: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface MessageTemplateModalProps {
  onClose: () => void;
  onUseTemplate: (content: string) => void;
}

type View = 'list' | 'create' | 'edit';

export function MessageTemplateModal({
  onClose,
  onUseTemplate
}: MessageTemplateModalProps) {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('list');
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getTemplates();
      setTemplates(data);
    } catch {
      setError(t('templates.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleCreate = async () => {
    if (!name.trim() || !content.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await api.createTemplate({ name: name.trim(), content: content.trim() });
      setName('');
      setContent('');
      setView('list');
      await fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('templates.createError'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingTemplate || !name.trim() || !content.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await api.updateTemplate(editingTemplate.id, {
        name: name.trim(),
        content: content.trim()
      });
      setEditingTemplate(null);
      setName('');
      setContent('');
      setView('list');
      await fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('templates.updateError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteTemplate(id);
      setDeleteConfirm(null);
      await fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('templates.deleteError'));
    }
  };

  const startEdit = (template: Template) => {
    setEditingTemplate(template);
    setName(template.name);
    setContent(template.content);
    setView('edit');
    setError(null);
  };

  const startCreate = () => {
    setEditingTemplate(null);
    setName('');
    setContent('');
    setView('create');
    setError(null);
  };

  const handleUse = (template: Template) => {
    onUseTemplate(template.content);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DocumentIcon size="md" />
            {t('templates.title')}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="text-red-400 text-sm bg-red-900/20 px-3 py-2 rounded">
            {error}
          </div>
        )}

        {view === 'list' && (
          <>
            {/* Create button */}
            <button
              onClick={startCreate}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded bg-boxflow-accent hover:bg-boxflow-accent/80 text-white transition-colors"
            >
              <PlusIcon size="sm" />
              {t('templates.create')}
            </button>

            {/* Template list */}
            <div className="flex-1 overflow-y-auto mt-2 space-y-1 min-h-0">
              {loading && (
                <div className="text-center text-gray-400 py-8">
                  {t('common.loading')}
                </div>
              )}

              {!loading && templates.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <DocumentIcon size="md" className="mx-auto mb-2 opacity-50" />
                  <p>{t('templates.empty')}</p>
                  <p className="text-xs mt-1">{t('templates.emptyHint')}</p>
                </div>
              )}

              {templates.map((template) => (
                <div
                  key={template.id}
                  className="group relative p-3 rounded hover:bg-boxflow-hover border border-gray-700/50 transition-colors"
                >
                  {/* Delete confirmation overlay */}
                  {deleteConfirm === template.id && (
                    <div className="absolute inset-0 bg-red-900/90 rounded flex items-center justify-center gap-2 z-10">
                      <span className="text-sm text-white">
                        {t('templates.confirmDelete')}
                      </span>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="px-2 py-1 text-xs bg-red-600 rounded hover:bg-red-500 text-white"
                      >
                        {t('common.delete')}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-2 py-1 text-xs bg-gray-600 rounded hover:bg-gray-500 text-white"
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-2">
                    <button
                      onClick={() => handleUse(template)}
                      className="flex-1 text-left"
                      title={t('templates.useTooltip')}
                    >
                      <div className="font-medium text-white text-sm">
                        {template.name}
                      </div>
                      <div className="text-gray-400 text-xs mt-1 line-clamp-2">
                        {template.content}
                      </div>
                    </button>

                    {/* Actions */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => startEdit(template)}
                        className="p-1 rounded hover:bg-boxflow-hover text-gray-400 hover:text-white"
                        title={t('common.edit')}
                      >
                        <EditIcon size="sm" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(template.id)}
                        className="p-1 rounded hover:bg-red-900/50 text-gray-400 hover:text-red-400"
                        title={t('common.delete')}
                      >
                        <TrashIcon size="sm" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {(view === 'create' || view === 'edit') && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                {t('templates.nameLabel')}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('templates.namePlaceholder')}
                className="w-full bg-boxflow-dark border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-500 text-sm focus:border-boxflow-accent outline-none"
                maxLength={100}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                {t('templates.contentLabel')}
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t('templates.contentPlaceholder')}
                className="w-full bg-boxflow-dark border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-500 text-sm focus:border-boxflow-accent outline-none resize-none"
                rows={5}
                maxLength={2000}
              />
              <div className="text-right text-xs text-gray-500 mt-1">
                {content.length}/2000
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setView('list');
                  setError(null);
                }}
                className="px-3 py-1.5 text-sm rounded bg-gray-700 hover:bg-gray-600 text-white transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={view === 'create' ? handleCreate : handleUpdate}
                disabled={saving || !name.trim() || !content.trim()}
                className="px-3 py-1.5 text-sm rounded bg-boxflow-accent hover:bg-boxflow-accent/80 text-white transition-colors disabled:opacity-50"
              >
                {saving
                  ? t('common.saving')
                  : view === 'create'
                    ? t('templates.create')
                    : t('templates.save')}
              </button>
            </div>
          </div>
        )}

        {/* Footer hint */}
        <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-700">
          {t('templates.hint')}
        </div>
      </DialogContent>
    </Dialog>
  );
}
