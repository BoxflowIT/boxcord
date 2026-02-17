// Custom hook for searching users based on @mention input
import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { MentionItem } from '../components/MentionAutocomplete';

interface MentionQuery {
  query: string;
  startPos: number;
  endPos: number;
}

interface UseMentionSearchProps {
  inputValue: string;
  cursorPosition: number;
  minQueryLength?: number;
  debounceMs?: number;
}

export function useMentionSearch({
  inputValue,
  cursorPosition,
  minQueryLength = 1,
  debounceMs = 200
}: UseMentionSearchProps) {
  const [results, setResults] = useState<MentionItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Find the @mention being typed
  const getMentionQuery = useCallback((): MentionQuery | null => {
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

    if (!mention || mention.query.length < minQueryLength) {
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
            value: `@${user.email}` // Full email for push notifications
          }))
        );
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchUsers, debounceMs);
    return () => clearTimeout(debounce);
  }, [inputValue, cursorPosition, getMentionQuery, minQueryLength, debounceMs]);

  return {
    results,
    loading,
    mentionQuery: getMentionQuery()
  };
}
