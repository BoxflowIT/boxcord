// Reusable Message Input Component
import React, { useRef, useEffect } from 'react';
import FileUpload from '../FileUpload';
import EmojiPicker from '../ui/EmojiPicker';

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  uploading?: boolean;
  onFileSelect?: (file: File) => void;
  onEmojiSelect?: (emoji: string) => void;
  autocomplete?: React.ReactNode;
  maxRows?: number;
  autoFocus?: boolean;
}

export function MessageInput({
  value,
  onChange,
  onSend,
  onKeyDown,
  placeholder = 'Skicka meddelande...',
  disabled = false,
  uploading = false,
  onFileSelect,
  onEmojiSelect,
  autocomplete,
  maxRows = 10,
  autoFocus = false
}: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const scrollHeight = textarea.scrollHeight;
    const maxHeight = maxRows * 24; // Approximate line height
    textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
  }, [value, maxRows]);

  // Auto-focus on mount
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSend();
      }
    }
    onKeyDown?.(e);
  };

  return (
    <div className="px-4 pb-6">
      <div className="message-input-container">
        {onFileSelect && (
          <FileUpload
            onFileSelect={onFileSelect}
            disabled={disabled || uploading}
          />
        )}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-boxflow-light placeholder-boxflow-muted resize-none outline-none p-3 max-h-48"
          rows={1}
          disabled={disabled || uploading}
        />
        {onEmojiSelect && <EmojiPicker onEmojiSelect={onEmojiSelect} />}
        {autocomplete}
      </div>
    </div>
  );
}
