// Font size selector component
import { cn } from '../../utils/classNames';

interface FontSizeSelectorProps {
  fontSize: string;
  onFontSizeChange: (size: string) => void;
}

const FONT_SIZES = ['small', 'medium', 'large'] as const;

export default function FontSizeSelector({
  fontSize,
  onFontSizeChange
}: FontSizeSelectorProps) {
  return (
    <div className="flex gap-2">
      {FONT_SIZES.map((size) => (
        <button
          key={size}
          onClick={() => onFontSizeChange(size)}
          className={cn(
            'px-4 py-2 rounded-lg capitalize transition-colors',
            fontSize === size
              ? 'gradient-primary text-white shadow-primary'
              : 'bg-boxflow-hover text-boxflow-muted hover:brightness-110'
          )}
        >
          {size}
        </button>
      ))}
    </div>
  );
}
