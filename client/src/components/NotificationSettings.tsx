// Push Notification Settings Component
import { useState, useEffect } from 'react';
import { pushService } from '../services/push';

export default function NotificationSettings() {
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
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-heading">Push-notiser</h3>
          <p className="text-muted">
            Få notiser om nya meddelanden och omnämnanden
          </p>
        </div>

        <button
          onClick={handleToggle}
          disabled={loading}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            subscribed ? 'bg-discord-blurple' : 'bg-gray-600'
          } ${loading ? 'opacity-50' : ''}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              subscribed ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {subscribed && (
        <button
          onClick={handleTest}
          disabled={loading}
          className="text-sm text-discord-blurple hover:underline disabled:opacity-50"
        >
          Skicka testnotis
        </button>
      )}
    </div>
  );
}
