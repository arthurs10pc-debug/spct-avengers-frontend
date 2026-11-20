import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { jsPDF } from 'jspdf';
import { 
  Shield, Volume2, Bell, VolumeX, Clock, 
  X, Activity, Navigation, Edit2, Trash2, Plus, Mic, AlertTriangle, Square, 
  DollarSign, Newspaper, Check, MapPin, Moon, UserCircle, LogIn, Wrench, Download, Upload, FileText, UserPlus,
  Search, RotateCw, ExternalLink, Zap, Tag, Coffee, Bus, BookOpen, ShoppingBag, FileSpreadsheet, RefreshCw,
  Globe, Play, Pause, Radio, Landmark, Building2, Flame, CheckSquare, Pin, Mail, Send, Sparkles, Filter,
  Power, TrendingUp, TrendingDown, BarChart2, PieChart, Calendar, ArrowUpRight, ArrowDownRight, StopCircle, Image, Video, Music, Paperclip, Eye,
  Palette, ArrowRight, FileType, Sliders, Wand2, Eraser,
  Wifi, Battery, Signal, LayoutGrid, SlidersHorizontal,
  MessageSquare, Star, HelpCircle, Heart,
  Coins, Fuel, Share2, QrCode
} from 'lucide-react';
import PhotoEditorModal from './components/PhotoEditorModal';
import DailyBhavModal from './features/dailyBhav/DailyBhavModal';
import NotesModal from './features/notes/NotesModal';
import ExpensesModal from './features/expenses/ExpensesModal';
import WatcherModal from './features/watcher/WatcherModal';
import ReminderAlertModal from './features/watcher/ReminderAlertModal';
import ProfileModal from './features/profile/ProfileModal';
const BACKEND_URL = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || /^192\.168\./.test(window.location.hostname) || /^10\./.test(window.location.hostname)))
  ? `http://${window.location.hostname}:5001`
  : "https://spct-avengers-backend.onrender.com";
const GOOGLE_CLIENT_ID = "644760404837-q0g258ajc1r1vjo8jqtru2c1cc11q1n7.apps.googleusercontent.com";

const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};


// Real-Time Dynamic Indian IPO Intelligence Database Generator (Always 100% Current Date, Never Stale)
const ShadowLogo = ({ size = 24, color = '#0f172a', innerColor = '#ffffff' }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 100 100" 
    width={size} 
    height={size} 
    fill="none" 
    style={{ display: 'block', flexShrink: 0 }}
  >
    <path d="M50 5 L90 21 V52 C90 75 72 91 50 97 C28 91 10 75 10 52 V21 L50 5 Z" fill={color} />
    <path d="M50 12 L83 26 V50 C83 69 68 83 50 89 C32 83 17 69 17 50 V26 L50 12 Z" fill={innerColor} />
    <path d="M30 33 H70 V47 H46 V53 H70 V71 H30 V57 H54 V51 H30 Z" fill={color} />
    <polygon points="50,18 54,23 50,28 46,23" fill={color} />
  </svg>
);

