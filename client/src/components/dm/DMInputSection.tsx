// DM Input Section Component (simpler than channel input - no mentions/commands)
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
  onEmojiSelect
}: DMInputSectionProps) {
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
          placeholder={`Meddelande @${userName ?? 'användare'}`}
          className="flex-1 bg-transparent text-discord-light placeholder-gray-500 resize-none outline-none p-3 max-h-48"
          rows={1}
          disabled={uploading || sending}
        />
        <EmojiPicker onEmojiSelect={onEmojiSelect} />
        {sending && (
          <div className="px-3 text-boxflow-muted text-sm">Skickar...</div>
        )}
      </div>
    </div>
  );
}
