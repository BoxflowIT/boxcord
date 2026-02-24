// Hook for managing message drafts per channel/DM
// Auto-saves drafts to localStorage and restores when switching channels
import { useEffect, useCallback } from 'react';
import { logger } from '../utils/logger';

const DRAFT_PREFIX = 'boxcord_draft_';
const MAX_DRAFT_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface DraftData {
  content: string;
  timestamp: number;
}

/**
 * Manages message drafts per channel with auto-save to localStorage
 */
export function useDrafts(channelId: string | undefined) {
  const getDraftKey = useCallback(
    () => (channelId ? `${DRAFT_PREFIX}${channelId}` : null),
    [channelId]
  );

  // Load draft from localStorage
  const loadDraft = useCallback((): string => {
    const key = getDraftKey();
    if (!key) return '';

    try {
      const stored = localStorage.getItem(key);
      if (!stored) return '';

      const draft: DraftData = JSON.parse(stored);

      // Check if draft is too old
      if (Date.now() - draft.timestamp > MAX_DRAFT_AGE_MS) {
        localStorage.removeItem(key);
        return '';
      }

      return draft.content;
    } catch (error) {
      logger.error('Failed to load draft:', error);
      return '';
    }
  }, [getDraftKey]);

  // Save draft to localStorage
  const saveDraft = useCallback(
    (content: string) => {
      const key = getDraftKey();
      if (!key) return;

      try {
        if (!content.trim()) {
          // Remove empty drafts
          localStorage.removeItem(key);
          return;
        }

        const draft: DraftData = {
          content,
          timestamp: Date.now()
        };

        localStorage.setItem(key, JSON.stringify(draft));
      } catch (error) {
        logger.error('Failed to save draft:', error);
      }
    },
    [getDraftKey]
  );

  // Clear draft from localStorage
  const clearDraft = useCallback(() => {
    const key = getDraftKey();
    if (!key) return;

    try {
      localStorage.removeItem(key);
    } catch (error) {
      logger.error('Failed to clear draft:', error);
    }
  }, [getDraftKey]);

  // Cleanup old drafts on mount
  useEffect(() => {
    try {
      const now = Date.now();
      const keysToRemove: string[] = [];

      // Find expired drafts
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(DRAFT_PREFIX)) {
          try {
            const stored = localStorage.getItem(key);
            if (stored) {
              const draft: DraftData = JSON.parse(stored);
              if (now - draft.timestamp > MAX_DRAFT_AGE_MS) {
                keysToRemove.push(key);
              }
            }
          } catch {
            // Invalid JSON, remove it
            keysToRemove.push(key);
          }
        }
      }

      // Remove expired drafts
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch (error) {
      logger.error('Failed to cleanup old drafts:', error);
    }
  }, []);

  return {
    loadDraft,
    saveDraft,
    clearDraft
  };
}
