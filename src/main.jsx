import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[Shadow App Crash Caught]:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          backgroundColor: '#f8fafc',
          color: '#0f172a',
          textAlign: 'center'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '28px 24px',
            maxWidth: '400px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
            border: '1.5px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🛡️</div>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>Shadow Recovery</h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>
              A display update is available. Tap below to refresh your dashboard with clean caches.
            </p>
            <button
              onClick={() => {
                try {
                  if ('caches' in window) {
                    caches.keys().then(k => Promise.all(k.map(c => caches.delete(c)))).then(() => {
                      window.location.reload();
                    });
                  } else {
                    window.location.reload();
                  }
                } catch (e) {
                  window.location.reload();
                }
              }}
              style={{
                backgroundColor: '#0f172a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '12px 24px',
                fontSize: '13px',
                fontWeight: '900',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              🔄 Refresh Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Register Service Worker for Mobile PWA, "Add to Home Screen", and Native Notifications
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  // Listen for active service worker updates and force reload with debounce
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'FORCE_REFRESH_NEW_VERSION') {
      const lastReload = sessionStorage.getItem('sw_last_reload');
      const now = Date.now();
      if (!lastReload || (now - Number(lastReload)) > 10000) {
        sessionStorage.setItem('sw_last_reload', String(now));
        console.log('[Shadow PWA] New version activated, reloading...');
        window.location.reload();
      }
    }
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      console.log('[Shadow PWA] Service Worker registered with scope:', reg.scope);
      // Check for SW update on app open
      reg.update().catch(() => {});

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              const lastReload = sessionStorage.getItem('sw_last_reload');
              const now = Date.now();
              if (!lastReload || (now - Number(lastReload)) > 10000) {
                sessionStorage.setItem('sw_last_reload', String(now));
                console.log('[Shadow PWA] New update available, reloading to latest bundle...');
                window.location.reload();
              }
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
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
