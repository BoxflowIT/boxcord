import { useCallback, useRef, useEffect } from 'react';

export interface UseTypingIndicatorOptions {
  onStartTyping: () => void;
  onStopTyping: () => void;
  timeout?: number; // Default 3000ms
}

/**
 * Hook for managing typing indicator state
 */
export function useTypingIndicator({
  onStartTyping,
  onStopTyping,
  timeout = 3000
}: UseTypingIndicatorOptions) {
  const typingTimeoutRef = useRef<number>();
  const isTyping = useRef(false);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const startTyping = useCallback(() => {
    if (!isTyping.current) {
      isTyping.current = true;
      onStartTyping();
    }

    // Reset timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      isTyping.current = false;
      onStopTyping();
    }, timeout);
  }, [onStartTyping, onStopTyping, timeout]);

  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (isTyping.current) {
      isTyping.current = false;
      onStopTyping();
    }
  }, [onStopTyping]);

  return {
    startTyping,
    stopTyping
  };
}
