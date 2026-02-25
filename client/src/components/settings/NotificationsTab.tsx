// Notifications Settings Tab Component
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/classNames';
import NotificationSettings from '../NotificationSettings';
import NotificationSoundSelector, {
  type NotificationSoundType
} from '../ui/NotificationSoundSelector';

interface NotificationsTabProps {
  soundEnabled: boolean;
  notificationSoundType: NotificationSoundType;
  onSoundToggle: (enabled: boolean) => void;
  onNotificationSoundTypeChange: (sound: NotificationSoundType) => void;
  onPreviewNotificationSound: (sound: NotificationSoundType) => void;
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
      className={cn('toggle-track w-12 h-6', enabled && 'toggle-track-checked')}
    >
      <span
        className={cn(
          'absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform',
          enabled && 'translate-x-6'
        )}
      />
    </button>
  );
}

export default function NotificationsTab({
  soundEnabled,
  notificationSoundType,
  onSoundToggle,
  onNotificationSoundTypeChange,
  onPreviewNotificationSound
}: NotificationsTabProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Push Notifications Section */}
      <div className="mb-6">
        <NotificationSettings />
      </div>

      {/* Divider */}
      <div className="border-t border-discord-darkest" />

      {/* Sound Notifications Section */}
      <SettingItem
        title={t('notifications.notificationSound')}
        description={t('notifications.notificationSoundDescription')}
        control={<Toggle enabled={soundEnabled} onChange={onSoundToggle} />}
      />

      {/* Notification Sound Type Selector */}
      {soundEnabled && (
        <div className="mt-4">
          <h3 className="text-white font-semibold mb-2">Notification Sound</h3>
          <p className="text-sm text-gray-400 mb-3">
            Choose your preferred notification sound style
          </p>
          <NotificationSoundSelector
            value={notificationSoundType}
            onChange={onNotificationSoundTypeChange}
            onPreview={onPreviewNotificationSound}
          />
        </div>
      )}

      <div className="border-t border-discord-darkest pt-6">
        <p className="text-sm text-gray-400">
          💡 <strong>{t('notifications.howItWorks')}:</strong>{' '}
          {t('notifications.howItWorksDescription')}
        </p>
      </div>
    </div>
  );
}
