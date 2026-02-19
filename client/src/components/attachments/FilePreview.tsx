// File Preview - Preview different file types
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CloseIcon, DownloadIcon } from '../ui/Icons';

interface FilePreviewProps {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  onClose?: () => void;
}

export function FilePreview({
  fileName,
  fileUrl,
  fileType,
  fileSize,
  onClose
}: FilePreviewProps) {
  const { t } = useTranslation();
  const [error, setError] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderPreview = () => {
    if (error) {
      return (
        <div className="flex items-center justify-center h-full text-gray-400">
          {t('files.previewError')}
        </div>
      );
    }

    // Image preview
    if (fileType.startsWith('image/')) {
      return (
        <img
          src={fileUrl}
          alt={fileName}
          className="max-w-full max-h-full object-contain"
          onError={() => setError(true)}
        />
      );
    }

    // Video preview
    if (fileType.startsWith('video/')) {
      return (
        <video
          src={fileUrl}
          controls
          className="max-w-full max-h-full"
          onError={() => setError(true)}
        >
          {t('files.videoNotSupported')}
        </video>
      );
    }

    // Audio preview
    if (fileType.startsWith('audio/')) {
      return (
        <div className="flex flex-col items-center gap-4">
          <div className="text-6xl">🎵</div>
          <audio src={fileUrl} controls className="w-full max-w-md">
            {t('files.audioNotSupported')}
          </audio>
        </div>
      );
    }

    // PDF preview (iframe)
    if (fileType === 'application/pdf') {
      return (
        <iframe
          src={fileUrl}
          className="w-full h-full"
          title={fileName}
          onError={() => setError(true)}
        />
      );
    }

    // Text preview
    if (fileType.startsWith('text/')) {
      return (
        <iframe
          src={fileUrl}
          className="w-full h-full bg-white text-black"
          title={fileName}
          onError={() => setError(true)}
        />
      );
    }

    // Generic file - no preview
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
        <div className="text-6xl">📄</div>
        <div className="text-center">
          <div className="font-semibold">{fileName}</div>
          <div className="text-sm">{formatFileSize(fileSize)}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold truncate">{fileName}</h2>
          <p className="text-sm text-gray-400">{formatFileSize(fileSize)}</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={fileUrl}
            download={fileName}
            className="p-2 hover:bg-white/10 rounded"
            title={t('files.download')}
          >
            <DownloadIcon size="md" />
          </a>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded"
              title={t('common.close')}
            >
              <CloseIcon size="md" />
            </button>
          )}
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 flex items-center justify-center p-4">
        {renderPreview()}
      </div>
    </div>
  );
}

// Thumbnail component for file attachments
export function FileThumbnail({
  fileName,
  fileType,
  fileSize,
  onClick
}: {
  fileName: string;
  fileType: string;
  fileSize: number;
  onClick?: () => void;
}) {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = () => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType.startsWith('audio/')) return '🎵';
    if (fileType === 'application/pdf') return '📄';
    if (fileType.startsWith('text/')) return '📝';
    if (fileType.includes('zip') || fileType.includes('archive')) return '🗜️';
    return '📎';
  };

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-3 bg-gray-800/50 rounded hover:bg-gray-800 transition-colors text-left max-w-md"
    >
      <span className="text-3xl">{getFileIcon()}</span>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{fileName}</div>
        <div className="text-sm text-gray-400">{formatFileSize(fileSize)}</div>
      </div>
    </button>
  );
}
