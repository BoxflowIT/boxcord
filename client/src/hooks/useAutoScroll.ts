import { useEffect, useRef } from 'react';

export interface UseAutoScrollOptions {
  /**
   * Dependencies array - when these change, scroll to bottom
   */
  dependencies: any[];
  /**
   * Scroll behavior
   */
  behavior?: ScrollBehavior;
  /**
   * Enable auto-scroll
   */
  enabled?: boolean;
}

/**
 * Hook for auto-scrolling to bottom when dependencies change
 */
export function useAutoScroll({
  dependencies,
  behavior = 'smooth',
  enabled = true
}: UseAutoScrollOptions) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;

    scrollRef.current?.scrollIntoView({ behavior });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return scrollRef;
}
