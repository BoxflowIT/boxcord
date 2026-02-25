/**
 * Audio Quality Preset Selector Component
 * Provides quick presets for voice quality settings
 */

export type AudioQualityPreset = 'low' | 'balanced' | 'high' | 'studio';

interface AudioQualityPresetSelectorProps {
  value: AudioQualityPreset;
  onChange: (preset: AudioQualityPreset) => void;
}

const PRESETS: {
  value: AudioQualityPreset;
  label: string;
  description: string;
  emoji: string;
}[] = [
  {
    value: 'low',
    label: 'Low',
    description: 'Minimal processing, faster',
    emoji: '⚡'
  },
  {
    value: 'balanced',
    label: 'Balanced',
    description: 'Good quality, recommended',
    emoji: '✨'
  },
  {
    value: 'high',
    label: 'High',
    description: 'Enhanced processing',
    emoji: '🎯'
  },
  {
    value: 'studio',
    label: 'Studio',
    description: 'Maximum quality, AI powered',
    emoji: '🎙️'
  }
];

export default function AudioQualityPresetSelector({
  value,
  onChange
}: AudioQualityPresetSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-3">
        {PRESETS.map((preset) => (
          <button
            key={preset.value}
            onClick={() => onChange(preset.value)}
            className={
              value === preset.value ? 'preset-btn-active' : 'preset-btn'
            }
          >
            <span className="text-2xl mb-1 block">{preset.emoji}</span>
            <div className="font-medium">{preset.label}</div>
            <div className="text-xs opacity-75 mt-1">{preset.description}</div>
            {value === preset.value && (
              <div className="absolute top-2 right-2 text-xs">✓</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
