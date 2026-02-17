import { useState, useRef, useCallback, useEffect } from 'react';
import { api } from '../../services/api';
import { logger } from '../../utils/logger';
import FileUpload from '../FileUpload';
import EmojiPicker from '../ui/EmojiPicker';
import MentionAutocomplete from '../MentionAutocomplete';
import type { MentionItem } from '../MentionAutocomplete';
import SlashCommandAutocomplete from '../SlashCommandAutocomplete';

interface SlashCommand {
  name: string;
  description: string;
  usage: string;
}

interface MessageComposerProps {
  channelId: string;
  workspaceId?: string;
  placeholder?: string;
  onSend: (content: string) => void;
  onTyping?: () => void;
  onStopTyping?: () => void;
  onBotResponse?: (response: { content: string; isPrivate: boolean }) => void;
}

/**
 * Complete message composer with mentions, slash commands, emojis, and file uploads
 */
export default function MessageComposer({
  channelId,
  workspaceId,
  placeholder = 'Skriv meddelande...',
  onSend,
  onTyping,
  onStopTyping,
  onBotResponse
}: MessageComposerProps) {
  const [inputValue, setInputValue] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [showMentions, setShowMentions] = useState(false);
  const [showSlashCommands, setShowSlashCommands] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<number>();

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      const cursor = e.target.selectionStart;

      setInputValue(value);
      setCursorPosition(cursor);

      // Check for mentions
      const beforeCursor = value.substring(0, cursor);
      const mentionMatch = beforeCursor.match(/@(\w*)$/);
      setShowMentions(!!mentionMatch);

      // Check for slash commands
      setShowSlashCommands(value.startsWith('/') && !value.includes(' '));

      // Typing indicator
      if (onTyping) {
        onTyping();
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = window.setTimeout(() => {
          onStopTyping?.();
        }, 3000);
      }
    },
    [onTyping, onStopTyping]
  );

  const handleSend = useCallback(async () => {
    if (!inputValue.trim()) return;

    const content = inputValue.trim();
    setInputValue('');

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
  }, [inputValue, channelId, workspaceId, onSend, onBotResponse]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleMentionSelect = useCallback(
    (mention: MentionItem, startPos: number, endPos: number) => {
      if (!textareaRef.current) return;

      const textarea = textareaRef.current;
      const beforeMention = inputValue.substring(0, startPos);
      const afterMention = inputValue.substring(endPos);

      const newValue = `${beforeMention}${mention.value} ${afterMention}`;

      setInputValue(newValue);
      setShowMentions(false);

      // Set cursor after mention
      const newCursorPos = startPos + mention.value.length + 1;
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    },
    [inputValue]
  );

  const handleCommandSelect = useCallback((command: SlashCommand) => {
    setInputValue(`/${command.name} `);
    setShowSlashCommands(false);
    textareaRef.current?.focus();
  }, []);

  const handleEmojiSelect = useCallback((emoji: string) => {
    setInputValue((prev) => prev + emoji);
    textareaRef.current?.focus();
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    // Handle file upload here - you might want to upload it and get a URL
    logger.info('File selected:', file.name);
  }, []);

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
            onSelect={handleCommandSelect}
            onClose={() => setShowSlashCommands(false)}
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
          <FileUpload onFileSelect={handleFileSelect} />
          <EmojiPicker onEmojiSelect={handleEmojiSelect} />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="ml-auto px-4 py-2 boxflow-bg-accent boxflow-text rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            Skicka
          </button>
        </div>
      </div>
    </div>
  );
}
