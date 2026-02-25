// DM Input Section Component (simpler than channel input - no mentions/commands)
import { useTranslation } from 'react-i18next';
import FileUpload, { type FileUploadHandle } from '../FileUpload';
import EmojiPicker from '../ui/EmojiPicker';

interface DMInputSectionProps {
  userName?: string;
  inputValue: string;
  uploading: boolean;
  sending: boolean;
  showEmojiPicker?: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  fileUploadRef?: React.RefObject<FileUploadHandle>;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onFileSelect: (file: File) => void;
  onEmojiSelect: (emoji: string) => void;
  onGifSelect: (gifUrl: string) => void;
  onToggleEmojiPicker?: (show: boolean) => void;
}

export default function DMInputSection({
  userName,
  inputValue,
  uploading,
  sending,
  showEmojiPicker,
  textareaRef,
  fileUploadRef,
  onInputChange,
  onKeyDown,
  onFileSelect,
  onEmojiSelect,
  onGifSelect,
  onToggleEmojiPicker
}: DMInputSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="px-4 pb-6">
      <div className="message-input-container">
        <FileUpload
          ref={fileUploadRef}
          onFileSelect={onFileSelect}
          disabled={uploading || sending}
        />
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={onInputChange}
          onKeyDown={onKeyDown}
          placeholder={t('dm.messageUser', { user: userName || 'user' })}
          className="flex-1 bg-transparent text-discord-light placeholder-gray-500 resize-none outline-none p-3 max-h-48"
          rows={1}
          disabled={uploading || sending}
        />
        <EmojiPicker
          onEmojiSelect={onEmojiSelect}
          onGifSelect={onGifSelect}
          showPicker={showEmojiPicker}
          onTogglePicker={onToggleEmojiPicker}
        />
        {sending && (
          <div className="px-3 text-boxflow-muted text-sm">
            {t('common.sending')}
          </div>
        )}
      </div>
    </div>
  );
}
