// Shadow Dashboard Service Worker (Mobile PWA & Desktop Web Push Notifications)
const CACHE_VERSION = 'shadow-v10-ultra';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    }).then(() => clients.claim()).then(() => {
      return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
        windowClients.forEach(client => {
          client.postMessage({ type: 'FORCE_REFRESH_NEW_VERSION' });
        });
      });
    })
  );
});

// Real-time Web Push Notification Listener (Triggers even when app is closed / backgrounded)
self.addEventListener('push', function(event) {
  let data = {
    title: '⏰ Shadow Reminder Alert',
    body: 'Scheduled reminder or routine update.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: '/' }
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const task = data.data?.task || data.task || '';
  const time = data.data?.time || data.time || '';
  const targetUrl = data.data?.url || data.url || (task ? `/?reminder=${encodeURIComponent(task)}&time=${encodeURIComponent(time)}` : '/');

  const options = {
    body: data.body || (task ? `Scheduled at ${time || 'now'}. Tap to view & speak alert.` : 'Scheduled reminder due now.'),
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    vibrate: data.vibrate || [300, 100, 300, 100, 300],
    tag: data.tag || `shadow-push-${Date.now()}`,
    renotify: true,
    requireInteraction: true,
    data: {
      url: targetUrl,
      task: task,
      time: time,
      timestamp: Date.now()
    },
    actions: [
      { action: 'open', title: 'Open & View' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || '⏰ Shadow Alert', options)
  );
});

// Local Message Notification Listener (Triggered by frontend on mobile PWA)
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    const notificationOptions = {
      body: options?.body || 'Scheduled reminder due now.',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [300, 100, 300, 100, 300],
      tag: options?.tag || `shadow-local-${Date.now()}`,
      renotify: true,
      requireInteraction: true,
      ...options
    };

    event.waitUntil(
      self.registration.showNotification(title || 'Shadow Watcher Alert', notificationOptions)
    );
  }
});

// Notification Click Handler: Focus existing app or open standalone window
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const notifData = event.notification.data || {};
  const targetUrl = notifData.url || '/';
  const task = notifData.task || '';
  const time = notifData.time || '';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // 1. If an existing Shadow tab is open, bring it to front and trigger visual pop-up animation & speech!
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if (task) {
            client.postMessage({
              type: 'TRIGGER_REMINDER_ANIMATION',
              task: task,
              time: time
            });
          }
          return client.focus();
        }
      }
      // 2. If no tab is open, open the full dashboard with reminder query param
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
