// @mentions Autocomplete Component
import { useRef, useCallback } from 'react';
import { useAutocompleteNavigation } from '../hooks/useAutocompleteNavigation';
import { useMentionSearch } from '../hooks/useMentionSearch';
import MentionListItem from './ui/MentionListItem';

export interface MentionItem {
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
  const containerRef = useRef<HTMLDivElement>(null);

  // Search for mentions using custom hook
  const { results, loading, mentionQuery } = useMentionSearch({
    inputValue,
    cursorPosition
  });

  // Handle selection with mention position
  const handleSelectItem = useCallback(
    (item: MentionItem) => {
      if (mentionQuery) {
        onSelect(item, mentionQuery.startPos, mentionQuery.endPos);
      }
    },
    [mentionQuery, onSelect]
  );

  // Use shared autocomplete navigation hook
  const { selectedIndex, handleItemClick } = useAutocompleteNavigation({
    items: results,
    onSelect: handleSelectItem,
    onClose,
    containerRef,
    enabled: results.length > 0
  });

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
            <MentionListItem
              key={item.id}
              item={item}
              selected={index === selectedIndex}
              onClick={() => handleItemClick(item)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

// Hook for parsing mentions in rendered messages
// Matches @email (like @anna@boxflow.se) or @username
export function parseMentions(content: string): (string | JSX.Element)[] {
  // Match @email format or @word format
  const mentionRegex = /@([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|[\w]+)/g;
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    // Add text before the mention
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    // Format display: show name part of email or full username
    const mentionText = match[1];
    const displayName = mentionText.includes('@')
      ? `@${mentionText.split('@')[0]}` // Show @anna instead of @anna@boxflow.se
      : `@${mentionText}`;

    // Add the mention as a styled element
    parts.push(
      <span key={match.index} className="mention-link" title={mentionText.includes('@') ? mentionText : undefined}>
        {displayName}
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
