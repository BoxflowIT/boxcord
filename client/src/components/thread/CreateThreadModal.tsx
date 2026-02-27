// Create Thread Modal - Prompts user for thread title before creating
import { useState, useCallback, KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface CreateThreadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string) => Promise<void>;
}

export function CreateThreadModal({
  isOpen,
  onClose,
  onCreate
}: CreateThreadModalProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const resetState = useCallback(() => {
    setTitle('');
    setError(null);
    setIsCreating(false);
  }, []);

  const handleCreate = useCallback(async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    setError(null);
    setIsCreating(true);

    try {
      await onCreate(trimmedTitle);
      resetState();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('threads.failedToCreate')
      );
      setIsCreating(false);
    }
  }, [title, onCreate, resetState, t]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !isCreating) {
        handleCreate();
      }
    },
    [handleCreate, isCreating]
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        onClose();
        resetState();
      }
    },
    [onClose, resetState]
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('threads.createThread')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="px-3 py-2 bg-red-500/20 border border-red-500 rounded-md text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              {t('threads.titleLabel')}
            </label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('threads.titlePlaceholder')}
              autoFocus
              disabled={isCreating}
              maxLength={100}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isCreating}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleCreate} disabled={!title.trim() || isCreating}>
            {isCreating ? t('common.creating') : t('threads.startThread')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
