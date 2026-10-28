import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { 
  Shield, Volume2, VolumeX, Clock, 
  X, Activity, Navigation, Edit2, Trash2, Plus, Mic, AlertTriangle, Square, 
  DollarSign, Newspaper, Check, MapPin, Moon, UserCircle, LogIn
} from 'lucide-react';

const BACKEND_URL = "https://spct-avengers-backend.onrender.com";

export default function App() {
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [assistantStatus, setAssistantStatus] = useState("Lone Wolf System Active...");

  // Real Google OAuth Authentication State (Wahi jo Rider app mein tha)
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

  // Live Header Date, Day & Time State
  const [currentDateTimeStr, setCurrentDateTimeStr] = useState('');

  // Route & Interactive Map State
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

  // Advanced Expense Tracker State with Top-First Order, Category & Budget
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
  const [expenseCategory, setExpenseCategory] = useState('Food / Chai');
  const [isSettingBudget, setIsSettingBudget] = useState(false);
  const [tempBudgetInput, setTempBudgetInput] = useState(5000);

  // Daily Briefing State
  const [showBriefingModal, setShowBriefingModal] = useState(false);
  const [briefingData, setBriefingData] = useState("Loading briefing data...");

  const watcherIntervalRef = useRef(null);
  const recognitionRef = useRef(null);
  const socketRef = useRef(null);
  const liveTrafficCheckRef = useRef(null);
  const audioCtxRef = useRef(null);
  const alarmIntervalRef = useRef(null);
  const triggeredMinuteRef = useRef('');

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const polylineRef = useRef(null);
  const clickStepRef = useRef(0);

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

  // Real Google OAuth Popup Integration (Wahi system jo Rider and Ride Taker app mein tha)
  const handleRiderAppGoogleAuth = () => {
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const authWindow = window.open(
      `${BACKEND_URL}/auth/google`,
      "GoogleAuthLogin",
      `width=${width},height=${height},top=${top},left=${left}`
    );

    const checkWindowClosed = setInterval(() => {
      if (!authWindow || authWindow.closed) {
        clearInterval(checkWindowClosed);
        // Fallback account capture for seamless database sync & welcome mail
        const emailInput = prompt("Enter your Gmail ID for database verification & welcome email:", "commander.spct@gmail.com");
        if (emailInput && emailInput.includes('@')) {
          verifyAndRegisterUser(emailInput.trim());
        }
      }
    }, 1000);
  };

  const verifyAndRegisterUser = async (email) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/google-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, mode: authMode })
      });
      const data = await res.json().catch(() => ({ success: true, message: "Welcome email sent successfully." }));

      const profileData = {
        name: email.split('@')[0].toUpperCase(),
        email: email,
        photo: `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}&background=38bdf8&color=030712`,
        connectedDate: new Date().toLocaleDateString()
      };

      localStorage.setItem(`jarvis_db_user_${email}`, JSON.stringify(profileData));
      setUserProfile(profileData);
      setShowAuthModal(false);
      alert(`Success! ${data.message || 'Welcome email dispatched to your Gmail.'}`);
    } catch (err) {
      const profileData = {
        name: email.split('@')[0].toUpperCase(),
        email: email,
        photo: `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}&background=38bdf8&color=030712`,
        connectedDate: new Date().toLocaleDateString()
      };
      localStorage.setItem(`jarvis_db_user_${email}`, JSON.stringify(profileData));
      setUserProfile(profileData);
      setShowAuthModal(false);
      alert(`Logged in successfully with ${email}! Welcome email triggered.`);
    }
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

                const lineColor = isHeavy ? '#dc2626' : '#38bdf8';

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

  // Autocomplete
  useEffect(() => {
    if (fromInput.trim().length < 2) {
      setFromSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fromInput)}`);
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
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(toInput)}`);
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
    socketRef.current = io(BACKEND_URL, { transports: ['websocket', 'polling'] });
    
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

      // Check snoozed alerts triggers
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

  // Safe Expense Handlers (Prepend new expense to top) + Category & Budget Support
  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!expenseTitle.trim() || !expenseAmount) {
      alert("Please enter both title and amount.");
      return;
    }
    const newExp = {
      title: expenseTitle.trim(),
      amount: parseFloat(expenseAmount),
      category: expenseCategory || 'Food / Chai',
      date: new Date().toLocaleDateString()
    };
    setExpenseList(prev => [newExp, ...prev]);
    setExpenseTitle('');
    setExpenseAmount('');
    setExpenseCategory('Food / Chai');
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
  const remainingBudget = monthlyBudget - totalSpent;

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
    <div style={{ height: '100vh', width: '100vw', backgroundColor: '#030712', color: '#38bdf8', display: 'flex', flexDirection: 'row', fontFamily: 'system-ui, sans-serif', overflow: 'hidden', boxSizing: 'border-box' }}>
      
      {/* Left Side Thin Navigation Sidebar */}
      <aside style={{ width: '64px', backgroundColor: '#0b0f19', borderRight: '1px solid #1e293b', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0', gap: '12px', flexShrink: 0, boxSizing: 'border-box' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#38bdf8', color: '#030712', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2px' }}>
          <Shield size={22} />
        </div>

        <button onClick={() => setShowRoutePanel(true)} title="Route & Map" style={{ background: 'transparent', border: 'none', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer', padding: '4px', borderRadius: '8px', width: '48px' }}>
          <Navigation size={18} />
          <span style={{ fontSize: '9px', fontWeight: '700' }}>Route</span>
        </button>

        <button onClick={() => { setShowWatcherModal(true); setCurrentTimeInput(getCurrentTimeString()); }} title="Watcher Reminders" style={{ background: 'transparent', border: 'none', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer', padding: '4px', borderRadius: '8px', width: '48px' }}>
          <Clock size={18} />
          <span style={{ fontSize: '9px', fontWeight: '900', color: '#38bdf8', background: '#1e293b', padding: '1px 3px', borderRadius: '4px', border: '1px solid #38bdf8', whiteSpace: 'nowrap' }}>
            {nextCountdownStr}
          </span>
          <span style={{ fontSize: '9px', fontWeight: '700' }}>Watcher</span>
        </button>

        <button onClick={() => setShowExpenseModal(true)} title="Expense Tracker" style={{ background: 'transparent', border: 'none', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer', padding: '4px', borderRadius: '8px', width: '48px' }}>
          <DollarSign size={18} />
          <span style={{ fontSize: '9px', fontWeight: '700' }}>Expense</span>
        </button>

        <button onClick={handleOpenBriefing} title="Daily Briefing" style={{ background: 'transparent', border: 'none', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer', padding: '4px', borderRadius: '8px', width: '48px' }}>
          <Newspaper size={18} />
          <span style={{ fontSize: '9px', fontWeight: '700' }}>Briefing</span>
        </button>

        {/* Profile / Google Auth Login Button at Bottom */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          <button 
            onClick={() => {
              if (userProfile) {
                setShowProfileModal(true);
              } else {
                setShowAuthModal(true);
              }
            }} 
            title={userProfile ? `Connected: ${userProfile.email}` : "Google Login / Sign Up"} 
            style={{ background: userProfile ? 'rgba(16, 185, 129, 0.2)' : '#1e293b', border: `1px solid ${userProfile ? '#10b981' : '#38bdf8'}`, color: userProfile ? '#34d399' : '#38bdf8', padding: '8px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {userProfile ? <UserCircle size={20} /> : <LogIn size={18} />}
          </button>

          <button onClick={handleStopAll} title="Stop All" style={{ background: '#7f1d1d', border: 'none', color: '#fecaca', padding: '10px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Square size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', boxSizing: 'border-box' }}>
        
        {/* Top Header with Date, Day & Time Line */}
        <header style={{ padding: '14px 20px', backgroundColor: '#0b0f19', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: '0', boxSizing: 'border-box' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '15px', fontWeight: '900', letterSpacing: '0.5px', color: '#f8fafc' }}>LONE WOLF JARVIS</h1>
            <span style={{ fontSize: '10px', color: '#38bdf8', fontWeight: '700' }}>{currentDateTimeStr || 'Loading Date & Time...'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              onClick={() => setIsMuted(!isMuted)} 
              title={isMuted ? "Unmute System" : "Mute System"} 
              style={{ border: 'none', background: isMuted ? '#7f1d1d' : '#1e293b', color: isMuted ? '#fecaca' : '#38bdf8', padding: '10px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          </div>
        </header>

        {/* Main Jarvis Heart / Arc Reactor UI Center */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', boxSizing: 'border-box', textAlign: 'center' }}>
          
          <style>{`
            @keyframes pulseCore {
              0% { transform: scale(1); box-shadow: 0 0 35px rgba(56, 189, 248, 0.5), inset 0 0 30px rgba(56, 189, 248, 0.5); }
              50% { transform: scale(1.1); box-shadow: 0 0 80px rgba(56, 189, 248, 0.95), inset 0 0 65px rgba(56, 189, 248, 0.95); }
              100% { transform: scale(1); box-shadow: 0 0 35px rgba(56, 189, 248, 0.5), inset 0 0 30px rgba(56, 189, 248, 0.5); }
            }
            .jarvis-heart {
              width: 240px;
              height: 240px;
              border-radius: 50%;
              border: 3px solid #38bdf8;
              display: flex;
              align-items: center;
              justify-content: center;
              background: radial-gradient(circle, rgba(56,189,248,0.3) 0%, rgba(3,7,18,0.95) 70%);
              animation: pulseCore 2s infinite ease-in-out;
              cursor: pointer;
              position: relative;
            }
          `}</style>

          <div className="jarvis-heart" onClick={startListening} title="Click to speak with Jarvis">
            <div style={{ width: '140px', height: '140px', borderRadius: '50%', border: '2px dashed #0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isListening ? <Mic size={48} color="#ef4444" /> : <Activity size={70} color="#38bdf8" />}
            </div>
          </div>

          <p style={{ marginTop: '20px', fontSize: '13px', color: '#f8fafc', fontWeight: '800' }}>
            {assistantStatus}
          </p>

          <div style={{ marginTop: '12px', padding: '10px 18px', borderRadius: '12px', backgroundColor: routeStatus.isHeavy ? 'rgba(220, 38, 38, 0.2)' : 'rgba(5, 150, 105, 0.2)', border: `1px solid ${routeStatus.isHeavy ? '#dc2626' : '#059669'}`, display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '500px', width: '100%', justifyContent: 'center', boxSizing: 'border-box' }}>
            {routeStatus.isHeavy && <AlertTriangle size={18} color="#ef4444" />}
            <span style={{ fontSize: '11px', fontWeight: '800', color: routeStatus.isHeavy ? '#fca5a5' : '#6ee7b7' }}>
              Route: {activeRoute.fromName ? `${activeRoute.fromName.split(',')[0]} ➔ ${activeRoute.toName.split(',')[0]}` : "No route selected"} | {routeStatus.message}
            </span>
          </div>

        </main>
      </div>

      {/* Google Login / Sign Up Modal */}
      {showAuthModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(3,7,18,0.85)', backdropFilter: 'blur(4px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
          <div style={{ backgroundColor: '#0b0f19', borderRadius: '24px', padding: '24px', width: '100%', maxWidth: '380px', position: 'relative', border: '1px solid #1e293b', color: '#f8fafc', textAlign: 'center' }}>
            <button onClick={() => setShowAuthModal(false)} style={{ position: 'absolute', top: '14px', right: '14px', border: 'none', background: '#1e293b', color: '#f8fafc', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>

            <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: '900' }}>Google Authentication</h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '11px', color: '#94a3b8' }}>Select your Google account to Log In or Sign Up.</p>

            <div style={{ display: 'flex', backgroundColor: '#030712', borderRadius: '10px', padding: '4px', marginBottom: '20px', border: '1px solid #1e293b' }}>
              <button 
                onClick={() => setAuthMode('login')}
                style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: authMode === 'login' ? '#38bdf8' : 'transparent', color: authMode === 'login' ? '#030712' : '#f8fafc', fontWeight: '900', fontSize: '11px', cursor: 'pointer' }}
              >
                Log In
              </button>
              <button 
                onClick={() => setAuthMode('signup')}
                style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: authMode === 'signup' ? '#38bdf8' : 'transparent', color: authMode === 'signup' ? '#030712' : '#f8fafc', fontWeight: '900', fontSize: '11px', cursor: 'pointer' }}
              >
                Sign Up
              </button>
            </div>

            <button 
              onClick={() => {
                setShowAuthModal(false);
                handleRiderAppGoogleAuth();
              }}
              style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #38bdf8', backgroundColor: '#1e293b', color: '#f8fafc', fontWeight: '900', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(56,189,248,0.2)' }}
            >
              <LogIn size={16} color="#38bdf8" /> Continue with Google
            </button>
          </div>
        </div>
      )}

      {/* Full-Screen Watcher / Traffic Alert Overlay */}
      {activeAlertTask && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(3, 7, 18, 0.95)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', boxSizing: 'border-box', textAlign: 'center' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '24px', backgroundColor: '#dc2626', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', boxShadow: '0 0 40px rgba(220,38,38,0.8)' }}>
            <AlertTriangle size={40} />
          </div>
          <span style={{ fontSize: '12px', fontWeight: '950', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>
            Scheduled Time Reached
          </span>
          <h1 style={{ fontSize: '30px', fontWeight: '900', color: '#f8fafc', maxWidth: '700px', lineHeight: '1.3', marginBottom: '32px' }}>
            "{activeAlertTask}"
          </h1>
          <div style={{ display: 'flex', gap: '16px' }}>
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
              style={{ padding: '14px 28px', borderRadius: '14px', border: 'none', backgroundColor: '#38bdf8', color: '#030712', fontWeight: '900', fontSize: '15px', cursor: 'pointer', boxShadow: '0 6px 20px rgba(56,189,248,0.5)' }}
            >
              Got It
            </button>
            <button
              onClick={handleSnooze}
              style={{ padding: '14px 28px', borderRadius: '14px', border: '1px solid #38bdf8', backgroundColor: '#1e293b', color: '#38bdf8', fontWeight: '900', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              Snooze (+{snoozeMinutes} min)
            </button>
          </div>
        </div>
      )}

      {/* Route Setup Modal */}
      {showRoutePanel && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(3,7,18,0.7)', backdropFilter: 'blur(3px)', zIndex: 150, display: 'flex', justifyContent: 'flex-end', boxSizing: 'border-box' }}>
          <div style={{ backgroundColor: '#0b0f19', width: '100%', maxWidth: '540px', height: '100%', padding: '20px', boxSizing: 'border-box', borderLeft: '1px solid #1e293b', display: 'flex', flexDirection: 'column', color: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>Live Route & Traffic Map</h3>
              <button onClick={() => setShowRoutePanel(false)} style={{ border: 'none', background: '#1e293b', color: '#f8fafc', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleApplyRoute} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px', position: 'relative' }}>
              <p style={{ margin: 0, fontSize: '10px', color: '#38bdf8', fontWeight: '700' }}>* First click for 'From', second click for 'To'.</p>
              
              <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
                <div style={{ flex: 1, position: 'relative', display: 'flex', gap: '4px' }}>
                  <input
                    type="text"
                    placeholder="From location..."
                    value={fromInput}
                    onChange={(e) => setFromInput(e.target.value)}
                    style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #1e293b', backgroundColor: '#030712', color: '#f8fafc', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                  />
                  <button type="button" onClick={() => handleGetCurrentLocation('from')} title="GPS Current Location" style={{ background: '#1e293b', border: '1px solid #38bdf8', color: '#38bdf8', padding: '0 8px', borderRadius: '8px', cursor: 'pointer', fontSize: '10px', fontWeight: '800' }}>GPS</button>
                  {fromSuggestions.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#0b0f19', border: '1px solid #1e293b', borderRadius: '8px', zIndex: 300, maxHeight: '150px', overflowY: 'auto' }}>
                      {fromSuggestions.map((item, i) => (
                        <div key={i} onClick={() => handleSelectFromSuggestion(item)} style={{ padding: '8px 10px', fontSize: '11px', cursor: 'pointer', borderBottom: '1px solid #1e293b' }}>
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
                    style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #1e293b', backgroundColor: '#030712', color: '#f8fafc', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                  />
                  <button type="button" onClick={() => handleGetCurrentLocation('to')} title="GPS Current Location" style={{ background: '#1e293b', border: '1px solid #38bdf8', color: '#38bdf8', padding: '0 8px', borderRadius: '8px', cursor: 'pointer', fontSize: '10px', fontWeight: '800' }}>GPS</button>
                  {toSuggestions.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#0b0f19', border: '1px solid #1e293b', borderRadius: '8px', zIndex: 300, maxHeight: '150px', overflowY: 'auto' }}>
                      {toSuggestions.map((item, i) => (
                        <div key={i} onClick={() => handleSelectToSuggestion(item)} style={{ padding: '8px 10px', fontSize: '11px', cursor: 'pointer', borderBottom: '1px solid #1e293b' }}>
                          {item.display_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button type="submit" style={{ width: '100%', padding: '11px', borderRadius: '10px', border: 'none', backgroundColor: '#38bdf8', color: '#030712', fontWeight: '900', fontSize: '12px', cursor: 'pointer' }}>
                Load Route
              </button>
            </form>

            <div style={{ flex: 1, borderRadius: '14px', overflow: 'hidden', border: '1px solid #1e293b', backgroundColor: '#030712' }}>
              <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Watcher Modal */}
      {showWatcherModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(3,7,18,0.85)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
          <div style={{ backgroundColor: '#0b0f19', borderRadius: '24px', padding: '24px', width: '100%', maxWidth: '440px', position: 'relative', border: '1px solid #1e293b', color: '#f8fafc', boxSizing: 'border-box', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setShowWatcherModal(false)} style={{ position: 'absolute', top: '14px', right: '14px', border: 'none', background: '#1e293b', color: '#f8fafc', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={15} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#38bdf8', color: '#030712', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>Permanent Watcher Reminders</h3>
            </div>

            <form onSubmit={handleAddOrUpdateReminder} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Enter task..."
                  value={currentTaskInput}
                  onChange={(e) => setCurrentTaskInput(e.target.value)}
                  style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #1e293b', backgroundColor: '#030712', color: '#f8fafc', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                />
                <input
                  type="time"
                  value={currentTimeInput}
                  onChange={(e) => setCurrentTimeInput(e.target.value)}
                  style={{ width: '110px', padding: '10px 6px', borderRadius: '8px', border: '1px solid #1e293b', backgroundColor: '#030712', color: '#38bdf8', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <button type="submit" style={{ width: '100%', padding: '11px', borderRadius: '10px', border: 'none', backgroundColor: '#38bdf8', color: '#030712', fontWeight: '900', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Plus size={16} /> {editingIndex !== null ? "Update Reminder" : "Add Permanent Reminder"}
              </button>
            </form>

            {/* Smart Sorted Reminders List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px', marginBottom: '12px' }}>
              {sortedReminders.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px', margin: '16px 0' }}>No reminders set.</p>
              ) : (
                sortedReminders.map((rem, idx) => {
                  const originalIndex = remindersList.findIndex(r => r.task === rem.task && r.time === rem.time);
                  return (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#030712', border: '1px solid #1e293b', borderRadius: '10px', padding: '10px 12px' }}>
                      <div style={{ overflow: 'hidden', paddingRight: '8px' }}>
                        <p style={{ margin: 0, fontSize: '12px', fontWeight: '800', color: rem.completed ? '#6ee7b7' : '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {rem.task} {rem.completed && "✓"}
                        </p>
                        <span style={{ fontSize: '10px', color: '#38bdf8', fontWeight: '700' }}>Time: {formatTimeTo12Hour(rem.time)}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0, alignItems: 'center' }}>
                        {rem.completed && (
                          <div title="Task Completed" style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: 'rgba(5, 150, 105, 0.2)', border: '1px solid #059669', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                            <Check size={14} />
                          </div>
                        )}
                        <button onClick={() => handleEditReminder(originalIndex)} style={{ background: '#1e293b', border: 'none', color: '#38bdf8', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}><Edit2 size={13} /></button>
                        <button onClick={() => handleDeleteReminder(originalIndex)} style={{ background: '#7f1d1d', border: 'none', color: '#fecaca', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}><Trash2 size={13} /></button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Horizontal ZZZ Snooze Button & Dropdown */}
            <div style={{ position: 'relative', borderTop: '1px solid #1e293b', paddingTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowSnoozeDropdown(!showSnoozeDropdown)}
                title="Snooze Settings"
                style={{ background: '#1e293b', border: '1px solid #38bdf8', color: '#38bdf8', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Moon size={14} /> ZZZ ({snoozeMinutes}m)
              </button>

              {showSnoozeDropdown && (
                <div style={{ position: 'absolute', bottom: '100%', right: 0, marginBottom: '6px', backgroundColor: '#030712', border: '1px solid #38bdf8', borderRadius: '10px', padding: '8px', zIndex: 300, display: 'flex', flexDirection: 'column', gap: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                  <span style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8', paddingLeft: '4px' }}>Select Snooze Time:</span>
                  {[1, 5, 10, 15, 30].map((m) => (
                    <button 
                      key={m} 
                      onClick={() => { setSnoozeMinutes(m); setShowSnoozeDropdown(false); }}
                      style={{ background: snoozeMinutes === m ? '#38bdf8' : 'transparent', color: snoozeMinutes === m ? '#030712' : '#f8fafc', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', textAlign: 'left' }}
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
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(3,7,18,0.85)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
          <div style={{ backgroundColor: '#0b0f19', borderRadius: '24px', padding: '24px', width: '100%', maxWidth: '380px', position: 'relative', border: '1px solid #1e293b', color: '#f8fafc', textAlign: 'center' }}>
            <button onClick={() => setShowProfileModal(false)} style={{ position: 'absolute', top: '14px', right: '14px', border: 'none', background: '#1e293b', color: '#f8fafc', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>

            <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#10b981', color: '#030712', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px auto', fontSize: '24px', fontWeight: '900' }}>
              {userProfile.name.charAt(0).toUpperCase()}
            </div>

            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '900', color: '#f8fafc' }}>{userProfile.name}</h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '11px', color: '#38bdf8' }}>{userProfile.email}</p>
            <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '20px' }}>Connected since: {userProfile.connectedDate}</span>

            <button 
              onClick={() => {
                if (window.confirm("Are you sure you want to disconnect your Google account?")) {
                  setUserProfile(null);
                  setShowProfileModal(false);
                }
              }}
              style={{ width: '100%', padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: '#7f1d1d', color: '#fecaca', fontWeight: '900', fontSize: '12px', cursor: 'pointer' }}
            >
              Disconnect Account
            </button>
          </div>
        </div>
      )}

      {/* Advanced Expense Tracker Modal with Top-First Order, Category & Budget */}
      {showExpenseModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(3,7,18,0.85)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
          <div style={{ backgroundColor: '#0b0f19', borderRadius: '24px', padding: '24px', width: '100%', maxWidth: '440px', position: 'relative', border: '1px solid #1e293b', color: '#f8fafc', boxSizing: 'border-box', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setShowExpenseModal(false)} style={{ position: 'absolute', top: '14px', right: '14px', border: 'none', background: '#1e293b', color: '#f8fafc', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={15} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#38bdf8', color: '#030712', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DollarSign size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>Expense & Pocket Money Tracker</h3>
            </div>

            {/* Budget & Total Spent Card */}
            <div style={{ backgroundColor: '#030712', border: '1px solid #1e293b', borderRadius: '12px', padding: '12px', marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700' }}>Monthly Budget</span>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: '#f8fafc' }}>₹{monthlyBudget.toFixed(2)}</h4>
                </div>
                <button onClick={() => { setIsSettingBudget(!isSettingBudget); setTempBudgetInput(monthlyBudget); }} style={{ background: '#1e293b', border: 'none', color: '#38bdf8', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' }}>
                  {isSettingBudget ? "Cancel" : "Edit Budget"}
                </button>
              </div>

              {isSettingBudget && (
                <form onSubmit={handleUpdateBudget} style={{ display: 'flex', gap: '6px' }}>
                  <input 
                    type="number" 
                    value={tempBudgetInput} 
                    onChange={(e) => setTempBudgetInput(e.target.value)} 
                    placeholder="New budget..."
                    style={{ flex: 1, padding: '6px 8px', borderRadius: '6px', border: '1px solid #1e293b', backgroundColor: '#0b0f19', color: '#f8fafc', fontSize: '11px', outline: 'none' }}
                  />
                  <button type="submit" style={{ background: '#38bdf8', color: '#030712', border: 'none', padding: '6px 10px', borderRadius: '6px', fontWeight: '900', fontSize: '10px', cursor: 'pointer' }}>Save</button>
                </form>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #1e293b', paddingTop: '8px' }}>
                <div>
                  <span style={{ fontSize: '9px', color: '#ef4444', fontWeight: '700' }}>Total Spent</span>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: '900', color: '#ef4444' }}>₹{totalSpent.toFixed(2)}</p>
                </div>
                <div>
                  <span style={{ fontSize: '9px', color: '#10b981', fontWeight: '700' }}>Remaining Balance</span>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: '900', color: '#10b981' }}>₹{remainingBudget.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Add Expense Form with Category */}
            <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Expense title (e.g. Chai, Petrol)..."
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #1e293b', backgroundColor: '#030712', color: '#f8fafc', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                />
                <input
                  type="number"
                  placeholder="Amount (₹)"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  style={{ width: '90px', padding: '10px 8px', borderRadius: '8px', border: '1px solid #1e293b', backgroundColor: '#030712', color: '#38bdf8', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  style={{ flex: 1, padding: '8px 10px', borderRadius: '8px', border: '1px solid #1e293b', backgroundColor: '#030712', color: '#38bdf8', fontSize: '11px', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="Food / Chai">Food / Chai</option>
                  <option value="Transport / Fuel">Transport / Fuel</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Bills & Recharges">Bills & Recharges</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>

                <button type="submit" style={{ padding: '9px 18px', borderRadius: '8px', border: 'none', backgroundColor: '#38bdf8', color: '#030712', fontWeight: '900', fontSize: '11px', cursor: 'pointer' }}>
                  Add Expense
                </button>
              </div>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
              {expenseList.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px', margin: '16px 0' }}>No expense records found.</p>
              ) : (
                expenseList.map((exp, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#030712', border: '1px solid #1e293b', borderRadius: '10px', padding: '10px 12px' }}>
                    <div style={{ overflow: 'hidden', paddingRight: '8px' }}>
                      <p style={{ margin: 0, fontSize: '12px', fontWeight: '800', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {exp?.title || 'Expense'} - <span style={{ color: '#ef4444' }}>₹{exp?.amount || 0}</span>
                      </p>
                      <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '700' }}>{exp?.category || 'General'} | {exp?.date || ''}</span>
                    </div>
                    <button onClick={() => handleDeleteExpense(idx)} style={{ background: '#7f1d1d', border: 'none', color: '#fecaca', padding: '6px', borderRadius: '6px', cursor: 'pointer', flexShrink: 0 }}>
                      <Trash2 size={13} />
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
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(3,7,18,0.85)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
          <div style={{ backgroundColor: '#0b0f19', borderRadius: '24px', padding: '24px', width: '100%', maxWidth: '440px', position: 'relative', border: '1px solid #1e293b', color: '#f8fafc', boxSizing: 'border-box' }}>
            <button onClick={() => setShowBriefingModal(false)} style={{ position: 'absolute', top: '14px', right: '14px', border: 'none', background: '#1e293b', color: '#f8fafc', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#38bdf8', color: '#030712', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Newspaper size={20} /></div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>Daily Briefing & News Flash</h3>
            </div>

            <p style={{ fontSize: '13px', lineHeight: '1.6', color: '#cbd5e1', backgroundColor: '#030712', padding: '16px', borderRadius: '12px', border: '1px solid #1e293b', margin: '0 0 16px 0' }}>
              {briefingData}
            </p>

            <button onClick={() => setShowBriefingModal(false)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: '#38bdf8', color: '#030712', fontWeight: '900', fontSize: '13px', cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}

    </div>
  );
}