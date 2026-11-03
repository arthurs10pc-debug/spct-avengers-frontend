// Shadow Dashboard Service Worker (Mobile PWA & Desktop Notifications)
const CACHE_VERSION = 'shadow-v6';

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

// Real-time Push Notification Listener
self.addEventListener('push', function(event) {
  let data = { title: 'Shadow Dashboard Alert', body: 'Scheduled reminder or system update.' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || 'Scheduled reminder due now.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [250, 100, 250, 100, 250],
    tag: data.tag || 'shadow-reminder-alert',
    renotify: true,
    data: data.data || { url: '/' }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Shadow Watcher Alert', options)
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
      tag: options?.tag || 'shadow-reminder-alert',
      renotify: true,
      ...options
    };

    event.waitUntil(
      self.registration.showNotification(title || 'Shadow Watcher Alert', notificationOptions)
    );
  }
});

// Notification Click Handler: Focus app or open standalone window
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
