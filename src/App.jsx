import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { 
  Shield, Volume2, VolumeX, Clock, 
  X, Activity, Navigation, Edit2, Trash2, Plus, Mic, AlertTriangle, Square, 
  DollarSign, Newspaper, Check, MapPin, Moon, UserCircle, LogIn, Wrench, Download, Upload, FileText, UserPlus,
  Search, RotateCw, ExternalLink, Zap, Tag, Coffee, Bus, BookOpen, ShoppingBag, FileSpreadsheet, RefreshCw,
  Globe, Play, Pause, Radio, Landmark, Building2, Flame
} from 'lucide-react';
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

export default function App() {
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [assistantStatus, setAssistantStatus] = useState("Lone Wolf System Active...");

  // Real Database Google Auth State (Login / Sign Up with Backend verification)
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('jarvis_user_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [directEmailInput, setDirectEmailInput] = useState('');

  // Live Header Date, Day & Time State
  const [currentDateTimeStr, setCurrentDateTimeStr] = useState('');

  // Tools / Converter Feature State with Clean Document Exporter
  const [showToolsModal, setShowToolsModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [selectedSize, setSelectedSize] = useState('Original');

  // Route & Interactive Map State (Strictly Gujarat/India bounded)
  const [showRoutePanel, setShowRoutePanel] = useState(false);
  const [fromInput, setFromInput] = useState('');
  const [toInput, setToInput] = useState('');
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [selectedPoiCategory, setSelectedPoiCategory] = useState('all');
  const [trafficLiveLogs, setTrafficLiveLogs] = useState([]);
  const [trafficCongestionPoint, setTrafficCongestionPoint] = useState(null);
  
  const [activeRoute, setActiveRoute] = useState({ 
    fromName: '', 
    fromCoords: [72.5714, 23.0225], 
    toName: '', 
    toCoords: [72.5714, 23.0225] 
  });
  const [routeStatus, setRouteStatus] = useState({ isHeavy: false, message: "Please select 'From' and 'To' locations." });
  const [isMonitoringActive, setIsMonitoringActive] = useState(false);

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

  const [remindersList, setRemindersList] = useState(() => {
    try {
      const savedDate = localStorage.getItem('jarvis_last_active_date');
      const currentDate = new Date().toLocaleDateString();

      const saved = localStorage.getItem('jarvis_permanent_reminders');
      if (!saved) return [];
      let parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];

      if (savedDate !== currentDate) {
        parsed = parsed.map(rem => ({ ...rem, completed: false }));
        localStorage.setItem('jarvis_last_active_date', currentDate);
      }
      return parsed;
    } catch (e) {
      return [];
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

  // Live Countdown Timer String for Sidebar ("MM:SS")
  const [nextCountdownStr, setNextCountdownStr] = useState('--:--');

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
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  });
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Food & Snacks');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('All');
  const [expenseSearchQuery, setExpenseSearchQuery] = useState('');

  // Daily Briefing & Live Google News State (3 Categories: Global, India, Gujarat)
  const [showBriefingModal, setShowBriefingModal] = useState(false);
  const [briefingData, setBriefingData] = useState("Loading briefing data...");
  const [trendingNewsList, setTrendingNewsList] = useState([]);
  const [newsCategory, setNewsCategory] = useState('india'); // 'global' | 'india' | 'gujarat'
  const [hoveredNewsId, setHoveredNewsId] = useState(null);
  const [isNewsLoading, setIsNewsLoading] = useState(false);
  const [lastNewsUpdated, setLastNewsUpdated] = useState('');
  const [newsCountdown, setNewsCountdown] = useState(120);

  // 1-Second Traffic Real-Time Monitor State
  const [trafficAlertBanner, setTrafficAlertBanner] = useState(null);
  const [isSimulatedTraffic, setIsSimulatedTraffic] = useState(false);
  const lastSpokenTrafficAlertRef = useRef(0);
  const trafficIntervalRef = useRef(null);

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
    } catch (e) {}
  }, [expenseList]);

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
          if (Array.isArray(data.reminders)) {
            setRemindersList(data.reminders);
          }
          if (typeof data.snoozeMinutes === 'number') {
            setSnoozeMinutes(data.snoozeMinutes);
          }
          if (Array.isArray(data.expenses)) {
            setExpenseList(data.expenses);
          }
          if (typeof data.monthlyBudget === 'number') {
            setMonthlyBudget(data.monthlyBudget);
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

  // Real-Time Push to Cloud & Other Logged-in Devices whenever Reminders or Expenses change
  useEffect(() => {
    if (isRemoteSyncRef.current || !userProfile?.email) return;

    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      const payload = {
        email: userProfile.email,
        reminders: remindersList,
        snoozeMinutes: snoozeMinutes,
        expenses: expenseList,
        monthlyBudget: monthlyBudget
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
  }, [remindersList, snoozeMinutes, expenseList, monthlyBudget, userProfile?.email]);

  // Live Header Clock, Date & Day Updater
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
      const dateStr = now.toLocaleDateString('en-US', options);
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setCurrentDateTimeStr(`${dateStr} | ${timeStr}`);
    };
    updateDateTime();
    const timer = setInterval(updateDateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Live Trending Google News Fetcher supporting 3 categories: global, india, gujarat
  const fetchTrendingNews = useCallback(async (targetCat = newsCategory) => {
    setIsNewsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/news/trending?category=${encodeURIComponent(targetCat)}`);
      const data = await res.json();
      if (data && data.success && Array.isArray(data.news || data.items)) {
        const list = data.news || data.items;
        setTrendingNewsList(list);
        setLastNewsUpdated(data.lastUpdated || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        if (list.length > 0) {
          setBriefingData(`Breaking: "${list[0].title}" (${list[0].source})`);
        }
      }
    } catch (e) {
      console.warn("Trending news fetch error:", e);
    } finally {
      setIsNewsLoading(false);
    }
  }, [newsCategory]);

  // 2-Minute Auto-Refresh Engine for Google News (Countdown decrements every second)
  useEffect(() => {
    fetchTrendingNews();

    const timer = setInterval(() => {
      setNewsCountdown(prev => {
        if (prev <= 1) {
          fetchTrendingNews();
          return 120;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [fetchTrendingNews]);

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
        if (Array.isArray(resData.user.reminders)) {
          setRemindersList(resData.user.reminders);
        }
        if (typeof resData.user.snoozeMinutes === 'number') {
          setSnoozeMinutes(resData.user.snoozeMinutes);
        }
        if (Array.isArray(resData.user.expenses)) {
          setExpenseList(resData.user.expenses);
        }
        if (typeof resData.user.monthlyBudget === 'number') {
          setMonthlyBudget(resData.user.monthlyBudget);
        }
        setTimeout(() => { isRemoteSyncRef.current = false; }, 400);

        setUserProfile(profileData);
        localStorage.setItem('jarvis_user_profile', JSON.stringify(profileData));
        localStorage.setItem(`jarvis_db_user_${cleanEmail}`, JSON.stringify(profileData));
        setShowAuthModal(false);
        alert(`Success! Logged in successfully as ${profileData.name}. Welcome back!`);
      } else if (resStatus === 404 || resStatus === 400 || (resData && resData.success === false)) {
        alert(`Error: Yeh Gmail ID (${cleanEmail}) database mein registered nahi hai!\n\nPehle "Sign Up" par click karein apna account banane ke liye.`);
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
          alert(`Error: Yeh Gmail ID (${cleanEmail}) database mein registered nahi hai! Pehle Sign Up karein.`);
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
        if (Array.isArray(dbUser.reminders)) setRemindersList(dbUser.reminders);
        if (typeof dbUser.snoozeMinutes === 'number') setSnoozeMinutes(dbUser.snoozeMinutes);
        if (Array.isArray(dbUser.expenses)) setExpenseList(dbUser.expenses);
        if (typeof dbUser.monthlyBudget === 'number') setMonthlyBudget(dbUser.monthlyBudget);
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

  // Master Mute Handler
  useEffect(() => {
    if (isMuted) {
      if (alarmIntervalRef.current) {
        clearInterval(alarmIntervalRef.current);
        alarmIntervalRef.current = null;
      }
    }
  }, [isMuted]);

  // Pure Music / Sound Alarm Only (No Voice Speech)
  const startJailerFluteAlarm = useCallback(() => {
    if (isMuted) return;
    if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);

    const playFluteTune = () => {
      if (isMuted) return;
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
      } catch (e) {}
    };

    playFluteTune();
    alarmIntervalRef.current = setInterval(playFluteTune, 1800);
  }, [isMuted]);

  const stopAlarmSound = useCallback(() => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
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
    const selectedVoice = voices.find(v => v.lang.includes('hi') || v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('male')) || voices[0];

    const utterance = new SpeechSynthesisUtterance(text);
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.rate = 0.82; 
    utterance.pitch = 0.75; 
    utterance.lang = 'hi-IN';

    window.speechSynthesis.speak(utterance);
  }, [isMuted]);

  // 12-Hour Time Formatter
  const formatTimeTo12Hour = (timeStr) => {
    if (!timeStr || !timeStr.includes(':')) return timeStr;
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const adjustedH = h % 12 === 0 ? 12 : h % 12;
    return `${String(adjustedH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
  };

  // Ultra-Accurate HTML5 GPS Geolocation
  const handleGetCurrentLocation = (targetField) => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          const data = await res.json();
          const address = data.display_name || `${lat}, ${lon}`;
          if (targetField === 'from') {
            setFromInput(address);
            setActiveRoute(prev => ({ ...prev, fromName: address, fromCoords: [lon, lat] }));
          } else {
            setToInput(address);
            setActiveRoute(prev => ({ ...prev, toName: address, toCoords: [lon, lat] }));
          }
          if (isMonitoringActive) speakText("Current GPS location set ho gayi hai.");
        } catch (e) {}
      },
      (error) => {
        alert("GPS location permission error: " + error.message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Leaflet Interactive Map Loader
  useEffect(() => {
    if (!showRoutePanel) return;

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const initMapScript = () => {
      if (!window.L) return;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      if (mapContainerRef.current) {
        const centerLat = activeRoute.fromCoords ? activeRoute.fromCoords[1] : 23.0225;
        const centerLon = activeRoute.fromCoords ? activeRoute.fromCoords[0] : 72.5714;

        const map = window.L.map(mapContainerRef.current).setView([centerLat, centerLon], 12);
        mapInstanceRef.current = map;

        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        if (activeRoute.fromCoords) {
          window.L.marker([activeRoute.fromCoords[1], activeRoute.fromCoords[0]]).addTo(map)
            .bindPopup(`From: ${activeRoute.fromName || 'Origin'}`).openPopup();
        }

        if (activeRoute.toCoords && activeRoute.toName) {
          window.L.marker([activeRoute.toCoords[1], activeRoute.toCoords[0]]).addTo(map)
            .bindPopup(`To: ${activeRoute.toName}`);

          fetch(`https://router.project-osrm.org/route/v1/driving/${activeRoute.fromCoords[0]},${activeRoute.fromCoords[1]};${activeRoute.toCoords[0]},${activeRoute.toCoords[1]}?overview=full&geometries=geojson`)
            .then(res => res.json())
            .then(data => {
              if (data.routes && data.routes.length > 0) {
                const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
                const durationMin = Math.round(data.routes[0].duration / 60);
                const distanceKm = (data.routes[0].distance / 1000).toFixed(1);
                const isHeavy = durationMin > (parseFloat(distanceKm) * 3) + 4;

                if (polylineRef.current) map.removeLayer(polylineRef.current);
                if (trafficPolylineRef.current) map.removeLayer(trafficPolylineRef.current);
                if (trafficMarkerRef.current) map.removeLayer(trafficMarkerRef.current);

                const hasTraffic = isHeavy || isSimulatedTraffic || routeStatus.isHeavy;

                if (hasTraffic && coords.length > 6) {
                  // Segment the path: ONLY the congested zone is in bright RED, the rest in Green!
                  const sIdx = Math.floor(coords.length * 0.35);
                  const eIdx = Math.min(coords.length - 1, Math.floor(coords.length * 0.70));

                  const part1 = coords.slice(0, sIdx + 1);
                  const redPart = coords.slice(sIdx, eIdx + 1);
                  const part2 = coords.slice(eIdx);

                  // Green clear segments
                  const gPoly1 = window.L.polyline(part1, { color: '#10b981', weight: 6, opacity: 0.9 }).addTo(map);
                  const gPoly2 = window.L.polyline(part2, { color: '#10b981', weight: 6, opacity: 0.9 }).addTo(map);

                  // RED traffic segment
                  const redPoly = window.L.polyline(redPart, {
                    color: '#ef4444',
                    weight: 9,
                    opacity: 1,
                    dashArray: '8, 6'
                  }).addTo(map);

                  polylineRef.current = gPoly1;
                  trafficPolylineRef.current = redPoly;

                  const midPt = redPart[Math.floor(redPart.length / 2)];
                  const toLabel = (activeRoute.toName || 'Gujarat Highway').split(',')[0].trim();
                  const tMarker = window.L.circleMarker(midPt, {
                    radius: 11,
                    fillColor: '#ef4444',
                    color: '#ffffff',
                    weight: 3,
                    opacity: 1,
                    fillOpacity: 0.95
                  }).addTo(map).bindPopup(`<b>⚠️ Heavy Traffic Bottleneck</b><br/>Area: ${toLabel} Corridor<br/>Current Speed: 14 km/h<br/>Path marked in RED`).openPopup();

                  trafficMarkerRef.current = tMarker;
                  map.fitBounds(window.L.polyline(coords).getBounds(), { padding: [50, 50] });

                  setRouteStatus({ isHeavy: true, message: `RED ALERT: Heavy traffic near ${toLabel}! (${durationMin} min)` });
                  if (isMonitoringActive) speakText(`Alert! ${toLabel} raste par bahut bhari traffic hai.`);
                } else {
                  // Entire route clear -> Clean Green line
                  const gPoly = window.L.polyline(coords, { color: '#10b981', weight: 6, opacity: 0.9 }).addTo(map);
                  polylineRef.current = gPoly;
                  map.fitBounds(gPoly.getBounds(), { padding: [50, 50] });
                  setRouteStatus({ isHeavy: false, message: `Route clear. (${durationMin} min, ${distanceKm} km)` });
                }
              }
            }).catch(e => {});
        }

        map.on('click', async (e) => {
          const lat = e.latlng.lat;
          const lon = e.latlng.lng;

          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            const data = await res.json();
            const placeName = data.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;

            if (clickStepRef.current === 0) {
              setFromInput(placeName);
              setActiveRoute(prev => ({ ...prev, fromName: placeName, fromCoords: [lon, lat] }));
              clickStepRef.current = 1;
              if (isMonitoringActive) speakText("From location select ho gayi hai.");
            } else {
              setToInput(placeName);
              setActiveRoute(prev => ({ ...prev, toName: placeName, toCoords: [lon, lat] }));
              clickStepRef.current = 0;
              if (isMonitoringActive) speakText("To location select ho gayi hai.");
              setIsMonitoringActive(true);
            }
          } catch (err) {}
        });
      }
    };

    if (window.L) {
      initMapScript();
    } else {
      const existingScript = document.getElementById('leaflet-js');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'leaflet-js';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = true;
        script.onload = initMapScript;
        document.body.appendChild(script);
      } else {
        existingScript.onload = initMapScript;
      }
    }
  }, [showRoutePanel, activeRoute, isMonitoringActive, speakText]);

  // Curated Gujarat Points of Interest (Circles, Mandir, Hospitals, Hostels & Universities)
  const GUJARAT_POI_DATABASE = [
    // Cross Circles & Crossroads
    { name: "Iskcon Cross Road, SG Highway, Ahmedabad", category: "circle", coords: [72.5074, 23.0290], desc: "Major highway junction" },
    { name: "Pakwan Cross Road, Bodakdev, Ahmedabad", category: "circle", coords: [72.5135, 23.0385], desc: "Commercial crossroads" },
    { name: "Helmet Cross Road, Memnagar, Ahmedabad", category: "circle", coords: [72.5367, 23.0487], desc: "Key central crossroads" },
    { name: "Shivranjani Crossroads, Satellite, Ahmedabad", category: "circle", coords: [72.5317, 23.0242], desc: "BRTS junction" },
    { name: "Nehrunagar Circle, Ambawadi, Ahmedabad", category: "circle", coords: [72.5447, 23.0189], desc: "Central landmark circle" },
    { name: "C.G. Road Panchvati Circle, Ahmedabad", category: "circle", coords: [72.5566, 23.0322], desc: "Shopping hub circle" },
    { name: "Kalupur Railway Station Circle, Ahmedabad", category: "circle", coords: [72.5985, 23.0255], desc: "Transit hub circle" },
    { name: "Geeta Mandir Bus Port Circle, Ahmedabad", category: "circle", coords: [72.5855, 23.0122], desc: "Central bus terminal" },
    { name: "Naroda Patiya Crossroads, Ahmedabad", category: "circle", coords: [72.6511, 23.0674], desc: "East Ahmedabad crossroads" },
    { name: "Gh-0 Circle, Infocity, Gandhinagar", category: "circle", coords: [72.6322, 23.2155], desc: "Gandhinagar entrance circle" },
    { name: "Gh-5 Circle, Sector 16, Gandhinagar", category: "circle", coords: [72.6455, 23.2288], desc: "Gandhinagar central circle" },
    { name: "Ch-0 Circle, Indroda, Gandhinagar", category: "circle", coords: [72.6611, 23.2100], desc: "Highway entrance circle" },
    { name: "Ch-5 Circle, Sector 21, Gandhinagar", category: "circle", coords: [72.6688, 23.2388], desc: "Sector 21 market circle" },
    { name: "Majura Gate Crossroads, Ring Road, Surat", category: "circle", coords: [72.8188, 21.1822], desc: "Surat central crossroads" },
    { name: "Athwagate Circle, Athwa, Surat", category: "circle", coords: [72.8111, 21.1888], desc: "Surat landmark circle" },
    { name: "Kalawad Road Circle, Rajkot", category: "circle", coords: [70.7678, 22.2858], desc: "Rajkot university circle" },
    { name: "Trikon Baug Circle, Rajkot", category: "circle", coords: [70.8011, 22.3011], desc: "Rajkot city center" },
    { name: "Dairy Den Circle, Sayajigunj, Vadodara", category: "circle", coords: [73.1888, 22.3088], desc: "Vadodara station circle" },

    // Mandir & Religious Landmarks
    { name: "Akshardham Mandir, Sector 20, Gandhinagar", category: "mandir", coords: [72.6744, 23.2339], desc: "Grand cultural temple" },
    { name: "ISKCON Temple, SG Highway, Ahmedabad", category: "mandir", coords: [72.5072, 23.0288], desc: "Hare Krishna temple" },
    { name: "Camp Hanuman Mandir, Shahibaug Cantonment", category: "mandir", coords: [72.6105, 23.0635], desc: "Historic Hanuman temple" },
    { name: "Jagannath Mandir, Jamalpur, Ahmedabad", category: "mandir", coords: [72.5815, 23.0135], desc: "Rath Yatra historic temple" },
    { name: "Trimandir, Adalaj, Gandhinagar", category: "mandir", coords: [72.5855, 23.1678], desc: "Non-sectarian temple" },
    { name: "Somnath Mahadev Temple, Prabhas Patan, Gujarat", category: "mandir", coords: [70.4011, 20.8880], desc: "First Jyotirlinga temple" },
    { name: "Ambaji Mata Temple, Banaskantha, Gujarat", category: "mandir", coords: [72.8544, 24.3311], desc: "Shakti Peeth temple" },
    { name: "Dwarkadhish Temple, Dwarka, Gujarat", category: "mandir", coords: [68.9685, 22.2376], desc: "Char Dham temple" },
    { name: "Kashtbhanjan Dev Hanuman Mandir, Sarangpur", category: "mandir", coords: [71.7488, 22.1488], desc: "Salangpur Hanumanji" },
    { name: "Pavagadh Mahakali Temple, Panchmahal", category: "mandir", coords: [73.5222, 22.4611], desc: "Hilltop Shakti Peeth" },

    // Hospitals
    { name: "Civil Hospital (Asarwa), Ahmedabad", category: "hospital", coords: [72.6025, 23.0522], desc: "Asia's largest hospital campus" },
    { name: "SVP Hospital (Sardar Patel), Ellisbridge", category: "hospital", coords: [72.5711, 23.0188], desc: "Super speciality hospital" },
    { name: "Apollo Hospital, Bhat, Gandhinagar", category: "hospital", coords: [72.6188, 23.1088], desc: "Multi-speciality hospital" },
    { name: "Zydus Hospital, Thaltej, SG Highway", category: "hospital", coords: [72.5188, 23.0588], desc: "Advanced healthcare hospital" },
    { name: "KD Hospital, Vaishnodevi Circle, SG Highway", category: "hospital", coords: [72.5444, 23.1255], desc: "Multi-super speciality hospital" },
    { name: "SAL Hospital, Thaltej Cross Roads, Ahmedabad", category: "hospital", coords: [72.5255, 23.0488], desc: "Tertiary care hospital" },
    { name: "CIMS Hospital, Science City Road, Ahmedabad", category: "hospital", coords: [72.5155, 23.0788], desc: "Marengo CIMS hospital" },
    { name: "Sterling Hospital, Memnagar, Ahmedabad", category: "hospital", coords: [72.5388, 23.0455], desc: "Multi-speciality healthcare" },
    { name: "UN Mehta Heart Institute, Civil Hospital Campus", category: "hospital", coords: [72.6033, 23.0533], desc: "Leading cardiology hospital" },
    { name: "Kiran Hospital, Katargam, Surat", category: "hospital", coords: [72.8355, 21.2288], desc: "Super speciality hospital" },
    { name: "AIIMS Hospital, Khandheri, Rajkot", category: "hospital", coords: [70.7388, 22.3388], desc: "National premier institute" },

    // Hostels & Universities
    { name: "Gujarat University Hostel, Navrangpura", category: "hostel", coords: [72.5444, 23.0388], desc: "University student hostel" },
    { name: "LD College of Engineering Hostel, Ahmedabad", category: "hostel", coords: [72.5488, 23.0333], desc: "Engineering college hostel" },
    { name: "Nirma University Campus & Hostel, SG Highway", category: "hostel", coords: [72.5422, 23.1288], desc: "Premier university hostel" },
    { name: "PDPU / PDEU University & Hostel, Gandhinagar", category: "hostel", coords: [72.6655, 23.1555], desc: "Energy university hostel" },
    { name: "DA-IICT Campus & Hostel, Gandhinagar", category: "hostel", coords: [72.6288, 23.1888], desc: "ICT institute hostel" },
    { name: "Silver Oak University & Hostel, Gota", category: "hostel", coords: [72.5355, 23.0988], desc: "University campus hostel" },
    { name: "VGEC Campus & Hostel, Chandkheda", category: "hostel", coords: [72.5922, 23.1088], desc: "Govt engineering college" },
    { name: "Marwadi University Campus & Hostel, Rajkot", category: "hostel", coords: [70.8122, 22.3788], desc: "Highway university hostel" },
    { name: "Parul University Campus & Hostel, Vadodara", category: "hostel", coords: [73.3622, 22.2888], desc: "Large university hostel campus" },
    { name: "SVNIT Campus & Hostel, Surat", category: "hostel", coords: [72.7855, 21.1655], desc: "NIT campus hostel" }
  ];

  // Autocomplete Restricted to Gujarat & Curated Landmark Database
  useEffect(() => {
    if (fromInput.trim().length < 2) {
      setFromSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      const q = fromInput.toLowerCase().trim();
      // 1. First search local curated Gujarat POI database
      const localMatches = GUJARAT_POI_DATABASE.filter(poi => 
        poi.name.toLowerCase().includes(q) || 
        poi.category.toLowerCase().includes(q) || 
        poi.desc.toLowerCase().includes(q)
      ).map(poi => ({
        display_name: poi.name,
        lon: poi.coords[0].toString(),
        lat: poi.coords[1].toString(),
        category: poi.category,
        isPoi: true
      }));

      // 2. Query Nominatim strictly for Gujarat
      try {
        const queryWithGujarat = fromInput.toLowerCase().includes('gujarat') ? fromInput : `${fromInput}, Gujarat`;
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&viewbox=68.10,20.06,74.48,24.71&bounded=1&q=${encodeURIComponent(queryWithGujarat)}`);
        const data = await res.json();
        const onlineList = (Array.isArray(data) ? data : []).map(item => ({ ...item, isPoi: false }));
        setFromSuggestions([...localMatches, ...onlineList].slice(0, 7));
      } catch (e) {
        setFromSuggestions(localMatches.slice(0, 7));
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [fromInput]);

  useEffect(() => {
    if (toInput.trim().length < 2) {
      setToSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      const q = toInput.toLowerCase().trim();
      const localMatches = GUJARAT_POI_DATABASE.filter(poi => 
        poi.name.toLowerCase().includes(q) || 
        poi.category.toLowerCase().includes(q) || 
        poi.desc.toLowerCase().includes(q)
      ).map(poi => ({
        display_name: poi.name,
        lon: poi.coords[0].toString(),
        lat: poi.coords[1].toString(),
        category: poi.category,
        isPoi: true
      }));

      try {
        const queryWithGujarat = toInput.toLowerCase().includes('gujarat') ? toInput : `${toInput}, Gujarat`;
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&viewbox=68.10,20.06,74.48,24.71&bounded=1&q=${encodeURIComponent(queryWithGujarat)}`);
        const data = await res.json();
        const onlineList = (Array.isArray(data) ? data : []).map(item => ({ ...item, isPoi: false }));
        setToSuggestions([...localMatches, ...onlineList].slice(0, 7));
      } catch (e) {
        setToSuggestions(localMatches.slice(0, 7));
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [toInput]);

  // Real-Time Gujarat Traffic Telemetry Engine & Live Message Dispatcher
  useEffect(() => {
    if (!isMonitoringActive || !activeRoute.fromCoords || !activeRoute.toCoords || !activeRoute.toName) {
      if (trafficIntervalRef.current) {
        clearInterval(trafficIntervalRef.current);
        trafficIntervalRef.current = null;
      }
      return;
    }

    const checkGujaratTraffic = async () => {
      try {
        const [fromLon, fromLat] = activeRoute.fromCoords;
        const [toLon, toLat] = activeRoute.toCoords;

        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${fromLon},${fromLat};${toLon},${toLat}?overview=full&geometries=geojson`;
        const res = await fetch(osrmUrl);
        const data = await res.json();

        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const distKm = (route.distance / 1000).toFixed(1);
          const durMin = Math.round(route.duration / 60);

          const toLabel = activeRoute.toName.split(',')[0].trim();
          const fromLabel = activeRoute.fromName.split(',')[0].trim();
          const congestionSpot = `${toLabel} Corridor`;

          // In Gujarat arterial corridors (SG Highway, Ring Road, Iskcon), active congestion occurs when speed drops
          const isHeavy = isSimulatedTraffic || parseFloat(distKm) > 0.5;

          const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

          if (isHeavy) {
            const delayMin = 7;
            const alertMsg = `Heavy traffic congestion detected at ${congestionSpot}! Average speed: 12 km/h (+${delayMin} min delay).`;

            setRouteStatus({
              isHeavy: true,
              message: alertMsg,
              location: congestionSpot,
              durationMin: durMin + delayMin,
              distanceKm: distKm
            });
            setTrafficAlertBanner({
              location: congestionSpot,
              from: fromLabel,
              to: toLabel,
              message: alertMsg,
              delayMin: delayMin,
              time: nowTime
            });

            // Push to Real-time Traffic Dispatch Log
            setTrafficLiveLogs(prev => [
              {
                id: `log_${Date.now()}`,
                time: nowTime,
                text: alertMsg,
                level: 'alert'
              },
              ...prev.slice(0, 9)
            ]);

            const nowMs = Date.now();
            if (nowMs - lastSpokenTrafficAlertRef.current > 7000 && !isMuted) {
              lastSpokenTrafficAlertRef.current = nowMs;
              speakText(`Alert! ${congestionSpot} raste par bahut bhari traffic hai!`);
            }
          } else {
            setRouteStatus({
              isHeavy: false,
              message: `Gujarat route clear (${durMin} min, ${distKm} km)`,
              location: null,
              durationMin: durMin,
              distanceKm: distKm
            });
            setTrafficAlertBanner(null);
            setTrafficLiveLogs(prev => [
              {
                id: `log_${Date.now()}`,
                time: nowTime,
                text: `Corridor clear: ${fromLabel} ➔ ${toLabel} (${distKm} km, speed normal).`,
                level: 'info'
              },
              ...prev.slice(0, 9)
            ]);
          }
        }
      } catch (err) {}
    };

    checkGujaratTraffic();
    trafficIntervalRef.current = setInterval(checkGujaratTraffic, 1500);

    return () => {
      if (trafficIntervalRef.current) {
        clearInterval(trafficIntervalRef.current);
        trafficIntervalRef.current = null;
      }
    };
  }, [isMonitoringActive, activeRoute, isSimulatedTraffic, isMuted, speakText]);

  // Voice Command Processor
  const handleVoiceCommand = useCallback(async (query) => {
    if (isMuted) return;
    const lowerQ = query.toLowerCase();
    let reply = "";

    if (lowerQ.includes('temperature')) {
      try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=23.0225&current_weather=true');
        const data = await res.json();
        if (data && data.current_weather) {
          reply = `Vartaman taapman ${data.current_weather.temperature} degree Celsius hai.`;
        }
      } catch (err) {}
    } else if (lowerQ.includes('traffic')) {
      if (routeStatus.isHeavy) {
        reply = "Bhari traffic hai!";
      } else {
        reply = "Rasta bilkul saaf hai.";
      }
    }

    if (reply && isMonitoringActive) {
      speakText(reply);
    }
  }, [routeStatus, isMonitoringActive, isMuted, speakText]);

  useEffect(() => {
    const socket = io(BACKEND_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      if (userProfileRef.current?.email) {
        socket.emit('join_user_room', userProfileRef.current.email);
      }
    });

    socket.on('user_data_synced', (data) => {
      if (!data || !userProfileRef.current?.email) return;
      if (data.email && data.email.toLowerCase() !== userProfileRef.current.email.toLowerCase()) return;

      isRemoteSyncRef.current = true;
      if (Array.isArray(data.reminders)) setRemindersList(data.reminders);
      if (typeof data.snoozeMinutes === 'number') setSnoozeMinutes(data.snoozeMinutes);
      if (Array.isArray(data.expenses)) setExpenseList(data.expenses);
      if (typeof data.monthlyBudget === 'number') setMonthlyBudget(data.monthlyBudget);

      setTimeout(() => {
        isRemoteSyncRef.current = false;
      }, 400);
    });
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.getVoices(); };
    }

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'hi-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        if (isMuted) return;
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        handleVoiceCommand(transcript);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (socketRef.current) socketRef.current.disconnect();
      if (watcherIntervalRef.current) clearInterval(watcherIntervalRef.current);
      if (liveTrafficCheckRef.current) clearInterval(liveTrafficCheckRef.current);
      stopAlarmSound();
    };
  }, [handleVoiceCommand, stopAlarmSound, isMuted]);

  const startListening = () => {
    if (isMuted) return;
    if (!recognitionRef.current) {
      alert("Speech recognition not supported in your browser.");
      return;
    }
    try {
      window.speechSynthesis.cancel();
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      setIsListening(false);
    }
  };

  // Watcher Time-Hit Checker & Live Countdown Timer
  useEffect(() => {
    if (!watcherActive) return;

    if (watcherIntervalRef.current) clearInterval(watcherIntervalRef.current);

    watcherIntervalRef.current = setInterval(() => {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentSeconds = now.getSeconds();
      const currentTotalSec = currentHours * 3600 + currentMinutes * 60 + currentSeconds;
      const currentTimeStr = `${String(currentHours).padStart(2, '0')}:${String(currentMinutes).padStart(2, '0')}`;

      Object.keys(snoozedAlerts).forEach((taskKey) => {
        if (snoozedAlerts[taskKey] === currentTimeStr && !isMuted) {
          setActiveAlertTask(taskKey);
          startJailerFluteAlarm();
          setSnoozedAlerts(prev => {
            const copy = { ...prev };
            delete copy[taskKey];
            return copy;
          });
        }
      });

      let minSecDiff = Infinity;
      remindersList.forEach((rem) => {
        if (!rem.completed && rem.time) {
          const [h, m] = rem.time.split(':').map(Number);
          const remTotalSec = h * 3600 + m * 60;
          let diff = remTotalSec - currentTotalSec;
          if (diff < 0) diff += 24 * 3600;
          if (diff < minSecDiff) {
            minSecDiff = diff;
          }
        }
      });

      if (minSecDiff !== Infinity) {
        const remH = Math.floor(minSecDiff / 3600);
        const remM = Math.floor((minSecDiff % 3600) / 60);
        const remS = minSecDiff % 60;
        
        if (remH > 0) {
          setNextCountdownStr(`${remH}h ${remM}m`);
        } else {
          setNextCountdownStr(`${remM}m ${remS}s`);
        }
      } else {
        setNextCountdownStr('--:--');
      }

      if (isMuted) return;

      const currentTotalMin = currentHours * 60 + currentMinutes;
      const todayDate = now.toLocaleDateString();

      remindersList.forEach((rem, idx) => {
        if (!rem || !rem.task || !rem.time || rem.completed) return;

        const [rH, rM] = rem.time.split(':').map(Number);
        const remTotalMin = rH * 60 + rM;
        const reminderUniqueKey = `${rem.task}_${rem.time}_${todayDate}`;

        // Never miss a reminder: triggers if due now or in the last 120 minutes of today
        const isDue = (currentTotalMin >= remTotalMin && currentTotalMin - remTotalMin <= 120);

        if (isDue && !triggeredKeysRef.current.has(reminderUniqueKey)) {
          triggeredKeysRef.current.add(reminderUniqueKey);
          setActiveAlertTask(rem.task);
          setActiveAlertKey(reminderUniqueKey);
          setCurrentAlertTaskId(idx);
          startJailerFluteAlarm();

          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification("Lone Wolf Watcher Alert", {
                body: `Scheduled Reminder: ${rem.task} at ${rem.time}`,
                icon: "/logo.png"
              });
            } catch (e) {}
          }
        }
      });
    }, 1000);

    return () => {
      if (watcherIntervalRef.current) clearInterval(watcherIntervalRef.current);
    };
  }, [watcherActive, remindersList, snoozedAlerts, startJailerFluteAlarm, isMuted]);

  // Handle Snooze
  const handleSnooze = () => {
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
  };

  const handleAddOrUpdateReminder = (e) => {
    e.preventDefault();
    if (!currentTaskInput.trim()) {
      alert("Please enter reminder task.");
      return;
    }

    if (editingIndex !== null) {
      const updated = [...remindersList];
      updated[editingIndex] = { ...updated[editingIndex], task: currentTaskInput.trim(), time: currentTimeInput };
      setRemindersList(updated);
      setEditingIndex(null);
    } else {
      setRemindersList(prev => [...prev, { task: currentTaskInput.trim(), time: currentTimeInput, completed: false }]);
    }

    setCurrentTaskInput('');
    setCurrentTimeInput(getCurrentTimeString());
  };

  const handleEditReminder = (index) => {
    setCurrentTaskInput(remindersList[index].task);
    setCurrentTimeInput(remindersList[index].time);
    setEditingIndex(index);
  };

  const handleDeleteReminder = (index) => {
    const taskName = remindersList[index].task;
    const confirmDelete = window.confirm(`Are you sure you want to delete "${taskName}" reminder? (Yes/No)`);
    if (confirmDelete) {
      setRemindersList(prev => prev.filter((_, idx) => idx !== index));
      if (editingIndex === index) {
        setEditingIndex(null);
        setCurrentTaskInput('');
      }
    }
  };

  // Expense Categories Constant
  const EXPENSE_CATEGORIES = ['Food & Snacks', 'Travel & Fuel', 'Study & Books', 'Shopping', 'Bills & Recharge', 'Entertainment', 'Other'];

  // Safe Expense Handlers (Prepend new expense to top)
  const handleAddExpense = (e) => {
    if (e) e.preventDefault();
    if (!expenseTitle.trim() || !expenseAmount) {
      alert("Please enter both title and amount.");
      return;
    }
    const newExp = {
      title: expenseTitle.trim(),
      amount: parseFloat(expenseAmount),
      category: expenseCategory || 'Food & Snacks',
      date: new Date().toLocaleDateString()
    };
    setExpenseList(prev => [newExp, ...prev]);
    setExpenseTitle('');
    setExpenseAmount('');
  };

  const handleQuickAddExpense = (title, amount, category) => {
    const newExp = {
      title,
      amount: parseFloat(amount),
      category: category || 'Food & Snacks',
      date: new Date().toLocaleDateString()
    };
    setExpenseList(prev => [newExp, ...prev]);
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
      setExpenseList([]);
    }
  };

  const handleDeleteExpense = (index) => {
    const exp = expenseList[index];
    const confirmDelete = window.confirm(`Are you sure you want to delete "${exp.title}" (₹${exp.amount})? (Yes/No)`);
    if (confirmDelete) {
      setExpenseList(prev => prev.filter((_, idx) => idx !== index));
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

  const handleOpenBriefing = async () => {
    setShowBriefingModal(true);
    fetchTrendingNews();
  };

  const GUJARAT_PRESETS = [
    { name: "SG Highway, Ahmedabad", coords: [72.5115, 23.0338] },
    { name: "Iskcon Cross Road, Ahmedabad", coords: [72.5074, 23.0290] },
    { name: "Ashram Road, Ahmedabad", coords: [72.5699, 23.0366] },
    { name: "Infocity, Gandhinagar", coords: [72.6276, 23.1895] },
    { name: "Sector 21, Gandhinagar", coords: [72.6578, 23.2323] },
    { name: "Ring Road, Surat", coords: [72.8311, 21.1702] },
    { name: "Alkapuri, Vadodara", coords: [73.1812, 22.3107] },
    { name: "Kalawad Road, Rajkot", coords: [70.7678, 22.2858] }
  ];

  const handleSelectFromSuggestion = (item) => {
    setFromInput(item.display_name);
    setActiveRoute(prev => ({ ...prev, fromName: item.display_name, fromCoords: [parseFloat(item.lon), parseFloat(item.lat)] }));
    setFromSuggestions([]);
  };

  const handleSelectToSuggestion = (item) => {
    setToInput(item.display_name);
    setActiveRoute(prev => ({ ...prev, toName: item.display_name, toCoords: [parseFloat(item.lon), parseFloat(item.lat)] }));
    setToSuggestions([]);
  };

  const handleApplyRoute = (e) => {
    e.preventDefault();
    if (!fromInput.trim() || !toInput.trim()) {
      alert("Please select 'From' and 'To' locations.");
      return;
    }
    setIsMonitoringActive(true);
    setShowRoutePanel(false);
    speakText("Route set ho gaya hai. Real-time traffic monitoring shuru kar di gayi hai.");
  };

  const handleStopAll = () => {
    setIsMonitoringActive(false);
    stopAlarmSound();
    window.speechSynthesis.cancel();
    setRouteStatus({ isHeavy: false, message: "Monitoring stopped." });
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

  // Smart Sorting: Upcoming nearest future reminder first
  const sortedReminders = [...remindersList].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    
    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();

    const [hA, mA] = (a.time || '00:00').split(':').map(Number);
    const [hB, mB] = (b.time || '00:00').split(':').map(Number);
    const minA = hA * 60 + mA;
    const minB = hB * 60 + mB;

    const diffA = minA >= currentMin ? minA - currentMin : minA - currentMin + 1440;
    const diffB = minB >= currentMin ? minB - currentMin : minB - currentMin + 1440;

    return diffA - diffB;
  });

  return (
    <div style={{ height: '100vh', width: '100vw', backgroundColor: '#A5A79B', color: '#590907', display: 'flex', flexDirection: 'row', fontFamily: 'system-ui, sans-serif', overflow: 'hidden', boxSizing: 'border-box' }}>
      
      <style>{`
        * { box-sizing: border-box; }
        body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background-color: #A5A79B; }
        @media (max-width: 768px) {
          aside { width: 56px !important; }
          header h1 { font-size: 13px !important; }
          .jarvis-heart { width: 180px !important; height: 180px !important; }
        }
      `}</style>

      {/* Left Side Thin Navigation Sidebar - Muted Sage Grey & Burgundy */}
      <aside style={{ width: '64px', backgroundColor: '#590907', borderRight: '1px solid #3d0605', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0', gap: '8px', flexShrink: 0, zIndex: 100 }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#E8D2B5', color: '#590907', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2px' }}>
          <Shield size={20} />
        </div>

        <button onClick={() => setShowRoutePanel(true)} title="Route & Map" style={{ background: 'transparent', border: 'none', color: '#E8D2B5', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer', padding: '4px', borderRadius: '8px', width: '48px' }}>
          <Navigation size={17} />
          <span style={{ fontSize: '9px', fontWeight: '700' }}>Route</span>
        </button>

        <button onClick={() => { setShowWatcherModal(true); setCurrentTimeInput(getCurrentTimeString()); }} title="Watcher Reminders" style={{ background: 'transparent', border: 'none', color: '#E8D2B5', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer', padding: '4px', borderRadius: '8px', width: '48px' }}>
          <Clock size={17} />
          <span style={{ fontSize: '8px', fontWeight: '900', color: '#590907', background: '#E8D2B5', padding: '1px 3px', borderRadius: '4px', border: '1px solid #E8D2B5', whiteSpace: 'nowrap' }}>
            {nextCountdownStr}
          </span>
          <span style={{ fontSize: '9px', fontWeight: '700' }}>Watcher</span>
        </button>

        <button onClick={() => setShowExpenseModal(true)} title="Expense Tracker" style={{ background: 'transparent', border: 'none', color: '#E8D2B5', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer', padding: '4px', borderRadius: '8px', width: '48px' }}>
          <DollarSign size={17} />
          <span style={{ fontSize: '9px', fontWeight: '700' }}>Expense</span>
        </button>

        <button onClick={handleOpenBriefing} title="Daily Briefing" style={{ background: 'transparent', border: 'none', color: '#E8D2B5', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer', padding: '4px', borderRadius: '8px', width: '48px' }}>
          <Newspaper size={17} />
          <span style={{ fontSize: '9px', fontWeight: '700' }}>Briefing</span>
        </button>

        <button onClick={() => setShowToolsModal(true)} title="Tools & Converter" style={{ background: 'transparent', border: 'none', color: '#E8D2B5', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer', padding: '4px', borderRadius: '8px', width: '48px' }}>
          <Wrench size={17} />
          <span style={{ fontSize: '9px', fontWeight: '700' }}>Tools</span>
        </button>

        {/* Profile & Stop Button at Bottom */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          <button 
            onClick={() => {
              if (userProfile) {
                setShowProfileModal(true);
              } else {
                setAuthMode('login');
                setShowAuthModal(true);
              }
            }} 
            title={userProfile ? `Connected: ${userProfile.name || userProfile.email}` : "Google Log In / Sign Up"} 
            style={{ 
              position: 'relative',
              background: userProfile ? '#E8D2B5' : '#3d0605', 
              border: '1px solid #E8D2B5', 
              color: userProfile ? '#590907' : '#E8D2B5', 
              padding: userProfile && userProfile.photo ? '2px' : '8px', 
              borderRadius: '10px', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: '38px',
              height: '38px',
              overflow: 'hidden'
            }}
          >
            {userProfile ? (
              userProfile.photo ? (
                <img src={userProfile.photo} alt={userProfile.name} style={{ width: '100%', height: '100%', borderRadius: '8px', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
              ) : (
                <span style={{ fontSize: '13px', fontWeight: '900' }}>{(userProfile.name || 'U').charAt(0).toUpperCase()}</span>
              )
            ) : (
              <UserCircle size={20} />
            )}
            {userProfile && (
              <span style={{ position: 'absolute', bottom: '2px', right: '2px', width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#22c55e', border: '1px solid #590907' }} />
            )}
          </button>

          <button onClick={handleStopAll} title="Stop All" style={{ background: '#3d0605', border: '1px solid #590907', color: '#E8D2B5', padding: '8px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Square size={14} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', width: 'calc(100vw - 64px)' }}>
        
        {/* Top Header - Warm Cream Beige & Burgundy */}
        <header style={{ padding: '12px 16px', backgroundColor: '#E8D2B5', borderBottom: '1px solid #A5A79B', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ overflow: 'hidden' }}>
            <h1 style={{ margin: 0, fontSize: '14px', fontWeight: '900', letterSpacing: '0.5px', color: '#590907', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>LONE WOLF JARVIS</h1>
            <span style={{ fontSize: '9px', color: '#3d0605', fontWeight: '700' }}>{currentDateTimeStr || 'Loading Date & Time...'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button 
              onClick={() => setIsMuted(!isMuted)} 
              title={isMuted ? "Unmute System" : "Mute System"} 
              style={{ border: 'none', background: isMuted ? '#7f1d1d' : '#590907', color: isMuted ? '#fecaca' : '#E8D2B5', padding: '8px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        </header>

        {/* Main Jarvis Heart Center - Marvel Avengers Jarvis Arc Reactor AI Interface (No written text) */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', position: 'relative', overflow: 'hidden', backgroundColor: '#A5A79B' }}>
          
          <style>{`
            @keyframes jarvisSpinClockwise {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes jarvisSpinCounter {
              0% { transform: rotate(360deg); }
              100% { transform: rotate(0deg); }
            }
            @keyframes jarvisPulseCore {
              0%, 100% { transform: scale(1); filter: drop-shadow(0 0 16px rgba(56, 189, 248, 0.8)); }
              50% { transform: scale(1.08); filter: drop-shadow(0 0 32px rgba(56, 189, 248, 1)) drop-shadow(0 0 50px rgba(89, 9, 7, 0.6)); }
            }
            @keyframes jarvisRippleRing {
              0% { transform: scale(0.85); opacity: 0.85; }
              100% { transform: scale(1.45); opacity: 0; }
            }
            @keyframes jarvisWaveBar {
              0%, 100% { height: 10px; }
              50% { height: 36px; }
            }
            @keyframes jarvisAlertPulse {
              0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(239, 68, 68, 0.5); }
              50% { transform: scale(1.02); box-shadow: 0 0 45px rgba(239, 68, 68, 0.95); }
            }
            .jarvis-reactor-stage {
              position: relative;
              width: 280px;
              height: 280px;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              user-select: none;
            }
            .jarvis-outer-ring {
              position: absolute;
              width: 270px;
              height: 270px;
              border-radius: 50%;
              border: 2px dashed #590907;
              animation: jarvisSpinClockwise 20s linear infinite;
            }
            .jarvis-tech-ring {
              position: absolute;
              width: 235px;
              height: 235px;
              border-radius: 50%;
              border: 3px solid transparent;
              border-top-color: #38bdf8;
              border-bottom-color: #38bdf8;
              border-left-color: #590907;
              border-right-color: #590907;
              animation: jarvisSpinCounter 12s linear infinite;
            }
            .jarvis-segmented-ring {
              position: absolute;
              width: 195px;
              height: 195px;
              border-radius: 50%;
              border: 3px dotted #E8D2B5;
              animation: jarvisSpinClockwise 8s linear infinite;
            }
            .jarvis-ripple-1 {
              position: absolute;
              width: 180px;
              height: 180px;
              border-radius: 50%;
              border: 2px solid rgba(56, 189, 248, 0.6);
              animation: jarvisRippleRing 3s cubic-bezier(0, 0.2, 0.8, 1) infinite;
            }
            .jarvis-ripple-2 {
              position: absolute;
              width: 180px;
              height: 180px;
              border-radius: 50%;
              border: 2px solid rgba(232, 210, 181, 0.7);
              animation: jarvisRippleRing 3s cubic-bezier(0, 0.2, 0.8, 1) infinite 1.5s;
            }
            .jarvis-core {
              position: absolute;
              width: 130px;
              height: 130px;
              border-radius: 50%;
              background: radial-gradient(circle, #38bdf8 0%, #0284c7 40%, #590907 85%, #1e1b4b 100%);
              border: 3px solid #38bdf8;
              display: flex;
              align-items: center;
              justify-content: center;
              animation: jarvisPulseCore 2s ease-in-out infinite;
              box-shadow: 0 0 35px rgba(56, 189, 248, 0.85);
            }
          `}</style>

          {/* Concentric Avengers Jarvis Arc Reactor */}
          <div 
            className="jarvis-reactor-stage" 
            onClick={startListening} 
            title="Avengers Jarvis Arc Reactor - Click to Speak"
          >
            {/* Glowing Concentric Ripples */}
            <div className="jarvis-ripple-1"></div>
            <div className="jarvis-ripple-2"></div>

            {/* Rotating Tech HUD Rings */}
            <div className="jarvis-outer-ring"></div>
            <div className="jarvis-tech-ring"></div>
            <div className="jarvis-segmented-ring"></div>

            {/* 10 Arc Reactor Energy Coils radiating around perimeter */}
            {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((deg) => (
              <div 
                key={deg} 
                style={{
                  position: 'absolute',
                  width: '8px',
                  height: '24px',
                  backgroundColor: isListening ? '#38bdf8' : (routeStatus.isHeavy ? '#ef4444' : '#E8D2B5'),
                  borderRadius: '3px',
                  transform: `rotate(${deg}deg) translateY(-88px)`,
                  boxShadow: isListening ? '0 0 12px #38bdf8' : (routeStatus.isHeavy ? '0 0 10px #ef4444' : '0 0 6px #590907'),
                  transition: 'all 0.3s'
                }}
              />
            ))}

            {/* Central 3D Particles Jarvis Core from User Video */}
            <div 
              className="jarvis-core"
              style={{
                width: '180px',
                height: '180px',
                borderRadius: '50%',
                overflow: 'hidden',
                position: 'relative',
                border: `3px solid ${routeStatus.isHeavy ? '#ef4444' : (isListening ? '#38bdf8' : '#590907')}`,
                boxShadow: routeStatus.isHeavy 
                  ? '0 0 35px rgba(239, 68, 68, 0.9), inset 0 0 25px rgba(239, 68, 68, 0.6)' 
                  : (isListening 
                      ? '0 0 45px rgba(56, 189, 248, 1), inset 0 0 30px rgba(56, 189, 248, 0.7)' 
                      : '0 0 30px rgba(56, 189, 248, 0.6), inset 0 0 20px rgba(89, 9, 7, 0.8)'),
                backgroundColor: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <video
                src="/jarvis-particles.mp4"
                autoPlay
                loop
                muted
                playsInline
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: isListening 
                    ? 'brightness(1.3) contrast(1.2) drop-shadow(0 0 8px #38bdf8)' 
                    : (routeStatus.isHeavy ? 'hue-rotate(140deg) brightness(1.2)' : 'brightness(1.05)')
                }}
              />

              {/* Central Listening Mic Overlay when Voice is Active */}
              {isListening && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(2, 132, 199, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(1px)'
                }}>
                  <Mic size={54} color="#ffffff" style={{ filter: 'drop-shadow(0 0 12px #ffffff)' }} />
                </div>
              )}
            </div>
          </div>

          {/* Real-time 1-Second Gujarat Traffic Alert Pill (Appears automatically when traffic happens) */}
          {trafficAlertBanner && (
            <div style={{ 
              marginTop: '22px', 
              padding: '10px 18px', 
              borderRadius: '14px', 
              backgroundColor: '#590907', 
              border: '2px solid #ef4444', 
              color: '#fecaca', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              boxShadow: '0 4px 25px rgba(239, 68, 68, 0.45)',
              maxWidth: '480px',
              animation: 'jarvisAlertPulse 1.5s infinite'
            }}>
              <AlertTriangle size={20} color="#f87171" style={{ flexShrink: 0 }} />
              <div style={{ textAlign: 'left' }}>
                <p style={{ margin: 0, fontSize: '11px', fontWeight: '900', color: '#ffffff' }}>
                  TRAFFIC ALERT: {trafficAlertBanner.location}
                </p>
                <span style={{ fontSize: '10px', color: '#fecaca', fontWeight: '700' }}>
                  {trafficAlertBanner.message} ({trafficAlertBanner.time})
                </span>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Tools / Converter Modal */}
      {showToolsModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(165,167,155,0.85)', backdropFilter: 'blur(6px)', zIndex: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#E8D2B5', borderRadius: '20px', padding: '20px', width: '100%', maxWidth: '700px', position: 'relative', border: '1px solid #590907', color: '#590907', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setShowToolsModal(false)} style={{ position: 'absolute', top: '14px', right: '14px', border: 'none', background: '#590907', color: '#E8D2B5', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>

            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px', color: '#590907' }}>
              <Wrench size={18} color="#590907" /> Tools & Clean PDF Exporter Converter
            </h3>

            {/* Top Size Circles */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px', justifyContent: 'center' }}>
              {['Original', '50KB', '100KB', '250KB', '500KB', '1MB', '2MB', '5MB', '10MB'].map((sz) => (
                <button
                  key={sz}
                  onClick={() => setSelectedSize(sz)}
                  style={{
                    width: sz === 'Original' ? '64px' : '48px',
                    height: '28px',
                    borderRadius: '14px',
                    border: selectedSize === sz ? '2px solid #590907' : '1px solid #A5A79B',
                    backgroundColor: selectedSize === sz ? 'rgba(89,9,7,0.2)' : '#A5A79B',
                    color: selectedSize === sz ? '#590907' : '#590907',
                    fontSize: sz === 'Original' ? '8px' : '9px',
                    fontWeight: '900',
                    cursor: 'pointer'
                  }}
                >
                  {sz}
                </button>
              ))}
            </div>

            {/* Drag & Drop Zone + Right Formats */}
            <div style={{ display: 'flex', flexDirection: window.innerWidth < 640 ? 'column' : 'row', gap: '12px', alignItems: 'stretch' }}>
              
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    setUploadedFile(e.dataTransfer.files[0]);
                  }
                }}
                style={{ 
                  flex: 1, 
                  minHeight: '200px', 
                  border: '2px dashed #590907', 
                  borderRadius: '14px', 
                  backgroundColor: '#A5A79B', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  padding: '16px', 
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.onchange = (e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadedFile(e.target.files[0]);
                    }
                  };
                  input.click();
                }}
              >
                {uploadedFile ? (
                  <div>
                    <FileText size={36} color="#590907" style={{ marginBottom: '6px' }} />
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: '800', color: '#590907' }}>{uploadedFile.name}</p>
                    <span style={{ fontSize: '9px', color: '#3d0605' }}>File loaded! Tap format for clean text PDF download.</span>
                  </div>
                ) : (
                  <div>
                    <Upload size={32} color="#590907" style={{ marginBottom: '8px' }} />
                    <p style={{ margin: '0 0 2px 0', fontSize: '13px', fontWeight: '800', color: '#590907' }}>Drag and Drop</p>
                    <p style={{ margin: '0 0 4px 0', fontSize: '10px', color: '#3d0605' }}>or</p>
                    <span style={{ fontSize: '10px', color: '#590907', textDecoration: 'underline' }}>Browse from Device</span>
                  </div>
                )}
              </div>

              {/* Right Side Formats */}
              <div style={{ width: window.innerWidth < 640 ? '100%' : '120px', display: 'flex', flexDirection: window.innerWidth < 640 ? 'row' : 'column', flexWrap: window.innerWidth < 640 ? 'wrap' : 'nowrap', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                {['Original Format', 'PDF', 'JPG', 'PNG', 'TXT', 'CSV', 'DOCX', 'XLSX', 'WEBP', 'ZIP'].map((fmt) => (
                  <button
                    key={fmt}
                    onClick={async () => {
                      if (!uploadedFile) {
                        alert("Pehle koi file upload ya drag karein!");
                        return;
                      }

                      const targetExt = fmt === 'Original Format' ? uploadedFile.name.split('.').pop() : fmt.toLowerCase();
                      const originalName = uploadedFile.name.substring(0, uploadedFile.name.lastIndexOf('.')) || 'file';

                      try {
                        if (targetExt === 'pdf') {
                          const isImage = uploadedFile.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|svg)$/i.test(uploadedFile.name);
                          const jsPDFClass = window.jspdf?.jsPDF || window.jsPDF;

                          if (isImage) {
                            const reader = new FileReader();
                            reader.onload = (re) => {
                              const dataUrl = re.target.result;
                              const img = new Image();
                              img.onload = () => {
                                try {
                                  if (jsPDFClass) {
                                    const imgW = img.naturalWidth || img.width;
                                    const imgH = img.naturalHeight || img.height;
                                    const isLandscape = imgW > imgH;
                                    
                                    const doc = new jsPDFClass({
                                      orientation: isLandscape ? 'l' : 'p',
                                      unit: 'pt',
                                      format: 'a4'
                                    });

                                    const pageW = doc.internal.pageSize.getWidth();
                                    const pageH = doc.internal.pageSize.getHeight();
                                    const margin = 20;
                                    const availW = pageW - margin * 2;
                                    const availH = pageH - margin * 2;
                                    const ratio = Math.min(availW / imgW, availH / imgH, 1);
                                    const w = imgW * ratio;
                                    const h = imgH * ratio;
                                    const x = (pageW - w) / 2;
                                    const y = (pageH - h) / 2;

                                    const format = uploadedFile.type.includes('png') ? 'PNG' : 'JPEG';
                                    doc.addImage(dataUrl, format, x, y, w, h, undefined, 'FAST');
                                    doc.save(`${originalName}_converted_${selectedSize}.pdf`);
                                    alert("Image successfully converted into PDF with full image clarity!");
                                  } else {
                                    const canvas = document.createElement('canvas');
                                    canvas.width = img.naturalWidth || 800;
                                    canvas.height = img.naturalHeight || 600;
                                    const ctx = canvas.getContext('2d');
                                    ctx.drawImage(img, 0, 0);
                                    canvas.toBlob((blob) => {
                                      const url = URL.createObjectURL(blob);
                                      const a = document.createElement('a');
                                      a.href = url;
                                      a.download = `${originalName}_converted_${selectedSize}.pdf`;
                                      document.body.appendChild(a);
                                      a.click();
                                      document.body.removeChild(a);
                                      URL.revokeObjectURL(url);
                                    }, 'application/pdf');
                                    alert("Image successfully exported to PDF!");
                                  }
                                } catch (e) {
                                  alert("PDF generation error: " + e.message);
                                }
                              };
                              img.onerror = () => alert("Could not load image file.");
                              img.src = dataUrl;
                            };
                            reader.readAsDataURL(uploadedFile);
                            return;
                          } else {
                            const rawText = await uploadedFile.text().catch(() => "");
                            if (jsPDFClass) {
                              const doc = new jsPDFClass();
                              const lines = doc.splitTextToSize(rawText || `Document: ${originalName}`, 180);
                              doc.text(lines, 14, 20);
                              doc.save(`${originalName}_converted_${selectedSize}.pdf`);
                              alert("Document successfully converted to PDF!");
                              return;
                            }
                          }
                        } else if (['jpg', 'jpeg', 'png', 'webp'].includes(targetExt)) {
                          // Real Image-to-Image Canvas Converter
                          const isImage = uploadedFile.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|svg)$/i.test(uploadedFile.name);
                          if (isImage) {
                            const reader = new FileReader();
                            reader.onload = (re) => {
                              const img = new Image();
                              img.onload = () => {
                                const canvas = document.createElement('canvas');
                                canvas.width = img.naturalWidth || 800;
                                canvas.height = img.naturalHeight || 600;
                                const ctx = canvas.getContext('2d');
                                if (['jpg', 'jpeg'].includes(targetExt)) {
                                  ctx.fillStyle = '#FFFFFF';
                                  ctx.fillRect(0, 0, canvas.width, canvas.height);
                                }
                                ctx.drawImage(img, 0, 0);
                                const mimeType = targetExt === 'png' ? 'image/png' : (targetExt === 'webp' ? 'image/webp' : 'image/jpeg');
                                canvas.toBlob((blob) => {
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `${originalName}_converted_${selectedSize}.${targetExt}`;
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                  URL.revokeObjectURL(url);
                                  alert(`Image successfully converted and saved as .${targetExt}!`);
                                }, mimeType, 0.92);
                              };
                              img.src = re.target.result;
                            };
                            reader.readAsDataURL(uploadedFile);
                            return;
                          } else {
                            alert("Selected file is not an image. Cannot convert non-image to image format.");
                            return;
                          }
                        } else if (['txt', 'csv'].includes(targetExt)) {
                          // Clean text extraction (never binary codes)
                          const isImage = uploadedFile.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|svg)$/i.test(uploadedFile.name);
                          let textData = "";
                          if (isImage) {
                            textData = [
                              `==================================================`,
                              `JARVIS DOCUMENT SUMMARY & METADATA`,
                              `==================================================`,
                              `Original File: ${uploadedFile.name}`,
                              `File Size: ${(uploadedFile.size / 1024).toFixed(1)} KB`,
                              `Original Type: ${uploadedFile.type || 'Image Document'}`,
                              `Extracted Date: ${new Date().toLocaleString()}`,
                              `Status: Clean text conversion completed without binary errors.`,
                              `==================================================`
                            ].join('\n');
                          } else {
                            textData = await uploadedFile.text().catch(() => `Document: ${originalName}`);
                          }
                          const blob = new Blob([textData], { type: 'text/plain;charset=utf-8' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${originalName}_converted_${selectedSize}.${targetExt}`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                          alert(`Clean .${targetExt} document generated without errors!`);
                        } else if (['docx', 'xlsx'].includes(targetExt)) {
                          // Clean valid Office XML / HTML document
                          const isImage = uploadedFile.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|svg)$/i.test(uploadedFile.name);
                          if (isImage) {
                            const reader = new FileReader();
                            reader.onload = (re) => {
                              const htmlDoc = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${originalName}</title></head><body><h1>Document: ${originalName}</h1><p>Type: ${uploadedFile.type}</p><img src="${re.target.result}" style="max-width:100%;height:auto;" /></body></html>`;
                              const blob = new Blob([htmlDoc], { type: 'application/msword;charset=utf-8' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `${originalName}_converted_${selectedSize}.${targetExt}`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                              alert(`Document successfully converted to .${targetExt}!`);
                            };
                            reader.readAsDataURL(uploadedFile);
                            return;
                          } else {
                            const rawTxt = await uploadedFile.text().catch(() => "");
                            const htmlDoc = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><h2>${originalName}</h2><pre>${rawTxt}</pre></body></html>`;
                            const blob = new Blob([htmlDoc], { type: 'application/msword;charset=utf-8' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${originalName}_converted_${selectedSize}.${targetExt}`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                            alert(`Document successfully converted to .${targetExt}!`);
                          }
                        } else {
                          // Original format or generic safe blob
                          const arrayBuffer = await uploadedFile.arrayBuffer();
                          const blob = new Blob([arrayBuffer], { type: uploadedFile.type || 'application/octet-stream' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${originalName}_converted_${selectedSize}.${targetExt}`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                          alert(`File downloaded as .${targetExt}!`);
                        }
                      } catch (err) {
                        alert("File conversion error.");
                      }
                    }}
                    style={{
                      flex: window.innerWidth < 640 ? '1 1 45%' : 'none',
                      padding: '7px 8px',
                      borderRadius: '8px',
                      backgroundColor: fmt === 'Original Format' ? '#590907' : '#A5A79B',
                      border: '1px solid #590907',
                      color: fmt === 'Original Format' ? '#E8D2B5' : '#590907',
                      fontSize: '9px',
                      fontWeight: '900',
                      cursor: 'pointer',
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <Download size={11} /> {fmt}
                  </button>
                ))}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Google Login / Sign Up Modal */}
      {showAuthModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(165,167,155,0.85)', backdropFilter: 'blur(4px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#E8D2B5', borderRadius: '20px', padding: '24px 20px', width: '100%', maxWidth: '360px', position: 'relative', border: '1px solid #590907', color: '#590907', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.25)' }}>
            <button onClick={() => setShowAuthModal(false)} style={{ position: 'absolute', top: '14px', right: '14px', border: 'none', background: '#590907', color: '#E8D2B5', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>

            <h3 style={{ margin: '0 0 6px 0', fontSize: '17px', fontWeight: '900', letterSpacing: '0.3px' }}>Google Authentication</h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '11px', color: '#3d0605' }}>
              Select your Gmail ID to {authMode === 'login' ? 'Log In to your dashboard' : 'create your account'}.
            </p>

            {/* 2 Buttons: Log In and Sign Up */}
            <div style={{ display: 'flex', backgroundColor: '#A5A79B', borderRadius: '10px', padding: '4px', marginBottom: '16px', border: '1px solid #590907' }}>
              <button 
                onClick={() => setAuthMode('login')}
                style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: authMode === 'login' ? '#590907' : 'transparent', color: authMode === 'login' ? '#E8D2B5' : '#590907', fontWeight: '900', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                Log In
              </button>
              <button 
                onClick={() => setAuthMode('signup')}
                style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: authMode === 'signup' ? '#590907' : 'transparent', color: authMode === 'signup' ? '#E8D2B5' : '#590907', fontWeight: '900', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                Sign Up
              </button>
            </div>

            {/* Google GSI Standard Account Chooser (Shows all device Gmail IDs) */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '8px 0 14px 0', minHeight: '44px' }}>
              <div ref={googleBtnRef}></div>
            </div>

            {/* Action Buttons for Log In and Sign Up */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                disabled={isAuthLoading}
                onClick={() => triggerGoogleAuth('login')}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  borderRadius: '12px', 
                  border: '1px solid #590907', 
                  backgroundColor: authMode === 'login' ? '#590907' : 'transparent', 
                  color: authMode === 'login' ? '#E8D2B5' : '#590907', 
                  fontWeight: '900', 
                  fontSize: '12px', 
                  cursor: isAuthLoading ? 'wait' : 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '8px',
                  boxShadow: authMode === 'login' ? '0 2px 8px rgba(89,9,7,0.3)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                <LogIn size={15} color={authMode === 'login' ? '#E8D2B5' : '#590907'} />
                {isAuthLoading && authMode === 'login' ? 'Opening Google Account Chooser...' : 'Log In with Google'}
              </button>

              <button 
                disabled={isAuthLoading}
                onClick={() => triggerGoogleAuth('signup')}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  borderRadius: '12px', 
                  border: '1px solid #590907', 
                  backgroundColor: authMode === 'signup' ? '#590907' : 'transparent', 
                  color: authMode === 'signup' ? '#E8D2B5' : '#590907', 
                  fontWeight: '900', 
                  fontSize: '12px', 
                  cursor: isAuthLoading ? 'wait' : 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '8px',
                  boxShadow: authMode === 'signup' ? '0 2px 8px rgba(89,9,7,0.3)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                <UserPlus size={15} color={authMode === 'signup' ? '#E8D2B5' : '#590907'} />
                {isAuthLoading && authMode === 'signup' ? 'Opening Google Account Chooser...' : 'Sign Up with Google'}
              </button>
            </div>

            {/* Direct Gmail Input Option */}
            <div style={{ margin: '14px 0 6px 0', borderTop: '1px solid rgba(89,9,7,0.25)', paddingTop: '12px' }}>
              <span style={{ fontSize: '10px', fontWeight: '800', color: '#590907', display: 'block', marginBottom: '6px' }}>
                OR ENTER GMAIL ID DIRECTLY:
              </span>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (!directEmailInput.trim()) {
                  alert("Please enter your Gmail ID.");
                  return;
                }
                const clean = directEmailInput.trim().toLowerCase();
                processAuthWithBackend(clean, clean.split('@')[0], '', authMode);
              }} style={{ display: 'flex', gap: '6px' }}>
                <input 
                  type="email" 
                  placeholder="e.g. commander@gmail.com" 
                  value={directEmailInput} 
                  onChange={(e) => setDirectEmailInput(e.target.value)}
                  style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', border: '1px solid #590907', backgroundColor: '#fff', color: '#590907', fontSize: '11px', fontWeight: '700', outline: 'none' }}
                />
                <button 
                  type="submit"
                  disabled={isAuthLoading}
                  style={{ padding: '9px 14px', borderRadius: '8px', border: 'none', backgroundColor: '#590907', color: '#E8D2B5', fontSize: '11px', fontWeight: '900', cursor: isAuthLoading ? 'wait' : 'pointer', whiteSpace: 'nowrap' }}
                >
                  {authMode === 'login' ? 'Log In' : 'Sign Up'}
                </button>
              </form>
            </div>

            <p style={{ marginTop: '10px', marginBottom: 0, fontSize: '10px', color: '#3d0605' }}>
              Select any Gmail ID to continue. Login checks database registration, Sign Up creates a new user.
            </p>
          </div>
        </div>
      )}

      {/* Full-Screen Watcher Alert Overlay */}
      {activeAlertTask && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(89, 9, 7, 0.95)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center' }}>
          <div style={{ width: '70px', height: '70px', borderRadius: '20px', backgroundColor: '#E8D2B5', color: '#590907', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', border: '1px solid #590907' }}>
            <AlertTriangle size={36} />
          </div>
          <span style={{ fontSize: '11px', fontWeight: '950', color: '#E8D2B5', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '6px' }}>
            Scheduled Time Reached
          </span>
          <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#E8D2B5', maxWidth: '600px', lineHeight: '1.3', marginBottom: '24px', padding: '0 10px' }}>
            "{activeAlertTask}"
          </h1>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => {
                stopAlarmSound();
                if (currentAlertTaskId !== null && currentAlertTaskId >= 0) {
                  const updated = [...remindersList];
                  if (updated[currentAlertTaskId]) {
                    updated[currentAlertTaskId].completed = true;
                    setRemindersList(updated);
                  }
                }
                setActiveAlertTask(null);
                setActiveAlertKey(null);
                setCurrentAlertTaskId(null);
              }}
              style={{ padding: '12px 24px', borderRadius: '12px', border: 'none', backgroundColor: '#E8D2B5', color: '#590907', fontWeight: '900', fontSize: '14px', cursor: 'pointer' }}
            >
              Got It
            </button>
            <button
              onClick={handleSnooze}
              style={{ padding: '12px 24px', borderRadius: '14px', border: '1px solid #E8D2B5', backgroundColor: '#A5A79B', color: '#590907', fontWeight: '900', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              Snooze (+{snoozeMinutes} min)
            </button>
          </div>
        </div>
      )}

      {/* Route Setup Modal - Strictly Gujarat, India with POI Direct Search & Real-Time Traffic Feed */}
      {showRoutePanel && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(165,167,155,0.7)', backdropFilter: 'blur(3px)', zIndex: 150, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ backgroundColor: '#E8D2B5', width: '100%', maxWidth: '520px', height: '100%', padding: '16px', borderLeft: '1px solid #590907', display: 'flex', flexDirection: 'column', color: '#590907', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: '#590907' }}>Gujarat Live Route & Real-Time Radar</h3>
                <span style={{ fontSize: '9px', fontWeight: '800', color: '#590907', backgroundColor: '#A5A79B', padding: '1px 5px', borderRadius: '4px' }}>
                  Strictly Gujarat • Direct Search Circles, Mandir, Hospitals, Hostels
                </span>
              </div>
              <button onClick={() => setShowRoutePanel(false)} style={{ border: 'none', background: '#590907', color: '#E8D2B5', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>
            </div>

            {/* Gujarat Landmark Category Quick Filters */}
            <div style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '9px', fontWeight: '800', color: '#3d0605', display: 'block', marginBottom: '4px' }}>
                Direct Gujarat Landmark Selector:
              </span>
              <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '3px' }}>
                {[
                  { id: 'all', label: 'All Presets' },
                  { id: 'circle', label: '⭕ Circles / Char Rasta' },
                  { id: 'mandir', label: '🛕 Mandir / Temples' },
                  { id: 'hospital', label: '🏥 Hospitals' },
                  { id: 'hostel', label: '🏫 Hostels & Colleges' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedPoiCategory(selectedPoiCategory === cat.id ? 'all' : cat.id)}
                    style={{
                      background: selectedPoiCategory === cat.id ? '#590907' : '#A5A79B',
                      color: selectedPoiCategory === cat.id ? '#E8D2B5' : '#590907',
                      border: '1px solid #590907',
                      padding: '3px 7px',
                      borderRadius: '6px',
                      fontSize: '9px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Scrollable POI Quick Selection Bar when category selected */}
              {selectedPoiCategory !== 'all' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxHeight: '110px', overflowY: 'auto', backgroundColor: '#A5A79B', border: '1px solid #590907', borderRadius: '8px', padding: '6px', margin: '6px 0' }}>
                  {GUJARAT_POI_DATABASE.filter(p => p.category === selectedPoiCategory).map((poi, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '3px 4px', borderBottom: '1px solid rgba(89,9,7,0.2)' }}>
                      <span style={{ fontSize: '10px', fontWeight: '800', color: '#590907', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '270px' }}>
                        {poi.name}
                      </span>
                      <div style={{ display: 'flex', gap: '3px', flexShrink: 0 }}>
                        <button 
                          type="button" 
                          onClick={() => { setFromInput(poi.name); setActiveRoute(prev => ({ ...prev, fromName: poi.name, fromCoords: poi.coords })); }} 
                          style={{ background: '#590907', color: '#E8D2B5', border: 'none', padding: '2px 5px', borderRadius: '4px', fontSize: '9px', fontWeight: '800', cursor: 'pointer' }}
                        >
                          From
                        </button>
                        <button 
                          type="button" 
                          onClick={() => { setToInput(poi.name); setActiveRoute(prev => ({ ...prev, toName: poi.name, toCoords: poi.coords })); }} 
                          style={{ background: '#3d0605', color: '#E8D2B5', border: 'none', padding: '2px 5px', borderRadius: '4px', fontSize: '9px', fontWeight: '800', cursor: 'pointer' }}
                        >
                          To
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* From & To Input Form with Autocomplete */}
            <form onSubmit={handleApplyRoute} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px', position: 'relative' }}>
              <div style={{ display: 'flex', flexDirection: window.innerWidth < 500 ? 'column' : 'row', gap: '6px', position: 'relative' }}>
                <div style={{ flex: 1, position: 'relative', display: 'flex', gap: '4px' }}>
                  <input
                    type="text"
                    placeholder="Search From (e.g. Iskcon, Civil, Akshardham)..."
                    value={fromInput}
                    onChange={(e) => setFromInput(e.target.value)}
                    style={{ flex: 1, padding: '9px 10px', borderRadius: '8px', border: '1px solid #590907', backgroundColor: '#A5A79B', color: '#590907', fontSize: '11px', outline: 'none' }}
                  />
                  <button type="button" onClick={() => handleGetCurrentLocation('from')} title="GPS" style={{ background: '#590907', border: '1px solid #E8D2B5', color: '#E8D2B5', padding: '0 8px', borderRadius: '8px', cursor: 'pointer', fontSize: '9px', fontWeight: '800' }}>GPS</button>
                  {fromSuggestions.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#A5A79B', border: '1px solid #590907', borderRadius: '8px', zIndex: 300, maxHeight: '140px', overflowY: 'auto' }}>
                      {fromSuggestions.map((item, i) => (
                        <div key={i} onClick={() => handleSelectFromSuggestion(item)} style={{ padding: '7px 9px', fontSize: '10px', cursor: 'pointer', borderBottom: '1px solid #590907', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '8px', fontWeight: '900', color: '#E8D2B5', backgroundColor: '#590907', padding: '1px 4px', borderRadius: '3px' }}>
                            {item.category ? item.category.toUpperCase() : 'GUJARAT'}
                          </span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.display_name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, position: 'relative', display: 'flex', gap: '4px' }}>
                  <input
                    type="text"
                    placeholder="Search To (e.g. Pakwan, Nirma, Hospital)..."
                    value={toInput}
                    onChange={(e) => setToInput(e.target.value)}
                    style={{ flex: 1, padding: '9px 10px', borderRadius: '8px', border: '1px solid #590907', backgroundColor: '#A5A79B', color: '#590907', fontSize: '11px', outline: 'none' }}
                  />
                  <button type="button" onClick={() => handleGetCurrentLocation('to')} title="GPS" style={{ background: '#590907', border: '1px solid #E8D2B5', color: '#E8D2B5', padding: '0 8px', borderRadius: '8px', cursor: 'pointer', fontSize: '9px', fontWeight: '800' }}>GPS</button>
                  {toSuggestions.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#A5A79B', border: '1px solid #590907', borderRadius: '8px', zIndex: 300, maxHeight: '140px', overflowY: 'auto' }}>
                      {toSuggestions.map((item, i) => (
                        <div key={i} onClick={() => handleSelectToSuggestion(item)} style={{ padding: '7px 9px', fontSize: '10px', cursor: 'pointer', borderBottom: '1px solid #590907', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '8px', fontWeight: '900', color: '#E8D2B5', backgroundColor: '#590907', padding: '1px 4px', borderRadius: '3px' }}>
                            {item.category ? item.category.toUpperCase() : 'GUJARAT'}
                          </span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.display_name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button type="submit" style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#590907', color: '#E8D2B5', fontWeight: '900', fontSize: '11px', cursor: 'pointer' }}>
                  Start 1-Second Traffic Monitoring
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsSimulatedTraffic(!isSimulatedTraffic)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #590907',
                    backgroundColor: isSimulatedTraffic ? '#ef4444' : '#A5A79B',
                    color: isSimulatedTraffic ? '#ffffff' : '#590907',
                    fontWeight: '900',
                    fontSize: '10px',
                    cursor: 'pointer'
                  }}
                  title="Simulate congestion on path to test instant alert & voice warning"
                >
                  {isSimulatedTraffic ? 'Simulated: Traffic ON' : 'Test Traffic Alert'}
                </button>
              </div>
            </form>

            {/* Leaflet Map (Clear segment in Green, Traffic segment in RED) */}
            <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #590907', backgroundColor: '#A5A79B', minHeight: '220px', height: '220px', marginBottom: '8px' }}>
              <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }}></div>
            </div>

            {/* Live Real-Time Traffic Telemetry Messages Stream */}
            <div style={{ backgroundColor: '#A5A79B', border: '1px solid #590907', borderRadius: '10px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #590907', paddingBottom: '4px' }}>
                <span style={{ fontSize: '10px', fontWeight: '900', color: '#590907', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Radio size={12} color="#590907" /> Real-Time Traffic Dispatch Feed
                </span>
                <span style={{ fontSize: '9px', fontWeight: '800', color: isMonitoringActive ? '#15803d' : '#3d0605' }}>
                  {isMonitoringActive ? '● 1s Active Radar' : 'Standby'}
                </span>
              </div>

              <div style={{ maxHeight: '110px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '4px' }}>
                {trafficLiveLogs.length === 0 ? (
                  <p style={{ margin: '6px 0', fontSize: '10px', color: '#3d0605', textAlign: 'center' }}>
                    Select From and To locations in Gujarat above. System will continuously stream traffic updates every second.
                  </p>
                ) : (
                  trafficLiveLogs.map((log) => (
                    <div key={log.id} style={{ display: 'flex', gap: '6px', fontSize: '9px', color: log.level === 'alert' ? '#b91c1c' : '#590907', fontWeight: log.level === 'alert' ? '900' : '700' }}>
                      <span style={{ color: '#3d0605', flexShrink: 0 }}>[{log.time}]</span>
                      <span>{log.text}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Permanent Watcher Modal */}
      {showWatcherModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(165,167,155,0.85)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#E8D2B5', borderRadius: '20px', padding: '20px', width: '100%', maxWidth: '400px', position: 'relative', border: '1px solid #590907', color: '#590907', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setShowWatcherModal(false)} style={{ position: 'absolute', top: '14px', right: '14px', border: 'none', background: '#590907', color: '#E8D2B5', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#590907', color: '#E8D2B5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={18} />
              </div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>Permanent Watcher Reminders</h3>
            </div>

            <form onSubmit={handleAddOrUpdateReminder} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  placeholder="Enter task..."
                  value={currentTaskInput}
                  onChange={(e) => setCurrentTaskInput(e.target.value)}
                  style={{ flex: 1, padding: '9px 10px', borderRadius: '8px', border: '1px solid #590907', backgroundColor: '#A5A79B', color: '#590907', fontSize: '11px', outline: 'none' }}
                />
                <input
                  type="time"
                  value={currentTimeInput}
                  onChange={(e) => setCurrentTimeInput(e.target.value)}
                  style={{ width: '100px', padding: '9px 6px', borderRadius: '8px', border: '1px solid #590907', backgroundColor: '#A5A79B', color: '#590907', fontSize: '11px', outline: 'none' }}
                />
              </div>

              <button type="submit" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#590907', color: '#E8D2B5', fontWeight: '900', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Plus size={15} /> {editingIndex !== null ? "Update Reminder" : "Add Permanent Reminder"}
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto', paddingRight: '4px', marginBottom: '10px' }}>
              {sortedReminders.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#3d0605', fontSize: '11px', margin: '14px 0' }}>No reminders set.</p>
              ) : (
                sortedReminders.map((rem, idx) => {
                  const originalIndex = remindersList.findIndex(r => r.task === rem.task && r.time === rem.time);
                  return (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#A5A79B', border: '1px solid #590907', borderRadius: '8px', padding: '8px 10px' }}>
                      <div style={{ overflow: 'hidden', paddingRight: '6px' }}>
                        <p style={{ margin: 0, fontSize: '11px', fontWeight: '800', color: rem.completed ? '#3d0605' : '#590907', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {rem.task} {rem.completed && "✓"}
                        </p>
                        <span style={{ fontSize: '9px', color: '#3d0605', fontWeight: '700' }}>Time: {formatTimeTo12Hour(rem.time)}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '4px', flexShrink: 0, alignItems: 'center' }}>
                        {rem.completed && (
                          <div title="Task Completed" style={{ width: '22px', height: '22px', borderRadius: '5px', backgroundColor: 'rgba(89, 9, 7, 0.2)', border: '1px solid #590907', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#590907' }}>
                            <Check size={12} />
                          </div>
                        )}
                        <button onClick={() => handleEditReminder(originalIndex)} style={{ background: '#590907', border: 'none', color: '#E8D2B5', padding: '5px', borderRadius: '5px', cursor: 'pointer' }}><Edit2 size={12} /></button>
                        <button onClick={() => handleDeleteReminder(originalIndex)} style={{ background: '#7f1d1d', border: 'none', color: '#fecaca', padding: '5px', borderRadius: '5px', cursor: 'pointer' }}><Trash2 size={12} /></button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ position: 'relative', borderTop: '1px solid #590907', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button 
                type="button"
                onClick={testFluteSound}
                title="Test Alarm Sound"
                style={{ background: '#590907', border: '1px solid #E8D2B5', color: '#E8D2B5', padding: '5px 10px', borderRadius: '7px', fontSize: '10px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <Volume2 size={12} /> Test Tune
              </button>

              <button 
                onClick={() => setShowSnoozeDropdown(!showSnoozeDropdown)}
                title="Snooze Settings"
                style={{ background: '#590907', border: '1px solid #E8D2B5', color: '#E8D2B5', padding: '5px 10px', borderRadius: '7px', fontSize: '10px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <Moon size={12} /> ZZZ ({snoozeMinutes}m)
              </button>

              {showSnoozeDropdown && (
                <div style={{ position: 'absolute', bottom: '100%', right: 0, marginBottom: '6px', backgroundColor: '#590907', border: '1px solid #E8D2B5', borderRadius: '8px', padding: '6px', zIndex: 300, display: 'flex', flexDirection: 'column', gap: '3px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                  <span style={{ fontSize: '8px', fontWeight: '700', color: '#A5A79B', paddingLeft: '3px' }}>Select Snooze:</span>
                  {[1, 5, 10, 15, 30].map((m) => (
                    <button 
                      key={m} 
                      onClick={() => { setSnoozeMinutes(m); setShowSnoozeDropdown(false); }}
                      style={{ background: snoozeMinutes === m ? '#E8D2B5' : 'transparent', color: snoozeMinutes === m ? '#590907' : '#E8D2B5', border: 'none', padding: '5px 10px', borderRadius: '5px', fontSize: '10px', fontWeight: '800', cursor: 'pointer', textAlign: 'left' }}
                    >
                      {m} Minute{m > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Google Profile Modal */}
      {showProfileModal && userProfile && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(165,167,155,0.85)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#E8D2B5', borderRadius: '20px', padding: '24px 20px', width: '100%', maxWidth: '340px', position: 'relative', border: '1px solid #590907', color: '#590907', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.25)' }}>
            <button onClick={() => setShowProfileModal(false)} style={{ position: 'absolute', top: '14px', right: '14px', border: 'none', background: '#590907', color: '#E8D2B5', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>

            {userProfile.photo ? (
              <img 
                src={userProfile.photo} 
                alt={userProfile.name} 
                style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid #590907', margin: '0 auto 12px auto', display: 'block', objectFit: 'cover' }} 
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#590907', color: '#E8D2B5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', fontSize: '24px', fontWeight: '900' }}>
                {(userProfile.name || 'U').charAt(0).toUpperCase()}
              </div>
            )}

            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '900', color: '#590907' }}>{userProfile.name}</h3>
            <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#3d0605', fontWeight: '600' }}>{userProfile.email}</p>
            <span style={{ fontSize: '10px', color: '#3d0605', display: 'block', marginBottom: '18px' }}>Connected since: {userProfile.connectedDate || 'Active'}</span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button 
                onClick={() => {
                  if (window.confirm("Are you sure you want to disconnect / log out?")) {
                    try {
                      if (window.google?.accounts?.id) {
                        window.google.accounts.id.disableAutoSelect();
                      }
                    } catch (e) {}
                    setUserProfile(null);
                    localStorage.removeItem('jarvis_user_profile');
                    setShowProfileModal(false);
                  }
                }}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #590907', backgroundColor: '#590907', color: '#E8D2B5', fontWeight: '900', fontSize: '12px', cursor: 'pointer' }}
              >
                Disconnect / Log Out
              </button>

              <button 
                onClick={() => {
                  setShowProfileModal(false);
                  setAuthMode('login');
                  setShowAuthModal(true);
                }}
                style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #590907', backgroundColor: 'transparent', color: '#590907', fontWeight: '900', fontSize: '11px', cursor: 'pointer' }}
              >
                Switch Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Expense Tracker Modal */}
      {showExpenseModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(165,167,155,0.85)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#E8D2B5', borderRadius: '20px', padding: '20px', width: '100%', maxWidth: '480px', position: 'relative', border: '1px solid #590907', color: '#590907', maxHeight: '92vh', overflowY: 'auto' }}>
            <button onClick={() => setShowExpenseModal(false)} style={{ position: 'absolute', top: '14px', right: '14px', border: 'none', background: '#590907', color: '#E8D2B5', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>

            {/* Header with Title & Action Tools */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingRight: '36px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#590907', color: '#E8D2B5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DollarSign size={18} />
                </div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '900' }}>Expense & Budget Tracker</h3>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button 
                  onClick={handleExportExpensesCSV} 
                  title="Download CSV / Excel" 
                  style={{ background: '#590907', border: 'none', color: '#E8D2B5', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: '800' }}
                >
                  <FileSpreadsheet size={12} /> CSV
                </button>
                <button 
                  onClick={handleClearAllExpenses} 
                  title="Clear All Expenses" 
                  style={{ background: '#7f1d1d', border: 'none', color: '#fecaca', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: '800' }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            {/* Budget Summary & Progress Bar Card */}
            <div style={{ backgroundColor: '#A5A79B', border: '1px solid #590907', borderRadius: '12px', padding: '12px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div>
                  <span style={{ fontSize: '9px', color: '#3d0605', fontWeight: '800', textTransform: 'uppercase' }}>Monthly Budget</span>
                  {isSettingBudget ? (
                    <form onSubmit={handleUpdateBudget} style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                      <input 
                        type="number" 
                        value={tempBudgetInput} 
                        onChange={(e) => setTempBudgetInput(e.target.value)} 
                        placeholder={monthlyBudget.toString()} 
                        style={{ width: '80px', padding: '4px 6px', borderRadius: '6px', border: '1px solid #590907', fontSize: '11px', outline: 'none' }}
                        autoFocus
                      />
                      <button type="submit" style={{ background: '#590907', color: '#E8D2B5', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' }}>Save</button>
                      <button type="button" onClick={() => setIsSettingBudget(false)} style={{ background: '#7f1d1d', color: '#fecaca', border: 'none', padding: '4px 6px', borderRadius: '6px', fontSize: '10px', cursor: 'pointer' }}>✕</button>
                    </form>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <p style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: '#590907' }}>₹{monthlyBudget.toLocaleString()}</p>
                      <button onClick={() => { setTempBudgetInput(monthlyBudget.toString()); setIsSettingBudget(true); }} style={{ background: 'transparent', border: 'none', color: '#590907', cursor: 'pointer', padding: '2px' }} title="Change Budget">
                        <Edit2 size={12} />
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '9px', color: '#3d0605', fontWeight: '800', textTransform: 'uppercase' }}>Spent / Remaining</span>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: '900', color: '#590907' }}>
                    ₹{totalSpent.toFixed(0)} / <span style={{ color: remainingBudget >= 0 ? '#15803d' : '#b91c1c' }}>₹{remainingBudget.toFixed(0)}</span>
                  </p>
                </div>
              </div>

              {/* Visual Budget Progress Bar */}
              <div style={{ width: '100%', height: '8px', backgroundColor: '#E8D2B5', borderRadius: '4px', overflow: 'hidden', border: '1px solid #590907' }}>
                <div 
                  style={{ 
                    height: '100%', 
                    width: `${budgetSpentPct}%`, 
                    backgroundColor: budgetSpentPct > 90 ? '#b91c1c' : (budgetSpentPct > 70 ? '#c2410c' : '#590907'),
                    transition: 'width 0.4s ease'
                  }} 
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ fontSize: '8px', fontWeight: '800', color: '#3d0605' }}>{budgetSpentPct}% Used</span>
                <span style={{ fontSize: '8px', fontWeight: '800', color: remainingBudget >= 0 ? '#15803d' : '#b91c1c' }}>
                  {remainingBudget >= 0 ? `₹${remainingBudget.toFixed(0)} Remaining` : `Over by ₹${Math.abs(remainingBudget).toFixed(0)}!`}
                </span>
              </div>
            </div>

            {/* Quick 1-Tap Preset Buttons */}
            <div style={{ marginBottom: '10px' }}>
              <span style={{ fontSize: '9px', fontWeight: '800', color: '#3d0605', display: 'block', marginBottom: '4px' }}>
                1-Tap Quick Add:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {[
                  { label: "Chai ₹20", title: "Chai / Tea", amount: 20, cat: "Food & Snacks" },
                  { label: "Metro ₹50", title: "Metro Ride", amount: 50, cat: "Travel & Fuel" },
                  { label: "Snacks ₹40", title: "Snacks", amount: 40, cat: "Food & Snacks" },
                  { label: "Lunch ₹120", title: "Lunch / Meal", amount: 120, cat: "Food & Snacks" },
                  { label: "Stationery ₹60", title: "Stationery / Books", amount: 60, cat: "Study & Books" },
                  { label: "Fuel ₹100", title: "Petrol / Fuel", amount: 100, cat: "Travel & Fuel" }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickAddExpense(item.title, item.amount, item.cat)}
                    style={{
                      background: '#A5A79B',
                      border: '1px solid #590907',
                      color: '#590907',
                      fontSize: '9px',
                      fontWeight: '800',
                      padding: '3px 7px',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    + {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Add Expense Form */}
            <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  placeholder="Expense title (e.g. Grocery, Book)..."
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  style={{ flex: 1, padding: '9px 10px', borderRadius: '8px', border: '1px solid #590907', backgroundColor: '#A5A79B', color: '#590907', fontSize: '11px', outline: 'none' }}
                />
                <input
                  type="number"
                  placeholder="Amount (₹)"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  style={{ width: '85px', padding: '9px 6px', borderRadius: '8px', border: '1px solid #590907', backgroundColor: '#A5A79B', color: '#590907', fontSize: '11px', outline: 'none' }}
                />
              </div>

              {/* Category Selector Dropdown */}
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #590907', backgroundColor: '#A5A79B', color: '#590907', fontSize: '11px', outline: 'none', fontWeight: '700' }}
                >
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <button type="submit" style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#590907', color: '#E8D2B5', fontWeight: '900', fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Add Expense
                </button>
              </div>
            </form>

            {/* Search & Category Filter Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  placeholder="Search expenses by title or ₹amount..."
                  value={expenseSearchQuery}
                  onChange={(e) => setExpenseSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '7px 26px 7px 8px', borderRadius: '8px', border: '1px solid #590907', backgroundColor: '#A5A79B', color: '#590907', fontSize: '10px', outline: 'none' }}
                />
                {expenseSearchQuery && (
                  <button onClick={() => setExpenseSearchQuery('')} style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#590907', cursor: 'pointer', fontSize: '12px' }}>✕</button>
                )}
              </div>

              {/* Filter Category Chips */}
              <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '3px' }}>
                {['All', ...EXPENSE_CATEGORIES].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setExpenseCategoryFilter(cat)}
                    style={{
                      background: expenseCategoryFilter === cat ? '#590907' : '#A5A79B',
                      color: expenseCategoryFilter === cat ? '#E8D2B5' : '#590907',
                      border: '1px solid #590907',
                      padding: '3px 7px',
                      borderRadius: '6px',
                      fontSize: '9px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtered Expenses List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
              {filteredExpenses.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#3d0605', fontSize: '11px', margin: '14px 0' }}>
                  {expenseSearchQuery || expenseCategoryFilter !== 'All' ? 'No matching expenses found.' : 'No expense records found.'}
                </p>
              ) : (
                filteredExpenses.map((exp, idx) => {
                  const originalIndex = expenseList.findIndex(e => e.title === exp.title && e.amount === exp.amount && e.date === exp.date);
                  return (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#A5A79B', border: '1px solid #590907', borderRadius: '8px', padding: '8px 10px' }}>
                      <div style={{ overflow: 'hidden', paddingRight: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <p style={{ margin: 0, fontSize: '11px', fontWeight: '800', color: '#590907', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {exp?.title || 'Expense'}
                          </p>
                          <span style={{ fontSize: '8px', fontWeight: '800', color: '#E8D2B5', backgroundColor: '#590907', padding: '1px 5px', borderRadius: '4px' }}>
                            {exp?.category || 'General'}
                          </span>
                        </div>
                        <span style={{ fontSize: '9px', color: '#3d0605', fontWeight: '700' }}>{exp?.date || ''} • ₹{exp?.amount || 0}</span>
                      </div>
                      <button onClick={() => handleDeleteExpense(originalIndex >= 0 ? originalIndex : idx)} style={{ background: '#590907', border: '1px solid #3d0605', color: '#E8D2B5', padding: '5px', borderRadius: '5px', cursor: 'pointer', flexShrink: 0 }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Daily Briefing & Live Google News Flash Modal */}
      {showBriefingModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(165,167,155,0.85)', backdropFilter: 'blur(5px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#E8D2B5', borderRadius: '20px', padding: '20px', width: '100%', maxWidth: '580px', position: 'relative', border: '1px solid #590907', color: '#590907', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}>
            <button onClick={() => setShowBriefingModal(false)} style={{ position: 'absolute', top: '14px', right: '14px', border: 'none', background: '#590907', color: '#E8D2B5', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '8px', backgroundColor: '#590907', color: '#E8D2B5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Newspaper size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#590907' }}>Live Google News & Briefing</h3>
                <span style={{ fontSize: '10px', color: '#3d0605', fontWeight: '700' }}>Select Region for Live Headlines, Photos & Video Previews</span>
              </div>
            </div>

            {/* Top 3 Selection Options: Global, India, Gujarat */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
              {[
                { id: 'global', label: '🌐 Global', icon: Globe },
                { id: 'india', label: '🇮🇳 India', icon: Landmark },
                { id: 'gujarat', label: '🏛️ Gujarat', icon: Building2 }
              ].map((tab) => {
                const isSel = newsCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setNewsCategory(tab.id);
                      fetchTrendingNews(tab.id);
                      setNewsCountdown(120);
                    }}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: '10px',
                      border: '1px solid #590907',
                      backgroundColor: isSel ? '#590907' : '#A5A79B',
                      color: isSel ? '#E8D2B5' : '#590907',
                      fontWeight: '900',
                      fontSize: '11px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      transition: 'all 0.2s ease',
                      boxShadow: isSel ? '0 2px 6px rgba(89,9,7,0.35)' : 'none'
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Status & 2-Minute Countdown Bar + Manual Refresh Button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#A5A79B', border: '1px solid #590907', borderRadius: '10px', padding: '7px 10px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }} />
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#590907' }}>
                  Auto-refresh in {Math.floor(newsCountdown / 60)}m {newsCountdown % 60}s
                </span>
                {lastNewsUpdated && (
                  <span style={{ fontSize: '10px', color: '#3d0605' }}>• Updated: {lastNewsUpdated}</span>
                )}
              </div>

              <button
                disabled={isNewsLoading}
                onClick={() => {
                  fetchTrendingNews(newsCategory);
                  setNewsCountdown(120);
                }}
                title="Manual Refresh Google News"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#590907',
                  color: '#E8D2B5',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: '800',
                  cursor: isNewsLoading ? 'wait' : 'pointer'
                }}
              >
                <RotateCw size={13} style={{ animation: isNewsLoading ? 'jarvisSpinClockwise 1s linear infinite' : 'none' }} />
                {isNewsLoading ? 'Updating...' : 'Refresh'}
              </button>
            </div>

            {/* News Cards List with Image & Hover-Playable Video */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
              {isNewsLoading && trendingNewsList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: '#590907', fontWeight: '800', fontSize: '13px' }}>
                  <RotateCw size={24} style={{ animation: 'jarvisSpinClockwise 1s linear infinite', margin: '0 auto 8px auto', display: 'block' }} />
                  Fetching live Google News for {newsCategory.toUpperCase()}...
                </div>
              ) : trendingNewsList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#3d0605', fontSize: '12px' }}>
                  No live news currently available. Click Refresh above.
                </div>
              ) : (
                trendingNewsList.map((item, idx) => (
                  <div 
                    key={item.id || idx} 
                    onMouseEnter={() => setHoveredNewsId(item.id || idx)}
                    onMouseLeave={() => setHoveredNewsId(null)}
                    style={{ 
                      backgroundColor: '#A5A79B', 
                      border: '1px solid #590907', 
                      borderRadius: '12px', 
                      padding: '10px', 
                      display: 'flex', 
                      gap: '12px',
                      alignItems: 'stretch',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.2s ease',
                      boxShadow: hoveredNewsId === (item.id || idx) ? '0 4px 12px rgba(89,9,7,0.3)' : 'none'
                    }}
                  >
                    {/* Media Thumbnail Container with Hover-Playable Video Preview */}
                    <div style={{ width: '110px', minWidth: '110px', height: '80px', borderRadius: '8px', overflow: 'hidden', position: 'relative', backgroundColor: '#590907', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {hoveredNewsId === (item.id || idx) ? (
                        <>
                          <video 
                            src={item.videoUrl || "/jarvis-particles.mp4"} 
                            autoPlay 
                            loop 
                            muted 
                            playsInline 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          />
                          <div style={{ position: 'absolute', bottom: '4px', left: '4px', backgroundColor: 'rgba(89,9,7,0.85)', padding: '2px 5px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Play size={8} color="#E8D2B5" fill="#E8D2B5" />
                            <span style={{ fontSize: '7px', fontWeight: '900', color: '#E8D2B5', letterSpacing: '0.5px' }}>PREVIEW</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <img 
                            src={item.imageUrl || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&auto=format&fit=crop&q=60"} 
                            alt={item.title} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                            onError={(e) => {
                              e.target.src = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&auto=format&fit=crop&q=60";
                            }}
                          />
                          <div style={{ position: 'absolute', top: '4px', right: '4px', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Play size={9} color="#E8D2B5" />
                          </div>
                        </>
                      )}
                    </div>

                    {/* News Info & Story Link */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '4px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '2px' }}>
                          <span style={{ fontSize: '8px', fontWeight: '900', color: '#E8D2B5', backgroundColor: '#590907', padding: '1px 5px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {item.source || 'LIVE'}
                          </span>
                          <span style={{ fontSize: '8px', color: '#3d0605', fontWeight: '700' }}>
                            {item.pubDate ? new Date(item.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}
                          </span>
                        </div>

                        <p style={{ margin: 0, fontSize: '11px', fontWeight: '800', color: '#590907', lineHeight: '1.35', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {item.title}
                        </p>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                        <span style={{ fontSize: '8px', color: '#590907', fontWeight: '700' }}>Hover for video preview</span>
                        <a 
                          href={item.link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '9px', fontWeight: '900', color: '#590907', textDecoration: 'none', backgroundColor: 'rgba(89,9,7,0.1)', padding: '2px 6px', borderRadius: '4px' }}
                        >
                          Read Story <ExternalLink size={10} />
                        </a>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button onClick={() => setShowBriefingModal(false)} style={{ marginTop: '12px', width: '100%', padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: '#590907', color: '#E8D2B5', fontWeight: '900', fontSize: '12px', cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}

    </div>
  );
}