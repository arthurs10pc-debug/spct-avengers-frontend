import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Register Service Worker for Mobile PWA, "Add to Home Screen", and Native Notifications
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  // Listen for active service worker updates and force reload
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'FORCE_REFRESH_NEW_VERSION') {
      console.log('[Shadow PWA] New version activated, reloading...');
      window.location.reload();
    }
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      console.log('[Shadow PWA] Service Worker registered with scope:', reg.scope);
      // Immediately check for SW update on every app open
      reg.update().catch(() => {});

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[Shadow PWA] New update available, reloading to latest bundle...');
              window.location.reload();
            }
          });
        }
      });
    }).catch((err) => {
      console.warn('[Shadow PWA] Service Worker registration failed:', err);
    });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
