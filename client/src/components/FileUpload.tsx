// File Upload Component
import { useRef, useState } from 'react';
import { AttachmentIcon, DocumentIcon, DownloadIcon } from './ui/Icons';

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
        className="btn-icon"
        title="Bifoga fil"
      >
        <AttachmentIcon />
      </button>
      {error && <div className="tooltip">{error}</div>}
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
      className="file-attachment"
    >
      <div className="file-icon-container">
        <DocumentIcon className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-boxflow-primary truncate">{fileName}</p>
        <p className="text-xs text-gray-400">{formatSize(fileSize)}</p>
      </div>
      <DownloadIcon className="text-gray-400" />
    </a>
  );
}
