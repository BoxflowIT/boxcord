// @mentions Autocomplete Component
import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api';

interface MentionItem {
  id: string;
  display: string; // What to show in UI
  value: string; // What to insert (@username)
}

interface MentionAutocompleteProps {
  inputValue: string;
  cursorPosition: number;
  onSelect: (mention: MentionItem, startPos: number, endPos: number) => void;
  onClose: () => void;
  position: { top: number; left: number };
}

export default function MentionAutocomplete({
  inputValue,
  cursorPosition,
  onSelect,
  onClose,
  position
}: MentionAutocompleteProps) {
  const [results, setResults] = useState<MentionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Find the @mention being typed
  const getMentionQuery = useCallback(() => {
    const textBeforeCursor = inputValue.slice(0, cursorPosition);
    const atIndex = textBeforeCursor.lastIndexOf('@');

    if (atIndex === -1) return null;

    // Check if there's a space between @ and cursor
    const textAfterAt = textBeforeCursor.slice(atIndex + 1);
    if (textAfterAt.includes(' ')) return null;

    // Check if @ is at start or preceded by space
    if (atIndex > 0 && inputValue[atIndex - 1] !== ' ') return null;

    return {
      query: textAfterAt,
      startPos: atIndex,
      endPos: cursorPosition
    };
  }, [inputValue, cursorPosition]);

  useEffect(() => {
    const mention = getMentionQuery();

    if (!mention || mention.query.length < 1) {
      setResults([]);
      return;
    }

    const searchUsers = async () => {
      setLoading(true);
      try {
        const users = await api.searchUsers(mention.query);
        setResults(
          users.map((user) => ({
            id: user.id,
            display:
              user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : user.email.split('@')[0],
            value: `@${user.firstName?.toLowerCase() ?? user.email.split('@')[0]}`
          }))
        );
        setSelectedIndex(0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchUsers, 200);
    return () => clearTimeout(debounce);
  }, [inputValue, cursorPosition, getMentionQuery]);

  const handleSelect = useCallback(
    (item: MentionItem) => {
      const mention = getMentionQuery();
      if (mention) {
        onSelect(item, mention.startPos, mention.endPos);
      }
    },
    [getMentionQuery, onSelect]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (results.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % results.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(
            (prev) => (prev - 1 + results.length) % results.length
          );
          break;
        case 'Enter':
        case 'Tab':
          e.preventDefault();
          handleSelect(results[selectedIndex]);
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [results, selectedIndex, onClose, handleSelect]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (results.length === 0 && !loading) return null;

  return (
    <div
      ref={containerRef}
      className="absolute bg-discord-darker border border-discord-dark rounded-lg shadow-xl overflow-hidden z-50"
      style={{
        bottom: `calc(100% + 8px)`,
        left: position.left,
        minWidth: '200px',
        maxWidth: '300px'
      }}
    >
      {loading ? (
        <div className="px-4 py-3 text-gray-400 text-sm">Söker...</div>
      ) : (
        <ul className="py-1">
          {results.map((item, index) => (
            <li
              key={item.id}
              onClick={() => handleSelect(item)}
              className={`px-4 py-2 cursor-pointer flex items-center gap-3 ${
                index === selectedIndex
                  ? 'bg-discord-blurple text-white'
                  : 'text-gray-300 hover:bg-discord-dark'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-discord-blurple flex items-center justify-center text-white text-sm font-semibold">
                {item.display[0].toUpperCase()}
              </div>
              <div>
                <div className="font-medium">{item.display}</div>
                <div className="text-xs text-gray-400">{item.value}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Hook for parsing mentions in rendered messages
export function parseMentions(content: string): (string | JSX.Element)[] {
  const mentionRegex = /@(\w+)/g;
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    // Add text before the mention
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    // Add the mention as a styled element
    parts.push(
      <span
        key={match.index}
        className="text-discord-blurple bg-discord-blurple/10 rounded px-1 cursor-pointer hover:underline"
      >
        {match[0]}
      </span>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [content];
}
