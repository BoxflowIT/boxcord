// Hook for handling file drag & drop and paste operations
import { useState, useCallback, useEffect, DragEvent } from 'react';

interface UseFileUploadOptions {
  onFilesSelected: (files: File[]) => void;
  acceptedTypes?: string[]; // e.g., ['image/*', 'application/pdf']
  maxFileSize?: number; // in bytes
  maxFiles?: number;
}

export function useFileUpload({
  onFilesSelected,
  acceptedTypes,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 5
}: UseFileUploadOptions) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFiles = useCallback(
    (files: FileList | File[]): File[] => {
      const fileArray = Array.from(files);

      // Check count
      if (fileArray.length > maxFiles) {
        setError(`Maximum ${maxFiles} files allowed`);
        return [];
      }

      // Validate each file
      const validFiles: File[] = [];
      for (const file of fileArray) {
        // Check size
        if (file.size > maxFileSize) {
          setError(
            `File "${file.name}" exceeds maximum size of ${(maxFileSize / 1024 / 1024).toFixed(0)}MB`
          );
          continue;
        }

        // Check type if specified
        if (acceptedTypes && acceptedTypes.length > 0) {
          const isAccepted = acceptedTypes.some((type) => {
            if (type.endsWith('/*')) {
              const category = type.split('/')[0];
              return file.type.startsWith(category + '/');
            }
            return file.type === type;
          });

          if (!isAccepted) {
            setError(`File type "${file.type}" not accepted`);
            continue;
          }
        }

        validFiles.push(file);
      }

      return validFiles;
    },
    [acceptedTypes, maxFileSize, maxFiles]
  );

  // Drag & Drop handlers
  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setError(null);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Only set dragging to false if we're leaving the main container
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      setError(null);

      const { files } = e.dataTransfer;
      if (files && files.length > 0) {
        const validFiles = validateFiles(files);
        if (validFiles.length > 0) {
          onFilesSelected(validFiles);
        }
      }
    },
    [validateFiles, onFilesSelected]
  );

  // Paste handler
  const handlePaste = useCallback(
    (e: React.ClipboardEvent | globalThis.ClipboardEvent) => {
      const clipboardData = e.clipboardData;
      if (!clipboardData) return;

      const { items } = clipboardData;
      const files: File[] = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) {
            files.push(file);
          }
        }
      }

      if (files.length > 0) {
        e.preventDefault(); // Prevent default paste behavior for files
        const validFiles = validateFiles(files);
        if (validFiles.length > 0) {
          onFilesSelected(validFiles);
        }
      }
    },
    [validateFiles, onFilesSelected]
  );

  // Global paste listener
  useEffect(() => {
    const handleGlobalPaste = (e: Event) => {
      handlePaste(e as globalThis.ClipboardEvent);
    };

    document.addEventListener('paste', handleGlobalPaste);
    return () => document.removeEventListener('paste', handleGlobalPaste);
  }, [handlePaste]);

  return {
    isDragging,
    error,
    setError,
    dragHandlers: {
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop
    },
    pasteHandler: handlePaste
  };
}
