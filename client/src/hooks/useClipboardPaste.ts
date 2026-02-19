// useClipboardPaste - Handle Ctrl+V paste for images and files
import { useEffect, useCallback } from 'react';

interface UseClipboardPasteOptions {
  onFilesPaste: (files: File[]) => void;
  enabled?: boolean;
}

export function useClipboardPaste({
  onFilesPaste,
  enabled = true
}: UseClipboardPasteOptions) {
  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      if (!enabled) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      const files: File[] = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        // Handle image paste
        if (item.type.startsWith('image/')) {
          const blob = item.getAsFile();
          if (blob) {
            // Create a File from the blob with a default name
            const file = new File([blob], `pasted-image-${Date.now()}.png`, {
              type: blob.type
            });
            files.push(file);
          }
        }
        // Handle file paste (some browsers support this)
        else if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) {
            files.push(file);
          }
        }
      }

      if (files.length > 0) {
        e.preventDefault();
        onFilesPaste(files);
      }
    },
    [enabled, onFilesPaste]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [enabled, handlePaste]);
}
