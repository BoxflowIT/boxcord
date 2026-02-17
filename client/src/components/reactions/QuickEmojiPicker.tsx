// Quick emoji picker popup
interface QuickEmojiPickerProps {
  emojis: string[];
  onEmojiSelect: (emoji: string) => void;
}

export default function QuickEmojiPicker({
  emojis,
  onEmojiSelect
}: QuickEmojiPickerProps) {
  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-boxflow-darkest border border-boxflow-hover rounded-lg shadow-2xl flex gap-1 z-50">
      {emojis.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onEmojiSelect(emoji)}
          className="p-1 hover:bg-boxflow-hover rounded-lg text-lg transition-colors"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
