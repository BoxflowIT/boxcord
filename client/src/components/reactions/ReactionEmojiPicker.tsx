// Full emoji picker for reactions
import { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import EmojiPickerReact, { EmojiClickData, Theme } from 'emoji-picker-react';

interface ReactionEmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
  buttonRect?: DOMRect;
}

export default function ReactionEmojiPicker({
  onEmojiSelect,
  onClose,
  buttonRect
}: ReactionEmojiPickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Calculate position based on button position
  useEffect(() => {
    if (buttonRect) {
      const pickerWidth = 320;
      const pickerHeight = 400;

      // Position above the button, aligned to the right
      let left = buttonRect.right - pickerWidth;
      let top = buttonRect.top - pickerHeight - 8;

      // Keep picker on screen
      if (left < 8) left = 8;
      if (top < 8) top = buttonRect.bottom + 8; // If no room above, show below
      if (left + pickerWidth > window.innerWidth - 8) {
        left = window.innerWidth - pickerWidth - 8;
      }

      setPosition({ top, left });
    }
  }, [buttonRect]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData.emoji);
  };

  const pickerElement = (
    <div
      ref={pickerRef}
      className="fixed z-[99999] shadow-2xl rounded-lg overflow-hidden"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`
      }}
    >
      <EmojiPickerReact
        onEmojiClick={handleEmojiClick}
        theme={Theme.DARK}
        searchPlaceHolder="Search emojis..."
        height={400}
        width={320}
        previewConfig={{ showPreview: false }}
      />
    </div>
  );

  return createPortal(pickerElement, document.body);
}
