// Reusable Message Edit Form Component
import React from 'react';

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
          className="px-3 py-1 bg-gradient-to-r from-boxflow-primary to-boxflow-secondary hover:from-boxflow-secondary hover:to-[#3c44a8] text-white rounded-lg shadow-lg shadow-boxflow-primary/25 transition-all"
        >
          Spara
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1 hover:bg-boxflow-hover text-boxflow-muted hover:text-white rounded-lg transition-colors"
        >
          Avbryt
        </button>
        {compact && (
          <span className="text-boxflow-muted pt-1">
            Escape för att <strong>avbryta</strong> • Enter för att{' '}
            <strong>spara</strong>
          </span>
        )}
      </div>
    </div>
  );
}
