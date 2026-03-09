// Push Notification Settings Component
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { pushService } from '../services/push';
import ToggleSwitch from './ui/ToggleSwitch';

export default function NotificationSettings() {
  const { t } = useTranslation();
  const [supported, setSupported] = useState(true);
  const [permission, setPermission] =
    useState<NotificationPermission>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      const isSupported = pushService.isSupported();
      setSupported(isSupported);

      if (isSupported) {
        await pushService.init();
        const status = await pushService.getStatus();
        setPermission(status.permission);
        setSubscribed(status.subscribed);
      }
    };

    checkStatus();
  }, []);

  const handleToggle = async () => {
    setLoading(true);
    setError(null);

    try {
      if (subscribed) {
        const success = await pushService.unsubscribe();
        if (success) {
          setSubscribed(false);
        } else {
          setError(
            t(
              'notifications.unsubscribeError',
              'Failed to disable notifications'
            )
          );
        }
      } else {
        const success = await pushService.subscribe();
        if (success) {
          setSubscribed(true);
          setPermission('granted');
        } else {
          // Check if permission was denied
          const currentPermission = Notification.permission;
          setPermission(currentPermission);
          if (currentPermission === 'denied') {
            setError(t('notifications.permissionDenied'));
          } else {
            setError(
              t(
                'notifications.subscribeError',
                'Could not enable notifications. Make sure VAPID keys are configured on the server.'
              )
            );
          }
        }
      }
    } catch {
      setError(
        t(
          'notifications.subscribeError',
          'Could not enable notifications. Make sure VAPID keys are configured on the server.'
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setLoading(true);
    await pushService.sendTest();
    setLoading(false);
  };

  if (!supported) {
    return (
      <div className="card">
        <h3 className="text-heading mb-2">
          {t('notifications.pushNotifications')}
        </h3>
        <p className="text-muted">{t('notifications.browserNotSupported')}</p>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="card">
        <h3 className="text-heading mb-2">
          {t('notifications.pushNotifications')}
        </h3>
        <p className="text-muted">{t('notifications.permissionDenied')}</p>
      </div>
    );
  }

  return (
    <div className="card">
      <ToggleSwitch
        checked={subscribed}
        onChange={handleToggle}
        disabled={loading}
        label={t('notifications.title')}
        description={t('notifications.description')}
      />

      {error && <p className="text-sm text-red-400 mt-2">{error}</p>}

      {subscribed && (
        <button
          onClick={handleTest}
          disabled={loading}
          className="text-sm text-link disabled:opacity-50 mt-3"
        >
          {t('notifications.testNotification')}
        </button>
      )}
    </div>
  );
}
