// Channel Input Section Component
import FileUpload from '../FileUpload';
import EmojiPicker from '../ui/EmojiPicker';
import MentionAutocomplete from '../MentionAutocomplete';
import SlashCommandAutocomplete from '../SlashCommandAutocomplete';

interface ChannelInputSectionProps {
  channelName?: string;
  inputValue: string;
  cursorPosition: number;
  uploading: boolean;
  showMentions: boolean;
  showSlashCommands: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onFileSelect: (file: File) => void;
  onEmojiSelect: (emoji: string) => void;
  onGifSelect: (gifUrl: string) => void;
  onMentionSelect: (
    mention: { value: string },
    startPos: number,
    endPos: number
  ) => void;
  onSlashCommandSelect: (command: { name: string; usage: string }) => void;
  onCloseMentions: () => void;
  onCloseSlashCommands: () => void;
}

export default function ChannelInputSection({
  channelName,
  inputValue,
  cursorPosition,
  uploading,
  showMentions,
  showSlashCommands,
  textareaRef,
  onInputChange,
  onKeyDown,
  onFileSelect,
  onEmojiSelect,
  onGifSelect,
  onMentionSelect,
  onSlashCommandSelect,
  onCloseMentions,
  onCloseSlashCommands
}: ChannelInputSectionProps) {
  return (
    <div className="px-4 pb-6">
      <div className="message-input-container">
        <FileUpload onFileSelect={onFileSelect} disabled={uploading} />
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={onInputChange}
          onKeyDown={onKeyDown}
          placeholder={`Skicka meddelande i #${channelName ?? 'kanal'}`}
          className="flex-1 bg-transparent text-boxflow-light placeholder-boxflow-subtle resize-none outline-none p-3 max-h-48"
          rows={1}
          disabled={uploading}
        />
        <EmojiPicker onEmojiSelect={onEmojiSelect} onGifSelect={onGifSelect} />
        {showMentions && (
          <MentionAutocomplete
            inputValue={inputValue}
            cursorPosition={cursorPosition}
            onSelect={onMentionSelect}
            onClose={onCloseMentions}
            position={{ top: 0, left: 50 }}
          />
        )}
        {showSlashCommands && (
          <SlashCommandAutocomplete
            inputValue={inputValue}
            onSelect={onSlashCommandSelect}
            onClose={onCloseSlashCommands}
          />
        )}
      </div>
    </div>
  );
}
