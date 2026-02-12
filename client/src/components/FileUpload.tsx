// File Upload Component
import { useRef, useState } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

const MAX_SIZE = 25 * 1024 * 1024; // 25MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

export default function FileUpload({
  onFileSelect,
  disabled
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (file.size > MAX_SIZE) {
      setError('Filen är för stor (max 25MB)');
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Filtypen stöds inte');
      return;
    }

    onFileSelect(file);

    // Reset input
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="file"
        onChange={handleChange}
        className="hidden"
        accept={ALLOWED_TYPES.join(',')}
        disabled={disabled}
      />
      <button
        onClick={handleClick}
        disabled={disabled}
        className="p-2 text-gray-400 hover:text-white disabled:opacity-50"
        title="Bifoga fil"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
          />
        </svg>
      </button>
      {error && (
        <div className="absolute bottom-full left-0 mb-1 px-2 py-1 bg-red-500 text-white text-xs rounded whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  );
}

// Attachment preview component
interface AttachmentPreviewProps {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

export function AttachmentPreview({
  fileName,
  fileUrl,
  fileType,
  fileSize
}: AttachmentPreviewProps) {
  const isImage = fileType.startsWith('image/');
  const isVideo = fileType.startsWith('video/');

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isImage) {
    return (
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block max-w-md"
      >
        <img
          src={fileUrl}
          alt={fileName}
          className="rounded-lg max-h-80 object-contain"
        />
      </a>
    );
  }

  if (isVideo) {
    return (
      <video src={fileUrl} controls className="rounded-lg max-w-md max-h-80" />
    );
  }

  // Generic file
  return (
    <a
      href={fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 bg-discord-darker rounded-lg max-w-sm hover:bg-discord-dark transition-colors"
    >
      <div className="w-10 h-10 rounded bg-discord-blurple flex items-center justify-center">
        <svg
          className="w-5 h-5 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-discord-blurple truncate">{fileName}</p>
        <p className="text-xs text-gray-400">{formatSize(fileSize)}</p>
      </div>
      <svg
        className="w-5 h-5 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
    </a>
  );
}
