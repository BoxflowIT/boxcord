// Avatar Upload - Avatar with upload overlay
import React, { useState } from 'react';
import Avatar from '../ui/Avatar';

interface AvatarUploadProps {
  src?: string;
  initial: string;
  onUpload: (file: File) => void;
  onRemove?: () => void;
  size?: 'sm' | 'md' | 'lg';
  isUploading?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function AvatarUpload({
  src,
  initial,
  onUpload,
  onRemove,
  size = 'lg',
  isUploading = false,
  disabled = false,
  className = ''
}: AvatarUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onUpload(file);
    }
  };

  return (
    <div className={`relative group ${className}`}>
      <Avatar size={size} src={src}>
        {initial}
      </Avatar>

      {/* Upload overlay */}
      {!disabled && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            absolute inset-0 rounded-full
            bg-black/70 opacity-0 group-hover:opacity-100
            transition-opacity flex flex-col items-center justify-center
            cursor-pointer text-white text-xs
            ${isDragging ? 'opacity-100 bg-black/80' : ''}
            ${isUploading ? 'opacity-100 cursor-wait' : ''}
          `}
        >
          {isUploading ? (
            <div className="spinner-ring w-6 h-6" />
          ) : (
            <>
              <label className="cursor-pointer text-center">
                <svg
                  className="w-6 h-6 mx-auto mb-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>Ladda upp</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {src && onRemove && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                  }}
                  className="mt-1 text-red-400 hover:text-red-300"
                >
                  Ta bort
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
