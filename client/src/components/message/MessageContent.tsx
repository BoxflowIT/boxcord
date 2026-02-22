// Reusable Message Content Component - Text content and attachments
import { AttachmentPreview } from '../FileUpload';
import { cn } from '../../utils/classNames';
import { isOnlyGifUrl, renderGif } from '../../utils/gifRenderer';
import { MessageEmbed } from './MessageEmbed';

export interface MessageAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

interface MessageContentProps {
  content: string;
  attachments?: MessageAttachment[];
  compact?: boolean;
  renderContent?: (content: string) => React.ReactNode;
}

export function MessageContent({
  content,
  attachments = [],
  compact = false,
  renderContent
}: MessageContentProps) {
  // Check if content is a GIF URL
  const isGif = isOnlyGifUrl(content);

  return (
    <>
      {isGif ? (
        // Render GIF as image
        renderGif(content)
      ) : (
        // Render normal text content - use div to prevent nesting issues
        <div
          className={cn(
            'text-boxflow-light break-words',
            compact ? 'text-sm leading-5' : 'text-base'
          )}
        >
          {renderContent ? renderContent(content) : content}
        </div>
      )}

      {/* Rich media embeds */}
      {!isGif && <MessageEmbed content={content} />}

      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="mt-2 space-y-2">
          {attachments.map((att) => (
            <AttachmentPreview
              key={att.id}
              fileName={att.fileName}
              fileUrl={att.fileUrl}
              fileType={att.fileType}
              fileSize={att.fileSize}
            />
          ))}
        </div>
      )}
    </>
  );
}
