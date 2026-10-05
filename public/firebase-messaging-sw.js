importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyD-4gRvVI1Tx8VLADJRifzYN190_FqBbJa",
  authDomain: "spct-avengers-65de1.firebaseapp.com",
  projectId: "spct-avengers-65de1",
  storageBucket: "spct-avengers-65de1.appspot.com",
  messagingSenderId: "1085189203233",
  appId: "1:1085189203233:web:c568f971709a4c7846ca60",
  measurementId: "G-WJ3P8YTDZD"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title || 'SPCT Alert';
  const notificationOptions = {
    body: payload.notification.body || 'New Ride Request Available',
    icon: '/logo.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: 'spct-high-priority'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

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