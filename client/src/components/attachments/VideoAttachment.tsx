// Video attachment preview component
interface VideoAttachmentProps {
  fileUrl: string;
}

export default function VideoAttachment({ fileUrl }: VideoAttachmentProps) {
  return (
    <video src={fileUrl} controls className="rounded-lg max-w-md max-h-80" />
  );
}
