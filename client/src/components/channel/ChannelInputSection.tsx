// Channel Input Section Component
import { useTranslation } from 'react-i18next';
import FileUpload, { type FileUploadHandle } from '../FileUpload';
import EmojiPicker from '../ui/EmojiPicker';
import MentionAutocomplete from '../MentionAutocomplete';
import SlashCommandAutocomplete from '../SlashCommandAutocomplete';
import { PollIcon, DocumentIcon } from '../ui/Icons';

interface ChannelInputSectionProps {
  channelName?: string;
  inputValue: string;
  cursorPosition: number;
  uploading: boolean;
  showMentions: boolean;
  showSlashCommands: boolean;
  showEmojiPicker?: boolean;
  fileUploadRef?: React.RefObject<FileUploadHandle>;
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
  onToggleEmojiPicker?: (show: boolean) => void;
  onCreatePoll?: () => void;
  onOpenTemplates?: () => void;
}

export default function ChannelInputSection({
  channelName,
  inputValue,
  cursorPosition,
  uploading,
  showMentions,
  showSlashCommands,
  showEmojiPicker,
  fileUploadRef,
  textareaRef,
  onInputChange,
  onKeyDown,
  onFileSelect,
  onEmojiSelect,
  onGifSelect,
  onMentionSelect,
  onSlashCommandSelect,
  onCloseMentions,
  onCloseSlashCommands,
  onToggleEmojiPicker,
  onCreatePoll,
  onOpenTemplates
}: ChannelInputSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="px-4 pb-6">
      <div className="message-input-container">
        <FileUpload
          ref={fileUploadRef}
          onFileSelect={onFileSelect}
          disabled={uploading}
        />
        {onOpenTemplates && (
          <button
            type="button"
            onClick={onOpenTemplates}
            title={t('templates.title')}
            className="btn-icon"
          >
            <DocumentIcon />
          </button>
        )}
        {onCreatePoll && (
          <button
            type="button"
            onClick={onCreatePoll}
            title="Skapa omröstning"
            className="btn-icon"
          >
            <PollIcon />
          </button>
        )}
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={onInputChange}
          onKeyDown={onKeyDown}
          placeholder={t('messages.typeMessageInChannel', {
            channel: channelName || 'channel'
          })}
          className="flex-1 bg-transparent text-boxflow-light placeholder-boxflow-subtle resize-none outline-none p-3 max-h-48"
          rows={1}
          disabled={uploading}
        />
        <EmojiPicker
          onEmojiSelect={onEmojiSelect}
          onGifSelect={onGifSelect}
          showPicker={showEmojiPicker}
          onTogglePicker={onToggleEmojiPicker}
        />
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
