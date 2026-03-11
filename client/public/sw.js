// Boxcord Service Worker - Push Notifications
// @ts-nocheck

const sw = self;

// Install event - activate immediately
sw.addEventListener('install', (event) => {
  event.waitUntil(sw.skipWaiting());
});

// Activate event - claim clients
sw.addEventListener('activate', (event) => {
  event.waitUntil(sw.clients.claim());
});

// Push event - show notification
sw.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();

    const options = {
      body: data.body,
      icon: data.icon || '/logo-192.png',
      badge: '/logo-192.png',
      tag: data.tag || 'boxcord-notification',
      requireInteraction: false,
      data: {
        url: data.url || '/',
      },
    };

    event.waitUntil(sw.registration.showNotification(data.title, options));
  } catch (err) {
    console.error('Failed to parse push data:', err);
  }
});

// Notification click - open the app
sw.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    sw.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already an open window
      for (const client of clientList) {
        if (client.url.includes(sw.location.origin) && 'focus' in client) {
          client.focus();
          // Navigate to the notification URL
          if (client.navigate) {
            return client.navigate(url);
          }
          return;
        }
      }
      // No open window, open a new one
      return sw.clients.openWindow(url);
    })
  );
});
