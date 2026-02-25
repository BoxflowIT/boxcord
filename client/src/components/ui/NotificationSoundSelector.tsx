/**
 * Notification Sound Selector Component
 * Choose between different notification sound styles
 */

export type NotificationSoundType =
  | 'default'
  | 'subtle'
  | 'ping'
  | 'chime'
  | 'bell';

interface NotificationSoundSelectorProps {
  value: NotificationSoundType;
  onChange: (sound: NotificationSoundType) => void;
  onPreview: (sound: NotificationSoundType) => void;
}

const SOUNDS: { value: NotificationSoundType; label: string; emoji: string }[] =
  [
    { value: 'default', label: 'Default', emoji: '🔔' },
    { value: 'subtle', label: 'Subtle', emoji: '🔕' },
    { value: 'ping', label: 'Ping', emoji: '📍' },
    { value: 'chime', label: 'Chime', emoji: '🎵' },
    { value: 'bell', label: 'Bell', emoji: '🪘' }
  ];

export default function NotificationSoundSelector({
  value,
  onChange,
  onPreview
}: NotificationSoundSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-5 gap-2">
        {SOUNDS.map((sound) => (
          <div key={sound.value} className="flex flex-col gap-1">
            <button
              onClick={() => onChange(sound.value)}
              className={
                value === sound.value ? 'sound-btn-active' : 'sound-btn'
              }
            >
              <span className="text-2xl">{sound.emoji}</span>
              <span className="text-xs mt-1">{sound.label}</span>
            </button>
            <button
              onClick={() => onPreview(sound.value)}
              className="text-xs text-primary hover:text-primary-dark transition-colors"
            >
              Preview
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
