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

    try {
      if (subscribed) {
        const success = await pushService.unsubscribe();
        if (success) {
          setSubscribed(false);
        }
      } else {
        const success = await pushService.subscribe();
        if (success) {
          setSubscribed(true);
          setPermission('granted');
        } else {
          // Check if permission was denied
          setPermission(Notification.permission);
        }
      }
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
        <h3 className="text-heading mb-2">Push-notiser</h3>
        <p className="text-muted">Din webbläsare stöder inte push-notiser.</p>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="card">
        <h3 className="text-heading mb-2">Push-notiser</h3>
        <p className="text-muted">
          Du har blockerat notiser. Aktivera dem i webbläsarens inställningar.
        </p>
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

      {subscribed && (
        <button
          onClick={handleTest}
          disabled={loading}
          className="text-sm text-link disabled:opacity-50 mt-3"
        >
          Skicka testnotis
        </button>
      )}
    </div>
  );
}
