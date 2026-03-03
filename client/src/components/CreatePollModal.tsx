// Create Poll Modal - Dialog for creating a new poll
import React, { useState, useCallback } from 'react';
import { api } from '../services/api';
import { logger } from '../utils/logger';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { PollIcon } from './ui/Icons';
import CheckboxInput from './form/CheckboxInput';
import { POLL_RULES } from '../constants/poll';

interface CreatePollModalProps {
  channelId: string;
  onClose: () => void;
  onCreated?: () => void;
}

export const CreatePollModal: React.FC<CreatePollModalProps> = ({
  channelId,
  onClose,
  onCreated
}) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [isMultiple, setIsMultiple] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addOption = useCallback(() => {
    if (options.length < POLL_RULES.MAX_OPTIONS) {
      setOptions((prev) => [...prev, '']);
    }
  }, [options.length]);

  const removeOption = useCallback(
    (index: number) => {
      if (options.length > 2) {
        setOptions((prev) => prev.filter((_, i) => i !== index));
      }
    },
    [options.length]
  );

  const updateOption = useCallback((index: number, value: string) => {
    setOptions((prev) => prev.map((opt, i) => (i === index ? value : opt)));
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);

    const trimmedQ = question.trim();
    const trimmedOpts = options
      .map((o) => o.trim())
      .filter((o) => o.length > 0);

    if (!trimmedQ) {
      setError('Ange en fråga');
      return;
    }
    if (trimmedOpts.length < 2) {
      setError('Ange minst två alternativ');
      return;
    }

    setCreating(true);
    try {
      await api.createPoll({
        channelId,
        question: trimmedQ,
        options: trimmedOpts,
        isMultiple,
        isAnonymous
      });
      onCreated?.();
      onClose();
    } catch (err) {
      logger.error('Failed to create poll:', err);
      setError(
        err instanceof Error ? err.message : 'Kunde inte skapa omröstning'
      );
    } finally {
      setCreating(false);
    }
  };

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) onClose();
    },
    [onClose]
  );

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PollIcon size="sm" className="text-boxflow-primary" />
            Skapa omröstning
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto space-y-4"
        >
          {error && (
            <div className="px-3 py-2 bg-red-500/20 border border-red-500 rounded-md text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Question */}
          <div>
            <label className="label-base">Fråga</label>
            <Input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Vad vill du fråga?"
              maxLength={POLL_RULES.MAX_QUESTION_LENGTH}
              autoFocus
              disabled={creating}
            />
          </div>

          {/* Options */}
          <div>
            <label className="label-base">Alternativ</label>
            <div className="space-y-2">
              {options.map((opt, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-subtle w-5 text-right flex-shrink-0">
                    {index + 1}.
                  </span>
                  <Input
                    type="text"
                    value={opt}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Alternativ ${index + 1}`}
                    maxLength={POLL_RULES.MAX_OPTION_LENGTH}
                    disabled={creating}
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="text-boxflow-muted hover:text-boxflow-danger transition-colors text-sm flex-shrink-0"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {options.length < POLL_RULES.MAX_OPTIONS && (
              <button
                type="button"
                onClick={addOption}
                disabled={creating}
                className="mt-2 text-xs text-boxflow-primary hover:text-boxflow-primary/80 transition-colors"
              >
                + Lägg till alternativ
              </button>
            )}
          </div>

          {/* Settings */}
          <div className="space-y-2">
            <CheckboxInput
              checked={isMultiple}
              onChange={setIsMultiple}
              label="Tillåt flera val"
              disabled={creating}
            />
            <CheckboxInput
              checked={isAnonymous}
              onChange={setIsAnonymous}
              label="Anonym omröstning"
              disabled={creating}
            />
          </div>
        </form>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={creating}>
            Avbryt
          </Button>
          <Button onClick={() => handleSubmit()} disabled={creating}>
            {creating ? 'Skapar...' : 'Skapa omröstning'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
