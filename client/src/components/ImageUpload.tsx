// Image Upload Component for Server Icons
import { useRef, useState } from 'react';
import { IMAGE_UPLOAD } from '../constants/upload';

interface ImageUploadProps {
  currentImage?: string;
  onImageSelect: (file: File) => void;
  onImageRemove?: () => void;
}

export default function ImageUpload({
  currentImage,
  onImageSelect,
  onImageRemove
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Endast bildfiler är tillåtna');
      return;
    }

    // Validate file size
    if (file.size > IMAGE_UPLOAD.MAX_SIZE) {
      setError(`Bilden får max vara ${IMAGE_UPLOAD.MAX_SIZE_MB}MB`);
      return;
    }

    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    onImageSelect(file);

    // Reset input
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    setPreview(null);
    if (onImageRemove) {
      onImageRemove();
    }
  };

  const displayImage = preview || currentImage;

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        onChange={handleChange}
        className="hidden"
        accept="image/*"
      />

      <div className="flex items-center gap-4">
        {/* Image preview */}
        <div className="relative">
          {displayImage ? (
            <img
              src={displayImage}
              alt="Server icon"
              className="w-20 h-20 rounded-full object-cover border-2 border-boxflow-border"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-boxflow-hover border-2 border-boxflow-border flex items-center justify-center text-boxflow-subtle">
              <svg
                className="w-10 h-10"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Upload/remove buttons */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleClick}
            className="px-4 py-2 bg-boxflow-primary hover:bg-boxflow-primary-dark text-white rounded-md text-sm transition-colors"
          >
            {displayImage ? 'Byt bild' : 'Ladda upp bild'}
          </button>
          {displayImage && (
            <button
              type="button"
              onClick={handleRemove}
              className="px-4 py-2 bg-boxflow-hover hover:bg-red-600 text-boxflow-light hover:text-white rounded-md text-sm transition-colors"
            >
              Ta bort
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}

      <p className="text-xs text-boxflow-subtle">
        Rekommenderad storlek: {IMAGE_UPLOAD.RECOMMENDED_SIZE}. Max{' '}
        {IMAGE_UPLOAD.MAX_SIZE_MB}MB.
      </p>
    </div>
  );
}
