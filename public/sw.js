// Shadow Dashboard Service Worker (Mobile PWA & Desktop Web Push Notifications)
const CACHE_VERSION = 'shadow-v7';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    }).then(() => clients.claim())
  );
});

// Real-time Web Push Notification Listener (Triggers even when app is closed / backgrounded)
self.addEventListener('push', function(event) {
  let data = {
    title: 'Shadow Dashboard Alert',
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

  const options = {
    body: data.body || 'Scheduled reminder due now.',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    vibrate: data.vibrate || [250, 100, 250, 100, 250],
    tag: data.tag || `shadow-push-${Date.now()}`,
    renotify: true,
    requireInteraction: true,
    data: data.data || { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'Open Dashboard' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Shadow Alert', options)
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
      vibrate: [250, 100, 250, 100, 250],
      tag: options?.tag || `shadow-local-${Date.now()}`,
      renotify: true,
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

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if (targetUrl && targetUrl !== '/') {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
