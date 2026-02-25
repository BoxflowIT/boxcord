// Font size selector component

interface FontSizeSelectorProps {
  fontSize: string;
  onFontSizeChange: (size: string) => void;
}

const FONT_SIZES = [
  { value: 'small', label: 'Small', emoji: '🔹' },
  { value: 'medium', label: 'Medium', emoji: '🔸' },
  { value: 'large', label: 'Large', emoji: '🔶' }
];

export default function FontSizeSelector({
  fontSize,
  onFontSizeChange
}: FontSizeSelectorProps) {
  return (
    <div className="flex gap-2">
      {FONT_SIZES.map((size) => (
        <button
          key={size.value}
          onClick={() => onFontSizeChange(size.value)}
          className={
            fontSize === size.value ? 'settings-btn-active' : 'settings-btn'
          }
        >
          <span className="mr-1.5">{size.emoji}</span>
          {size.label}
        </button>
      ))}
    </div>
  );
}
