// Hook for image upload with validation and base64 conversion
import { useState } from 'react';
import { toast } from '../store/notification';

interface UseImageUploadOptions {
  maxSizeMB?: number;
  onError?: (message: string) => void;
}

export function useImageUpload(options: UseImageUploadOptions = {}) {
  const { maxSizeMB = 5, onError } = options;
  const [uploading, setUploading] = useState(false);

  const uploadImage = (
    file: File | null | undefined
  ): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!file) {
        resolve(null);
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        const message = 'Vänligen välj en bildfil';
        onError?.(message);
        toast.error(message);
        resolve(null);
        return;
      }

      // Validate file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        const message = `Bilden är för stor. Max ${maxSizeMB}MB.`;
        onError?.(message);
        toast.error(message);
        resolve(null);
        return;
      }

      setUploading(true);

      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploading(false);
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        setUploading(false);
        const message = 'Kunde inte läsa filen';
        onError?.(message);
        toast.error(message);
        resolve(null);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileInput = async (
    e: React.ChangeEvent<HTMLInputElement>
  ): Promise<string | null> => {
    const file = e.target.files?.[0];
    return uploadImage(file);
  };

  return {
    uploading,
    uploadImage,
    handleFileInput
  };
}
