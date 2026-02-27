// Emoji & GIF Picker Component - Unified picker with tabs
import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import EmojiPickerReact, { EmojiClickData, Theme } from 'emoji-picker-react';
import { GiphyFetch } from '@giphy/js-fetch-api';
import { Grid } from '@giphy/react-components';
import type { IGif } from '@giphy/js-types';
import { GIPHY_CONFIG } from '../../config/giphy';
import { EmojiIcon } from './Icons';
import { logger } from '../../utils/logger';
import { retryGiphy } from '../../utils/retry';

const gf = new GiphyFetch(GIPHY_CONFIG.apiKey);
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onGifSelect?: (gifUrl: string) => void;
  showPicker?: boolean;
  onTogglePicker?: (show: boolean) => void;
}

type TabType = 'emojis' | 'gifs';

export default function EmojiPicker({
  onEmojiSelect,
  onGifSelect,
  showPicker: externalShowPicker,
  onTogglePicker
}: EmojiPickerProps) {
  const { t } = useTranslation();
  // Use external state if provided, otherwise internal
  const [internalShowPicker, setInternalShowPicker] = useState(false);
  const showPicker = externalShowPicker ?? internalShowPicker;
  const setShowPicker = useCallback(
    (show: boolean) => {
      if (onTogglePicker) {
        onTogglePicker(show);
      } else {
        setInternalShowPicker(show);
      }
    },
    [onTogglePicker]
  );
  const [activeTab, setActiveTab] = useState<TabType>('emojis');
  const [searchTerm, setSearchTerm] = useState('');
  const pickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });

  // Simple cache for GIF results (search term -> results)
  const gifCache = useRef<Map<string, { data: IGif[]; timestamp: number }>>(
    new Map()
  );

  // Update picker position when shown
  useEffect(() => {
    if (showPicker && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const pickerHeight = 500; // approx picker height
      const pickerWidth = 370; // approx picker width

      // Calculate available space above and below
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;

      let top: number;
      if (spaceAbove >= pickerHeight) {
        // Position above the button
        top = rect.top - pickerHeight;
      } else if (spaceBelow >= pickerHeight) {
        // Position below the button
        top = rect.bottom + 8;
      } else {
        // Center on screen if not enough space
        top = Math.max(10, (window.innerHeight - pickerHeight) / 2);
      }

      // Position horizontally - align right edge with button, constrain to viewport
      let left = rect.right - pickerWidth;
      left = Math.max(10, Math.min(left, window.innerWidth - pickerWidth - 10));

      setPickerPosition({ top, left });
    }
  }, [showPicker]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowPicker(false);
        setActiveTab('emojis'); // Reset to emojis on close
        setSearchTerm('');
      }
    };

    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPicker, setShowPicker]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showPicker) {
        setShowPicker(false);
        setActiveTab('emojis');
        setSearchTerm('');
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showPicker, setShowPicker]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData.emoji);
    setShowPicker(false);
    setActiveTab('emojis');
  };

  // Fetch GIFs based on search term with retry logic and caching
  const fetchGifs = useCallback(
    async (offset: number) => {
      const cacheKey = `${searchTerm || 'trending'}-${offset}`;

      // Check cache first
      const cached = gifCache.current.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        logger.debug('Using cached Giphy results', { cacheKey });
        return {
          data: cached.data,
          pagination: {
            total_count: cached.data.length,
            count: cached.data.length,
            offset
          },
          meta: { status: 200, msg: 'OK', response_id: 'cached' }
        };
      }

      try {
        // Retry with exponential backoff for rate limiting
        const result = await retryGiphy(async () => {
          if (searchTerm) {
            return await gf.search(searchTerm, { offset, limit: 10 });
          }
          return await gf.trending({ offset, limit: 10 });
        });

        // Cache successful results
        if (result.data.length > 0) {
          gifCache.current.set(cacheKey, {
            data: result.data,
            timestamp: Date.now()
          });
        }

        return result;
      } catch (error) {
        // After all retries failed, use fallback
        logger.warn(
          'Giphy API error after retries, using empty fallback',
          error
        );
        // Return empty result matching GifsResult type
        return {
          data: [],
          pagination: { total_count: 0, count: 0, offset },
          meta: { status: 200, msg: 'OK', response_id: '' }
        };
      }
    },
    [searchTerm]
  );

  const handleGifClick = (
    gif: IGif,
    e: React.SyntheticEvent<HTMLElement, Event>
  ) => {
    e.preventDefault();
    if (onGifSelect) {
      const gifUrl = gif.images.downsized_medium.url;
      onGifSelect(gifUrl);
      setShowPicker(false);
      setActiveTab('emojis');
      setSearchTerm('');
    }
  };

  const pickerElement = showPicker ? (
    <div
      ref={pickerRef}
      className="fixed bg-boxflow-darker border border-boxflow-hover rounded-lg shadow-xl overflow-hidden z-[99999]"
      style={{
        top: `${Math.max(10, pickerPosition.top)}px`,
        left: `${pickerPosition.left}px`
      }}
    >
      {/* Tabs */}
      <div className="flex border-b border-boxflow-hover">
        <button
          onClick={() => setActiveTab('emojis')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'emojis'
              ? 'bg-boxflow-hover text-white border-b-2 border-boxflow-primary'
              : 'text-boxflow-muted hover:text-white hover:bg-boxflow-hover/50'
          }`}
        >
          😊 Emojis
        </button>
        {onGifSelect && GIPHY_CONFIG.enabled && (
          <button
            onClick={() => setActiveTab('gifs')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'gifs'
                ? 'bg-boxflow-hover text-white border-b-2 border-boxflow-primary'
                : 'text-boxflow-muted hover:text-white hover:bg-boxflow-hover/50'
            }`}
          >
            🎬 GIFs
          </button>
        )}
      </div>

      {/* Emoji Tab */}
      {activeTab === 'emojis' && (
        <div>
          <EmojiPickerReact
            onEmojiClick={handleEmojiClick}
            theme={Theme.DARK}
            searchPlaceholder={t('emoji.searchEmoji')}
            height={400}
            width={350}
          />
        </div>
      )}

      {/* GIF Tab */}
      {activeTab === 'gifs' && onGifSelect && GIPHY_CONFIG.enabled && (
        <div className="w-[350px]">
          <div className="p-3 border-b border-boxflow-hover">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('emoji.searchGifs')}
              className="w-full px-3 py-2 bg-boxflow-darkest text-white rounded-lg border border-boxflow-hover focus:border-boxflow-primary outline-none text-sm"
              autoFocus
            />
          </div>

          <div className="h-[350px] overflow-y-auto">
            <Grid
              key={searchTerm}
              width={350}
              columns={2}
              gutter={6}
              fetchGifs={fetchGifs}
              onGifClick={handleGifClick}
              noLink={true}
            />
          </div>

          <div className="p-2 border-t border-boxflow-hover text-center">
            <a
              href="https://giphy.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-boxflow-muted hover:text-boxflow-light"
            >
              Powered by GIPHY
            </a>
          </div>
        </div>
      )}
    </div>
  ) : null;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className="btn-icon"
        title={t('emoji.addEmojiOrGif')}
      >
        <EmojiIcon />
      </button>
      {createPortal(pickerElement, document.body)}
    </div>
  );
}
