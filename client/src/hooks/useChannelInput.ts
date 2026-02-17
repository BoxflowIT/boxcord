// Custom hook for channel input state and handlers
import { useState, useRef, useCallback } from 'react';
import { socketService } from '../services/socket';

interface UseChannelInputProps {
  channelId?: string;
  onShowMentions: (show: boolean) => void;
  onShowSlashCommands: (show: boolean) => void;
}

export function useChannelInput({
  channelId,
  onShowMentions,
  onShowSlashCommands
}: UseChannelInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<number>();

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursor = e.target.selectionStart ?? 0;
    setInputValue(value);
    setCursorPosition(cursor);

    // Check if we should show slash command autocomplete
    if (value.startsWith('/') && !value.includes(' ')) {
      onShowSlashCommands(true);
      onShowMentions(false);
    } else {
      onShowSlashCommands(false);

      // Check if we should show mention autocomplete
      const textBeforeCursor = value.slice(0, cursor);
      const atIndex = textBeforeCursor.lastIndexOf('@');
      if (atIndex !== -1) {
        const textAfterAt = textBeforeCursor.slice(atIndex + 1);
        const isValidAt = atIndex === 0 || value[atIndex - 1] === ' ';
        onShowMentions(isValidAt && !textAfterAt.includes(' '));
      } else {
        onShowMentions(false);
      }
    }

    // Send typing indicator (debounced)
    if (channelId) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = window.setTimeout(() => {
        socketService.sendTyping(channelId);
      }, 500);
    }
  };

  const handleMentionSelect = useCallback(
    (mention: { value: string }, startPos: number, endPos: number) => {
      const newValue =
        inputValue.slice(0, startPos) +
        mention.value +
        ' ' +
        inputValue.slice(endPos);
      setInputValue(newValue);
      onShowMentions(false);

      const newCursorPos = startPos + mention.value.length + 1;
      setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    },
    [inputValue, onShowMentions]
  );

  const handleSlashCommandSelect = useCallback(
    (command: { name: string; usage: string }) => {
      setInputValue(`/${command.name} `);
      onShowSlashCommands(false);

      setTimeout(() => {
        textareaRef.current?.focus();
        const len = command.name.length + 2;
        textareaRef.current?.setSelectionRange(len, len);
      }, 0);
    },
    [onShowSlashCommands]
  );

  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      const cursorPos =
        textareaRef.current?.selectionStart ?? inputValue.length;
      const newValue =
        inputValue.slice(0, cursorPos) + emoji + inputValue.slice(cursorPos);
      setInputValue(newValue);

      setTimeout(() => {
        textareaRef.current?.focus();
        const newCursorPos = cursorPos + emoji.length;
        textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    },
    [inputValue]
  );

  const clearInput = () => setInputValue('');

  return {
    inputValue,
    cursorPosition,
    textareaRef,
    handleInputChange,
    handleMentionSelect,
    handleSlashCommandSelect,
    handleEmojiSelect,
    clearInput,
    setInputValue
  };
}
