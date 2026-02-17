// Generic file attachment preview component
import { DocumentIcon, DownloadIcon } from '../ui/Icons';
import { formatFileSize } from '../../utils/fileUtils';

interface FileAttachmentProps {
  fileName: string;
  fileUrl: string;
  fileSize: number;
}

export default function FileAttachment({
  fileName,
  fileUrl,
  fileSize
}: FileAttachmentProps) {
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
        <p className="text-xs text-gray-400">{formatFileSize(fileSize)}</p>
      </div>
      <DownloadIcon className="text-gray-400" />
    </a>
  );
}
