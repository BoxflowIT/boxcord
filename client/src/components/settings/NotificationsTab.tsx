// Notifications Settings Tab Component

interface NotificationsTabProps {
  soundEnabled: boolean;
  onSoundToggle: (enabled: boolean) => void;
}

interface SettingItemProps {
  title: string;
  description: string;
  control: React.ReactNode;
}

function SettingItem({ title, description, control }: SettingItemProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <h3 className="text-white font-semibold mb-1">{title}</h3>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
      <div className="ml-4">{control}</div>
    </div>
  );
}

interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

function Toggle({ enabled, onChange }: ToggleProps) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        enabled
          ? 'bg-gradient-to-r from-[#5865f2] to-[#4752c4]'
          : 'bg-[#404249]'
      }`}
    >
      <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
          enabled ? 'translate-x-6' : ''
        }`}
      />
    </button>
  );
}

export default function NotificationsTab({
  soundEnabled,
  onSoundToggle
}: NotificationsTabProps) {
  return (
    <div className="space-y-6">
      <SettingItem
        title="Notification Sound"
        description="Play a sound when you receive a new message"
        control={<Toggle enabled={soundEnabled} onChange={onSoundToggle} />}
      />
      <div className="border-t border-discord-darkest pt-6">
        <p className="text-sm text-gray-400">
          💡 <strong>How it works:</strong> Notification sounds only play for
          messages in channels or DMs you're not currently viewing, and never
          for your own messages.
        </p>
      </div>
    </div>
  );
}
