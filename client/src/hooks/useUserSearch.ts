// Custom hook for user search functionality
import { useState } from 'react';
import { api } from '../services/api';
import { logger } from '../utils/logger';

interface UserInfo {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
}

interface UseUserSearchProps {
  currentUserId?: string;
}

/**
 * Hook for searching users
 * Handles search query, results, and debouncing
 */
export function useUserSearch({ currentUserId }: UseUserSearchProps = {}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await api.searchUsers(query);
      // Filter out current user
      setSearchResults(
        results.filter((u) => !currentUserId || u.id !== currentUserId)
      );
    } catch (err) {
      logger.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  return {
    searchQuery,
    searchResults,
    isSearching,
    handleSearch,
    clearSearch
  };
}
