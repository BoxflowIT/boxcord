// Thread Composer - Input area for new replies
import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import FileUpload, { type FileUploadHandle } from '../FileUpload';
import EmojiPicker from '../ui/EmojiPicker';
import { toast } from '../../store/notification';

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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/v1/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const { url } = await response.json();
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
      <div className="message-input-container !bg-boxflow-darker">
        <FileUpload
          ref={fileUploadRef}
          onFileSelect={handleFileSelect}
          disabled={isDisabled}
        />
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
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
