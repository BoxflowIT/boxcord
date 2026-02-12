// @mentions Autocomplete Component
import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api';
import { useAutocompleteNavigation } from '../hooks/useAutocompleteNavigation';
import Avatar from './ui/Avatar';

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

  // Handle selection with mention position
  const handleSelectItem = useCallback(
    (item: MentionItem) => {
      const mention = getMentionQuery();
      if (mention) {
        onSelect(item, mention.startPos, mention.endPos);
      }
    },
    [getMentionQuery, onSelect]
  );

  // Use shared autocomplete navigation hook
  const { selectedIndex, handleItemClick } = useAutocompleteNavigation({
    items: results,
    onSelect: handleSelectItem,
    onClose,
    containerRef,
    enabled: results.length > 0
  });

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
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchUsers, 200);
    return () => clearTimeout(debounce);
  }, [inputValue, cursorPosition, getMentionQuery]);

  if (results.length === 0 && !loading) return null;

  return (
    <div
      ref={containerRef}
      className="popup-container"
      style={{
        bottom: `calc(100% + 8px)`,
        left: position.left,
        minWidth: '200px',
        maxWidth: '300px'
      }}
    >
      {loading ? (
        <div className="px-4 py-3 text-muted">Söker...</div>
      ) : (
        <ul className="py-1">
          {results.map((item, index) => (
            <li
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={`popup-list-item flex items-center gap-3 ${
                index === selectedIndex
                  ? 'popup-list-item-selected'
                  : 'popup-list-item-default'
              }`}
            >
              <Avatar size="sm">{item.display[0].toUpperCase()}</Avatar>
              <div>
                <div className="font-medium">{item.display}</div>
                <div className="text-subtle">{item.value}</div>
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
