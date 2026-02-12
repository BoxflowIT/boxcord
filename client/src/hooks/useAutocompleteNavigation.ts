// Custom hook for autocomplete keyboard navigation and selection
import { useState, useEffect, useCallback, RefObject } from 'react';

interface UseAutocompleteNavigationOptions<T> {
  items: T[];
  onSelect: (item: T) => void;
  onClose: () => void;
  containerRef: RefObject<HTMLElement>;
  enabled?: boolean;
}

/**
 * Reusable hook for autocomplete components with keyboard navigation
 * Handles: ArrowUp, ArrowDown, Enter, Tab, Escape, and click-outside-to-close
 */
export function useAutocompleteNavigation<T>({
  items,
  onSelect,
  onClose,
  containerRef,
  enabled = true
}: UseAutocompleteNavigationOptions<T>) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Reset selected index when items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!enabled || items.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % items.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
          break;
        case 'Enter':
        case 'Tab':
          if (items[selectedIndex]) {
            e.preventDefault();
            onSelect(items[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, selectedIndex, onSelect, onClose, enabled]);

  // Handle click outside to close
  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, containerRef, enabled]);

  const handleItemClick = useCallback(
    (item: T) => {
      onSelect(item);
    },
    [onSelect]
  );

  return {
    selectedIndex,
    setSelectedIndex,
    handleItemClick
  };
}
