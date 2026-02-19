// DM Input Section Component (simpler than channel input - no mentions/commands)
import { useTranslation } from 'react-i18next';
import FileUpload from '../FileUpload';
import EmojiPicker from '../ui/EmojiPicker';

interface DMInputSectionProps {
  userName?: string;
  inputValue: string;
  uploading: boolean;
  sending: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onFileSelect: (file: File) => void;
  onEmojiSelect: (emoji: string) => void;
  onGifSelect: (gifUrl: string) => void;
}

export default function DMInputSection({
  userName,
  inputValue,
  uploading,
  sending,
  textareaRef,
  onInputChange,
  onKeyDown,
  onFileSelect,
  onEmojiSelect,
  onGifSelect
}: DMInputSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="px-4 pb-6">
      <div className="message-input-container">
        <FileUpload
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
        <EmojiPicker onEmojiSelect={onEmojiSelect} onGifSelect={onGifSelect} />
        {sending && (
          <div className="px-3 text-boxflow-muted text-sm">
            {t('common.sending')}
          </div>
        )}
      </div>
    </div>
  );
}
