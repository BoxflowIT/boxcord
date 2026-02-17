// Image attachment preview component
interface ImageAttachmentProps {
  fileUrl: string;
  fileName: string;
}

export default function ImageAttachment({
  fileUrl,
  fileName
}: ImageAttachmentProps) {
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
