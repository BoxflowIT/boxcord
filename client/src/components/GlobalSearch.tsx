// Global Search Component - Search across all messages and DMs
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { SearchIcon, CloseIcon, HashIcon, ChatIcon } from './ui/Icons';
import { api } from '../services/api';
import type { Message } from '../types';

interface SearchResult extends Message {
  type: 'channel' | 'dm';
  channel?: {
    id: string;
    name: string;
    workspace?: {
      id: string;
      name: string;
    };
  };
}

interface GlobalSearchProps {
  onClose: () => void;
  onResultClick: (result: SearchResult) => void;
}

export function GlobalSearch({ onClose, onResultClick }: GlobalSearchProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Search with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim().length < 2) {
      setResults([]);
      setError(null);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      setError(null);

      try {
        const data = await api.globalSearch(query);
        setResults(data.items);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleResultClick = (result: SearchResult) => {
    onResultClick(result);
    onClose();
  };

  const highlightMatch = (text: string, searchQuery: string) => {
    if (!searchQuery) return text;

    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <mark key={i} className="bg-yellow-400/30 text-yellow-100">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const getAuthorName = (msg: SearchResult) => {
    if (msg.author?.firstName || msg.author?.lastName) {
      return `${msg.author.firstName || ''} ${msg.author.lastName || ''}`.trim();
    }
    return msg.author?.email || 'Unknown';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20">
      <div
        className="bg-boxflow-dark border border-gray-700 rounded-lg shadow-2xl w-full max-w-2xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-700">
          <SearchIcon size="md" className="text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search.placeholder')}
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500"
          />
          {isSearching && <div className="spinner-ring w-5 h-5" />}
          <button
            onClick={onClose}
            className="p-1 hover:bg-boxflow-hover rounded"
            title={t('common.close')}
          >
            <CloseIcon size="sm" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {error && <div className="p-4 text-red-400 text-center">{error}</div>}

          {!error && query.trim().length < 2 && (
            <div className="p-8 text-center text-gray-500">
              {t('search.typeToSearch')}
            </div>
          )}

          {!error &&
            query.trim().length >= 2 &&
            results.length === 0 &&
            !isSearching && (
              <div className="p-8 text-center text-gray-500">
                {t('search.noResults')}
              </div>
            )}

          {results.map((result) => (
            <button
              key={result.id}
              onClick={() => handleResultClick(result)}
              className="w-full p-4 hover:bg-boxflow-hover border-b border-gray-800 text-left transition-colors"
            >
              {/* Result Header */}
              <div className="flex items-center gap-2 mb-2 text-sm text-gray-400">
                {result.type === 'channel' ? (
                  <>
                    <HashIcon size="sm" />
                    <span>
                      {result.channel?.workspace?.name || 'Unknown'} / #
                      {result.channel?.name || 'Unknown'}
                    </span>
                  </>
                ) : (
                  <>
                    <ChatIcon size="sm" />
                    <span>{t('dm.title')}</span>
                  </>
                )}
                <span className="mx-2">•</span>
                <span>{getAuthorName(result)}</span>
                <span className="mx-2">•</span>
                <span>{new Date(result.createdAt).toLocaleDateString()}</span>
              </div>

              {/* Message Content */}
              <div className="text-white">
                {highlightMatch(result.content, query)}
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-700 text-xs text-gray-500 text-center">
          {t('search.hint')}
        </div>
      </div>
    </div>
  );
}
