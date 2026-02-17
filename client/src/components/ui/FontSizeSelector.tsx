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
              ? 'bg-gradient-to-r from-[#5865f2] to-[#4752c4] text-white shadow-lg shadow-[#5865f2]/25'
              : 'bg-[#404249] text-[#b5bac1] hover:bg-[#4e5158]'
          )}
        >
          {size}
        </button>
      ))}
    </div>
  );
}
