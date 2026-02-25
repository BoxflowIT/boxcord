// File Upload Component
import { useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { AttachmentIcon } from './ui/Icons';
import { validateFile, ALLOWED_FILE_TYPES } from '../utils/fileUtils';
import ImageAttachment from './attachments/ImageAttachment';
import VideoAttachment from './attachments/VideoAttachment';
import FileAttachment from './attachments/FileAttachment';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export interface FileUploadHandle {
  triggerFileSelect: () => void;
}

const FileUpload = forwardRef<FileUploadHandle, FileUploadProps>(
  ({ onFileSelect, disabled }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState<string | null>(null);

    const handleClick = () => {
      inputRef.current?.click();
    };

    // Expose triggerFileSelect to parent
    useImperativeHandle(ref, () => ({
      triggerFileSelect: handleClick
    }));

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const { valid, error: validationError } = validateFile(file);

      if (!valid) {
        setError(validationError);
        return;
      }

      setError(null);
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
          accept={ALLOWED_FILE_TYPES.join(',')}
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
);

FileUpload.displayName = 'FileUpload';

export default FileUpload;

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

  if (isImage) {
    return <ImageAttachment fileUrl={fileUrl} fileName={fileName} />;
  }

  if (isVideo) {
    return <VideoAttachment fileUrl={fileUrl} />;
  }

  // Generic file
  return (
    <FileAttachment fileName={fileName} fileUrl={fileUrl} fileSize={fileSize} />
  );
}
