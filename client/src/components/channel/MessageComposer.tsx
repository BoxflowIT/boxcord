import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { logger } from '../../utils/logger';
import { useChannelInput } from '../../hooks/useChannelInput';
import FileUpload from '../FileUpload';
import EmojiPicker from '../ui/EmojiPicker';
import MentionAutocomplete from '../MentionAutocomplete';
import SlashCommandAutocomplete from '../SlashCommandAutocomplete';

interface MessageComposerProps {
  channelId: string;
  workspaceId?: string;
  placeholder?: string;
  onSend: (content: string) => void;
  onTyping?: () => void;
  onBotResponse?: (response: { content: string; isPrivate: boolean }) => void;
}

/**
 * Complete message composer with mentions, slash commands, emojis, and file uploads
 */
export default function MessageComposer({
  channelId,
  workspaceId,
  placeholder,
  onSend,
  onTyping,
  onBotResponse
}: MessageComposerProps) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [showSlashCommands, setShowSlashCommands] = useState(false);

  // Use shared input hook for input handling
  const {
    inputValue,
    cursorPosition,
    textareaRef,
    handleInputChange: baseHandleInputChange,
    handleMentionSelect,
    handleSlashCommandSelect,
    handleEmojiSelect,
    clearInput
  } = useChannelInput({
    channelId,
    onShowMentions: setShowMentions,
    onShowSlashCommands: setShowSlashCommands
  });

  // Wrap handleInputChange to add typing indicators
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      baseHandleInputChange(e);

      // Typing indicator
      if (onTyping) {
        onTyping();
      }
    },
    [baseHandleInputChange, onTyping]
  );

  const handleSend = useCallback(async () => {
    if (!inputValue.trim()) return;

    const content = inputValue.trim();
    clearInput(); // Clear input and draft

    // Handle slash commands
    if (content.startsWith('/')) {
      try {
        const result = await api.post<{
          content: string;
          isPrivate?: boolean;
        }>('/chatbot/execute', {
          command: content,
          channelId,
          workspaceId
        });

        if (result.data && onBotResponse) {
          onBotResponse({
            content: result.data.content,
            isPrivate: result.data.isPrivate ?? false
          });
        }
      } catch (error) {
        logger.error('Failed to execute command:', error);
      }
      return;
    }

    // Send regular message
    onSend(content);
  }, [inputValue, channelId, workspaceId, onSend, onBotResponse, clearInput]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleFileSelect = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        // Upload file to server
        const result = await api.uploadFile(file);
        const fileUrl = 'url' in result ? result.url : result.fileUrl;

        // Determine message format based on file type
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');

        let messageContent: string;
        if (isImage) {
          // Send as image embed
          messageContent = `![${file.name}](${fileUrl})`;
        } else if (isVideo) {
          // Send as video link
          messageContent = `🎬 [${file.name}](${fileUrl})`;
        } else {
          // Send as file attachment
          messageContent = `📎 [${file.name}](${fileUrl})`;
        }

        onSend(messageContent);
        logger.info('File uploaded and sent:', file.name);
      } catch (error) {
        logger.error('Failed to upload file:', error);
      } finally {
        setUploading(false);
      }
    },
    [onSend]
  );

  return (
    <div className="relative">
      {/* Autocomplete popups */}
      {showMentions && (
        <div className="absolute bottom-full mb-2 left-0 right-0">
          <MentionAutocomplete
            inputValue={inputValue}
            cursorPosition={cursorPosition}
            onSelect={handleMentionSelect}
            onClose={() => setShowMentions(false)}
            position={{ top: 0, left: 0 }}
          />
        </div>
      )}

      {showSlashCommands && (
        <div className="absolute bottom-full mb-2 left-0 right-0">
          <SlashCommandAutocomplete
            inputValue={inputValue.substring(1)}
            onSelect={handleSlashCommandSelect}
            onClose={() => {}}
          />
        </div>
      )}

      {/* Input area */}
      <div className="boxflow-bg-primary boxflow-border rounded-lg p-4">
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-transparent boxflow-text resize-none outline-none"
          rows={3}
        />

        {/* Actions */}
        <div className="flex items-center gap-2 mt-2">
          <FileUpload onFileSelect={handleFileSelect} disabled={uploading} />
          <EmojiPicker onEmojiSelect={handleEmojiSelect} />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || uploading}
            className="ml-auto px-4 py-2 boxflow-bg-accent boxflow-text rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {uploading ? t('common.uploading') : t('common.send')}
          </button>
        </div>
      </div>
    </div>
  );
}