// Full Screen Startup Animation: High-Performance GPU-Accelerated 60/120 FPS
// Features: Zero-Lag Letter Reveal + Rotating Light Sweep + Dynamic Shadow Retraction into 3D Bevel
const ShadowStartupAnimation = ({ onComplete }) => {
  const [fadingOut, setFadingOut] = useState(false);

  const handleFinish = useCallback(() => {
    if (fadingOut) return;
    setFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 320);
  }, [fadingOut, onComplete]);

  useEffect(() => {
    // Total duration: 1.85 seconds, then smooth fade
    const timer = setTimeout(() => {
      handleFinish();
    }, 1850);
    return () => clearTimeout(timer);
  }, [handleFinish]);

  const letters = ['S', 'H', 'A', 'D', 'O', 'W'];

  return (
    <div
      onClick={handleFinish}
      title="Tap to skip"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100dvh',
        zIndex: 999999,
        backgroundColor: '#ffffff',
        cursor: 'pointer',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: fadingOut ? 0 : 1,
        transition: 'opacity 0.32s cubic-bezier(0.4, 0, 0.2, 1)',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        padding: '20px'
      }}
    >
      <style>{`
        @keyframes shadowLogoSweep {
          0% {
            opacity: 0;
            transform: scale(0.92);
            filter: drop-shadow(-8px 14px 10px rgba(189,195,199,0.5));
          }
          15% {
            opacity: 1;
            transform: scale(1);
            filter: drop-shadow(-14px 22px 14px rgba(189,195,199,0.7));
          }
          45% {
            filter: drop-shadow(-8px 26px 16px rgba(189,195,199,0.8)) drop-shadow(-4px 12px 10px rgba(15,23,42,0.12));
          }
          70% {
            filter: drop-shadow(0px 20px 14px rgba(189,195,199,0.85)) drop-shadow(0px 10px 10px rgba(15,23,42,0.15));
          }
          85% {
            transform: scale(1);
            filter: drop-shadow(2px 5px 0px #BDC3C7) drop-shadow(4px 9px 12px rgba(15,23,42,0.2));
          }
          100% {
            transform: scale(1);
            filter: drop-shadow(2px 5px 0px #BDC3C7) drop-shadow(4px 9px 12px rgba(15,23,42,0.2));
          }
        }

        @keyframes shadowTextSweep {
          0% {
            text-shadow: -4px 6px 0 #BDC3C7, -8px 12px 0 #CBD5E1;
          }
          30% {
            text-shadow: -10px 18px 0 #BDC3C7, -18px 32px 0 #CBD5E1, -24px 44px 12px rgba(15,23,42,0.12);
          }
          55% {
            text-shadow: -4px 20px 0 #BDC3C7, -8px 36px 0 #CBD5E1, -12px 50px 14px rgba(15,23,42,0.14);
          }
          75% {
            text-shadow: 0px 16px 0 #BDC3C7, 0px 28px 0 #CBD5E1, 0px 38px 14px rgba(15,23,42,0.15);
          }
          88% {
            text-shadow: 1px 3px 0 #BDC3C7, 2px 5px 0 #CBD5E1, 3px 7px 0 #CBD5E1, 4px 8px 12px rgba(15,23,42,0.18);
          }
          100% {
            text-shadow: 1px 2px 0 #BDC3C7, 2px 4px 0 #CBD5E1, 3px 6px 0 #CBD5E1, 4px 8px 12px rgba(15,23,42,0.18);
          }
        }

        @keyframes letterPop {
          0% {
            opacity: 0;
            transform: translateY(-8px) scale(0.94);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .startup-logo-shield {
          animation: shadowLogoSweep 1.85s cubic-bezier(0.25, 1, 0.5, 1) forwards;
          will-change: filter, transform;
        }

        .startup-word-text {
          animation: shadowTextSweep 1.85s cubic-bezier(0.25, 1, 0.5, 1) forwards;
          will-change: text-shadow;
        }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '18px', transform: 'translateY(-10px)' }}>
        {/* Official Geometric Stealth Shield Brand Logo */}
        <div className="startup-logo-shield" style={{ width: '76px', height: '76px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShadowLogo size={76} color="#0f172a" innerColor="#ffffff" />
        </div>

        {/* Stationary Letter Placement with Staggered Snap Reveal */}
        <div 
          className="startup-word-text" 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'clamp(36px, 9vw, 64px)',
            fontWeight: '900',
            color: '#0f172a',
            letterSpacing: 'clamp(4px, 1.2vw, 8px)',
            fontFamily: "'Montserrat', 'Inter', -apple-system, sans-serif",
            textTransform: 'uppercase'
          }}
        >
          {letters.map((letter, idx) => (
            <span
              key={idx}
              style={{
                display: 'inline-block',
                animation: `letterPop 0.28s cubic-bezier(0.2, 0.8, 0.3, 1) ${idx * 0.08}s both`,
                willChange: 'transform, opacity'
              }}
            >
              {letter}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};


// Non-destructive intelligent expense merge (deduplicates, preserves IDs, honors deletes, orders newest first)
const mergeExpenses = (localList = [], remoteList = [], deletedIds = []) => {
  const deletedSet = new Set((Array.isArray(deletedIds) ? deletedIds : []).map(id => String(id)));
  const map = new Map();

  const processExp = (exp) => {
    if (!exp) return;
    const rawId = exp.id || `tx_${exp.date || ''}_${exp.title || ''}_${exp.amount || ''}`;
    const id = String(rawId);
    if (deletedSet.has(id)) return; // Exclude deleted expenses

    const item = {
      ...exp,
      id,
      title: String(exp.title || 'Expense').trim(),
      amount: parseFloat(exp.amount) || 0,
      category: exp.category || 'Food & Snacks',
      type: exp.type || 'expense',
      date: exp.date || new Date().toISOString().slice(0, 10),
      createdAt: exp.createdAt || (exp.date ? new Date(exp.date).getTime() : Date.now()) || Date.now()
    };

    if (map.has(id)) {
      const prev = map.get(id);
      if ((item.createdAt || 0) >= (prev.createdAt || 0)) {
        map.set(id, { ...prev, ...item });
      }
    } else {
      map.set(id, item);
    }
  };

  if (Array.isArray(localList)) localList.forEach(processExp);
  if (Array.isArray(remoteList)) remoteList.forEach(processExp);

  const merged = Array.from(map.values());
  merged.sort((a, b) => {
    const timeA = a.createdAt || (a.date ? new Date(a.date).getTime() : 0);
    const timeB = b.createdAt || (b.date ? new Date(b.date).getTime() : 0);
    return timeB - timeA;
  });
  return merged;
};

// Flexible month matcher for expense items across diverse date formats
const isExpenseInMonth = (item, ymStr) => {
  if (!item) return false;
  if (!item.date) return true;
  const dStr = String(item.date).trim();
  if (dStr.startsWith(ymStr) || dStr.includes(ymStr)) return true;

  try {
    const dt = new Date(dStr);
    if (!isNaN(dt.getTime())) {
      const itemYm = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      if (itemYm === ymStr) return true;
    }
  } catch (e) {}

  const parts = dStr.split(/[\/\-\.]/);
  if (parts.length === 3) {
    const [targetYear, targetMonth] = ymStr.split('-');
    const mNum = parseInt(targetMonth, 10);
    if (parts.includes(targetYear) && (parts.includes(targetMonth) || parts.includes(String(mNum)))) {
      return true;
    }
  }
  return false;
};


// Convert VAPID base64 string to Uint8Array for PushManager subscription
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Live Header Clock Component (Self-contained 1000ms clock so root App does not re-render every second)
const LiveHeaderClock = React.memo(() => {
  const [clockStr, setClockStr] = useState('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
      const dateStr = now.toLocaleDateString('en-US', options);
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setClockStr(`${dateStr} | ${timeStr}`);
    };
    updateDateTime();
    const timer = setInterval(updateDateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return <span style={{ color: '#FCD34D', fontWeight: '800' }}>{clockStr || new Date().toLocaleTimeString()}</span>;
});

export default function App() {
  const [isMuted, setIsMuted] = useState(false);
  const [showDailyBhavModal, setShowDailyBhavModal] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceFeedbackMessage, setVoiceFeedbackMessage] = useState('');
  const [assistantStatus, setAssistantStatus] = useState("Shadow System Active...");

  // Web Push PWA Subscription State
  const [isPushSubscribed, setIsPushSubscribed] = useState(() => {
    try {
      return localStorage.getItem('jarvis_pwa_push_subscribed') === 'true';
    } catch {
      return false;
    }
  });
  const [isSendingTestPush, setIsSendingTestPush] = useState(false);
  const [pushFeedbackMessage, setPushFeedbackMessage] = useState('');

  // Real Database Google Auth State (Login / Sign Up with Backend verification)
  // Mobile & Desktop System Permissions State
  const [mobilePermissions, setMobilePermissions] = useState(() => {
    try {
      const notifPerm = typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported';
      const storedNotif = typeof localStorage !== 'undefined' ? localStorage.getItem('jarvis_perm_notif') : null;
      return {
        mic: localStorage.getItem('jarvis_perm_mic') || 'prompt',
        location: localStorage.getItem('jarvis_perm_loc') || 'prompt',
        notifications: notifPerm === 'granted' || storedNotif === 'granted' ? 'granted' : notifPerm
      };
    } catch {
      return { mic: 'prompt', location: 'prompt', notifications: 'prompt' };
    }
  });
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [isRequestingPerms, setIsRequestingPerms] = useState(false);

  // Cross-Platform Native System Notification (Supports Android PWA, iOS, Desktop)
  const showSystemNotification = useCallback(async (title, options = {}) => {
    try {
      if (!('Notification' in window)) return;
      if (Notification.permission !== 'granted') {
        const perm = await Notification.requestPermission().catch(() => {});
        if (perm !== 'granted') return;
      }

      const notifOptions = {
        icon: '/shadow-logo.png?v=3',
        badge: '/shadow-logo.png?v=3',
        vibrate: [250, 100, 250, 100, 250],
        tag: options?.tag || 'shadow-reminder-alert',
        renotify: true,
        ...options
      };

      // 1. Try active Service Worker (Required for mobile PWA standalone and Android Chrome)
      if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.ready || await navigator.serviceWorker.getRegistration();
          if (reg && reg.showNotification) {
            await reg.showNotification(title, notifOptions);
            return;
          }
        } catch (swErr) {
          console.warn('[PWA Notification SW fallback]:', swErr);
        }

        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION',
            title,
            options: notifOptions
          });
          return;
        }
      }

      // 2. Desktop notification fallback
      new Notification(title, notifOptions);
    } catch (e) {
      console.warn('[Notification Error handled]:', e);
    }
  }, []);

  // Real Mobile Permissions Requester (Prompts native browser dialogs on user gesture)
  const requestAllMobilePermissions = useCallback(async () => {
    setIsRequestingPerms(true);
    const results = { ...mobilePermissions };

    // 1. Notifications & PWA Web Push
    if ('Notification' in window) {
      try {
        const p = await Notification.requestPermission();
        results.notifications = p;
        if (p === 'granted') {
          try { localStorage.setItem('jarvis_perm_notif', 'granted'); } catch (e) {}
          setTimeout(() => subscribeToPushNotifications(), 100);
        }
      } catch (e) {}
    }

    // 2. Microphone (Real native prompt)
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        results.mic = 'granted';
        try { localStorage.setItem('jarvis_perm_mic', 'granted'); } catch (e) {}
        stream.getTracks().forEach(t => t.stop());
      } catch (e) {
        results.mic = 'denied';
      }
    }

    // 3. Geolocation (Real native prompt)
    if (navigator.geolocation) {
      try {
        await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => {
              results.location = 'granted';
              try { localStorage.setItem('jarvis_perm_loc', 'granted'); } catch (e) {}
              resolve();
            },
            () => {
              results.location = 'denied';
              resolve();
            },
            { timeout: 7000, enableHighAccuracy: true }
          );
        });
      } catch (e) {}
    }

    setMobilePermissions(results);
    setIsRequestingPerms(false);
    return results;
  }, [mobilePermissions]);

  const DEFAULT_COMMANDER = {
    _id: 'usr_satapara_primary',
    name: 'Het Satapara',
    email: 'sataparahetkumar@gmail.com',
    role: 'commander'
  };

  const canonicalUserEmail = (email) => {
    if (!email) return 'sataparahetkumar@gmail.com';
    const clean = String(email).trim().toLowerCase();
    if (
      clean === 'sataparahetkumar786@gmail.com' ||
      clean === 'hetsatapara@gmail.com' ||
      clean === 'arthurs10pc@gmail.com' ||
      clean === 'iron123man0@gmail.com' ||
      clean === 'anonymous' ||
      clean === 'guest' ||
      clean.includes('satapara') ||
      clean.includes('arthur') ||
      clean.includes('iron')
    ) {
      return 'sataparahetkumar@gmail.com';
    }
    return clean;
  };

  const [userProfile, setUserProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('jarvis_user_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email) {
          const cEmail = canonicalUserEmail(parsed.email);
          if (cEmail === 'sataparahetkumar@gmail.com') {
            parsed.email = 'sataparahetkumar@gmail.com';
            if (!parsed.name || parsed.name === 'commander') parsed.name = 'Het Satapara';
          }
          return parsed;
        }
      }
      // Auto-bind to primary Commander account so Mobile & Laptop sync data right out of the box
      try { localStorage.setItem('jarvis_user_profile', JSON.stringify(DEFAULT_COMMANDER)); } catch (e) {}
      return DEFAULT_COMMANDER;
    } catch {
      return DEFAULT_COMMANDER;
    }
  });

  // PWA Web Push Subscription & Remote Dispatch Engine
  const subscribeToPushNotifications = useCallback(async (targetEmail = null) => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('[PWA Push] Web Push not supported on this browser/environment.');
      return { success: false, reason: 'unsupported' };
    }

    try {
      let permission = Notification.permission;
      if (permission !== 'granted') {
        permission = await Notification.requestPermission().catch(() => 'default');
        setMobilePermissions(prev => ({ ...prev, notifications: permission }));
      }
      if (permission !== 'granted') {
        return { success: false, reason: 'denied' };
      }

      // Fetch dynamic VAPID Public Key from backend server
      const vapidRes = await fetch(`${BACKEND_URL}/api/notifications/vapid-key`);
      const vapidData = await vapidRes.json();
      if (!vapidData.success || !vapidData.publicKey) {
        throw new Error(vapidData.error || 'Failed to retrieve VAPID key');
      }

      // Ensure Service Worker is ready
      const reg = await navigator.serviceWorker.ready;
      let subscription = await reg.pushManager.getSubscription();
      const convertedKey = urlBase64ToUint8Array(vapidData.publicKey);

      // Verify if existing subscription matches current VAPID key
      if (subscription) {
        let keyMatches = false;
        try {
          if (subscription.options && subscription.options.applicationServerKey) {
            const currentSubKey = new Uint8Array(subscription.options.applicationServerKey);
            if (currentSubKey.length === convertedKey.length) {
              keyMatches = currentSubKey.every((val, i) => val === convertedKey[i]);
            }
          }
        } catch (e) {
          keyMatches = false;
        }

        if (!keyMatches) {
          console.warn('[PWA Push] Mismatched or stale VAPID key detected. Unsubscribing to refresh...');
          try { await subscription.unsubscribe(); } catch (e) {}
          subscription = null;
        }
      }

      if (!subscription) {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey
        });
      }

      const emailToUse = targetEmail || userProfile?.email || 'sataparahetkumar@gmail.com';
      const subRes = await fetch(`${BACKEND_URL}/api/notifications/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailToUse,
          subscription: subscription.toJSON ? subscription.toJSON() : subscription,
          deviceInfo: `${navigator.platform || ''} ${/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop'}`
        })
      });
      const subData = await subRes.json();

      setIsPushSubscribed(true);
      try { localStorage.setItem('jarvis_pwa_push_subscribed', 'true'); } catch (e) {}
      console.log('[PWA Push] Registered fresh push subscription with backend:', subData);
      return { success: true, subscription };
    } catch (err) {
      console.warn('[PWA Push Subscribe Error]:', err);
      return { success: false, error: err.message };
    }
  }, [userProfile?.email]);

  // Auto-subscribe to Web Push notifications on startup if permission is already granted
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      const email = userProfile?.email || 'sataparahetkumar@gmail.com';
      subscribeToPushNotifications(email);
    }
  }, [userProfile?.email, subscribeToPushNotifications]);

  const triggerTestPushNotification = useCallback(async () => {
    setIsSendingTestPush(true);
    setPushFeedbackMessage('Connecting to push service & dispatching...');
    try {
      // 1. Ensure fresh active subscription with verified VAPID keys
      await subscribeToPushNotifications();

      // 2. Immediately trigger native system notification right now
      showSystemNotification('⚡ Shadow System Notification', {
        body: 'Push notifications are live and connected to your Shadow app!',
        icon: '/shadow-logo.png?v=3',
        tag: `shadow-local-test-${Date.now()}`
      });

      // 3. Trigger remote WebPush from backend server
      const emailToUse = userProfile?.email || 'sataparahetkumar@gmail.com';
      const res = await fetch(`${BACKEND_URL}/api/notifications/test-push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToUse })
      });
      const data = await res.json();
      if (data.success) {
        setPushFeedbackMessage(`✅ Notification dispatched! Check your phone & desktop notification tray.`);
      } else {
        setPushFeedbackMessage(`⚠️ ${data.message || 'Push queued'}`);
      }
    } catch (err) {
      setPushFeedbackMessage(`❌ Error: ${err.message}`);
    } finally {
      setIsSendingTestPush(false);
    }
  }, [userProfile?.email, subscribeToPushNotifications, showSystemNotification]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [directEmailInput, setDirectEmailInput] = useState('');

  // Mobile Navigation & Filter State
  const [mobileActiveNav, setMobileActiveNav] = useState('watcher'); // 'watcher' | 'expense' | 'notes' | 'profile'
  const [mobileCategoryFilter, setMobileCategoryFilter] = useState('All'); // 'All' | 'Watcher' | 'Expenses' | 'Notes' | 'Radar'
  const [mobileSearchQuery, setMobileSearchQuery] = useState('');

  // Tools / Universal Extension Changer & Converter Feature State
  const [showToolsModal, setShowToolsModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [selectedSize, setSelectedSize] = useState('Original');
  const [converterStatus, setConverterStatus] = useState(null);
  const [uploadedFilePreview, setUploadedFilePreview] = useState(null);
  const [uploadedFileMeta, setUploadedFileMeta] = useState(null);
  const [toolActiveTab, setToolActiveTab] = useState('extension'); // 'extension' | 'convert'
  const [customExtension, setCustomExtension] = useState('');
  const [convertedDownloadInfo, setConvertedDownloadInfo] = useState(null);
  const toolsFileInputRef = useRef(null);

  // Startup Intro Shadow Animation (Plays once on app start, smooth, zero-lag)
  const [showStartupSplash, setShowStartupSplash] = useState(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('nosplash')) return false;
    return true;
  });

  // Safe direct file selection handler (100% crash-proof, supports ALL file types)
  const handleToolsFileSelect = (file) => {
    if (!file) return;
    try {
      setUploadedFile(file);
      setConverterStatus(null);
      setConvertedDownloadInfo(null);

      const dotIdx = file.name.lastIndexOf('.');
      const detectedExt = dotIdx > 0 ? file.name.substring(dotIdx + 1).toUpperCase() : 'FILE';
      const isImg = file.type?.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|svg|avif|ico|tiff?)$/i.test(file.name || '');

      if (isImg) {
        try {
          const previewUrl = URL.createObjectURL(file);
          setUploadedFilePreview(previewUrl);

          const img = new window.Image();
          img.onload = () => {
            setUploadedFileMeta({
              width: img.naturalWidth || img.width || 800,
              height: img.naturalHeight || img.height || 600,
              sizeKb: file.size ? (file.size / 1024).toFixed(1) : '0',
              ext: detectedExt
            });
          };
          img.onerror = () => {
            setUploadedFileMeta({
              sizeKb: file.size ? (file.size / 1024).toFixed(1) : '0',
              ext: detectedExt
            });
          };
          img.src = previewUrl;
        } catch (urlErr) {
          console.warn('URL.createObjectURL non-fatal:', urlErr);
          setUploadedFilePreview(null);
          setUploadedFileMeta({
            sizeKb: file.size ? (file.size / 1024).toFixed(1) : '0',
            ext: detectedExt
          });
        }
      } else {
        setUploadedFilePreview(null);
        setUploadedFileMeta({
          sizeKb: file.size ? (file.size / 1024).toFixed(1) : '0',
          ext: detectedExt
        });
      }
    } catch (err) {
      console.error('File selection error:', err);
      setConverterStatus({ type: 'error', message: 'Could not load selected file.' });
    }
  };

  // Safe Universal Download Helper (Mobile WebKit / Android Chrome / Desktop compatible)
  const triggerSafeDownload = (blob, filename, targetExt) => {
    try {
      const url = URL.createObjectURL(blob);
      const sizeKb = (blob.size / 1024).toFixed(1);

      // Persist in state so user always has a prominent manual tap button in the UI
      setConvertedDownloadInfo({
        url,
        filename,
        sizeKb,
        targetFormat: (targetExt || '').toUpperCase()
      });

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.rel = 'noopener noreferrer';
      // Off-screen absolute positioning rather than display: none for iOS Safari compatibility
      a.style.position = 'fixed';
      a.style.left = '-9999px';
      a.style.top = '-9999px';
      a.style.opacity = '0';
      document.body.appendChild(a);

      try {
        a.click();
      } catch (clickErr) {
        console.warn('Programmatic click caught:', clickErr);
      }

      setTimeout(() => {
        try {
          if (document.body.contains(a)) document.body.removeChild(a);
        } catch (e) {}
      }, 1500);

      // Revoke ObjectURL after 60 seconds (generous for mobile background downloads)
      setTimeout(() => {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {}
      }, 60000);
    } catch (downErr) {
      console.error('Trigger safe download error:', downErr);
    }
  };

  // Comprehensive Extension Changer & Multi-Format Converter Engine
  const handleExecuteConversion = async (targetFormat, isDirectExtensionSwap = false) => {
    if (!uploadedFile) {
      setConverterStatus({ type: 'error', message: 'Please select or drop a file first!' });
      return;
    }

    const cleanExt = (targetFormat || '').trim().replace(/^\./, '').toLowerCase();
    if (!cleanExt) {
      setConverterStatus({ type: 'error', message: 'Please specify a target extension (e.g. png, jpg, pdf, mp4).' });
      return;
    }

    const dotIndex = uploadedFile.name.lastIndexOf('.');
    const baseName = dotIndex > 0 ? uploadedFile.name.substring(0, dotIndex) : (uploadedFile.name || 'file');
    const originalExt = dotIndex > 0 ? uploadedFile.name.substring(dotIndex + 1).toLowerCase() : '';
    const isImage = uploadedFile.type?.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|svg|avif|ico|tiff?)$/i.test(uploadedFile.name || '');

    let outputFilename = `${baseName}.${cleanExt}`;
    if (selectedSize && selectedSize !== 'Original' && ['png', 'jpg', 'jpeg', 'webp', 'bmp'].includes(cleanExt)) {
      outputFilename = `${baseName}_${selectedSize}.${cleanExt}`;
    }

    setConverterStatus({ type: 'loading', message: `Processing ${uploadedFile.name} ➔ .${cleanExt.toUpperCase()}...` });

    const MIME_MAP = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
      gif: 'image/gif',
      bmp: 'image/bmp',
      svg: 'image/svg+xml',
      ico: 'image/x-icon',
      avif: 'image/avif',
      pdf: 'application/pdf',
      txt: 'text/plain;charset=utf-8',
      csv: 'text/csv;charset=utf-8',
      json: 'application/json;charset=utf-8',
      html: 'text/html;charset=utf-8',
      htm: 'text/html;charset=utf-8',
      xml: 'application/xml;charset=utf-8',
      md: 'text/markdown;charset=utf-8',
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      m4a: 'audio/mp4',
      mp4: 'video/mp4',
      webm: 'video/webm',
      mov: 'video/quicktime',
      zip: 'application/zip',
      rar: 'application/x-rar-compressed',
      '7z': 'application/x-7z-compressed',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      bin: 'application/octet-stream',
      iso: 'application/octet-stream',
      apk: 'application/vnd.android.package-archive'
    };

    try {
      // 1. Direct Extension Swap mode
      if (isDirectExtensionSwap) {
        const arrayBuffer = await uploadedFile.arrayBuffer();
        const targetMime = MIME_MAP[cleanExt] || uploadedFile.type || 'application/octet-stream';
        const blob = new Blob([arrayBuffer], { type: targetMime });
        triggerSafeDownload(blob, outputFilename, cleanExt);
        setConverterStatus({
          type: 'success',
          message: `✓ Successfully changed extension to .${cleanExt.toUpperCase()} (${(blob.size / 1024).toFixed(1)} KB)!`
        });
        return;
      }

      // 2. Image formats: PNG, JPG, JPEG, WEBP, BMP
      if (['png', 'jpg', 'jpeg', 'webp', 'bmp'].includes(cleanExt)) {
        if (isImage) {
          try {
            const imgObj = await new Promise((resolve, reject) => {
              const url = URL.createObjectURL(uploadedFile);
              const img = new Image();
              img.onload = () => resolve({ img, width: img.naturalWidth || 800, height: img.naturalHeight || 600, url });
              img.onerror = () => {
                URL.revokeObjectURL(url);
                const reader = new FileReader();
                reader.onload = (e) => {
                  const img2 = new Image();
                  img2.onload = () => resolve({ img: img2, width: img2.naturalWidth || 800, height: img2.naturalHeight || 600, url: null });
                  img2.onerror = () => reject(new Error('Image canvas decode failed'));
                  img2.src = e.target.result;
                };
                reader.onerror = () => reject(new Error('File reader failed'));
                reader.readAsDataURL(uploadedFile);
              };
              img.src = url;
            });

            let scale = 1;
            let quality = 0.92;
            if (selectedSize && selectedSize !== 'Original') {
              const sizeMap = {
                '50KB': 50 * 1024,
                '100KB': 100 * 1024,
                '250KB': 250 * 1024,
                '500KB': 500 * 1024,
                '1MB': 1024 * 1024,
                '2MB': 2 * 1024 * 1024,
                '5MB': 5 * 1024 * 1024,
                '10MB': 10 * 1024 * 1024
              };
              const targetBytes = sizeMap[selectedSize];
              if (targetBytes && uploadedFile.size > targetBytes) {
                scale = Math.min(1, Math.sqrt(targetBytes / uploadedFile.size) * 1.15);
                quality = 0.78;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(imgObj.width * scale));
            canvas.height = Math.max(1, Math.round(imgObj.height * scale));
            const ctx = canvas.getContext('2d');

            if (['jpg', 'jpeg'].includes(cleanExt)) {
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
            } else {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
            ctx.drawImage(imgObj.img, 0, 0, canvas.width, canvas.height);
            if (imgObj.url) URL.revokeObjectURL(imgObj.url);

            const targetMime = cleanExt === 'jpg' || cleanExt === 'jpeg' ? 'image/jpeg' : (cleanExt === 'webp' ? 'image/webp' : (cleanExt === 'bmp' ? 'image/bmp' : 'image/png'));

            const blob = await new Promise((resolve) => {
              try {
                canvas.toBlob((b) => {
                  if (b) resolve(b);
                  else {
                    const dataUrl = canvas.toDataURL(targetMime, quality);
                    const bin = atob(dataUrl.split(',')[1]);
                    const u8 = new Uint8Array(bin.length);
                    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
                    resolve(new Blob([u8], { type: targetMime }));
                  }
                }, targetMime, quality);
              } catch (e) {
                const dataUrl = canvas.toDataURL(targetMime, quality);
                const bin = atob(dataUrl.split(',')[1]);
                const u8 = new Uint8Array(bin.length);
                for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
                resolve(new Blob([u8], { type: targetMime }));
              }
            });

            triggerSafeDownload(blob, outputFilename, cleanExt);
            setConverterStatus({
              type: 'success',
              message: `✓ Converted to .${cleanExt.toUpperCase()} (${(blob.size / 1024).toFixed(1)} KB)!`
            });
            return;
          } catch (imgErr) {
            console.warn('Canvas conversion fallback to direct extension repackage:', imgErr);
          }
        }

        // If not decoded via canvas or not an image: seamless repackaging!
        const arrayBuffer = await uploadedFile.arrayBuffer();
        const targetMime = MIME_MAP[cleanExt] || 'image/' + cleanExt;
        const blob = new Blob([arrayBuffer], { type: targetMime });
        triggerSafeDownload(blob, outputFilename, cleanExt);
        setConverterStatus({
          type: 'success',
          message: `✓ Changed extension to .${cleanExt.toUpperCase()} (${(blob.size / 1024).toFixed(1)} KB)!`
        });
        return;
      }

      // 3. PDF Document
      if (cleanExt === 'pdf') {
        const PDFConstructor = typeof jsPDF !== 'undefined' ? jsPDF : (window.jspdf?.jsPDF || window.jsPDF);
        if (PDFConstructor) {
          if (isImage) {
            try {
              const imgObj = await new Promise((resolve, reject) => {
                const url = URL.createObjectURL(uploadedFile);
                const img = new Image();
                img.onload = () => resolve({ img, width: img.naturalWidth || 800, height: img.naturalHeight || 600, url });
                img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image decode for PDF failed')); };
                img.src = url;
              });

              const canvas = document.createElement('canvas');
              canvas.width = imgObj.width;
              canvas.height = imgObj.height;
              const ctx = canvas.getContext('2d');
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(imgObj.img, 0, 0);
              if (imgObj.url) URL.revokeObjectURL(imgObj.url);

              const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.95);
              const isLandscape = canvas.width > canvas.height;
              const doc = new PDFConstructor({
                orientation: isLandscape ? 'l' : 'p',
                unit: 'pt',
                format: 'a4'
              });

              const pageW = doc.internal.pageSize.getWidth();
              const pageH = doc.internal.pageSize.getHeight();
              const margin = 24;
              const availW = pageW - margin * 2;
              const availH = pageH - margin * 2;
              const ratio = Math.min(availW / canvas.width, availH / canvas.height, 1);
              const w = canvas.width * ratio;
              const h = canvas.height * ratio;
              const x = (pageW - w) / 2;
              const y = (pageH - h) / 2;

              doc.addImage(jpegDataUrl, 'JPEG', x, y, w, h, undefined, 'FAST');
              const pdfBlob = doc.output('blob');
              triggerSafeDownload(pdfBlob, outputFilename, 'pdf');
              setConverterStatus({ type: 'success', message: `✓ Exported PDF document (${(pdfBlob.size / 1024).toFixed(1)} KB)!` });
              return;
            } catch (pdfImgErr) {
              console.warn('PDF image error fallback:', pdfImgErr);
            }
          } else {
            try {
              const rawText = await uploadedFile.text().catch(() => `Document: ${baseName}`);
              const doc = new PDFConstructor({ unit: 'pt', format: 'a4' });
              const lines = doc.splitTextToSize(rawText || `Document: ${baseName}`, 540);
              doc.text(lines, 30, 40);
              const pdfBlob = doc.output('blob');
              triggerSafeDownload(pdfBlob, outputFilename, 'pdf');
              setConverterStatus({ type: 'success', message: `✓ Exported text PDF document (${(pdfBlob.size / 1024).toFixed(1)} KB)!` });
              return;
            } catch (pdfTxtErr) {
              console.warn('PDF text error fallback:', pdfTxtErr);
            }
          }
        }
      }

      // 4. Text / CSV / JSON / MD / HTML
      if (['txt', 'csv', 'json', 'html', 'md', 'xml'].includes(cleanExt)) {
        if (!isImage) {
          const rawText = await uploadedFile.text().catch(() => '');
          const blob = new Blob([rawText], { type: MIME_MAP[cleanExt] || 'text/plain;charset=utf-8' });
          triggerSafeDownload(blob, outputFilename, cleanExt);
          setConverterStatus({ type: 'success', message: `✓ Converted to .${cleanExt.toUpperCase()} (${(blob.size / 1024).toFixed(1)} KB)!` });
          return;
        }
      }

      // 5. Universal fallback: Repackage binary buffer with target extension & MIME
      const arrayBuffer = await uploadedFile.arrayBuffer();
      const targetMime = MIME_MAP[cleanExt] || uploadedFile.type || 'application/octet-stream';
      const blob = new Blob([arrayBuffer], { type: targetMime });
      triggerSafeDownload(blob, outputFilename, cleanExt);
      setConverterStatus({
        type: 'success',
        message: `✓ Saved as .${cleanExt.toUpperCase()} (${(blob.size / 1024).toFixed(1)} KB)!`
      });
    } catch (err) {
      console.error('[Converter Error]:', err);
      try {
        const arrayBuffer = await uploadedFile.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
        triggerSafeDownload(blob, outputFilename, cleanExt);
        setConverterStatus({
          type: 'success',
          message: `✓ Extension changed to .${cleanExt.toUpperCase()} (Direct binary export)!`
        });
      } catch (fatalErr) {
        setConverterStatus({ type: 'error', message: `Conversion error: ${err.message || 'Could not process file'}` });
      }
    }
  };

  // Google Keep Style Notes & 3x Daily Email Reminder State
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showPhotoEditModal, setShowPhotoEditModal] = useState(false);
  const [photoStudioInitialImage, setPhotoStudioInitialImage] = useState(null);
  const DEFAULT_USER_NOTES = [
    {
      id: "note_1793366315731",
      title: "Obsssstion vadi bakchodi te joichhe  ne to nahi maja avae  i know tu  jois  j ads aavi j hase",
      type: "task",
      content: "",
      checklist: [],
      color: "#10b981",
      pinned: true,
      createdAt: "Oct 30, 2026"
    },
    {
      id: "note_1793642799064",
      title: "Papa watch",
      content: "Papa ni watch       maru laptop and  mobile  search karvanu",
      color: "#f59e0b",
      pinned: false,
      attachments: [],
      createdAt: "Nov 2, 2026"
    },
    {
      id: "note_1793642784618",
      title: "Cloths",
      content: "Didi na  marriege na  cloths",
      color: "#f59e0b",
      pinned: false,
      attachments: [],
      createdAt: "Nov 2, 2026"
    },
    {
      id: "note_1793642771166",
      title: "Document",
      content: "Je je ghare thi file  ma  document padiya chhe a  badha  sarkha set  kari deva",
      color: "#f43f5e",
      pinned: false,
      attachments: [],
      createdAt: "Nov 2, 2026"
    }
  ];

  const [notesList, setNotesList] = useState(() => {
    try {
      const email = userProfile?.email ? userProfile.email.trim().toLowerCase() : 'guest';
      const saved = localStorage.getItem(`jarvis_notes_${email}`);
      return saved ? JSON.parse(saved) : DEFAULT_USER_NOTES;
    } catch {
      return DEFAULT_USER_NOTES;
    }
  });
  const [noteFilterTab, setNoteFilterTab] = useState('all');
  const [noteSearchQuery, setNoteSearchQuery] = useState('');
  const [newNoteType, setNewNoteType] = useState('task');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteChecklist, setNewNoteChecklist] = useState([{ id: 'c_1', text: '', completed: false }]);
  const [newNoteColor, setNewNoteColor] = useState('#38bdf8');
  const [newNotePinned, setNewNotePinned] = useState(false);
  const [isSendingNotesEmail, setIsSendingNotesEmail] = useState(false);
  const [notesEmailFeedback, setNotesEmailFeedback] = useState('');
  const [notesTargetEmail, setNotesTargetEmail] = useState('');

  // Multimedia Notes Attachments State (Photo, Video, Audio, PDF) with Mobile Sync
  const [stagedAttachments, setStagedAttachments] = useState([]);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [activeLightboxMedia, setActiveLightboxMedia] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const notesFileInputRef = useRef(null);



  // Permanent Watcher State
  const [showWatcherModal, setShowWatcherModal] = useState(false);
  const [showSnoozeDropdown, setShowSnoozeDropdown] = useState(false);
  const [snoozeMinutes, setSnoozeMinutes] = useState(() => {
    try {
      const saved = localStorage.getItem('jarvis_snooze_duration');
      return saved ? parseInt(saved, 10) : 1;
    } catch {
      return 1;
    }
  });

  const DEFAULT_REMINDERS = [
    { task: "task 1", time: "10:58", completed: true },
    { task: "task 2", time: "11:58", completed: true },
    { task: "task 3", time: "12:58", completed: true },
    { task: "task 4", time: "14:28", completed: true },
    { task: "task 5", time: "15:28", completed: true },
    { task: "task 6", time: "16:58", completed: false },
    { task: "task 7", time: "18:13", completed: false },
    { task: "task 8", time: "19:28", completed: false }
  ];

  const [remindersList, setRemindersList] = useState(() => {
    try {
      const now = new Date();
      const todayDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const savedDate = localStorage.getItem('jarvis_last_active_date');

      const saved = localStorage.getItem('jarvis_permanent_reminders');
      let parsed = saved ? JSON.parse(saved) : null;
      if (!Array.isArray(parsed) || parsed.length === 0) {
        parsed = DEFAULT_REMINDERS;
        localStorage.setItem('jarvis_permanent_reminders', JSON.stringify(DEFAULT_REMINDERS));
      }

      if (savedDate !== todayDate) {
        parsed = parsed.map(rem => ({ ...rem, completed: false }));
        localStorage.setItem('jarvis_last_active_date', todayDate);
        localStorage.setItem('jarvis_permanent_reminders', JSON.stringify(parsed));
      }
      return parsed;
    } catch (e) {
      return DEFAULT_REMINDERS;
    }
  });

  const [currentTaskInput, setCurrentTaskInput] = useState('');
  
  const getCurrentTimeString = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  const [currentTimeInput, setCurrentTimeInput] = useState(getCurrentTimeString());
  const [editingIndex, setEditingIndex] = useState(null);
  const [watcherActive, setWatcherActive] = useState(true);
  const [activeAlertTask, setActiveAlertTask] = useState(null);
  const [activeAlertKey, setActiveAlertKey] = useState(null);
  const [currentAlertTaskId, setCurrentAlertTaskId] = useState(null);
  const [snoozedAlerts, setSnoozedAlerts] = useState({});

  // Live Countdown Timer String for Sidebar (Negative Countdown Timer "-MMm")
  const [nextCountdownStr, setNextCountdownStr] = useState('-48m');
  const [nextRemTimeStr, setNextRemTimeStr] = useState('14:28');
  const [nextRemTitle, setNextRemTitle] = useState('Daily Focus & Routine');

  // Advanced Expense Tracker State with Top-First Order
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [monthlyBudget, setMonthlyBudget] = useState(() => {
    try {
      const saved = localStorage.getItem('jarvis_monthly_budget');
      return saved ? parseFloat(saved) : 5000;
    } catch {
      return 5000;
    }
  });
  const [isSettingBudget, setIsSettingBudget] = useState(false);
  const [tempBudgetInput, setTempBudgetInput] = useState('');
  const [expenseList, setExpenseList] = useState(() => {
    try {
      const saved = localStorage.getItem('jarvis_expenses');
      let parsed = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(parsed)) parsed = [];

      // Check all possible email alias keys to prevent ANY data loss
      const aliasKeys = [
        'jarvis_expenses_sataparahetkumar@gmail.com',
        'jarvis_expenses_sataparahetkumar786@gmail.com',
        'jarvis_expenses_hetsatapara@gmail.com',
        'jarvis_expenses_arthurs10pc@gmail.com',
        'jarvis_expenses_iron123man0@gmail.com'
      ];
      aliasKeys.forEach(k => {
        try {
          const itemStr = localStorage.getItem(k);
          if (itemStr) {
            const arr = JSON.parse(itemStr);
            if (Array.isArray(arr) && arr.length > 0) {
              parsed = mergeExpenses(parsed, arr, []);
            }
          }
        } catch (e) {}
      });

      const userProfileRaw = localStorage.getItem('jarvis_user_profile');
      if (userProfileRaw) {
        try {
          const u = JSON.parse(userProfileRaw);
          if (u?.email) {
            const userSaved = localStorage.getItem(`jarvis_expenses_${u.email.trim().toLowerCase()}`);
            if (userSaved) {
              const userParsed = JSON.parse(userSaved);
              if (Array.isArray(userParsed)) {
                parsed = mergeExpenses(parsed, userParsed, []);
              }
            }
          }
        } catch (e) {}
      }
      return parsed;
    } catch (e) {
      return [];
    }
  });
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Food & Snacks');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('All');
  const [expenseSearchQuery, setExpenseSearchQuery] = useState('');
  const [expenseTabMode, setExpenseTabMode] = useState('tracker'); // 'tracker' | 'monthly_report'
  const [transactionType, setTransactionType] = useState('expense'); // 'expense' | 'income'
  const [selectedExpenseMonth, setSelectedExpenseMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const formatExpenseMonthLabel = (monthStr) => {
    if (!monthStr) return '';
    try {
      const [year, month] = monthStr.split('-');
      const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    } catch (e) {
      return monthStr;
    }
  };

  const handlePrevExpenseMonth = () => {
    setSelectedExpenseMonth(prev => {
      try {
        const [year, month] = prev.split('-').map(Number);
        const d = new Date(year, month - 2, 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      } catch (e) {
        return prev;
      }
    });
  };

  const isFutureMonthBlocked = (() => {
    const now = new Date();
    const currentYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return selectedExpenseMonth >= currentYm;
  })();

  const handleNextExpenseMonth = () => {
    const [y, m] = selectedExpenseMonth.split('-').map(Number);
    const nextDate = new Date(y, m, 1);
    const nextYm = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    const now = new Date();
    const currentYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (nextYm > currentYm) return; // Future months strictly blocked!
    setSelectedExpenseMonth(prev => {
      try {
        const [year, month] = prev.split('-').map(Number);
        const d = new Date(year, month, 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      } catch (e) {
        return prev;
      }
    });
  };

  // Request Desktop Notification Permission on Startup for Watcher Reminders
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Daily Briefing & Live Google News State (3 Categories: Global, India, Gujarat + Instagram Reels Mode)
  const watcherIntervalRef = useRef(null);
  const triggeredKeysRef = useRef(new Set());
  const recognitionRef = useRef(null);
  const socketRef = useRef(null);
  const googleBtnRef = useRef(null);
  const liveTrafficCheckRef = useRef(null);
  const audioCtxRef = useRef(null);
  const alarmIntervalRef = useRef(null);
  const triggeredMinuteRef = useRef('');

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const polylineRef = useRef(null);
  const trafficPolylineRef = useRef(null);
  const trafficMarkerRef = useRef(null);
  const clickStepRef = useRef(0);

  // Cloud Real-Time Sync State Refs
  const isRemoteSyncRef = useRef(false);
  const hasInitialSyncedRef = useRef(false);
  const userProfileRef = useRef(userProfile);
  const syncTimerRef = useRef(null);

  useEffect(() => {
    userProfileRef.current = userProfile;
  }, [userProfile]);

  useEffect(() => {
    try {
      localStorage.setItem('jarvis_permanent_reminders', JSON.stringify(remindersList));
    } catch (e) {}
  }, [remindersList]);

  useEffect(() => {
    try {
      localStorage.setItem('jarvis_snooze_duration', snoozeMinutes.toString());
    } catch (e) {}
  }, [snoozeMinutes]);

  useEffect(() => {
    try {
      localStorage.setItem('jarvis_expenses', JSON.stringify(expenseList));
      localStorage.setItem('jarvis_expenses_sataparahetkumar@gmail.com', JSON.stringify(expenseList));
      if (userProfile?.email) {
        localStorage.setItem(`jarvis_expenses_${userProfile.email.trim().toLowerCase()}`, JSON.stringify(expenseList));
      }
    } catch (e) {}
  }, [expenseList, userProfile?.email]);

  useEffect(() => {
    try {
      localStorage.setItem('jarvis_monthly_budget', monthlyBudget.toString());
    } catch (e) {}
  }, [monthlyBudget]);

  useEffect(() => {
    try {
      if (userProfile) {
        localStorage.setItem('jarvis_user_profile', JSON.stringify(userProfile));
      } else {
        localStorage.removeItem('jarvis_user_profile');
      }
    } catch (e) {}
  }, [userProfile]);

  // Fetch Cloud Data on Mount or when User Profile Changes (Sync from DB to Device)
  useEffect(() => {
    if (!userProfile?.email) return;

    if (socketRef.current?.connected) {
      socketRef.current.emit('join_user_room', userProfile.email);
    }

    const fetchCloudUserData = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/user/sync-data?email=${encodeURIComponent(userProfile.email)}`);
        const data = await res.json();
        if (data && data.success) {
          isRemoteSyncRef.current = true;
          if (Array.isArray(data.reminders) && data.reminders.length > 0) {
            setRemindersList(data.reminders);
          } else if (Array.isArray(data.reminders) && data.reminders.length === 0) {
            setRemindersList(DEFAULT_REMINDERS);
          }
          if (typeof data.snoozeMinutes === 'number') {
            setSnoozeMinutes(data.snoozeMinutes);
          }
          if (Array.isArray(data.expenses)) {
            const rawDeleted = (() => {
              try { return JSON.parse(localStorage.getItem('jarvis_deleted_expense_ids') || '[]'); } catch { return []; }
            })();
            setExpenseList(prev => {
              const merged = mergeExpenses(prev, data.expenses, rawDeleted);
              try {
                localStorage.setItem('jarvis_expenses', JSON.stringify(merged));
                localStorage.setItem('jarvis_expenses_sataparahetkumar@gmail.com', JSON.stringify(merged));
                localStorage.setItem(`jarvis_expenses_${userProfile.email.trim().toLowerCase()}`, JSON.stringify(merged));
              } catch (e) {}
              return merged;
            });
          }
          if (typeof data.monthlyBudget === 'number') {
            setMonthlyBudget(data.monthlyBudget);
          }
          if (Array.isArray(data.notes)) {
            setNotesList(data.notes);
          }
          setTimeout(() => {
            isRemoteSyncRef.current = false;
          }, 400);
        }
      } catch (e) {
        console.warn("Could not fetch user sync data:", e);
      }
    };

    fetchCloudUserData();
  }, [userProfile?.email]);

  // Real-Time Push to Cloud & Other Logged-in Devices whenever Reminders, Expenses, or Notes change
  useEffect(() => {
    // Crucial safeguard: never push initial local state until authoritative cloud sync has completed
    if (isRemoteSyncRef.current || !userProfile?.email || !hasInitialSyncedRef.current) return;

    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      const email = userProfile.email;
      const cleanEmail = canonicalUserEmail(email);

      // Collect local deleted IDs to accompany update
      let localDeleted = [];
      try {
        const raw = localStorage.getItem('jarvis_deleted_expense_ids');
        localDeleted = raw ? JSON.parse(raw) : [];
      } catch (e) {}

      const payload = {
        email: cleanEmail,
        reminders: remindersList,
        snoozeMinutes: snoozeMinutes,
        expenses: expenseList,
        deletedExpenseIds: localDeleted,
        monthlyBudget: monthlyBudget,
        notes: notesList
      };

      if (socketRef.current?.connected) {
        socketRef.current.emit('sync_user_data_realtime', payload);
      }

      fetch(`${BACKEND_URL}/api/user/sync-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {});
    }, 350);

    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [remindersList, snoozeMinutes, expenseList, monthlyBudget, notesList, userProfile?.email]);

  // Continuous Multi-Device Real-Time Cloud Sync (Mobile <-> Laptop)
  useEffect(() => {
    const rawEmail = userProfile?.email || 'sataparahetkumar@gmail.com';
    const cleanEmail = canonicalUserEmail(rawEmail);

    // Ensure socket joins user room for instant push broadcasts
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_user_room', cleanEmail);
    }

    const performCloudSync = async () => {
      if (isRemoteSyncRef.current) return;
      try {
        const res = await fetch(`${BACKEND_URL}/api/user/sync-data?email=${encodeURIComponent(cleanEmail)}`);
        const data = await res.json();
        if (data && data.success) {
          isRemoteSyncRef.current = true;
          hasInitialSyncedRef.current = true;

          // 1. Sync deleted IDs (tombstones) from server across devices
          let currentDeleted = [];
          try {
            const raw = localStorage.getItem('jarvis_deleted_expense_ids');
            currentDeleted = raw ? JSON.parse(raw) : [];
          } catch (e) {}
          if (Array.isArray(data.deletedExpenseIds) && data.deletedExpenseIds.length > 0) {
            currentDeleted = Array.from(new Set([...currentDeleted, ...data.deletedExpenseIds]));
            try { localStorage.setItem('jarvis_deleted_expense_ids', JSON.stringify(currentDeleted)); } catch (e) {}
          }

          // 2. Sync reminders
          if (Array.isArray(data.reminders) && data.reminders.length > 0) {
            setRemindersList(prev => {
              if (JSON.stringify(prev) !== JSON.stringify(data.reminders)) {
                try { localStorage.setItem('jarvis_permanent_reminders', JSON.stringify(data.reminders)); } catch (e) {}
                return data.reminders;
              }
              return prev;
            });
          }
          // 3. Sync notes
          if (Array.isArray(data.notes)) {
            setNotesList(prev => {
              if (JSON.stringify(prev) !== JSON.stringify(data.notes)) {
                try { 
                  localStorage.setItem(`jarvis_notes_${cleanEmail}`, JSON.stringify(data.notes)); 
                  localStorage.setItem(`jarvis_notes_sataparahetkumar@gmail.com`, JSON.stringify(data.notes));
                } catch (e) {}
                return data.notes;
              }
              return prev;
            });
          }
          // 4. Sync expenses authoritatively
          if (Array.isArray(data.expenses)) {
            setExpenseList(prev => {
              const merged = mergeExpenses(prev, data.expenses, currentDeleted);
              if (JSON.stringify(merged) !== JSON.stringify(prev)) {
                try {
                  localStorage.setItem('jarvis_expenses', JSON.stringify(merged));
                  localStorage.setItem('jarvis_expenses_sataparahetkumar@gmail.com', JSON.stringify(merged));
                  localStorage.setItem(`jarvis_expenses_${cleanEmail}`, JSON.stringify(merged));
                } catch (e) {}
                return merged;
              }
              return prev;
            });
          }
          // 5. Sync monthly budget
          if (typeof data.monthlyBudget === 'number') {
            setMonthlyBudget(prev => {
              if (prev !== data.monthlyBudget) {
                try { localStorage.setItem('jarvis_monthly_budget', data.monthlyBudget.toString()); } catch (e) {}
                return data.monthlyBudget;
              }
              return prev;
            });
          }
          setTimeout(() => { isRemoteSyncRef.current = false; }, 300);
        }
      } catch (err) {}
    };

    // Initial immediate sync
    performCloudSync();

    // 25-second background polling ensures 100% sync reliability across phones & laptops without battery drain or micro-stutters
    const interval = setInterval(performCloudSync, 25000);

    const handleReSyncOnForeground = () => {
      if (document.visibilityState === 'visible') {
        if (!socketRef.current?.connected) {
          socketRef.current?.connect();
        }
        performCloudSync();
        fetch(`${BACKEND_URL}/api/notes-scheduler/check-and-dispatch`).catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleReSyncOnForeground);
    window.addEventListener('focus', handleReSyncOnForeground);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleReSyncOnForeground);
      window.removeEventListener('focus', handleReSyncOnForeground);
    };
  }, [userProfile?.email]);

  // Periodic 5-minute automated mail check while app is open
  useEffect(() => {
    const check3x = () => {
      fetch(`${BACKEND_URL}/api/notes-scheduler/check-and-dispatch`).catch(() => {});
    };
    check3x();
    const inv = setInterval(check3x, 300000);
    return () => clearInterval(inv);
  }, []);

  // Load Google Identity Services script
  useEffect(() => {
    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  // Process Auth with Backend (Database Verification for Login, Creation for Sign Up)
  const processAuthWithBackend = async (email, fullName, photoURL, targetMode) => {
    setIsAuthLoading(true);
    const cleanEmail = (email || '').trim().toLowerCase();
    const userName = fullName || cleanEmail.split('@')[0];
    const userPhoto = photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=E8D2B5&color=590907`;

    const payload = {
      email: cleanEmail,
      fullName: userName,
      avatar: userPhoto,
      mode: targetMode
    };

    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const endpoints = isLocal
      ? ['http://localhost:5001', BACKEND_URL]
      : [BACKEND_URL, 'http://localhost:5001'];

    let resData = null;
    let resOk = false;
    let resStatus = 0;

    for (const base of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(`${base}/api/auth/google-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        resStatus = res.status;
        resOk = res.ok;
        resData = await res.json().catch(() => null);
        if (resData) break;
      } catch (e) {
        // next candidate
      }
    }

    setIsAuthLoading(false);

    if (targetMode === 'login') {
      if (resOk && resData && resData.success && resData.user) {
        const profileData = {
          _id: resData.user._id,
          name: resData.user.fullName || userName,
          email: resData.user.email || cleanEmail,
          photo: resData.user.avatar || userPhoto,
          role: resData.user.role || 'commander',
          connectedDate: new Date(resData.user.createdAt || Date.now()).toLocaleDateString()
        };
        isRemoteSyncRef.current = true;
        hasInitialSyncedRef.current = true;
        if (Array.isArray(resData.user.reminders)) {
          setRemindersList(resData.user.reminders);
          try { localStorage.setItem('jarvis_permanent_reminders', JSON.stringify(resData.user.reminders)); } catch (e) {}
        }
        if (typeof resData.user.snoozeMinutes === 'number') {
          setSnoozeMinutes(resData.user.snoozeMinutes);
          try { localStorage.setItem('jarvis_snooze_duration', resData.user.snoozeMinutes.toString()); } catch (e) {}
        }
        if (Array.isArray(resData.user.expenses)) {
          let currentDeleted = [];
          try {
            const raw = localStorage.getItem('jarvis_deleted_expense_ids');
            currentDeleted = raw ? JSON.parse(raw) : [];
          } catch (e) {}
          if (Array.isArray(resData.user.deletedExpenseIds) && resData.user.deletedExpenseIds.length > 0) {
            currentDeleted = Array.from(new Set([...currentDeleted, ...resData.user.deletedExpenseIds]));
            try { localStorage.setItem('jarvis_deleted_expense_ids', JSON.stringify(currentDeleted)); } catch (e) {}
          }
          setExpenseList(prev => {
            const merged = mergeExpenses(prev, resData.user.expenses, currentDeleted);
            try {
              localStorage.setItem('jarvis_expenses', JSON.stringify(merged));
              localStorage.setItem('jarvis_expenses_sataparahetkumar@gmail.com', JSON.stringify(merged));
              localStorage.setItem(`jarvis_expenses_${cleanEmail}`, JSON.stringify(merged));
            } catch (e) {}
            return merged;
          });
        }
        if (typeof resData.user.monthlyBudget === 'number') {
          setMonthlyBudget(resData.user.monthlyBudget);
          try { localStorage.setItem('jarvis_monthly_budget', resData.user.monthlyBudget.toString()); } catch (e) {}
        }
        if (Array.isArray(resData.user.notes)) {
          setNotesList(resData.user.notes);
          try { 
            localStorage.setItem(`jarvis_notes_${cleanEmail}`, JSON.stringify(resData.user.notes));
            localStorage.setItem(`jarvis_notes_sataparahetkumar@gmail.com`, JSON.stringify(resData.user.notes));
          } catch (e) {}
        }
        setTimeout(() => { isRemoteSyncRef.current = false; }, 400);

        setUserProfile(profileData);
        localStorage.setItem('jarvis_user_profile', JSON.stringify(profileData));
        localStorage.setItem(`jarvis_db_user_${cleanEmail}`, JSON.stringify(profileData));
        setShowAuthModal(false);
        alert(`Success! Logged in successfully as ${profileData.name}. Welcome back!`);
      } else if (resStatus === 404 || resStatus === 400 || (resData && resData.success === false)) {
        alert(`Error: This Gmail ID (${cleanEmail}) is not registered in the database.\n\nPlease click "Sign Up" first to create your account.`);
        setAuthMode('signup');
      } else {
        // Offline / emergency local check
        const localCheck = localStorage.getItem(`jarvis_db_user_${cleanEmail}`);
        if (localCheck) {
          const profileData = JSON.parse(localCheck);
          setUserProfile(profileData);
          setShowAuthModal(false);
          alert(`Success! Logged in successfully as ${profileData.name}.`);
        } else {
          alert(`Error: This Gmail ID (${cleanEmail}) is not registered in the database. Please Sign Up first.`);
          setAuthMode('signup');
        }
      }
    } else {
      // mode === 'signup'
      let dbUser = resData?.user;
      const profileData = {
        _id: dbUser?._id || `usr_${Date.now()}`,
        name: dbUser?.fullName || userName,
        email: dbUser?.email || cleanEmail,
        photo: dbUser?.avatar || userPhoto,
        role: dbUser?.role || 'commander',
        connectedDate: new Date(dbUser?.createdAt || Date.now()).toLocaleDateString()
      };
      if (dbUser) {
        isRemoteSyncRef.current = true;
        if (Array.isArray(dbUser.reminders) && dbUser.reminders.length > 0) setRemindersList(dbUser.reminders);
        if (typeof dbUser.snoozeMinutes === 'number') setSnoozeMinutes(dbUser.snoozeMinutes);
        if (Array.isArray(dbUser.expenses)) {
          const rawDeleted = (() => {
            try { return JSON.parse(localStorage.getItem('jarvis_deleted_expense_ids') || '[]'); } catch { return []; }
          })();
          setExpenseList(prev => {
            const merged = mergeExpenses(prev, dbUser.expenses, rawDeleted);
            try {
              localStorage.setItem('jarvis_expenses', JSON.stringify(merged));
              localStorage.setItem(`jarvis_expenses_${cleanEmail}`, JSON.stringify(merged));
            } catch (e) {}
            return merged;
          });
        }
        if (typeof dbUser.monthlyBudget === 'number') setMonthlyBudget(dbUser.monthlyBudget);
        if (Array.isArray(dbUser.notes)) setNotesList(dbUser.notes);
        setTimeout(() => { isRemoteSyncRef.current = false; }, 400);
      }
      localStorage.setItem('jarvis_user_profile', JSON.stringify(profileData));
      localStorage.setItem(`jarvis_db_user_${cleanEmail}`, JSON.stringify(profileData));
      setUserProfile(profileData);
      setShowAuthModal(false);
      alert(`Sign Up Success! Welcome ${profileData.name}. Your account has been registered.`);
    }
  };

  // Callback from GSI rendered button / One-Tap
  const handleGoogleCredentialResponse = async (response) => {
    if (!response || !response.credential) return;
    try {
      const decoded = parseJwt(response.credential);
      if (!decoded || !decoded.email) {
        throw new Error("Unable to parse Google authentication token.");
      }
      await processAuthWithBackend(decoded.email, decoded.name || 'User', decoded.picture || '', authMode);
    } catch (err) {
      alert(`Authentication Error: ${err.message}`);
    }
  };

  // Render Google GSI button when Auth Modal is open
  useEffect(() => {
    if (!showAuthModal) return;

    const renderGsiButton = () => {
      if (window.google?.accounts?.id && googleBtnRef.current) {
        try {
          googleBtnRef.current.innerHTML = "";
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCredentialResponse,
            auto_select: false
          });
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'outline',
            size: 'large',
            width: 280,
            text: authMode === 'login' ? 'signin_with' : 'signup_with',
            shape: 'pill'
          });
        } catch (e) {
          console.error("GSI renderButton error:", e);
        }
      }
    };

    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = renderGsiButton;
      document.body.appendChild(script);
    } else {
      renderGsiButton();
    }
  }, [showAuthModal, authMode]);

  // Main Google Auth Trigger (Uses Google Identity Services popup with prompt: 'select_account')
  const triggerGoogleAuth = (targetMode = authMode) => {
    setIsAuthLoading(true);

    const startOAuth = () => {
      if (window.google?.accounts?.oauth2) {
        try {
          const client = window.google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: 'email profile openid',
            callback: async (tokenResponse) => {
              if (tokenResponse.error) {
                setIsAuthLoading(false);
                if (tokenResponse.error === 'popup_closed_by_user') return;
                alert(`Google Sign-In: ${tokenResponse.error_description || tokenResponse.error}`);
                return;
              }
              try {
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                const info = await res.json();
                if (info && info.email) {
                  await processAuthWithBackend(info.email, info.name, info.picture, targetMode);
                } else {
                  alert("Could not fetch user profile from Google.");
                  setIsAuthLoading(false);
                }
              } catch (fetchErr) {
                alert(`Error: ${fetchErr.message}`);
                setIsAuthLoading(false);
              }
            }
          });
          client.requestAccessToken({ prompt: 'select_account' });
          return;
        } catch (err) {
          console.error("OAuth client error:", err);
        }
      }

      // Fallback: prompt Google One Tap / account chooser
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.prompt();
        } catch (e) {}
      }
      setIsAuthLoading(false);
    };

    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = startOAuth;
      document.body.appendChild(script);
    } else {
      startOAuth();
    }
  };

  const handleGoogleAuthAction = () => {
    triggerGoogleAuth(authMode);
  };

  const startBrowserGoogleAuthPopup = () => {
    triggerGoogleAuth(authMode);
  };

  const startRiderAppGoogleAuth = () => {
    triggerGoogleAuth(authMode);
  };

  // Master Mute Handler: Completely mutes whole web application
  useEffect(() => {
    if (isMuted) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (alarmIntervalRef.current) {
        clearInterval(alarmIntervalRef.current);
        alarmIntervalRef.current = null;
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'running') {
        audioCtxRef.current.suspend().catch(() => {});
      }
      document.querySelectorAll('audio, video').forEach(el => {
        el.muted = true;
      });
    } else {
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }
    }
  }, [isMuted]);

  // Pure Music / Sound Alarm Only - Plays Continuously in a loop until user clicks "Got It / Dismiss"
  const isAlarmPlayingRef = useRef(false);

  const startJailerFluteAlarm = useCallback(() => {
    if (isMuted) return;
    isAlarmPlayingRef.current = true;
    if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);

    const playFluteTune = () => {
      if (!isAlarmPlayingRef.current || isMuted) return;
      try {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const notes = [587.33, 659.25, 783.99, 880.00, 1046.50, 880.00, 783.99];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.16);
          
          gain.gain.setValueAtTime(0.5, ctx.currentTime + idx * 0.16);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.16 + 0.20);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.16);
          osc.stop(ctx.currentTime + idx * 0.16 + 0.21);
        });
      } catch (e) {
        console.warn("Alarm sound error:", e);
      }
    };

    playFluteTune();
    // Continuous loop every 1.4 seconds until user clicks "Got It"
    alarmIntervalRef.current = setInterval(playFluteTune, 1400);
  }, [isMuted]);

  const stopAlarmSound = useCallback(() => {
    isAlarmPlayingRef.current = false;
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
  }, []);

  const handleSnooze = useCallback(() => {
    stopAlarmSound();
    if (activeAlertTask) {
      const now = new Date();
      now.setMinutes(now.getMinutes() + snoozeMinutes);
      const snoozeH = String(now.getHours()).padStart(2, '0');
      const snoozeM = String(now.getMinutes()).padStart(2, '0');
      const snoozeTimeStr = `${snoozeH}:${snoozeM}`;

      setSnoozedAlerts(prev => ({ ...prev, [activeAlertTask]: snoozeTimeStr }));
    }
    setActiveAlertTask(null);
    setActiveAlertKey(null);
    setCurrentAlertTaskId(null);
    triggeredMinuteRef.current = '';
  }, [activeAlertTask, snoozeMinutes, stopAlarmSound]);

  // Ensure alarm keeps playing continuously as long as activeAlertTask modal is showing
  useEffect(() => {
    if (activeAlertTask && !isMuted) {
      startJailerFluteAlarm();
    } else if (!activeAlertTask) {
      stopAlarmSound();
    }
  }, [activeAlertTask, isMuted, startJailerFluteAlarm, stopAlarmSound]);

  const triggerReminderVisualAndVoice = useCallback((task, time) => {
    if (!task) return;
    setActiveAlertTask(task);
    setActiveAlertKey(`alert_${Date.now()}`);
    if (!isMuted) {
      startJailerFluteAlarm();
      try {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utter = new SpeechSynthesisUtterance(`Reminder alert: ${task}`);
          utter.rate = 0.95;
          utter.pitch = 1.0;
          window.speechSynthesis.speak(utter);
        }
      } catch (e) {}
    }
  }, [isMuted, startJailerFluteAlarm]);

  const triggerReminderVisualAndVoiceRef = useRef(triggerReminderVisualAndVoice);
  useEffect(() => {
    triggerReminderVisualAndVoiceRef.current = triggerReminderVisualAndVoice;
  }, [triggerReminderVisualAndVoice]);

  // Service Worker and URL Query String Listener for Native Web Push Click
  useEffect(() => {
    // 1. Check URL parameters for ?reminder=...
    try {
      const params = new URLSearchParams(window.location.search);
      const remParam = params.get('reminder');
      const timeParam = params.get('time') || '';
      if (remParam) {
        setTimeout(() => {
          if (triggerReminderVisualAndVoiceRef.current) {
            triggerReminderVisualAndVoiceRef.current(decodeURIComponent(remParam), timeParam);
          }
        }, 600);
        window.history.replaceState({}, '', window.location.pathname);
      }
    } catch (e) {}

    // 2. Listen for messages from Service Worker when user clicks native Windows/Android push banner
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const handleSwMessage = (event) => {
        if (event.data && event.data.type === 'TRIGGER_REMINDER_ANIMATION') {
          if (triggerReminderVisualAndVoiceRef.current) {
            triggerReminderVisualAndVoiceRef.current(event.data.task, event.data.time);
          }
        }
      };
      navigator.serviceWorker.addEventListener('message', handleSwMessage);
      return () => navigator.serviceWorker.removeEventListener('message', handleSwMessage);
    }
  }, []);

  // Global Audio Unlock Listener on User Interaction (Prevents browser audio blocking)
  useEffect(() => {
    const unlockAudio = () => {
      try {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }
      } catch (e) {}
    };
    window.addEventListener('click', unlockAudio, { passive: true });
    window.addEventListener('pointerdown', unlockAudio, { passive: true });
    window.addEventListener('keydown', unlockAudio, { passive: true });
    window.addEventListener('touchstart', unlockAudio, { passive: true });
    window.addEventListener('touchstart', unlockAudio, { passive: true });
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  const testFluteSound = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const notes = [587.33, 659.25, 783.99, 880.00, 783.99, 659.25];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.18);
        gain.gain.setValueAtTime(0.4, ctx.currentTime + idx * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.18 + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.18);
        osc.stop(ctx.currentTime + idx * 0.18 + 0.15);
      });
    } catch (e) {
      console.warn("Audio test error:", e);
    }
  }, []);

  const speakText = useCallback((text) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    
    const voices = window.speechSynthesis.getVoices();
    const selectedVoice = voices.find(v => v.lang.includes('en') || v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('male')) || voices[0];

    const utterance = new SpeechSynthesisUtterance(text);
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.rate = 0.82; 
    utterance.pitch = 0.75; 
    utterance.lang = 'en-US';

    window.speechSynthesis.speak(utterance);
  }, [isMuted]);

  const handleStopAll = useCallback(() => {
    setIsMonitoringActive(false);
    stopAlarmSound();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setRouteStatus({ isHeavy: false, message: "Monitoring stopped." });
  }, [stopAlarmSound]);

  // 12-Hour Time Formatter
  const formatTimeTo12Hour = (timeStr) => {
    if (!timeStr || !timeStr.includes(':')) return timeStr;
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const adjustedH = h % 12 === 0 ? 12 : h % 12;
    return `${String(adjustedH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
  };

  // Expense Categories Constant
  const EXPENSE_CATEGORIES = ['Food & Snacks', 'Travel & Fuel', 'Study & Books', 'Shopping', 'Bills & Recharge', 'Entertainment', 'Other'];


  // Google Keep Style Notes Handlers with Gmail ID Multi-Device Sync & Email Dispatch
  const syncNotesToCloud = (newNotes) => {
    setNotesList(newNotes);
    const email = userProfile?.email ? userProfile.email.trim().toLowerCase() : 'guest';
    localStorage.setItem(`jarvis_notes_${email}`, JSON.stringify(newNotes));

    if (userProfile?.email) {
      if (socketRef.current?.connected) {
        socketRef.current.emit('sync_user_data_realtime', {
          email: userProfile.email,
          notes: newNotes
        });
      }
      fetch(`${BACKEND_URL}/api/notes/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userProfile.email, notes: newNotes })
      }).catch(() => {});
    }
  };

  // Client-Side Image Compression & Attachment Reader for High-Speed Mobile Sync
  const processNoteAttachmentFile = (file) => {
    return new Promise((resolve, reject) => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isAudio = file.type.startsWith('audio/');
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

      let attType = 'other';
      if (isImage) attType = 'photo';
      else if (isVideo) attType = 'video';
      else if (isAudio) attType = 'audio';
      else if (isPdf) attType = 'pdf';

      const reader = new FileReader();

      if (isImage) {
        reader.onload = (e) => {
          const img = new window.Image();
          img.onload = () => {
            const maxDim = 1400;
            let w = img.width;
            let h = img.height;
            if (w > maxDim || h > maxDim) {
              if (w > h) {
                h = Math.round((h * maxDim) / w);
                w = maxDim;
              } else {
                w = Math.round((w * maxDim) / h);
                h = maxDim;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
            resolve({
              id: 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
              name: file.name,
              type: 'photo',
              mimeType: 'image/jpeg',
              size: Math.round((compressedDataUrl.length * 3) / 4),
              dataUrl: compressedDataUrl,
              uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
          };
          img.onerror = () => {
            resolve({
              id: 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
              name: file.name,
              type: 'photo',
              mimeType: file.type || 'image/jpeg',
              size: file.size,
              dataUrl: e.target.result,
              uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
          };
          img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      } else {
        reader.onload = (e) => {
          resolve({
            id: 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            name: file.name,
            type: attType,
            mimeType: file.type || (isPdf ? 'application/pdf' : 'application/octet-stream'),
            size: file.size,
            dataUrl: e.target.result,
            uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      }
    });
  };

  const handleNotesFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      try {
        const att = await processNoteAttachmentFile(file);
        setStagedAttachments(prev => [...prev, att]);
      } catch (err) {
        console.error("Error attaching file:", err);
      }
    }
    if (notesFileInputRef.current) notesFileInputRef.current.value = '';
  };

  const handleRemoveStagedAttachment = (attId) => {
    setStagedAttachments(prev => prev.filter(a => a.id !== attId));
  };

  // Direct Voice Recording into Note (Mobile & Desktop Compatible)
  const handleStartAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result;
          const newAtt = {
            id: 'att_voice_' + Date.now(),
            name: `Voice_Note_${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/:/g, '-')}.webm`,
            type: 'audio',
            mimeType: 'audio/webm',
            size: audioBlob.size,
            dataUrl: base64data,
            uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setStagedAttachments(prev => [...prev, newAtt]);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(200);
      setIsRecordingAudio(true);
      setRecordingDuration(0);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      alert("Microphone permission is required to record voice notes.");
      console.warn("Microphone access notice:", err);
    }
  };

  const handleStopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const handleSaveNote = () => {
    if (!newNoteTitle.trim() && !newNoteContent.trim() && stagedAttachments.length === 0) {
      alert("Please enter a note title, content, or attach a photo, video, audio, or PDF.");
      return;
    }

    const newNote = {
      id: `note_${Date.now()}`,
      title: newNoteTitle.trim() || (stagedAttachments.length > 0 ? stagedAttachments[0].name : 'Untitled Note'),
      content: newNoteContent.trim(),
      color: newNoteColor || '#38bdf8',
      pinned: newNotePinned,
      attachments: stagedAttachments,
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    const updated = [newNote, ...notesList];
    setNotesList(updated);
    syncNotesToCloud(updated);
    setNewNoteTitle('');
    setNewNoteContent('');
    setNewNotePinned(false);
    setStagedAttachments([]);
  };

  const handleToggleChecklistItem = (noteId, itemId) => {
    const updated = notesList.map(n => {
      if (n.id === noteId && Array.isArray(n.checklist)) {
        return {
          ...n,
          checklist: n.checklist.map(c => c.id === itemId ? { ...c, completed: !c.completed } : c)
        };
      }
      return n;
    });
    syncNotesToCloud(updated);
  };

  const handleDeleteNote = (noteId) => {
    const updated = notesList.filter(n => n.id !== noteId);
    syncNotesToCloud(updated);
  };

  const handleTogglePinNote = (noteId) => {
    const updated = notesList.map(n => n.id === noteId ? { ...n, pinned: !n.pinned } : n);
    syncNotesToCloud(updated);
  };

  const handleSendNotesEmailNow = async (explicitEmail = null) => {
    const targetEmail = (explicitEmail || notesTargetEmail || userProfile?.email || 'sataparahetkumar@gmail.com').trim().toLowerCase();
    setIsSendingNotesEmail(true);
    setNotesEmailFeedback(`Dispatching notes to Telegram bot, mobile push & email (${targetEmail})...`);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const res = await fetch(`${BACKEND_URL}/api/notes-scheduler/trigger?email=${encodeURIComponent(targetEmail)}&slot=Manual%20Instant%20Notes%20Briefing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, slot: 'Manual Instant Notes Briefing' }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setNotesEmailFeedback(`✅ Dispatched to Telegram bot, Mobile Push & ${targetEmail}!`);
      } else {
        setNotesEmailFeedback(`❌ ${data.error || data.message || 'Failed to dispatch notes'}`);
      }
    } catch (e) {
      if (e.name === 'AbortError') {
        setNotesEmailFeedback(`⚠️ Notes dispatch is processing in background.`);
      } else {
        setNotesEmailFeedback(`❌ Dispatch notice: ${e.message}`);
      }
    } finally {
      setIsSendingNotesEmail(false);
      setTimeout(() => setNotesEmailFeedback(""), 8000);
    }
  };

  // Safe Expense Handlers (Prepend new expense to top with instant multi-device sync)
  const handleAddExpense = (e) => {
    if (e) e.preventDefault();
    if (!expenseTitle.trim() || !expenseAmount) {
      alert("Please enter both title and amount.");
      return;
    }
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const dateStr = `${ym}-${String(now.getDate()).padStart(2, '0')}`;
    const newExp = {
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      type: transactionType || 'expense',
      title: expenseTitle.trim(),
      amount: parseFloat(expenseAmount),
      category: transactionType === 'income' ? (expenseCategory || 'Salary & Wages') : (expenseCategory || 'Food & Snacks'),
      date: dateStr,
      createdAt: Date.now()
    };

    setExpenseList(prev => {
      const updated = [newExp, ...prev.filter(item => item && item.id !== newExp.id)];
      try {
        localStorage.setItem('jarvis_expenses', JSON.stringify(updated));
        localStorage.setItem('jarvis_expenses_sataparahetkumar@gmail.com', JSON.stringify(updated));
        if (userProfile?.email) {
          localStorage.setItem(`jarvis_expenses_${userProfile.email.trim().toLowerCase()}`, JSON.stringify(updated));
        }
      } catch (err) {}
      return updated;
    });

    setExpenseTitle('');
    setExpenseAmount('');

    if (userProfile?.email) {
      const cleanEmail = userProfile.email.trim().toLowerCase();
      if (socketRef.current?.connected) {
        socketRef.current.emit('sync_user_data_realtime', {
          email: cleanEmail,
          expenses: [newExp, ...expenseList],
          monthlyBudget
        });
      }
      fetch(`${BACKEND_URL}/api/expenses/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, expense: newExp }),
        keepalive: true
      }).catch(err => console.warn('Instant expense sync backgrounded:', err));
    }
  };

  const handleQuickAddExpense = (title, amount, category) => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const dateStr = `${ym}-${String(now.getDate()).padStart(2, '0')}`;
    const newExp = {
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      type: 'expense',
      title: (title || 'Expense').trim(),
      amount: parseFloat(amount) || 0,
      category: category || 'Food & Snacks',
      date: dateStr,
      createdAt: Date.now()
    };

    setExpenseList(prev => {
      const updated = [newExp, ...prev.filter(item => item && item.id !== newExp.id)];
      try {
        localStorage.setItem('jarvis_expenses', JSON.stringify(updated));
        localStorage.setItem('jarvis_expenses_sataparahetkumar@gmail.com', JSON.stringify(updated));
        if (userProfile?.email) {
          localStorage.setItem(`jarvis_expenses_${userProfile.email.trim().toLowerCase()}`, JSON.stringify(updated));
        }
      } catch (err) {}
      return updated;
    });

    if (userProfile?.email) {
      const cleanEmail = userProfile.email.trim().toLowerCase();
      if (socketRef.current?.connected) {
        socketRef.current.emit('sync_user_data_realtime', {
          email: cleanEmail,
          expenses: [newExp, ...expenseList],
          monthlyBudget
        });
      }
      fetch(`${BACKEND_URL}/api/expenses/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, expense: newExp }),
        keepalive: true
      }).catch(() => {});
    }
  };

  const handleExportExpensesCSV = () => {
    if (expenseList.length === 0) {
      alert("No expenses to export.");
      return;
    }
    const headers = ["Date", "Title", "Category", "Amount (INR)"];
    const rows = expenseList.map(item => [
      `"${item.date || ''}"`,
      `"${(item.title || '').replace(/"/g, '""')}"`,
      `"${(item.category || 'General').replace(/"/g, '""')}"`,
      item.amount || 0
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Jarvis_Expenses_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearAllExpenses = () => {
    if (window.confirm("Are you sure you want to clear all expense records?")) {
      const allIds = expenseList.map(e => String(e.id || '')).filter(Boolean);
      try {
        const raw = localStorage.getItem('jarvis_deleted_expense_ids');
        const deletedIds = raw ? JSON.parse(raw) : [];
        const mergedDeleted = Array.from(new Set([...deletedIds, ...allIds]));
        localStorage.setItem('jarvis_deleted_expense_ids', JSON.stringify(mergedDeleted.slice(-300)));
      } catch (e) {}

      setExpenseList([]);
      try {
        localStorage.setItem('jarvis_expenses', JSON.stringify([]));
        if (userProfile?.email) {
          localStorage.setItem(`jarvis_expenses_${userProfile.email.trim().toLowerCase()}`, JSON.stringify([]));
        }
      } catch (err) {}

      if (userProfile?.email) {
        const cleanEmail = userProfile.email.trim().toLowerCase();
        if (socketRef.current?.connected) {
          socketRef.current.emit('sync_user_data_realtime', {
            email: cleanEmail,
            expenses: [],
            isClearAllExpenses: true
          });
        }
        fetch(`${BACKEND_URL}/api/expenses/clear`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail }),
          keepalive: true
        }).catch(() => {});
      }
    }
  };

  const handleDeleteExpense = (target) => {
    const targetId = typeof target === 'object' ? target?.id : target;
    const exp = expenseList.find(e => String(e.id) === String(targetId)) ||
      (typeof target === 'number' ? expenseList[target] : null) ||
      (typeof target === 'object' ? target : null);

    if (!exp) return;

    const confirmDelete = window.confirm(`Are you sure you want to delete "${exp.title || 'this expense'}" (₹${exp.amount})?`);
    if (!confirmDelete) return;

    const expId = String(exp.id || targetId || `tx_${exp.date || ''}_${exp.title || ''}_${exp.amount || ''}`);

    try {
      const raw = localStorage.getItem('jarvis_deleted_expense_ids');
      const deletedIds = raw ? JSON.parse(raw) : [];
      if (expId && !deletedIds.includes(expId)) {
        deletedIds.push(expId);
        localStorage.setItem('jarvis_deleted_expense_ids', JSON.stringify(deletedIds.slice(-300)));
      }
    } catch (e) {}

    setExpenseList(prev => {
      const updated = prev.filter(e => {
        if (expId && e.id) return String(e.id) !== expId;
        return !(e.title === exp.title && e.amount === exp.amount && e.date === exp.date);
      });
      try {
        localStorage.setItem('jarvis_expenses', JSON.stringify(updated));
        if (userProfile?.email) {
          localStorage.setItem(`jarvis_expenses_${userProfile.email.trim().toLowerCase()}`, JSON.stringify(updated));
        }
      } catch (err) {}
      return updated;
    });

    if (userProfile?.email) {
      const cleanEmail = userProfile.email.trim().toLowerCase();
      if (socketRef.current?.connected) {
        socketRef.current.emit('sync_user_data_realtime', {
          email: cleanEmail,
          deletedExpenseIds: [expId],
          expenses: expenseList.filter(e => String(e.id) !== expId),
          monthlyBudget
        });
      }
      fetch(`${BACKEND_URL}/api/expenses/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, id: expId }),
        keepalive: true
      }).catch(() => {});
    }
  };

  const handleUpdateBudget = (e) => {
    e.preventDefault();
    const val = parseFloat(tempBudgetInput);
    if (!isNaN(val) && val > 0) {
      setMonthlyBudget(val);
      setIsSettingBudget(false);
      speakText("Monthly budget updated.");
    }
  };



    const totalSpent = expenseList.reduce((acc, curr) => acc + (parseFloat(curr?.amount) || 0), 0);
  const remainingBudget = monthlyBudget - totalSpent;
  const budgetSpentPct = Math.min(100, Math.round((totalSpent / (monthlyBudget || 1)) * 100));

  const filteredExpenses = expenseList.filter(exp => {
    const matchesCategory = expenseCategoryFilter === 'All' || exp.category === expenseCategoryFilter;
    const matchesSearch = !expenseSearchQuery.trim() || 
      (exp.title && exp.title.toLowerCase().includes(expenseSearchQuery.toLowerCase())) ||
      (exp.amount && exp.amount.toString().includes(expenseSearchQuery));
    return matchesCategory && matchesSearch;
  });

  // Smart Sorting: Upcoming nearest future reminder ALWAYS kept at the top, triggered ones below
  const sortedReminders = [...remindersList].sort((a, b) => {
    // 1. Pending (not yet triggered) come first; Triggered (completed) go below
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    
    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();

    const [hA, mA] = (a.time || '00:00').split(':').map(Number);
    const [hB, mB] = (b.time || '00:00').split(':').map(Number);
    const minA = hA * 60 + mA;
    const minB = hB * 60 + mB;

    if (!a.completed && !b.completed) {
      // Both are pending today:
      // The reminder coming up next (nearest future minute today) is ALWAYS kept at the top
      const diffA = minA >= currentMin ? (minA - currentMin) : (minA - currentMin + 1440);
      const diffB = minB >= currentMin ? (minB - currentMin) : (minB - currentMin + 1440);
      return diffA - diffB;
    } else {
      // Both are triggered: chronological order
      return minA - minB;
    }
  });

  // Reactive Month Expense Spend Computations for Dashboard & Recommendations
  const currentMonthExpenses = (expenseList || []).filter(item => item && item.type !== 'income' && isExpenseInMonth(item, selectedExpenseMonth));
  const currentMonthSpent = currentMonthExpenses.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
  const currentBudgetPct = monthlyBudget > 0 ? Math.min(Math.round((currentMonthSpent / monthlyBudget) * 100), 100) : 0;

  return (
    <div className="app-shell liquid-glass-shell nordic-shell">
      {/* Custom Full-Screen Startup Animation */}
      {showStartupSplash && (
        <ShadowStartupAnimation onComplete={() => setShowStartupSplash(false)} />
      )}

      {/* Liquid Glass iOS 26 Header */}
      <header className="liquid-glass-header nordic-header">
        <div className="liquid-glass-header-inner nordic-header-inner">
          {/* Brand Logo & Title */}
          <div className="liquid-glass-brand nordic-brand">
            <div className="liquid-glass-logo-box nordic-logo-box">
              <ShadowLogo size={22} color="#FFFFFF" innerColor="#F59E0B" />
            </div>
            <div className="liquid-glass-brand-text nordic-brand-text">
              <span className="liquid-glass-brand-title nordic-brand-title">SHADOW</span>
              <span className="liquid-glass-brand-sub nordic-brand-sub">Daily Hub • Gujarat</span>
            </div>
          </div>

          {/* Center Greeting & Status (Desktop only) */}
          <div className="liquid-glass-greeting-pill nordic-greeting-pill desktop-only">
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block', boxShadow: '0 0 8px #10B981' }} />
            <span>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {userProfile ? (userProfile.name?.split(' ')[0] || 'Het') : 'Het'} 👋</span>
            <span style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '11px' }}>•</span>
            <LiveHeaderClock />
          </div>

          {/* Right Header Actions */}
          <div className="liquid-glass-header-actions nordic-header-actions">
            {/* Direct PWA Push Alert Button (ONLY PLACE TO SETUP PUSH/ALERTS) */}
            <button 
              type="button"
              className="liquid-glass-icon-btn nordic-icon-btn touch-btn"
              onClick={() => setShowPermissionsModal(true)}
              title="PWA Web Push Notifications & Permissions"
            >
              <Bell size={17} color={mobilePermissions.notifications === 'granted' || isPushSubscribed ? "#FCD34D" : "rgba(255, 255, 255, 0.7)"} />
              {(mobilePermissions.notifications === 'granted' || isPushSubscribed) && (
                <span style={{ position: 'absolute', top: '7px', right: '7px', width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10B981', border: '1.5px solid #FFFFFF' }} />
              )}
            </button>

            {/* Sound Toggle */}
            <button 
              type="button"
              className="liquid-glass-icon-btn nordic-icon-btn touch-btn desktop-only"
              onClick={() => setIsMuted(!isMuted)}
              title={isMuted ? "Unmute Application Sound" : "Mute Sound"}
            >
              {isMuted ? <VolumeX size={17} color="#EF4444" /> : <Volume2 size={17} color="#FCD34D" />}
            </button>

            {/* User Profile Avatar (ONLY PLACE TO OPEN PROFILE / LOGIN) */}
            <button 
              type="button"
              className="liquid-glass-profile-pill nordic-profile-pill touch-btn"
              onClick={() => {
                setMobileActiveNav('profile');
                if (userProfile) setShowProfileModal(true);
                else { setAuthMode('login'); setShowAuthModal(true); }
              }}
              title={userProfile ? userProfile.name : "Sign In with Google"}
            >
              {userProfile && userProfile.photo ? (
                <img src={userProfile.photo} alt={userProfile.name} className="nordic-avatar-img" />
              ) : (
                <UserCircle size={18} color="#FCD34D" />
              )}
              <span className="desktop-only">{userProfile ? (userProfile.name?.split(' ')[0] || 'Profile') : 'Login'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area - Liquid Glass Stage */}
      <main className="liquid-glass-main nordic-main smooth-scroll">
        <div className="liquid-glass-container nordic-container">

          {/* Quick Routine Glance Banner (Frosted glass focus strip) */}
          <section className="liquid-glass-glance-banner nordic-glance-banner">
            <div className="liquid-glass-glance-left nordic-glance-left">
              <span className="liquid-glass-glance-tag nordic-glance-tag">UPCOMING FOCUS</span>
              <span style={{ fontWeight: '800' }}>
                "{nextRemTitle || 'Routine Focus'}" at {formatTimeTo12Hour(nextRemTimeStr || '14:28')}
              </span>
              <span style={{ color: '#FCD34D', fontWeight: '900' }}>({nextCountdownStr})</span>
            </div>
            <div className="liquid-glass-glance-right nordic-glance-right desktop-only">
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981', boxShadow: '0 0 6px #10B981' }} />
              <span>Cloud Telemetry Active • Gujarat Standard Time</span>
            </div>
          </section>

          {/* SQUARE-TYPE LIQUID GLASS TILE GRID (2-Col Square on Mobile, 3-Col on Laptop) */}
          <section className="liquid-glass-grid nordic-grid">
            
            {/* Tile 1: Daily Routines & Watcher */}
            <div 
              className="liquid-glass-card nordic-card touch-btn"
              onClick={() => { setMobileActiveNav('watcher'); setShowWatcherModal(true); setCurrentTimeInput(getCurrentTimeString()); }}
              title="Open Daily Routines & Watcher"
            >
              <div className="liquid-glass-card-top nordic-card-top">
                <div className="liquid-glass-icon-orb nordic-card-icon-wrap orange-glow terracotta">
                  <Clock size={24} />
                </div>
                <span className="liquid-glass-badge nordic-card-badge highlight">
                  {nextCountdownStr}
                </span>
              </div>
              <div className="liquid-glass-card-body nordic-card-body">
                <span className="liquid-glass-card-title nordic-card-title">Watcher & Routines</span>
                <span className="liquid-glass-card-stat nordic-card-stat">
                  {formatTimeTo12Hour(nextRemTimeStr || '14:28')}
                </span>
                <p className="liquid-glass-card-desc nordic-card-desc desktop-only">
                  Upcoming target: "{nextRemTitle || 'Routine'}" with automated voice speech alerts.
                </p>
              </div>
              <div className="liquid-glass-card-footer nordic-card-footer desktop-only">
                <button type="button" className="liquid-glass-card-btn nordic-card-btn primary">
                  Open Watcher ➔
                </button>
              </div>
            </div>

            {/* Tile 2: Expenses Vault & Budget */}
            <div 
              className="liquid-glass-card nordic-card touch-btn"
              onClick={() => { setMobileActiveNav('expense'); setShowExpenseModal(true); }}
              title="Open Expenses Vault & Monthly Budget"
            >
              <div className="liquid-glass-card-top nordic-card-top">
                <div className="liquid-glass-icon-orb nordic-card-icon-wrap emerald-glow emerald">
                  <DollarSign size={24} />
                </div>
                <span className="liquid-glass-badge nordic-card-badge">
                  {currentBudgetPct}% Spent
                </span>
              </div>
              <div className="liquid-glass-card-body nordic-card-body">
                <span className="liquid-glass-card-title nordic-card-title">Expenses Vault</span>
                <span className="liquid-glass-card-stat nordic-card-stat">
                  ₹{currentMonthSpent.toLocaleString('en-IN')}
                </span>
                <div className="liquid-glass-progress-bar nordic-progress-bar desktop-only">
                  <div 
                    className="liquid-glass-progress-fill nordic-progress-fill" 
                    style={{ 
                      width: `${currentBudgetPct}%`
                    }} 
                  />
                </div>
                <p className="liquid-glass-card-desc nordic-card-desc desktop-only">
                  Track daily spending, view monthly reports, export CSV sheets.
                </p>
              </div>
              <div className="liquid-glass-card-footer nordic-card-footer desktop-only">
                <button type="button" className="liquid-glass-card-btn nordic-card-btn primary">
                  Open Vault ➔
                </button>
              </div>
            </div>

            {/* Tile 3: Google Keep Notes */}
            <div 
              className="liquid-glass-card nordic-card touch-btn"
              onClick={() => { setMobileActiveNav('notes'); setShowNotesModal(true); }}
              title="Open Google Keep Style Notes"
            >
              <div className="liquid-glass-card-top nordic-card-top">
                <div className="liquid-glass-icon-orb nordic-card-icon-wrap amber-glow" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.15) 100%)', color: '#fbbf24' }}>
                  <CheckSquare size={24} />
                </div>
                <span className="liquid-glass-badge nordic-card-badge highlight">
                  {notesList.length} Notes
                </span>
              </div>
              <div className="liquid-glass-card-body nordic-card-body">
                <span className="liquid-glass-card-title nordic-card-title">Keep Notes</span>
                <span className="liquid-glass-card-stat nordic-card-stat" style={{ color: '#fbbf24' }}>
                  {notesList.filter(n => n.pinned).length} Pinned
                </span>
                <p className="liquid-glass-card-desc nordic-card-desc desktop-only">
                  Fast color-coded notes, voice memos, media attachments & Gmail sync.
                </p>
              </div>
              <div className="liquid-glass-card-footer nordic-card-footer desktop-only">
                <button type="button" className="liquid-glass-card-btn nordic-card-btn primary">
                  Open Notes ➔
                </button>
              </div>
            </div>

            {/* Tile 4: AI Photo Studio */}
            <div 
              className="liquid-glass-card nordic-card touch-btn"
              onClick={() => setShowPhotoEditModal(true)}
              title="Open AI Photo Studio & Magic Eraser"
            >
              <div className="liquid-glass-card-top nordic-card-top">
                <div className="liquid-glass-icon-orb nordic-card-icon-wrap rose-glow rose">
                  <Image size={24} />
                </div>
                <span className="liquid-glass-badge nordic-card-badge">
                  AI Eraser
                </span>
              </div>
              <div className="liquid-glass-card-body nordic-card-body">
                <span className="liquid-glass-card-title nordic-card-title">AI Photo Studio</span>
                <span className="liquid-glass-card-stat nordic-card-stat">
                  Magic Studio
                </span>
                <p className="liquid-glass-card-desc nordic-card-desc desktop-only">
                  Inpainting object eraser, photo filters, instant crop, brightness & format conversions.
                </p>
              </div>
              <div className="liquid-glass-card-footer nordic-card-footer desktop-only">
                <button type="button" className="liquid-glass-card-btn nordic-card-btn primary">
                  Open Studio ➔
                </button>
              </div>
            </div>

            {/* Tile 5: સોના/ચાંદીનો ભાવ - દૈનિક (Facebook Live Feed & Daily Bhav) */}
            <div 
              className="liquid-glass-card nordic-card touch-btn"
              onClick={() => setShowDailyBhavModal(true)}
              title="સોના/ચાંદીનો ભાવ - દૈનિક (Facebook Live Updates)"
              style={{ borderColor: 'rgba(245, 158, 11, 0.35)' }}
            >
              <div className="liquid-glass-card-top nordic-card-top">
                <div className="liquid-glass-icon-orb nordic-card-icon-wrap amber-glow" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.15) 100%)', color: '#fbbf24' }}>
                  <Coins size={24} />
                </div>
                <span className="liquid-glass-badge nordic-card-badge highlight" style={{ backgroundColor: '#f59e0b', color: '#0b0f19', fontWeight: '900' }}>
                  46K LIVE
                </span>
              </div>
              <div className="liquid-glass-card-body nordic-card-body">
                <span className="liquid-glass-card-title nordic-card-title" style={{ fontSize: '15px' }}>
                  સોના/ચાંદીનો ભાવ - દૈનિક
                </span>
                <span className="liquid-glass-card-stat nordic-card-stat" style={{ color: '#fbbf24', fontSize: '14px', fontWeight: '900' }}>
                  Facebook Live Post
                </span>
                <p className="liquid-glass-card-desc nordic-card-desc desktop-only" style={{ fontSize: '11px', lineHeight: '1.4' }}>
                  ગુજરાતના સોના અને ચાંદીના રોજિંદા તાજા ભાવ. સરળ, સ્પષ્ટ અને દૈનિક ઇમેજ અપડેટ્સ.
                </p>
              </div>
              <div className="liquid-glass-card-footer nordic-card-footer desktop-only">
                <button type="button" className="liquid-glass-card-btn nordic-card-btn primary" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#0b0f19', fontWeight: '900' }}>
                  જુઓ લાઈવ ભાવ ➔
                </button>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* Tools / Extension Changer & Universal Converter Modal */}
      {showToolsModal && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowToolsModal(false);
              setConverterStatus(null);
              setConvertedDownloadInfo(null);
            }
          }}
          className="modal-overlay"
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(5, 7, 12, 0.72)', backdropFilter: 'blur(28px) saturate(190%)', WebkitBackdropFilter: 'blur(28px) saturate(190%)', zIndex: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', cursor: 'pointer' }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="modal-card tools-modal-scroll"
            style={{ 
              background: 'linear-gradient(150deg, rgba(18, 23, 35, 0.94) 0%, rgba(9, 12, 19, 0.98) 100%)', 
              backdropFilter: 'blur(32px) saturate(190%)',
              WebkitBackdropFilter: 'blur(32px) saturate(190%)',
              borderRadius: '24px', 
              padding: window.innerWidth < 640 ? '16px' : '24px', 
              width: '100%', 
              maxWidth: '740px', 
              position: 'relative', 
              border: '1px solid rgba(255, 255, 255, 0.20)', 
              color: '#FFFFFF', 
              maxHeight: '94vh', 
              overflowY: 'auto', 
              WebkitOverflowScrolling: 'touch',
              boxShadow: 'inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.55), inset 0 -1px 1px 0 rgba(255, 255, 255, 0.08), 0 24px 60px rgba(0,0,0,0.75)',
              touchAction: 'pan-y',
              cursor: 'default'
            }}
          >
            
            {/* Top Close Button (44px touch-friendly) */}
            <button 
              type="button"
              onClick={() => { setShowToolsModal(false); setConverterStatus(null); setConvertedDownloadInfo(null); }} 
              className="touch-btn"
              style={{ 
                position: 'absolute', 
                top: '16px', 
                right: '16px', 
                border: '1px solid rgba(255, 255, 255, 0.22)', 
                background: 'rgba(255, 255, 255, 0.12)', 
                color: '#FFFFFF', 
                borderRadius: '50%', 
                width: '38px', 
                height: '38px', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                zIndex: 10
              }}
              aria-label="Close"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', paddingRight: '44px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.12)', border: '1px solid rgba(255, 255, 255, 0.22)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Wrench size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#FFFFFF', letterSpacing: '-0.3px', lineHeight: '1.2' }}>
                  Shadow Studio: Extension Changer & Converter
                </h3>
                <span style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: '800', display: 'block', marginTop: '2px' }}>
                  Change any file extension or convert WEBP, PNG, JPG, PDF with 1-tap download
                </span>
              </div>
            </div>

            {/* Smooth Touch Navigation Tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px', backgroundColor: 'rgba(255, 255, 255, 0.08)', padding: '4px', borderRadius: '14px' }}>
              <button
                type="button"
                onClick={() => setToolActiveTab('extension')}
                className="touch-btn"
                style={{
                  minHeight: '44px',
                  borderRadius: '10px',
                  border: toolActiveTab === 'extension' ? '1px solid rgba(255, 255, 255, 0.5)' : 'none',
                  background: toolActiveTab === 'extension' ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 243, 248, 0.85) 100%)' : 'transparent',
                  color: toolActiveTab === 'extension' ? '#0b0f19' : 'rgba(255, 255, 255, 0.7)',
                  fontSize: '12px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <FileType size={16} /> Extension Changer
              </button>
              <button
                type="button"
                onClick={() => setToolActiveTab('convert')}
                className="touch-btn"
                style={{
                  minHeight: '44px',
                  borderRadius: '10px',
                  border: toolActiveTab === 'convert' ? '1px solid rgba(255, 255, 255, 0.5)' : 'none',
                  background: toolActiveTab === 'convert' ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 243, 248, 0.85) 100%)' : 'transparent',
                  color: toolActiveTab === 'convert' ? '#0b0f19' : 'rgba(255, 255, 255, 0.7)',
                  fontSize: '12px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Sliders size={16} /> Format & Size Converter
              </button>
            </div>

            {/* File Drop & Native Mobile Touch Area */}
            <input
              id="tools-universal-file-picker"
              type="file"
              ref={toolsFileInputRef}
              style={{ display: 'none' }}
              accept="*/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleToolsFileSelect(e.target.files[0]);
                  e.target.value = '';
                }
              }}
            />

            <label
              htmlFor="tools-universal-file-picker"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleToolsFileSelect(e.dataTransfer.files[0]);
                }
              }}
              className="touch-card"
              style={{ 
                minHeight: uploadedFile ? '140px' : '150px', 
                border: '2px dashed rgba(255, 255, 255, 0.25)', 
                borderRadius: '16px', 
                backgroundColor: uploadedFile ? 'rgba(255, 255, 255, 0.09)' : 'rgba(255, 255, 255, 0.05)', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                padding: '16px', 
                textAlign: 'center',
                cursor: 'pointer',
                marginBottom: '16px',
                width: '100%',
                boxSizing: 'border-box'
              }}
            >
              {uploadedFile ? (
                <div style={{ display: 'flex', flexDirection: window.innerWidth < 640 ? 'column' : 'row', alignItems: 'center', gap: '14px', width: '100%', justifyContent: 'center' }}>
                  {uploadedFilePreview ? (
                    <div style={{ width: '74px', height: '74px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.2)', backgroundColor: '#000000', flexShrink: 0 }}>
                      <img 
                        src={uploadedFilePreview} 
                        alt="Preview" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                  ) : (
                    <div style={{ width: '64px', height: '64px', borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FileText size={34} color="#FFFFFF" />
                    </div>
                  )}
                  
                  <div style={{ textAlign: window.innerWidth < 640 ? 'center' : 'left', flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '900', color: '#FFFFFF', wordBreak: 'break-all' }}>
                      {uploadedFile?.name || 'Selected File'}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: window.innerWidth < 640 ? 'center' : 'flex-start', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', backgroundColor: '#FFFFFF', color: '#0b0f19', padding: '2px 8px', borderRadius: '6px', fontWeight: '900' }}>
                        FORMAT: .{uploadedFileMeta?.ext || (uploadedFile?.name.split('.').pop() || 'FILE').toUpperCase()}
                      </span>
                      <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.75)', fontWeight: '800' }}>
                        {uploadedFileMeta?.sizeKb || (uploadedFile?.size ? (uploadedFile.size / 1024).toFixed(1) : '0')} KB 
                        {uploadedFileMeta?.width ? ` • ${uploadedFileMeta.width} × ${uploadedFileMeta.height} px` : ''}
                      </span>
                    </div>
                  </div>

                  <span
                    className="touch-btn"
                    style={{
                      padding: '8px 16px',
                      minHeight: '40px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.12)',
                      color: '#FFFFFF',
                      border: '1px solid rgba(255, 255, 255, 0.22)',
                      fontSize: '11.5px',
                      fontWeight: '900',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      flexShrink: 0
                    }}
                  >
                    <RefreshCw size={14} /> Change File
                  </span>
                </div>
              ) : (
                <div style={{ pointerEvents: 'none' }}>
                  <Upload size={36} color="#FFFFFF" style={{ marginBottom: '6px' }} />
                  <p style={{ margin: '0 0 4px 0', fontSize: '14.5px', fontWeight: '900', color: '#FFFFFF' }}>
                    Tap to Select Any File or Drop Here
                  </p>
                  <p style={{ margin: '0 0 6px 0', fontSize: '11px', color: 'rgba(255, 255, 255, 0.75)', fontWeight: '800' }}>
                    Supports ALL files: WEBP, PNG, JPG, PDF, TXT, CSV, MP3, MP4, ZIP, etc.
                  </p>
                  <span style={{ fontSize: '11px', color: '#60a5fa', fontWeight: '900', textDecoration: 'underline' }}>
                    100% Touch-Friendly Native File Picker
                  </span>
                </div>
              )}
            </label>

            {/* Real-Time Status & 1-Tap Direct Download Button (Prominently placed right below file card) */}
            {converterStatus && (
              <div style={{
                padding: '14px 16px',
                borderRadius: '14px',
                marginBottom: '16px',
                fontSize: '12.5px',
                fontWeight: '900',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                backgroundColor: converterStatus.type === 'error' ? '#fef2f2' : (converterStatus.type === 'success' ? '#f0fdf4' : '#eff6ff'),
                color: converterStatus.type === 'error' ? '#b91c1c' : (converterStatus.type === 'success' ? '#15803d' : '#1d4ed8'),
                border: `1.5px solid ${converterStatus.type === 'error' ? '#fecaca' : (converterStatus.type === 'success' ? '#bbf7d0' : '#bfdbfe')}`,
                boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {converterStatus.type === 'loading' ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    converterStatus.type === 'success' ? <Check size={16} /> : <X size={16} />
                  )}
                  <span>{converterStatus.message}</span>
                </div>

                {/* Infallible 1-Tap Direct Download Link (Guaranteed on mobile iOS Safari & Android) */}
                {convertedDownloadInfo && (
                  <a
                    href={convertedDownloadInfo.url}
                    download={convertedDownloadInfo.filename}
                    className="touch-btn"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      width: '100%',
                      marginTop: '6px',
                      backgroundColor: '#0f172a',
                      color: '#ffffff',
                      padding: '12px 18px',
                      borderRadius: '12px',
                      textDecoration: 'none',
                      fontSize: '13px',
                      fontWeight: '900',
                      minHeight: '48px',
                      boxShadow: '0 4px 14px rgba(15,23,42,0.18)',
                      boxSizing: 'border-box'
                    }}
                  >
                    <Download size={18} /> Tap to Download: {convertedDownloadInfo.filename} ({convertedDownloadInfo.sizeKb} KB)
                  </a>
                )}
              </div>
            )}

            {/* TAB 1: EXTENSION CHANGER */}
            {toolActiveTab === 'extension' && (
              <div>
                {/* Custom Extension Input Bar */}
                <div style={{ backgroundColor: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '14px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '900', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '8px' }}>
                    Change To Custom Extension:
                  </span>
                  <div style={{ display: 'flex', flexDirection: window.innerWidth < 560 ? 'column' : 'row', gap: '8px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: '900', color: '#94a3b8', fontSize: '15px' }}>.</span>
                      <input
                        type="text"
                        value={customExtension}
                        onChange={(e) => setCustomExtension(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                        placeholder="Type extension (e.g. png, mp4, apk, dat, mov)..."
                        style={{
                          width: '100%',
                          minHeight: '46px',
                          paddingLeft: '24px',
                          paddingRight: '12px',
                          borderRadius: '10px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '13px',
                          fontWeight: '800',
                          color: '#0f172a',
                          backgroundColor: '#ffffff',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      disabled={!uploadedFile || !customExtension.trim()}
                      onClick={() => handleExecuteConversion(customExtension, true)}
                      className="touch-btn"
                      style={{
                        minHeight: '46px',
                        padding: '0 20px',
                        borderRadius: '10px',
                        backgroundColor: '#0f172a',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: '900',
                        cursor: (uploadedFile && customExtension.trim()) ? 'pointer' : 'not-allowed',
                        opacity: (uploadedFile && customExtension.trim()) ? 1 : 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <Zap size={16} /> Change & Download
                    </button>
                  </div>
                </div>

                {/* Quick 1-Tap Extension Pills */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Fast 1-Tap Extension Presets:
                    </span>
                    <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '800' }}>
                      Tap any to instantly change & download
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: '8px' }}>
                    {[
                      { ext: 'png', label: '.PNG Image' },
                      { ext: 'jpg', label: '.JPG Photo' },
                      { ext: 'webp', label: '.WEBP Next' },
                      { ext: 'pdf', label: '.PDF Doc' },
                      { ext: 'txt', label: '.TXT Text' },
                      { ext: 'csv', label: '.CSV Sheet' },
                      { ext: 'json', label: '.JSON Data' },
                      { ext: 'svg', label: '.SVG Vector' },
                      { ext: 'mp3', label: '.MP3 Audio' },
                      { ext: 'mp4', label: '.MP4 Video' },
                      { ext: 'zip', label: '.ZIP Archive' },
                      { ext: 'docx', label: '.DOCX Word' },
                      { ext: 'xlsx', label: '.XLSX Excel' },
                      { ext: 'html', label: '.HTML Web' }
                    ].map((f) => (
                      <button
                        type="button"
                        key={f.ext}
                        disabled={!uploadedFile}
                        onClick={() => {
                          setCustomExtension(f.ext);
                          handleExecuteConversion(f.ext, false);
                        }}
                        className="touch-btn"
                        style={{
                          minHeight: '46px',
                          padding: '8px 10px',
                          borderRadius: '10px',
                          border: '1.5px solid #e2e8f0',
                          backgroundColor: '#f8fafc',
                          color: '#0f172a',
                          fontSize: '11px',
                          fontWeight: '900',
                          cursor: uploadedFile ? 'pointer' : 'not-allowed',
                          opacity: uploadedFile ? 1 : 0.5,
                          textAlign: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '2px'
                        }}
                      >
                        <span style={{ fontSize: '12px', fontWeight: '900', color: '#0f172a' }}>.{f.ext.toUpperCase()}</span>
                        <span style={{ fontSize: '9.5px', color: '#64748b', fontWeight: '800' }}>{f.label.split(' ')[1] || ''}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: IMAGE & DOC CONVERTER */}
            {toolActiveTab === 'convert' && (
              <div>
                {/* Target Size / Quality Selector */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Target Output Size / Quality:
                    </span>
                    <span style={{ fontSize: '11px', color: '#0f172a', fontWeight: '900' }}>
                      Selected: {selectedSize}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {['Original', '50KB', '100KB', '250KB', '500KB', '1MB', '2MB', '5MB'].map((sz) => (
                      <button
                        type="button"
                        key={sz}
                        onClick={() => setSelectedSize(sz)}
                        className="touch-btn"
                        style={{
                          minHeight: '38px',
                          padding: '6px 14px',
                          borderRadius: '8px',
                          border: selectedSize === sz ? 'none' : '1px solid #e2e8f0',
                          backgroundColor: selectedSize === sz ? '#0f172a' : '#f1f5f9',
                          color: selectedSize === sz ? '#ffffff' : '#0f172a',
                          fontSize: '11px',
                          fontWeight: '900',
                          cursor: 'pointer'
                        }}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick 1-Click Conversions */}
                <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 600 ? '1fr' : '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                  <button
                    type="button"
                    onClick={() => handleExecuteConversion('png')}
                    disabled={!uploadedFile}
                    className="touch-btn"
                    style={{
                      minHeight: '48px',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: '1.5px solid #e2e8f0',
                      backgroundColor: '#f1f5f9',
                      color: '#0f172a',
                      fontSize: '12px',
                      fontWeight: '900',
                      cursor: uploadedFile ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      opacity: uploadedFile ? 1 : 0.5
                    }}
                  >
                    <Download size={16} color="#0f172a" /> Convert to PNG (.png)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExecuteConversion('jpg')}
                    disabled={!uploadedFile}
                    className="touch-btn"
                    style={{
                      minHeight: '48px',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: '1.5px solid #e2e8f0',
                      backgroundColor: '#f1f5f9',
                      color: '#0f172a',
                      fontSize: '12px',
                      fontWeight: '900',
                      cursor: uploadedFile ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      opacity: uploadedFile ? 1 : 0.5
                    }}
                  >
                    <Download size={16} color="#0f172a" /> Convert to JPG (.jpg)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExecuteConversion('webp')}
                    disabled={!uploadedFile}
                    className="touch-btn"
                    style={{
                      minHeight: '48px',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: '1.5px solid #e2e8f0',
                      backgroundColor: '#f1f5f9',
                      color: '#0f172a',
                      fontSize: '12px',
                      fontWeight: '900',
                      cursor: uploadedFile ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      opacity: uploadedFile ? 1 : 0.5
                    }}
                  >
                    <Download size={16} color="#0f172a" /> Convert to WEBP (.webp)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExecuteConversion('pdf')}
                    disabled={!uploadedFile}
                    className="touch-btn"
                    style={{
                      minHeight: '48px',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: '1.5px solid #e2e8f0',
                      backgroundColor: '#f1f5f9',
                      color: '#0f172a',
                      fontSize: '12px',
                      fontWeight: '900',
                      cursor: uploadedFile ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      opacity: uploadedFile ? 1 : 0.5
                    }}
                  >
                    <Download size={16} color="#0f172a" /> Export as PDF (.pdf)
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Photo Studio / AI Object Eraser Modal */}
      <PhotoEditorModal 
        isOpen={showPhotoEditModal} 
        onClose={() => {
          setShowPhotoEditModal(false);
          setPhotoStudioInitialImage(null);
        }} 
        initialImage={photoStudioInitialImage}
      />

      {/* Facebook Live Feed & Daily Gold/Silver Bhav Modal */}
      <DailyBhavModal
        isOpen={showDailyBhavModal}
        onClose={() => setShowDailyBhavModal(false)}
      />

      {/* Google Keep Style Notes Modal */}
      <NotesModal
        isOpen={showNotesModal}
        onClose={() => setShowNotesModal(false)}
        userProfile={userProfile}
        notesList={notesList}
        setNotesList={setNotesList}
        syncUserData={({ notes }) => syncNotesToCloud(notes)}
        backendUrl={BACKEND_URL}
        setActiveLightboxMedia={setActiveLightboxMedia}
      />

      {/* Shadow Expense Manager Modal */}
      <ExpensesModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        expenseList={expenseList}
        setExpenseList={setExpenseList}
        monthlyBudget={monthlyBudget}
        setMonthlyBudget={setMonthlyBudget}
        selectedExpenseMonth={selectedExpenseMonth}
        setSelectedExpenseMonth={setSelectedExpenseMonth}
        userProfile={userProfile}
        socketRef={socketRef}
        backendUrl={BACKEND_URL}
      />

      {/* Permanent Watcher & Routines Modal */}
      <WatcherModal
        isOpen={showWatcherModal}
        onClose={() => setShowWatcherModal(false)}
        remindersList={remindersList}
        setRemindersList={setRemindersList}
        snoozeMinutes={snoozeMinutes}
        setSnoozeMinutes={setSnoozeMinutes}
        stopAlarmSound={stopAlarmSound}
        setShowPermissionsModal={setShowPermissionsModal}
        userProfile={userProfile}
        socketRef={socketRef}
        backendUrl={BACKEND_URL}
      />

      {/* Full-Screen Watcher Reminder Alert Modal */}
      <ReminderAlertModal
        activeAlertTask={activeAlertTask}
        onDismiss={() => {
          stopAlarmSound();
          setActiveAlertTask(null);
          setActiveAlertKey(null);
          setCurrentAlertTaskId(null);
        }}
        onSnooze={handleSnooze}
        snoozeMinutes={snoozeMinutes}
      />

      {/* System Permissions Setup Modal */}
      {/* Mobile Permissions & System Setup Modal */}
      {showPermissionsModal && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPermissionsModal(false);
          }}
          className="modal-overlay"
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(5, 7, 12, 0.72)', backdropFilter: 'blur(28px) saturate(190%)', WebkitBackdropFilter: 'blur(28px) saturate(190%)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', cursor: 'pointer' }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="modal-card permissions-modal-card"
            style={{ 
              background: 'linear-gradient(150deg, rgba(18, 23, 35, 0.94) 0%, rgba(9, 12, 19, 0.98) 100%)', 
              backdropFilter: 'blur(32px) saturate(190%)',
              WebkitBackdropFilter: 'blur(32px) saturate(190%)',
              borderRadius: '24px', 
              padding: '24px 20px', 
              width: '100%', 
              maxWidth: '440px', 
              position: 'relative', 
              border: '1px solid rgba(255, 255, 255, 0.20)', 
              color: '#FFFFFF', 
              boxShadow: 'inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.55), inset 0 -1px 1px 0 rgba(255, 255, 255, 0.08), 0 24px 60px rgba(0,0,0,0.75)',
              cursor: 'default'
            }}
          >
            <button 
              onClick={() => setShowPermissionsModal(false)} 
              style={{ position: 'absolute', top: '14px', right: '14px', border: '1px solid rgba(255, 255, 255, 0.22)', background: 'rgba(255, 255, 255, 0.12)', color: '#FFFFFF', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={16} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.12)', border: '1px solid rgba(255, 255, 255, 0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShadowLogo size={22} color="#ffffff" innerColor="#0f172a" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#FFFFFF', textTransform: 'uppercase' }}>System Permissions</h3>
                <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: '800' }}>MOBILE & DESKTOP HARDWARE AUTHORIZATION</span>
              </div>
            </div>

            <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.75)', lineHeight: '1.5', margin: '0 0 16px 0', fontWeight: '700' }}>
              Shadow Dashboard requires hardware access to deliver voice commands, GPS route traffic alerts, and background reminder notifications on mobile.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
              
              {/* Notifications Permission */}
              <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.16)', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Bell size={20} color="#FFFFFF" />
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '900', color: '#FFFFFF', textTransform: 'uppercase' }}>System Notifications</div>
                      <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: '700' }}>Watcher alerts & PWA push notifications</div>
                    </div>
                  </div>
                  {(() => {
                    const isNotifGranted = mobilePermissions.notifications === 'granted' || (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') || (typeof localStorage !== 'undefined' && localStorage.getItem('jarvis_perm_notif') === 'granted');
                    return (
                      <span style={{ fontSize: '11px', fontWeight: '900', color: isNotifGranted ? '#4ade80' : '#fbbf24' }}>
                        {isNotifGranted ? (isPushSubscribed ? '✓ PWA PUSH ACTIVE' : '✓ GRANTED') : 'PENDING'}
                      </span>
                    );
                  })()}
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={async () => {
                      setIsSendingTestPush(true);
                      setPushFeedbackMessage('Requesting push permissions & dispatching test...');
                      try {
                        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted') {
                          const p = await Notification.requestPermission();
                          setMobilePermissions(prev => ({ ...prev, notifications: p }));
                          if (p === 'granted') {
                            try { localStorage.setItem('jarvis_perm_notif', 'granted'); } catch (e) {}
                          } else {
                            setPushFeedbackMessage('⚠️ Permission not granted. Please allow notifications in browser settings.');
                            setIsSendingTestPush(false);
                            return;
                          }
                        }
                        await triggerTestPushNotification();
                      } catch (err) {
                        setPushFeedbackMessage(`❌ Error: ${err.message}`);
                        setIsSendingTestPush(false);
                      }
                    }}
                    disabled={isSendingTestPush}
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.22)',
                      backgroundColor: 'rgba(255, 255, 255, 0.12)',
                      color: '#FFFFFF',
                      fontSize: '11px',
                      fontWeight: '900',
                      cursor: isSendingTestPush ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      textTransform: 'uppercase',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                    }}
                  >
                    <Bell size={13} color="#FFFFFF" />
                    {isSendingTestPush ? 'SENDING PUSH...' : '🔔 TEST PWA PUSH NOW'}
                  </button>
                </div>
                {pushFeedbackMessage && (
                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#FFFFFF', backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '6px 10px', borderRadius: '6px' }}>
                    {pushFeedbackMessage}
                  </div>
                )}
              </div>

              {/* Microphone Permission */}
              <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.16)', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Mic size={20} color="#FFFFFF" />
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '900', color: '#FFFFFF', textTransform: 'uppercase' }}>Microphone Access</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: '700' }}>Shadow Voice AI & Audio Notes</div>
                  </div>
                </div>
                <span style={{ fontSize: '11px', fontWeight: '900', color: mobilePermissions.mic === 'granted' ? '#4ade80' : '#fbbf24' }}>
                  {mobilePermissions.mic === 'granted' ? '✓ GRANTED' : 'PENDING'}
                </span>
              </div>

              {/* Geolocation Permission */}
              <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.16)', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Navigation size={20} color="#FFFFFF" />
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '900', color: '#FFFFFF', textTransform: 'uppercase' }}>GPS Location</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: '700' }}>Real-time traffic & live navigation</div>
                  </div>
                </div>
                <span style={{ fontSize: '11px', fontWeight: '900', color: mobilePermissions.location === 'granted' ? '#4ade80' : '#fbbf24' }}>
                  {mobilePermissions.location === 'granted' ? '✓ GRANTED' : 'PENDING'}
                </span>
              </div>

            </div>

            <button
              onClick={requestAllMobilePermissions}
              disabled={isRequestingPerms}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 243, 248, 0.85) 100%)',
                color: '#0b0f19',
                fontWeight: '900',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: 'inset 0 1px 1px #fff, 0 4px 15px rgba(0, 0, 0, 0.35)',
                textTransform: 'uppercase'
              }}
            >
              <Zap size={16} />
              {isRequestingPerms ? 'REQUESTING PERMISSIONS...' : 'GRANT ALL PERMISSIONS IN 1 TAP'}
            </button>
          </div>
        </div>
      )}


      {/* User Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        userProfile={userProfile}
        setUserProfile={setUserProfile}
        onOpenDailyBhav={() => setShowDailyBhavModal(true)}
        onOpenExpenses={() => setShowExpenseModal(true)}
        onOpenNotes={() => setShowNotesModal(true)}
        onOpenPhotoStudio={() => setShowPhotoEditModal(true)}
        onOpenAuth={() => { setAuthMode('login'); setShowAuthModal(true); }}
      />

      {/* Google Authentication & Account Modal (Log In / Sign Up) */}
      {/* Google Authentication & Account Modal (Log In / Sign Up) */}
      {showAuthModal && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAuthModal(false);
          }}
          className="modal-overlay"
          style={{ 
            position: 'fixed', 
            inset: 0, 
            backgroundColor: 'rgba(15, 23, 42, 0.55)', 
            backdropFilter: 'blur(8px)', 
            zIndex: 350, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '16px' 
          }}
        >
          <div 
            className="modal-card auth-modal-card"
            style={{ 
              backgroundColor: '#ffffff', 
              borderRadius: '24px', 
              padding: '28px 24px', 
              width: '100%', 
              maxWidth: '380px', 
              position: 'relative', 
              border: '1.5px solid #e2e8f0', 
              color: '#0f172a', 
              textAlign: 'center', 
              boxShadow: '0 25px 60px rgba(0,0,0,0.18)',
              overflow: 'hidden'
            }}
          >
            {/* Close Button */}
            <button 
              type="button"
              onClick={() => setShowAuthModal(false)} 
              className="touch-btn"
              style={{ 
                position: 'absolute', 
                top: '16px', 
                right: '16px', 
                border: '1px solid #e2e8f0', 
                background: '#f8fafc', 
                color: '#64748b', 
                borderRadius: '50%', 
                width: '32px', 
                height: '32px', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}
              aria-label="Close"
            >
              <X size={16} />
            </button>

            {/* Profile Icon Header */}
            <div style={{ width: '52px', height: '52px', borderRadius: '16px', backgroundColor: '#0f172a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px auto', boxShadow: '0 4px 14px rgba(15,23,42,0.18)' }}>
              <UserCircle size={28} />
            </div>

            <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.3px' }}>
              {authMode === 'login' ? 'Welcome to Shadow' : 'Create Your Account'}
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '11.5px', color: '#64748b', fontWeight: '800', lineHeight: '1.45', padding: '0 8px' }}>
              {authMode === 'login' 
                ? 'Sign in to access your cloud-synced notes, expenses, reminders and routes.' 
                : 'Sign up to enable instant cross-device cloud sync and personal notifications.'}
            </p>

            {/* Log In & Sign Up Tab Selector */}
            <div style={{ display: 'flex', backgroundColor: '#f1f5f9', borderRadius: '12px', padding: '4px', marginBottom: '18px', border: '1px solid #e2e8f0' }}>
              <button 
                type="button"
                onClick={() => setAuthMode('login')}
                className="touch-btn"
                style={{ 
                  flex: 1, 
                  padding: '9px', 
                  borderRadius: '9px', 
                  border: 'none', 
                  backgroundColor: authMode === 'login' ? '#0f172a' : 'transparent', 
                  color: authMode === 'login' ? '#ffffff' : '#64748b', 
                  fontWeight: '900', 
                  fontSize: '12px', 
                  cursor: 'pointer', 
                  transition: 'all 0.15s ease',
                  boxShadow: authMode === 'login' ? '0 2px 8px rgba(15,23,42,0.2)' : 'none'
                }}
              >
                Log In
              </button>
              <button 
                type="button"
                onClick={() => setAuthMode('signup')}
                className="touch-btn"
                style={{ 
                  flex: 1, 
                  padding: '9px', 
                  borderRadius: '9px', 
                  border: 'none', 
                  backgroundColor: authMode === 'signup' ? '#0f172a' : 'transparent', 
                  color: authMode === 'signup' ? '#ffffff' : '#64748b', 
                  fontWeight: '900', 
                  fontSize: '12px', 
                  cursor: 'pointer', 
                  transition: 'all 0.15s ease',
                  boxShadow: authMode === 'signup' ? '0 2px 8px rgba(15,23,42,0.2)' : 'none'
                }}
              >
                Sign Up
              </button>
            </div>

            {/* Google GSI Standard One-Tap / Account Chooser */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '44px', marginBottom: '10px' }}>
              <div ref={googleBtnRef}></div>
            </div>

            {/* Fallback Direct Google 1-Click Popup Button */}
            <button 
              type="button"
              disabled={isAuthLoading}
              onClick={() => triggerGoogleAuth(authMode)}
              className="touch-btn"
              style={{ 
                width: '100%', 
                padding: '12px', 
                borderRadius: '12px', 
                border: '1.5px solid #0f172a', 
                backgroundColor: '#ffffff', 
                color: '#0f172a', 
                fontWeight: '900', 
                fontSize: '12.5px', 
                cursor: isAuthLoading ? 'wait' : 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '10px',
                marginBottom: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}
            >
              {/* Google G Logo SVG */}
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{isAuthLoading ? 'Opening Google Sign-In...' : (authMode === 'login' ? 'Continue with Google' : 'Sign Up with Google')}</span>
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '14px 0' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
              <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '900', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                or quick email access
              </span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
            </div>

            {/* Direct Email Access Form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const em = (directEmailInput || '').trim();
                if (!em || !em.includes('@')) {
                  alert('Please enter a valid Gmail / Email address.');
                  return;
                }
                processAuthWithBackend(em, em.split('@')[0], '', authMode);
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              <input 
                type="email" 
                value={directEmailInput}
                onChange={(e) => setDirectEmailInput(e.target.value)}
                placeholder="Enter your Gmail / Email"
                required
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '12px',
                  fontWeight: '800',
                  color: '#0f172a',
                  backgroundColor: '#f8fafc',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />

              <button 
                type="submit"
                disabled={isAuthLoading}
                className="touch-btn"
                style={{
                  width: '100%',
                  padding: '11px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: '900',
                  cursor: isAuthLoading ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(15,23,42,0.15)'
                }}
              >
                {authMode === 'login' ? <LogIn size={15} /> : <UserPlus size={15} />}
                <span>{authMode === 'login' ? 'Log In with Email' : 'Sign Up with Email'}</span>
              </button>
            </form>

            {/* Switch Mode Footer */}
            <div style={{ marginTop: '16px', fontSize: '11px', color: '#64748b', fontWeight: '800' }}>
              {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button 
                type="button"
                onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0f172a',
                  fontWeight: '900',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0,
                  fontSize: '11px'
                }}
              >
                {authMode === 'login' ? 'Sign Up here' : 'Log In here'}
              </button>
            </div>

          </div>
        </div>
      )}


      {/* Lightbox Full-Screen Modal for Photos & Attachments */}
      {activeLightboxMedia && (
        <div
          onClick={() => setActiveLightboxMedia(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.92)',
            zIndex: 999999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '92vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <button
              onClick={() => setActiveLightboxMedia(null)}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={18} />
            </button>

            {activeLightboxMedia.type === 'photo' && (
              <img
                src={activeLightboxMedia.dataUrl}
                alt={activeLightboxMedia.name}
                style={{
                  maxWidth: '90vw',
                  maxHeight: '80vh',
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
                  objectFit: 'contain'
                }}
              />
            )}

            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: '#ffffff', fontSize: '12px', fontWeight: '700' }}>
                {activeLightboxMedia.name}
              </span>
              <a
                href={activeLightboxMedia.dataUrl}
                download={activeLightboxMedia.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  backgroundColor: '#0f172a',
                  color: '#f8fafc',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '900',
                  textDecoration: 'none'
                }}
              >
                <Download size={13} /> Download
              </a>
            </div>
          </div>
        </div>
      )}


      {/* Mobile Home Indicator Line (iPhone/Android standard swipe bar from screenshot) */}
      <div className="mobile-home-indicator" />

    </div>
  );
}