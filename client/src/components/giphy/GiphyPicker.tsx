/**
 * GiphyPicker Component
 * Modal for searching and selecting GIFs from Giphy
 */

import { useState } from 'react';
import { X, Search, TrendingUp } from 'lucide-react';
import {
  useGiphySearch,
  useGiphyTrending,
  type GiphyGif
} from '../../hooks/useGiphy';

interface GiphyPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (gif: GiphyGif) => void;
}

export function GiphyPicker({ isOpen, onClose, onSelect }: GiphyPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    const timer = setTimeout(() => {
      setDebouncedQuery(value);
    }, 500);
    return () => clearTimeout(timer);
  };

  const { data: searchResults, isLoading: isSearching } =
    useGiphySearch(debouncedQuery);
  const { data: trendingGifs, isLoading: isTrendingLoading } =
    useGiphyTrending(50);

  const gifs = debouncedQuery ? searchResults?.data : trendingGifs?.data;
  const isLoading = debouncedQuery ? isSearching : isTrendingLoading;

  if (!isOpen) return null;

  const handleGifClick = (gif: GiphyGif) => {
    onSelect(gif);
    onClose();
    setSearchQuery('');
    setDebouncedQuery('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-3xl max-h-[80vh] bg-[var(--color-bg-primary)] rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">
              {debouncedQuery ? 'Search GIFs' : 'Trending GIFs'}
            </h2>
            {!debouncedQuery && (
              <TrendingUp className="w-5 h-5 text-yellow-400" />
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[var(--color-bg-hover)] rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search bar */}
        <div className="p-4 border-b border-[var(--color-border)]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search for GIFs..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
        </div>

        {/* GIF Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
            </div>
          ) : gifs && gifs.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {gifs.map((gif) => (
                <button
                  key={gif.id}
                  onClick={() => handleGifClick(gif)}
                  className="relative aspect-square overflow-hidden rounded-lg hover:ring-2 hover:ring-blue-500 transition-all group"
                >
                  <img
                    src={gif.images.fixed_height.url}
                    alt={gif.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end p-2">
                    <p className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity truncate">
                      {gif.title}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Search className="w-12 h-12 mb-2" />
              <p>No GIFs found</p>
              <p className="text-sm">Try a different search term</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[var(--color-border)] text-center">
          <a
            href="https://giphy.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-gray-300"
          >
            Powered by GIPHY
          </a>
        </div>
      </div>
    </div>
  );
}
