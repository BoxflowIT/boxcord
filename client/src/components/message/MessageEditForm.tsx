// Reusable Message Edit Form Component
import { useTranslation } from 'react-i18next';

interface MessageEditFormProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  compact?: boolean;
}

export function MessageEditForm({
  value,
  onChange,
  onSave,
  onCancel,
  textareaRef,
  compact = false
}: MessageEditFormProps) {
  const { t } = useTranslation();
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="mt-1">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="input-message"
        rows={compact ? 2 : 3}
      />
      <div
        className={compact ? 'flex-row mt-1 text-xs' : 'flex-row mt-2 text-xs'}
      >
        <button
          onClick={onSave}
          className="px-3 py-1 gradient-primary text-white rounded-lg shadow-primary transition-all"
        >
          {t('common.save')}
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1 hover:bg-boxflow-hover text-boxflow-muted hover:text-white rounded-lg transition-colors"
        >
          {t('common.cancel')}
        </button>
        {compact && (
          <span className="text-boxflow-muted pt-1">
            {t('messages.editHint')}
          </span>
        )}
      </div>
    </div>
  );
}
