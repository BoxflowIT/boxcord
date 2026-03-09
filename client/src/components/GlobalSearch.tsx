// Global Search Component - Advanced search across messages and DMs
// Supports filters: type (channel/dm), date range, author, channel, attachments
import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  SearchIcon,
  CloseIcon,
  HashIcon,
  ChatIcon,
  AttachmentIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from './ui/Icons';
import { api } from '../services/api';
import { useWorkspaces } from '../hooks/queries/workspace';
import { useChannels } from '../hooks/queries/channel';
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

interface SearchFilters {
  type: 'all' | 'channel' | 'dm';
  channelId?: string;
  workspaceId?: string;
  authorId?: string;
  before?: string;
  after?: string;
  hasAttachment?: boolean;
}

interface GlobalSearchProps {
  onClose: () => void;
  onResultClick: (result: SearchResult) => void;
}

const TYPE_TABS = [
  { key: 'all', icon: null },
  { key: 'channel', icon: HashIcon },
  { key: 'dm', icon: ChatIcon }
] as const;

export function GlobalSearch({ onClose, onResultClick }: GlobalSearchProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({ type: 'all' });
  const [resultCounts, setResultCounts] = useState({ channels: 0, dms: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Workspace & channel data for filter dropdowns
  const { data: workspaces } = useWorkspaces();
  const { data: channels } = useChannels(filters.workspaceId);

  const hasActiveFilters =
    filters.type !== 'all' ||
    !!filters.channelId ||
    !!filters.before ||
    !!filters.after ||
    !!filters.hasAttachment;

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Perform search
  const doSearch = useCallback(async (q: string, f: SearchFilters) => {
    if (q.trim().length < 2) {
      setResults([]);
      setResultCounts({ channels: 0, dms: 0 });
      setError(null);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const data = await api.globalSearch(q, {
        type: f.type === 'all' ? undefined : f.type,
        channelId: f.channelId,
        workspaceId: f.workspaceId,
        before: f.before ? new Date(f.before).toISOString() : undefined,
        after: f.after ? new Date(f.after).toISOString() : undefined,
        hasAttachment: f.hasAttachment || undefined
      });
      setResults(data.items);
      setResultCounts({
        channels: data.totalChannelResults,
        dms: data.totalDMResults
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Search with debounce when query or filters change
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      doSearch(query, filters);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, filters, doSearch]);

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

  const clearFilters = () => {
    setFilters({ type: 'all' });
  };

  const updateFilter = <K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K]
  ) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      // Clear channelId when workspace changes
      if (key === 'workspaceId') next.channelId = undefined;
      return next;
    });
  };

  const highlightMatch = (text: string, searchQuery: string) => {
    if (!searchQuery) return text;
    try {
      const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
      return parts.map((part, i) =>
        part.toLowerCase() === searchQuery.toLowerCase() ? (
          <mark key={i} className="bg-yellow-400/30 text-yellow-100">
            {part}
          </mark>
        ) : (
          part
        )
      );
    } catch {
      return text;
    }
  };

  const getAuthorName = (msg: SearchResult) => {
    if (msg.webhook) {
      return msg.webhook.name;
    }
    if (msg.author?.firstName || msg.author?.lastName) {
      return `${msg.author.firstName || ''} ${msg.author.lastName || ''}`.trim();
    }
    return msg.author?.email || 'Unknown';
  };

  return (
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
          onClick={() => setShowFilters(!showFilters)}
          className={`p-1.5 rounded transition-colors ${
            hasActiveFilters
              ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30'
              : 'hover:bg-boxflow-hover text-gray-400'
          }`}
          title={t('search.filters')}
        >
          {showFilters ? (
            <ChevronUpIcon size="sm" />
          ) : (
            <ChevronDownIcon size="sm" />
          )}
        </button>
        <button
          onClick={onClose}
          className="p-1 hover:bg-boxflow-hover rounded"
          title={t('common.close')}
        >
          <CloseIcon size="sm" />
        </button>
      </div>

      {/* Type Tabs */}
      <div className="flex border-b border-gray-700">
        {TYPE_TABS.map(({ key, icon: Icon }) => (
          <button
            key={key}
            onClick={() => updateFilter('type', key)}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
              filters.type === key
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {Icon && <Icon size="sm" />}
            {t(`search.type.${key}`)}
          </button>
        ))}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="p-4 border-b border-gray-700 bg-boxflow-darker/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">
              {t('search.advancedFilters')}
            </span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                {t('search.clearFilters')}
              </button>
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                {t('search.dateAfter')}
              </label>
              <input
                type="date"
                value={filters.after || ''}
                onChange={(e) =>
                  updateFilter('after', e.target.value || undefined)
                }
                className="w-full bg-boxflow-dark border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                {t('search.dateBefore')}
              </label>
              <input
                type="date"
                value={filters.before || ''}
                onChange={(e) =>
                  updateFilter('before', e.target.value || undefined)
                }
                className="w-full bg-boxflow-dark border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Workspace & Channel (only for channel type or all) */}
          {filters.type !== 'dm' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  {t('search.workspace')}
                </label>
                <select
                  value={filters.workspaceId || ''}
                  onChange={(e) =>
                    updateFilter('workspaceId', e.target.value || undefined)
                  }
                  className="w-full bg-boxflow-dark border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="">{t('search.allWorkspaces')}</option>
                  {workspaces?.map((ws) => (
                    <option key={ws.id} value={ws.id}>
                      {ws.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  {t('search.channel')}
                </label>
                <select
                  value={filters.channelId || ''}
                  onChange={(e) =>
                    updateFilter('channelId', e.target.value || undefined)
                  }
                  disabled={!filters.workspaceId}
                  className="w-full bg-boxflow-dark border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none disabled:opacity-50"
                >
                  <option value="">{t('search.allChannels')}</option>
                  {channels?.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      #{ch.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Has Attachment */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.hasAttachment || false}
              onChange={(e) =>
                updateFilter('hasAttachment', e.target.checked || undefined)
              }
              className="rounded border-gray-600 bg-boxflow-dark text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
            />
            <AttachmentIcon size="sm" className="text-gray-400" />
            <span className="text-sm text-gray-300">
              {t('search.hasAttachment')}
            </span>
          </label>
        </div>
      )}

      {/* Result counts */}
      {query.trim().length >= 2 && !isSearching && results.length > 0 && (
        <div className="px-4 py-2 border-b border-gray-700 text-xs text-gray-400 flex gap-3">
          <span>{t('search.resultCount', { count: results.length })}</span>
          {resultCounts.channels > 0 && (
            <span className="flex items-center gap-1">
              <HashIcon size="sm" /> {resultCounts.channels}
            </span>
          )}
          {resultCounts.dms > 0 && (
            <span className="flex items-center gap-1">
              <ChatIcon size="sm" /> {resultCounts.dms}
            </span>
          )}
        </div>
      )}

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
              <span className="mx-2">·</span>
              <span>{getAuthorName(result)}</span>
              <span className="mx-2">·</span>
              <span>{new Date(result.createdAt).toLocaleDateString()}</span>
              {result.attachments && result.attachments.length > 0 && (
                <>
                  <span className="mx-2">·</span>
                  <AttachmentIcon size="sm" />
                  <span>{result.attachments.length}</span>
                </>
              )}
            </div>

            {/* Message Content */}
            <div className="text-white line-clamp-2">
              {highlightMatch(result.content, query)}
            </div>

            {/* Attachment preview */}
            {result.attachments && result.attachments.length > 0 && (
              <div className="mt-2 flex gap-2 flex-wrap">
                {result.attachments.slice(0, 3).map((att) => (
                  <span
                    key={att.id}
                    className="text-xs bg-gray-700/50 text-gray-300 px-2 py-0.5 rounded flex items-center gap-1"
                  >
                    <AttachmentIcon size="sm" />
                    {att.fileName}
                  </span>
                ))}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-700 text-xs text-gray-500 text-center">
        {t('search.hint')}
      </div>
    </div>
  );
}
