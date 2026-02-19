// useFileDrop - Handle drag & drop file uploads
import { useState, useCallback, DragEvent } from 'react';

interface UseFileDropOptions {
  onFilesDrop: (files: File[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedTypes?: string[];
}

export function useFileDrop({
  onFilesDrop,
  maxFiles = 10,
  maxSizeMB = 10,
  acceptedTypes
}: UseFileDropOptions) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFiles = useCallback(
    (files: File[]): File[] => {
      setError(null);
      const validFiles: File[] = [];

      if (files.length > maxFiles) {
        setError(`Maximum ${maxFiles} files allowed`);
        return [];
      }

      for (const file of files) {
        // Check file size
        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > maxSizeMB) {
          setError(`File ${file.name} exceeds ${maxSizeMB}MB`);
          continue;
        }

        // Check file type
        if (acceptedTypes && acceptedTypes.length > 0) {
          const isAccepted = acceptedTypes.some((type) => {
            if (type.endsWith('/*')) {
              const category = type.split('/')[0];
              return file.type.startsWith(category + '/');
            }
            return file.type === type;
          });

          if (!isAccepted) {
            setError(`File type ${file.type} not accepted`);
            continue;
          }
        }

        validFiles.push(file);
      }

      return validFiles;
    },
    [maxFiles, maxSizeMB, acceptedTypes]
  );

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're leaving the drop zone entirely
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

      const files = Array.from(e.dataTransfer.files);
      const validFiles = validateFiles(files);

      if (validFiles.length > 0) {
        onFilesDrop(validFiles);
      }
    },
    [onFilesDrop, validateFiles]
  );

  return {
    isDragging,
    error,
    dragHandlers: {
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop
    }
  };
}
