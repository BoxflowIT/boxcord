// Image Preview - Shows preview of uploaded/entered image URL
import { cn } from '../../utils/classNames';

interface ImagePreviewProps {
  src: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  label?: string;
  onError?: () => void;
}

const sizeClasses: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16'
};

const roundedClasses: Record<string, string> = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full'
};

export default function ImagePreview({
  src,
  alt = 'Preview',
  size = 'md',
  rounded = 'full',
  label = 'Förhandsgranskning',
  onError
}: ImagePreviewProps) {
  return (
    <div className="mt-2 flex-row">
      <img
        src={src}
        alt={alt}
        className={cn(
          sizeClasses[size],
          roundedClasses[rounded],
          'object-cover'
        )}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
          onError?.();
        }}
      />
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  );
}
