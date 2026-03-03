// Thread Composer - Input area for new replies with @mention support
import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import FileUpload, { type FileUploadHandle } from '../FileUpload';
import EmojiPicker from '../ui/EmojiPicker';
import MentionAutocomplete from '../MentionAutocomplete';
import type { MentionItem } from '../MentionAutocomplete';
import { toast } from '../../store/notification';
import { api } from '../../services/api';

interface ThreadComposerProps {
  disabled?: boolean;
  onSend: (content: string) => Promise<void>;
}

export function ThreadComposer({
  disabled = false,
  onSend
}: ThreadComposerProps) {
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [showMentions, setShowMentions] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileUploadRef = useRef<FileUploadHandle>(null);

  const handleSend = async () => {
    if (!content.trim() || sending || uploading) return;

    setSending(true);
    try {
      await onSend(content.trim());
      setContent('');
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !showMentions) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursor = e.target.selectionStart ?? 0;
    setContent(value);
    setCursorPosition(cursor);

    // Check if we should show mention autocomplete
    const textBeforeCursor = value.slice(0, cursor);
    const atIndex = textBeforeCursor.lastIndexOf('@');
    if (atIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(atIndex + 1);
      const isValidAt = atIndex === 0 || value[atIndex - 1] === ' ';
      setShowMentions(isValidAt && !textAfterAt.includes(' '));
    } else {
      setShowMentions(false);
    }
  };

  const handleMentionSelect = useCallback(
    (mention: MentionItem, startPos: number, endPos: number) => {
      const newValue =
        content.slice(0, startPos) +
        mention.value +
        ' ' +
        content.slice(endPos);
      setContent(newValue);
      setShowMentions(false);

      const newCursorPos = startPos + mention.value.length + 1;
      setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    },
    [content]
  );

  const handleFileSelect = async (file: File) => {
    setUploading(true);
    try {
      const result = await api.uploadFile(file);
      const url = 'url' in result ? result.url : '';
      setContent((prev) => (prev ? `${prev}\n${url}` : url));
      toast.success('File uploaded');
    } catch (err) {
      console.error('Failed to upload file:', err);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setContent((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  const handleGifSelect = (gifUrl: string) => {
    setContent((prev) => prev + ' ' + gifUrl);
    textareaRef.current?.focus();
  };

  const isDisabled = disabled || sending || uploading;
  const canSend = content.trim() && !isDisabled;

  return (
    <div className="p-4 border-t border-boxflow-border bg-boxflow-darker">
      <div className="message-input-container !bg-boxflow-darker relative">
        <FileUpload
          ref={fileUploadRef}
          onFileSelect={handleFileSelect}
          disabled={isDisabled}
        />
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onClick={(e) =>
            setCursorPosition(
              (e.target as HTMLTextAreaElement).selectionStart ?? 0
            )
          }
          placeholder={t('threads.replyPlaceholder')}
          className="flex-1 bg-transparent text-boxflow-light placeholder-boxflow-subtle resize-none outline-none p-3 max-h-48"
          rows={1}
          disabled={isDisabled}
        />
        <EmojiPicker
          onEmojiSelect={handleEmojiSelect}
          onGifSelect={handleGifSelect}
          showPicker={showEmojiPicker}
          onTogglePicker={setShowEmojiPicker}
        />
        {showMentions && (
          <MentionAutocomplete
            inputValue={content}
            cursorPosition={cursorPosition}
            onSelect={handleMentionSelect}
            onClose={() => setShowMentions(false)}
            position={{ top: 0, left: 40 }}
          />
        )}
      </div>
      <div className="flex justify-end mt-2 gap-2">
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="px-4 py-2 bg-boxflow-primary text-white rounded hover:bg-boxflow-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {sending
            ? t('common.sending')
            : uploading
              ? 'Uploading...'
              : t('threads.sendReply')}
        </button>
      </div>
    </div>
  );
}
