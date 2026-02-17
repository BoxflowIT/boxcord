// Hook for localStorage with type safety and reactivity
import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => void] {
  // Get initial value from localStorage or use default
  const [value, setValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  // Update localStorage when value changes
  const setStoredValue = useCallback(
    (newValue: T) => {
      try {
        setValue(newValue);
        localStorage.setItem(key, JSON.stringify(newValue));
        // Notify other components/tabs
        window.dispatchEvent(new Event('settingsChanged'));
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key]
  );

  // Sync with other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setValue(JSON.parse(e.newValue) as T);
        } catch {
          // Ignore parse errors
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [value, setStoredValue];
}
