import { useState, useCallback } from 'react';

export interface UseModalStateOptions {
  defaultOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
}

/**
 * Hook for managing modal open/close state with callbacks
 */
export function useModalState(options: UseModalStateOptions = {}) {
  const { defaultOpen = false, onOpen, onClose } = options;
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const open = useCallback(() => {
    setIsOpen(true);
    onOpen?.();
  }, [onOpen]);

  const close = useCallback(() => {
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  return {
    isOpen,
    open,
    close,
    toggle
  };
}

/**
 * Hook for managing multiple modals with data
 */
export function useModalWithData<T>() {
  const [data, setData] = useState<T | null>(null);

  const open = useCallback((itemData: T) => {
    setData(itemData);
  }, []);

  const close = useCallback(() => {
    setData(null);
  }, []);

  const isOpen = data !== null;

  return {
    isOpen,
    data,
    open,
    close
  };
}
