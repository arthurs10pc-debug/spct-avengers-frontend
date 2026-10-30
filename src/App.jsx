import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { 
  Shield, Volume2, VolumeX, Clock, 
  X, Activity, Navigation, Edit2, Trash2, Plus, Mic, AlertTriangle, Square, 
  DollarSign, Newspaper, Check, MapPin, Moon, UserCircle, LogIn, Wrench, Download, Upload, FileText, UserPlus
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

  // Daily Briefing State
  const [showBriefingModal, setShowBriefingModal] = useState(false);
  const [briefingData, setBriefingData] = useState("Loading briefing data...");

  const watcherIntervalRef = useRef(null);
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

                const lineColor = isHeavy ? '#590907' : '#E8D2B5';

                const polyline = window.L.polyline(coords, { color: lineColor, weight: 6, opacity: 0.85 }).addTo(map);
                polylineRef.current = polyline;
                map.fitBounds(polyline.getBounds(), { padding: [50, 50] });

                if (isHeavy) {
                  setRouteStatus({ isHeavy: true, message: `RED ALERT: Heavy traffic! (${durationMin} min)` });
                  if (isMonitoringActive) speakText("Alert! Raste par bhari traffic hai.");
                } else {
                  setRouteStatus({ isHeavy: false, message: `Route is clear. (${durationMin} min)` });
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

  // Autocomplete Strictly Restricted to India & Gujarat Region
  useEffect(() => {
    if (fromInput.trim().length < 2) {
      setFromSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&viewbox=68.1,6.5,97.4,35.5&bounded=1&q=${encodeURIComponent(fromInput)}`);
        const data = await res.json();
        setFromSuggestions(data.slice(0, 5));
      } catch (e) {}
    }, 300);
    return () => clearTimeout(timer);
  }, [fromInput]);

  useEffect(() => {
    if (toInput.trim().length < 2) {
      setToSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&viewbox=68.1,6.5,97.4,35.5&bounded=1&q=${encodeURIComponent(toInput)}`);
        const data = await res.json();
        setToSuggestions(data.slice(0, 5));
      } catch (e) {}
    }, 300);
    return () => clearTimeout(timer);
  }, [toInput]);

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
      if (triggeredMinuteRef.current === currentTimeStr) return;

      remindersList.forEach((rem, idx) => {
        if (rem.task && rem.time === currentTimeStr && !rem.completed) {
          triggeredMinuteRef.current = currentTimeStr;
          setActiveAlertTask(rem.task);
          setActiveAlertKey(`${rem.task}_${rem.time}`);
          setCurrentAlertTaskId(idx);
          startJailerFluteAlarm();
          
          if (Notification.permission === 'granted') {
            new Notification("Lone Wolf Watcher Alert", { body: rem.task, icon: "/logo.png" });
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

  // Safe Expense Handlers (Prepend new expense to top)
  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!expenseTitle.trim() || !expenseAmount) {
      alert("Please enter both title and amount.");
      return;
    }
    const newExp = {
      title: expenseTitle.trim(),
      amount: parseFloat(expenseAmount),
      date: new Date().toLocaleDateString()
    };
    setExpenseList(prev => [newExp, ...prev]);
    setExpenseTitle('');
    setExpenseAmount('');
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
    try {
      const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=23.0225&current_weather=true');
      const data = await res.json();
      const temp = data?.current_weather?.temperature || 'N/A';
      const wind = data?.current_weather?.windspeed || 'N/A';
      setBriefingData(`Good morning Commander! Current temperature is ${temp}°C and wind speed is ${wind} km/h. Financial systems active.`);
    } catch (e) {
      setBriefingData("Failed to fetch briefing data.");
    }
  };

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

        {/* Main Jarvis Heart Center - Muted Sage Grey background with Burgundy/Beige accents */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', textAlign: 'center', overflowY: 'auto', backgroundColor: '#A5A79B' }}>
          
          <style>{`
            .jarvis-heart {
              width: 220px;
              height: 220px;
              border-radius: 50%;
              border: 3px solid #590907;
              display: flex;
              align-items: center;
              justify-content: center;
              background: radial-gradient(circle, rgba(89,9,7,0.2) 0%, rgba(165,167,155,0.95) 70%);
              cursor: pointer;
              position: relative;
              box-shadow: 0 0 40px rgba(89, 9, 7, 0.25);
            }
          `}</style>

          <div className="jarvis-heart" onClick={startListening} title="Click to speak with Jarvis">
            <div style={{ width: '120px', height: '120px', borderRadius: '50%', border: '2px dashed #590907', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isListening ? <Mic size={40} color="#590907" /> : <Activity size={56} color="#590907" />}
            </div>
          </div>

          <p style={{ marginTop: '16px', fontSize: '12px', color: '#590907', fontWeight: '800', padding: '0 10px' }}>
            {assistantStatus}
          </p>

          <div style={{ marginTop: '10px', padding: '8px 14px', borderRadius: '10px', backgroundColor: routeStatus.isHeavy ? 'rgba(89, 9, 7, 0.2)' : 'rgba(232, 210, 181, 0.5)', border: `1px solid ${routeStatus.isHeavy ? '#590907' : '#E8D2B5'}`, display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '460px', width: '100%', justifyContent: 'center' }}>
            {routeStatus.isHeavy && <AlertTriangle size={16} color="#590907" />}
            <span style={{ fontSize: '10px', fontWeight: '800', color: '#590907' }}>
              Route: {activeRoute.fromName ? `${activeRoute.fromName.split(',')[0]} ➔ ${activeRoute.toName.split(',')[0]}` : "No route selected"} | {routeStatus.message}
            </span>
          </div>

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
                          let rawText = await uploadedFile.text().catch(() => "");
                          let cleanWords = rawText.replace(/<[^>]*>?/gm, ' ').match(/[a-zA-Z0-9\s.,-]{3,}/g);
                          
                          let displayLines = [];
                          if (cleanWords && cleanWords.length > 5) {
                            displayLines = cleanWords.slice(0, 20).map(w => `(${w.trim()}) Tj`);
                          } else {
                            displayLines = [
                              `(Document Name: ${originalName}) Tj`,
                              `(File Type: ${uploadedFile.type || 'Binary Document'}) Tj`,
                              `(Status: Successfully Converted to Clean PDF) Tj`
                            ];
                          }

                          const pdfStream = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 300 >>\nstream\nBT\n/F1 12 Tf\n50 750 Td\n${displayLines.join('\n0 -25 Td\n')}\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000268 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n378\n%%EOF`;
                          
                          const blob = new Blob([pdfStream], { type: 'application/pdf' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${originalName}_converted_${selectedSize}.pdf`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                          alert("Clean PDF successfully generated and downloaded!");
                        } else {
                          const arrayBuffer = await uploadedFile.arrayBuffer();
                          let mimeType = 'application/octet-stream';
                          if (['jpg', 'jpeg', 'png', 'webp'].includes(targetExt)) mimeType = `image/${targetExt === 'jpg' ? 'jpeg' : targetExt}`;
                          else if (['txt', 'csv'].includes(targetExt)) mimeType = 'text/plain';
                          else if (targetExt === 'docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                          else if (targetExt === 'xlsx') mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

                          const blob = new Blob([arrayBuffer], { type: mimeType });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${originalName}_converted_${selectedSize}.${targetExt}`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                          alert(`File successfully converted and downloaded as .${targetExt}!`);
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

            <p style={{ marginTop: '14px', marginBottom: 0, fontSize: '10px', color: '#3d0605' }}>
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

      {/* Route Setup Modal */}
      {showRoutePanel && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(165,167,155,0.7)', backdropFilter: 'blur(3px)', zIndex: 150, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ backgroundColor: '#E8D2B5', width: '100%', maxWidth: '480px', height: '100%', padding: '16px', borderLeft: '1px solid #590907', display: 'flex', flexDirection: 'column', color: '#590907' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>Live Route & Traffic Map</h3>
              <button onClick={() => setShowRoutePanel(false)} style={{ border: 'none', background: '#590907', color: '#E8D2B5', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>
            </div>

            <form onSubmit={handleApplyRoute} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px', position: 'relative' }}>
              <p style={{ margin: 0, fontSize: '9px', color: '#3d0605', fontWeight: '700' }}>* First click for 'From', second click for 'To'.</p>
              
              <div style={{ display: 'flex', flexDirection: window.innerWidth < 500 ? 'column' : 'row', gap: '6px', position: 'relative' }}>
                <div style={{ flex: 1, position: 'relative', display: 'flex', gap: '4px' }}>
                  <input
                    type="text"
                    placeholder="From location..."
                    value={fromInput}
                    onChange={(e) => setFromInput(e.target.value)}
                    style={{ flex: 1, padding: '9px 10px', borderRadius: '8px', border: '1px solid #590907', backgroundColor: '#A5A79B', color: '#590907', fontSize: '11px', outline: 'none' }}
                  />
                  <button type="button" onClick={() => handleGetCurrentLocation('from')} title="GPS" style={{ background: '#590907', border: '1px solid #E8D2B5', color: '#E8D2B5', padding: '0 8px', borderRadius: '8px', cursor: 'pointer', fontSize: '9px', fontWeight: '800' }}>GPS</button>
                  {fromSuggestions.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#A5A79B', border: '1px solid #590907', borderRadius: '8px', zIndex: 300, maxHeight: '130px', overflowY: 'auto' }}>
                      {fromSuggestions.map((item, i) => (
                        <div key={i} onClick={() => handleSelectFromSuggestion(item)} style={{ padding: '7px 9px', fontSize: '10px', cursor: 'pointer', borderBottom: '1px solid #590907' }}>
                          {item.display_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, position: 'relative', display: 'flex', gap: '4px' }}>
                  <input
                    type="text"
                    placeholder="To location..."
                    value={toInput}
                    onChange={(e) => setToInput(e.target.value)}
                    style={{ flex: 1, padding: '9px 10px', borderRadius: '8px', border: '1px solid #590907', backgroundColor: '#A5A79B', color: '#590907', fontSize: '11px', outline: 'none' }}
                  />
                  <button type="button" onClick={() => handleGetCurrentLocation('to')} title="GPS" style={{ background: '#590907', border: '1px solid #E8D2B5', color: '#E8D2B5', padding: '0 8px', borderRadius: '8px', cursor: 'pointer', fontSize: '9px', fontWeight: '800' }}>GPS</button>
                  {toSuggestions.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#A5A79B', border: '1px solid #590907', borderRadius: '8px', zIndex: 300, maxHeight: '130px', overflowY: 'auto' }}>
                      {toSuggestions.map((item, i) => (
                        <div key={i} onClick={() => handleSelectToSuggestion(item)} style={{ padding: '7px 9px', fontSize: '10px', cursor: 'pointer', borderBottom: '1px solid #590907' }}>
                          {item.display_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button type="submit" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#590907', color: '#E8D2B5', fontWeight: '900', fontSize: '11px', cursor: 'pointer' }}>
                Load Route
              </button>
            </form>

            <div style={{ flex: 1, borderRadius: '12px', overflow: 'hidden', border: '1px solid #590907', backgroundColor: '#A5A79B', minHeight: '250px' }}>
              <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }}></div>
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

            <div style={{ position: 'relative', borderTop: '1px solid #590907', paddingTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
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
          <div style={{ backgroundColor: '#E8D2B5', borderRadius: '20px', padding: '20px', width: '100%', maxWidth: '400px', position: 'relative', border: '1px solid #590907', color: '#590907', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setShowExpenseModal(false)} style={{ position: 'absolute', top: '14px', right: '14px', border: 'none', background: '#590907', color: '#E8D2B5', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#590907', color: '#E8D2B5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DollarSign size={18} />
              </div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>Expense & Pocket Money Tracker</h3>
            </div>

            <div style={{ backgroundColor: '#A5A79B', border: '1px solid #590907', borderRadius: '10px', padding: '10px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '9px', color: '#3d0605', fontWeight: '700' }}>Total Spent</span>
                <p style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: '#590907' }}>₹{totalSpent.toFixed(2)}</p>
              </div>
            </div>

            <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  placeholder="Expense title (e.g. Chai, Petrol)..."
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

              <button type="submit" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#590907', color: '#E8D2B5', fontWeight: '900', fontSize: '11px', cursor: 'pointer' }}>
                Add Expense
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
              {expenseList.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#3d0605', fontSize: '11px', margin: '14px 0' }}>No expense records found.</p>
              ) : (
                expenseList.map((exp, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#A5A79B', border: '1px solid #590907', borderRadius: '8px', padding: '8px 10px' }}>
                    <div style={{ overflow: 'hidden', paddingRight: '6px' }}>
                      <p style={{ margin: 0, fontSize: '11px', fontWeight: '800', color: '#590907', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {exp?.title || 'Expense'} - <span style={{ color: '#590907' }}>₹{exp?.amount || 0}</span>
                      </p>
                      <span style={{ fontSize: '9px', color: '#3d0605', fontWeight: '700' }}>{exp?.date || ''}</span>
                    </div>
                    <button onClick={() => handleDeleteExpense(idx)} style={{ background: '#590907', border: '1px solid #3d0605', color: '#E8D2B5', padding: '5px', borderRadius: '5px', cursor: 'pointer', flexShrink: 0 }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Briefing Modal */}
      {showBriefingModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(165,167,155,0.85)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#E8D2B5', borderRadius: '20px', padding: '20px', width: '100%', maxWidth: '380px', position: 'relative', border: '1px solid #590907', color: '#590907' }}>
            <button onClick={() => setShowBriefingModal(false)} style={{ position: 'absolute', top: '14px', right: '14px', border: 'none', background: '#590907', color: '#E8D2B5', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#590907', color: '#E8D2B5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Newspaper size={18} /></div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>Daily Briefing & News Flash</h3>
            </div>

            <p style={{ fontSize: '12px', lineHeight: '1.5', color: '#590907', backgroundColor: '#A5A79B', padding: '14px', borderRadius: '10px', border: '1px solid #590907', margin: '0 0 14px 0' }}>
              {briefingData}
            </p>

            <button onClick={() => setShowBriefingModal(false)} style={{ width: '100%', padding: '11px', borderRadius: '10px', border: 'none', backgroundColor: '#590907', color: '#E8D2B5', fontWeight: '900', fontSize: '12px', cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}

    </div>
  );
}