/**
 * Volume Slider Component
 * Reusable volume control slider
 */

interface VolumeSliderProps {
  label: string;
  value: number; // 0-1
  onChange: (value: number) => void;
}

export default function VolumeSlider({
  label,
  value,
  onChange
}: VolumeSliderProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {label}: {Math.round(value * 100)}%
      </label>
      <input
        type="range"
        min="0"
        max="100"
        value={value * 100}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="w-full accent-green-600"
      />
    </div>
  );
}
