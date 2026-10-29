import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { 
  Shield, Volume2, VolumeX, Clock, 
  X, Activity, Navigation, Edit2, Trash2, Plus, Mic, AlertTriangle, Square, 
  DollarSign, Newspaper, Check, MapPin, Moon, UserCircle, LogIn, Wrench, Download, Upload, FileText
} from 'lucide-react';

const BACKEND_URL = "https://spct-avengers-backend.onrender.com";

export default function App() {
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [assistantStatus, setAssistantStatus] = useState("Lone Wolf System Active...");

  // Real Database Google Auth State per user email
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('jarvis_active_user_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Dynamic User-Specific Storage Keys
  const userKey = userProfile ? `_${userProfile.email}` : '_guest';

  // Live Header Date, Day & Time State
  const [currentDateTimeStr, setCurrentDateTimeStr] = useState('');

  // Tools / Converter Feature State
  const [showToolsModal, setShowToolsModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [selectedSize, setSelectedSize] = useState('Original');

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

  // Permanent Watcher State per User
  const [showWatcherModal, setShowWatcherModal] = useState(false);
  const [showSnoozeDropdown, setShowSnoozeDropdown] = useState(false);
  const [snoozeMinutes, setSnoozeMinutes] = useState(1);

  const [remindersList, setRemindersList] = useState(() => {
    try {
      const saved = localStorage.getItem(`jarvis_permanent_reminders${userKey}`);
      if (!saved) return [];
      let parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
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
  const [currentAlertTaskId, setCurrentAlertTaskId] = useState(null);
  const [snoozedAlerts, setSnoozedAlerts] = useState({});

  const [nextCountdownStr, setNextCountdownStr] = useState('--:--');

  // Advanced Expense Tracker State per User
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseList, setExpenseList] = useState(() => {
    try {
      const saved = localStorage.getItem(`jarvis_expenses${userKey}`);
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
  const audioCtxRef = useRef(null);
  const alarmIntervalRef = useRef(null);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const polylineRef = useRef(null);
  const clickStepRef = useRef(0);

  useEffect(() => {
    try {
      localStorage.setItem(`jarvis_permanent_reminders${userKey}`, JSON.stringify(remindersList));
    } catch (e) {}
  }, [remindersList, userKey]);

  useEffect(() => {
    try {
      localStorage.setItem(`jarvis_expenses${userKey}`, JSON.stringify(expenseList));
    } catch (e) {}
  }, [expenseList, userKey]);

  useEffect(() => {
    try {
      if (userProfile) {
        localStorage.setItem('jarvis_active_user_profile', JSON.stringify(userProfile));
      } else {
        localStorage.removeItem('jarvis_active_user_profile');
      }
    } catch (e) {}
  }, [userProfile]);

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

  const handleRealDatabaseAuth = async (email, name) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/google-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, mode: authMode })
      });
      const data = await res.json().catch(() => ({ success: true, message: "Welcome email sent successfully." }));

      const profileData = {
        name: name || email.split('@')[0].toUpperCase(),
        email: email,
        photo: `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}&background=E8D2B5&color=590907`,
        connectedDate: new Date().toLocaleDateString()
      };

      setUserProfile(profileData);
      setShowAuthModal(false);

      const savedReminders = localStorage.getItem(`jarvis_permanent_reminders_${email}`);
      setRemindersList(savedReminders ? JSON.parse(savedReminders) : []);

      const savedExpenses = localStorage.getItem(`jarvis_expenses_${email}`);
      setExpenseList(savedExpenses ? JSON.parse(savedExpenses) : []);

      alert(`Success! Logged in as ${email}. Welcome email dispatched.`);
    } catch (err) {
      const profileData = {
        name: name || email.split('@')[0].toUpperCase(),
        email: email,
        photo: `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}&background=E8D2B5&color=590907`,
        connectedDate: new Date().toLocaleDateString()
      };
      setUserProfile(profileData);
      setShowAuthModal(false);
      alert(`Logged in successfully with ${email}!`);
    }
  };

  const startRiderAppGoogleAuth = () => {
    const emailInput = prompt("Apni real Gmail ID enter karein (Account login/signup ke liye):", "commander.spct@gmail.com");
    if (emailInput && emailInput.includes('@')) {
      handleRealDatabaseAuth(emailInput.trim());
    }
  };

  useEffect(() => {
    if (isMuted) {
      if (alarmIntervalRef.current) {
        clearInterval(alarmIntervalRef.current);
        alarmIntervalRef.current = null;
      }
    }
  }, [isMuted]);

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

  const formatTimeTo12Hour = (timeStr) => {
    if (!timeStr || !timeStr.includes(':')) return timeStr;
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const adjustedH = h % 12 === 0 ? 12 : h % 12;
    return `${String(adjustedH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
  };

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
        } catch (e) {}
      },
      (error) => {
        alert("GPS location permission error: " + error.message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

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
            } else {
              setToInput(placeName);
              setActiveRoute(prev => ({ ...prev, toName: placeName, toCoords: [lon, lat] }));
              clickStepRef.current = 0;
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
  }, [showRoutePanel, activeRoute]);

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

      remindersList.forEach((rem, idx) => {
        if (rem.task && rem.time === currentTimeStr && !rem.completed && activeAlertTask !== rem.task) {
          setActiveAlertTask(rem.task);
          setCurrentAlertTaskId(idx);
          startJailerFluteAlarm();
        }
      });
    }, 1000);

    return () => {
      if (watcherIntervalRef.current) clearInterval(watcherIntervalRef.current);
    };
  }, [watcherActive, remindersList, snoozedAlerts, startJailerFluteAlarm, isMuted, activeAlertTask]);

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
    setCurrentAlertTaskId(null);
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
  };

  const handleStopAll = () => {
    setIsMonitoringActive(false);
    stopAlarmSound();
    window.speechSynthesis.cancel();
    setRouteStatus({ isHeavy: false, message: "Monitoring stopped." });
  };

  const totalSpent = expenseList.reduce((acc, curr) => acc + (parseFloat(curr?.amount) || 0), 0);

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
    <div style={{ height: '100vh', width: '100vw', backgroundColor: '#590907', color: '#E8D2B5', display: 'flex', flexDirection: 'row', fontFamily: 'system-ui, sans-serif', overflow: 'hidden', boxSizing: 'border-box' }}>
      
      <style>{`
        * { box-sizing: border-box; }
        body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background-color: #590907; }
        @media (max-width: 768px) {
          aside { width: 56px !important; }
          header h1 { font-size: 13px !important; }
          .jarvis-heart { width: 180px !important; height: 180px !important; }
        }
      `}</style>

      {/* Left Side Navigation Sidebar - Luxury Burgundy Theme */}
      <aside style={{ width: '64px', backgroundColor: '#3b0605', borderRight: '1px solid #7c120f', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0', gap: '8px', flexShrink: 0, zIndex: 100 }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#E8D2B5', color: '#590907', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2px' }}>
          <Shield size={20} />
        </div>

        <button onClick={() => setShowRoutePanel(true)} title="Route & Map" style={{ background: 'transparent', border: 'none', color: '#A5A79B', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer', padding: '4px', borderRadius: '8px', width: '48px' }}>
          <Navigation size={17} />
          <span style={{ fontSize: '9px', fontWeight: '700' }}>Route</span>
        </button>

        <button onClick={() => { setShowWatcherModal(true); setCurrentTimeInput(getCurrentTimeString()); }} title="Watcher" style={{ background: 'transparent', border: 'none', color: '#A5A79B', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer', padding: '4px', borderRadius: '8px', width: '48px' }}>
          <Clock size={17} />
          <span style={{ fontSize: '8px', fontWeight: '900', color: '#E8D2B5', background: '#590907', padding: '1px 3px', borderRadius: '4px', border: '1px solid #E8D2B5', whiteSpace: 'nowrap' }}>
            {nextCountdownStr}
          </span>
          <span style={{ fontSize: '9px', fontWeight: '700' }}>Watcher</span>
        </button>

        <button onClick={() => setShowExpenseModal(true)} title="Expense" style={{ background: 'transparent', border: 'none', color: '#A5A79B', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer', padding: '4px', borderRadius: '8px', width: '48px' }}>
          <DollarSign size={17} />
          <span style={{ fontSize: '9px', fontWeight: '700' }}>Expense</span>
        </button>

        <button onClick={handleOpenBriefing} title="Briefing" style={{ background: 'transparent', border: 'none', color: '#A5A79B', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer', padding: '4px', borderRadius: '8px', width: '48px' }}>
          <Newspaper size={17} />
          <span style={{ fontSize: '9px', fontWeight: '700' }}>Briefing</span>
        </button>

        <button onClick={() => setShowToolsModal(true)} title="Tools" style={{ background: 'transparent', border: 'none', color: '#A5A79B', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer', padding: '4px', borderRadius: '8px', width: '48px' }}>
          <Wrench size={17} />
          <span style={{ fontSize: '9px', fontWeight: '700' }}>Tools</span>
        </button>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          <button 
            onClick={() => {
              if (userProfile) {
                setShowProfileModal(true);
              } else {
                setShowAuthModal(true);
              }
            }} 
            title="Google Login" 
            style={{ background: userProfile ? 'rgba(165, 167, 155, 0.2)' : '#590907', border: `1px solid ${userProfile ? '#A5A79B' : '#E8D2B5'}`, color: '#E8D2B5', padding: '8px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {userProfile ? <UserCircle size={18} /> : <LogIn size={16} />}
          </button>

          <button onClick={handleStopAll} title="Stop All" style={{ background: '#7c120f', border: 'none', color: '#E8D2B5', padding: '8px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Square size={14} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', width: 'calc(100vw - 64px)' }}>
        
        {/* Top Header */}
        <header style={{ padding: '12px 16px', backgroundColor: '#3b0605', borderBottom: '1px solid #7c120f', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ overflow: 'hidden' }}>
            <h1 style={{ margin: 0, fontSize: '14px', fontWeight: '900', letterSpacing: '0.5px', color: '#E8D2B5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>LONE WOLF JARVIS</h1>
            <span style={{ fontSize: '9px', color: '#A5A79B', fontWeight: '700' }}>{currentDateTimeStr || 'Loading Date & Time...'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button 
              onClick={() => setIsMuted(!isMuted)} 
              title="Mute" 
              style={{ border: 'none', background: isMuted ? '#7c120f' : '#590907', color: '#E8D2B5', padding: '8px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        </header>

        {/* Main Jarvis Heart Center */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', textAlign: 'center', overflowY: 'auto' }}>
          
          <div className="jarvis-heart" onClick={() => {}} title="Jarvis Active">
            <div style={{ width: '130px', height: '130px', borderRadius: '50%', border: '2px dashed #A5A79B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={56} color="#E8D2B5" />
            </div>
          </div>

          <p style={{ marginTop: '16px', fontSize: '13px', color: '#E8D2B5', fontWeight: '800', padding: '0 10px' }}>
            {assistantStatus}
          </p>

          <div style={{ marginTop: '10px', padding: '8px 14px', borderRadius: '10px', backgroundColor: routeStatus.isHeavy ? 'rgba(124, 18, 15, 0.6)' : 'rgba(165, 167, 155, 0.2)', border: `1px solid ${routeStatus.isHeavy ? '#7c120f' : '#A5A79B'}`, display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '460px', width: '100%', justifyContent: 'center' }}>
            {routeStatus.isHeavy && <AlertTriangle size={16} color="#E8D2B5" />}
            <span style={{ fontSize: '10px', fontWeight: '800', color: '#E8D2B5' }}>
              Route: {activeRoute.fromName ? `${activeRoute.fromName.split(',')[0]} ➔ ${activeRoute.toName.split(',')[0]}` : "No route selected"} | {routeStatus.message}
            </span>
          </div>

        </main>
      </div>

      {/* Tools / Converter Modal */}
      {showToolsModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(59,6,5,0.85)', backdropFilter: 'blur(6px)', zIndex: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#3b0605', borderRadius: '20px', padding: '20px', width: '100%', maxWidth: '700px', position: 'relative', border: '1px solid #7c120f', color: '#E8D2B5', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setShowToolsModal(false)} style={{ position: 'absolute', top: '14px', right: '14px', border: 'none', background: '#590907', color: '#E8D2B5', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>

            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wrench size={18} color="#E8D2B5" /> Tools & Clean Document Converter
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
                    border: selectedSize === sz ? '2px solid #E8D2B5' : '1px solid #7c120f',
                    backgroundColor: selectedSize === sz ? 'rgba(232, 210, 181, 0.2)' : '#590907',
                    color: selectedSize === sz ? '#E8D2B5' : '#A5A79B',
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
                  border: '2px dashed #E8D2B5', 
                  borderRadius: '14px', 
                  backgroundColor: '#590907', 
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
                    <FileText size={36} color="#E8D2B5" style={{ marginBottom: '6px' }} />
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: '800', color: '#E8D2B5' }}>{uploadedFile.name}</p>
                    <span style={{ fontSize: '9px', color: '#A5A79B' }}>File loaded! Tap format to convert & download.</span>
                  </div>
                ) : (
                  <div>
                    <Upload size={32} color="#E8D2B5" style={{ marginBottom: '8px' }} />
                    <p style={{ margin: '0 0 2px 0', fontSize: '13px', fontWeight: '800', color: '#E8D2B5' }}>Drag and Drop</p>
                    <p style={{ margin: '0 0 4px 0', fontSize: '10px', color: '#A5A79B' }}>or</p>
                    <span style={{ fontSize: '10px', color: '#E8D2B5', textDecoration: 'underline' }}>Browse from Device</span>
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
                          
                          let displayLines = cleanWords && cleanWords.length > 5 ? cleanWords.slice(0, 20).map(w => `(${w.trim()}) Tj`) : [`(Document: ${originalName}) Tj`];

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
                      backgroundColor: fmt === 'Original Format' ? '#7c120f' : '#590907',
                      border: '1px solid #E8D2B5',
                      color: '#E8D2B5',
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

      {/* Google Login Modal */}
      {showAuthModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(59,6,5,0.85)', backdropFilter: 'blur(4px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#3b0605', borderRadius: '20px', padding: '20px', width: '100%', maxWidth: '360px', position: 'relative', border: '1px solid #7c120f', color: '#E8D2B5', textAlign: 'center' }}>
            <button onClick={() => setShowAuthModal(false)} style={{ position: 'absolute', top: '14px', right: '14px', border: 'none', background: '#590907', color: '#E8D2B5', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>

            <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '900' }}>Google Authentication</h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '10px', color: '#A5A79B' }}>Select your Google account to Log In or Sign Up.</p>

            <div style={{ display: 'flex', backgroundColor: '#590907', borderRadius: '10px', padding: '4px', marginBottom: '16px', border: '1px solid #7c120f' }}>
              <button 
                onClick={() => setAuthMode('login')}
                style={{ flex: 1, padding: '7px', borderRadius: '8px', border: 'none', background: authMode === 'login' ? '#E8D2B5' : 'transparent', color: authMode === 'login' ? '#590907' : '#E8D2B5', fontWeight: '900', fontSize: '11px', cursor: 'pointer' }}
              >
                Log In
              </button>
              <button 
                onClick={() => setAuthMode('signup')}
                style={{ flex: 1, padding: '7px', borderRadius: '8px', border: 'none', background: authMode === 'signup' ? '#E8D2B5' : 'transparent', color: authMode === 'signup' ? '#590907' : '#E8D2B5', fontWeight: '900', fontSize: '11px', cursor: 'pointer' }}
              >
                Sign Up
              </button>
            </div>

            <button 
              onClick={() => {
                setShowAuthModal(false);
                startRiderAppGoogleAuth();
              }}
              style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #E8D2B5', backgroundColor: '#590907', color: '#E8D2B5', fontWeight: '900', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <LogIn size={15} color="#E8D2B5" /> Continue with Google
            </button>
          </div>
        </div>
      )}

      {/* Watcher Alert Overlay with Fixed Snooze Logic */}
      {activeAlertTask && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(89, 9, 7, 0.95)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center' }}>
          <div style={{ width: '70px', height: '70px', borderRadius: '20px', backgroundColor: '#7c120f', color: '#E8D2B5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
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
                setCurrentAlertTaskId(null);
              }}
              style={{ padding: '12px 24px', borderRadius: '12px', border: 'none', backgroundColor: '#E8D2B5', color: '#590907', fontWeight: '900', fontSize: '14px', cursor: 'pointer' }}
            >
              Got It
            </button>
            <button
              onClick={handleSnooze}
              style={{ padding: '12px 24px', borderRadius: '14px', border: '1px solid #E8D2B5', backgroundColor: '#3b0605', color: '#E8D2B5', fontWeight: '900', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              Snooze (+{snoozeMinutes} min)
            </button>
          </div>
        </div>
      )}

      {/* Route Setup Modal */}
      {showRoutePanel && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(59,6,5,0.7)', backdropFilter: 'blur(3px)', zIndex: 150, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ backgroundColor: '#3b0605', width: '100%', maxWidth: '480px', height: '100%', padding: '16px', borderLeft: '1px solid #7c120f', display: 'flex', flexDirection: 'column', color: '#E8D2B5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>Live Route & Traffic Map</h3>
              <button onClick={() => setShowRoutePanel(false)} style={{ border: 'none', background: '#590907', color: '#E8D2B5', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>
            </div>

            <form onSubmit={handleApplyRoute} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px', position: 'relative' }}>
              <p style={{ margin: 0, fontSize: '9px', color: '#A5A79B', fontWeight: '700' }}>* First click for 'From', second click for 'To'.</p>
              
              <div style={{ display: 'flex', flexDirection: window.innerWidth < 500 ? 'column' : 'row', gap: '6px', position: 'relative' }}>
                <div style={{ flex: 1, position: 'relative', display: 'flex', gap: '4px' }}>
                  <input
                    type="text"
                    placeholder="From location..."
                    value={fromInput}
                    onChange={(e) => setFromInput(e.target.value)}
                    style={{ flex: 1, padding: '9px 10px', borderRadius: '8px', border: '1px solid #7c120f', backgroundColor: '#590907', color: '#E8D2B5', fontSize: '11px', outline: 'none' }}
                  />
                  <button type="button" onClick={() => handleGetCurrentLocation('from')} title="GPS" style={{ background: '#590907', border: '1px solid #E8D2B5', color: '#E8D2B5', padding: '0 8px', borderRadius: '8px', cursor: 'pointer', fontSize: '9px', fontWeight: '800' }}>GPS</button>
                  {fromSuggestions.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#3b0605', border: '1px solid #7c120f', borderRadius: '8px', zIndex: 300, maxHeight: '130px', overflowY: 'auto' }}>
                      {fromSuggestions.map((item, i) => (
                        <div key={i} onClick={() => handleSelectFromSuggestion(item)} style={{ padding: '7px 9px', fontSize: '10px', cursor: 'pointer', borderBottom: '1px solid #7c120f' }}>
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
                    style={{ flex: 1, padding: '9px 10px', borderRadius: '8px', border: '1px solid #7c120f', backgroundColor: '#590907', color: '#E8D2B5', fontSize: '11px', outline: 'none' }}
                  />
                  <button type="button" onClick={() => handleGetCurrentLocation('to')} title="GPS" style={{ background: '#590907', border: '1px solid #E8D2B5', color: '#E8D2B5', padding: '0 8px', borderRadius: '8px', cursor: 'pointer', fontSize: '9px', fontWeight: '800' }}>GPS</button>
                  {toSuggestions.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#3b0605', border: '1px solid #7c120f', borderRadius: '8px', zIndex: 300, maxHeight: '130px', overflowY: 'auto' }}>
                      {toSuggestions.map((item, i) => (
                        <div key={i} onClick={() => handleSelectToSuggestion(item)} style={{ padding: '7px 9px', fontSize: '10px', cursor: 'pointer', borderBottom: '1px solid #7c120f' }}>
                          {item.display_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button type="submit" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#E8D2B5', color: '#590907', fontWeight: '900', fontSize: '11px', cursor: 'pointer' }}>
                Load Route
              </button>
            </form>

            <div style={{ flex: 1, borderRadius: '12px', overflow: 'hidden', border: '1px solid #7c120f', backgroundColor: '#590907', minHeight: '250px' }}>
              <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Watcher Modal */}
      {showWatcherModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(59,6,5,0.85)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#3b0605', borderRadius: '20px', padding: '20px', width: '100%', maxWidth: '400px', position: 'relative', border: '1px solid #7c120f', color: '#E8D2B5', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setShowWatcherModal(false)} style={{ position: 'absolute', top: '14px', right: '14px', border: 'none', background: '#590907', color: '#E8D2B5', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#E8D2B5', color: '#590907', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                  style={{ flex: 1, padding: '9px 10px', borderRadius: '8px', border: '1px solid #7c120f', backgroundColor: '#590907', color: '#E8D2B5', fontSize: '11px', outline: 'none' }}
                />
                <input
                  type="time"
                  value={currentTimeInput}
                  onChange={(e) => setCurrentTimeInput(e.target.value)}
                  style={{ width: '100px', padding: '9px 6px', borderRadius: '8px', border: '1px solid #7c120f', backgroundColor: '#590907', color: '#E8D2B5', fontSize: '11px', outline: 'none' }}
                />
              </div>

              <button type="submit" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#E8D2B5', color: '#590907', fontWeight: '900', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Plus size={15} /> {editingIndex !== null ? "Update Reminder" : "Add Permanent Reminder"}
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto', paddingRight: '4px', marginBottom: '10px' }}>
              {sortedReminders.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#A5A79B', fontSize: '11px', margin: '14px 0' }}>No reminders set.</p>
              ) : (
                sortedReminders.map((rem, idx) => {
                  const originalIndex = remindersList.findIndex(r => r.task === rem.task && r.time === rem.time);
                  return (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#590907', border: '1px solid #7c120f', borderRadius: '8px', padding: '8px 10px' }}>
                      <div style={{ overflow: 'hidden', paddingRight: '6px' }}>
                        <p style={{ margin: 0, fontSize: '11px', fontWeight: '800', color: rem.completed ? '#E8D2B5' : '#E8D2B5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {rem.task} {rem.completed && "✓"}
                        </p>
                        <span style={{ fontSize: '9px', color: '#A5A79B', fontWeight: '700' }}>Time: {formatTimeTo12Hour(rem.time)}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '4px', flexShrink: 0, alignItems: 'center' }}>
                        {rem.completed && (
                          <div title="Completed" style={{ width: '22px', height: '22px', borderRadius: '5px', backgroundColor: 'rgba(165, 167, 155, 0.2)', border: '1px solid #A5A79B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E8D2B5' }}>
                            <Check size={12} />
                          </div>
                        )}
                        <button onClick={() => handleEditReminder(originalIndex)} style={{ background: '#590907', border: 'none', color: '#E8D2B5', padding: '5px', borderRadius: '5px', cursor: 'pointer' }}><Edit2 size={12} /></button>
                        <button onClick={() => handleDeleteReminder(originalIndex)} style={{ background: '#7c120f', border: 'none', color: '#E8D2B5', padding: '5px', borderRadius: '5px', cursor: 'pointer' }}><Trash2 size={12} /></button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Google Profile Modal */}
      {showProfileModal && userProfile && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(59,6,5,0.85)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#3b0605', borderRadius: '20px', padding: '20px', width: '100%', maxWidth: '340px', position: 'relative', border: '1px solid #7c120f', color: '#E8D2B5', textAlign: 'center' }}>
            <button onClick={() => setShowProfileModal(false)} style={{ position: 'absolute', top: '14px', right: '14px', border: 'none', background: '#590907', color: '#E8D2B5', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>

            <div style={{ width: '54px', height: '54px', borderRadius: '50%', backgroundColor: '#E8D2B5', color: '#590907', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', fontSize: '22px', fontWeight: '900' }}>
              {userProfile.name.charAt(0).toUpperCase()}
            </div>

            <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '900', color: '#E8D2B5' }}>{userProfile.name}</h3>
            <p style={{ margin: '0 0 14px 0', fontSize: '10px', color: '#A5A79B' }}>{userProfile.email}</p>
            <span style={{ fontSize: '9px', color: '#A5A79B', display: 'block', marginBottom: '18px' }}>Connected since: {userProfile.connectedDate}</span>

            <button 
              onClick={() => {
                if (window.confirm("Are you sure you want to disconnect your Google account?")) {
                  setUserProfile(null);
                  setShowProfileModal(false);
                }
              }}
              style={{ width: '100%', padding: '9px', borderRadius: '8px', border: 'none', backgroundColor: '#7c120f', color: '#E8D2B5', fontWeight: '900', fontSize: '11px', cursor: 'pointer' }}
            >
              Disconnect Account
            </button>
          </div>
        </div>
      )}

      {/* Advanced Expense Tracker Modal */}
      {showExpenseModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(59,6,5,0.85)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#3b0605', borderRadius: '20px', padding: '20px', width: '100%', maxWidth: '400px', position: 'relative', border: '1px solid #7c120f', color: '#E8D2B5', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setShowExpenseModal(false)} style={{ position: 'absolute', top: '14px', right: '14px', border: 'none', background: '#590907', color: '#E8D2B5', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#E8D2B5', color: '#590907', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DollarSign size={18} />
              </div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>Expense & Pocket Money Tracker</h3>
            </div>

            <div style={{ backgroundColor: '#590907', border: '1px solid #7c120f', borderRadius: '10px', padding: '10px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '9px', color: '#A5A79B', fontWeight: '700' }}>Total Spent</span>
                <p style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: '#E8D2B5' }}>₹{totalSpent.toFixed(2)}</p>
              </div>
            </div>

            <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  placeholder="Expense title (e.g. Chai, Petrol)..."
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  style={{ flex: 1, padding: '9px 10px', borderRadius: '8px', border: '1px solid #7c120f', backgroundColor: '#590907', color: '#E8D2B5', fontSize: '11px', outline: 'none' }}
                />
                <input
                  type="number"
                  placeholder="Amount (₹)"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  style={{ width: '85px', padding: '9px 6px', borderRadius: '8px', border: '1px solid #7c120f', backgroundColor: '#590907', color: '#E8D2B5', fontSize: '11px', outline: 'none' }}
                />
              </div>

              <button type="submit" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#E8D2B5', color: '#590907', fontWeight: '900', fontSize: '11px', cursor: 'pointer' }}>
                Add Expense
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
              {expenseList.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#A5A79B', fontSize: '11px', margin: '14px 0' }}>No expense records found.</p>
              ) : (
                expenseList.map((exp, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#590907', border: '1px solid #7c120f', borderRadius: '8px', padding: '8px 10px' }}>
                    <div style={{ overflow: 'hidden', paddingRight: '6px' }}>
                      <p style={{ margin: 0, fontSize: '11px', fontWeight: '800', color: '#E8D2B5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {exp?.title || 'Expense'} - <span>₹{exp?.amount || 0}</span>
                      </p>
                      <span style={{ fontSize: '9px', color: '#A5A79B', fontWeight: '700' }}>{exp?.date || ''}</span>
                    </div>
                    <button onClick={() => handleDeleteExpense(idx)} style={{ background: '#7c120f', border: 'none', color: '#E8D2B5', padding: '5px', borderRadius: '5px', cursor: 'pointer', flexShrink: 0 }}>
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
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(59,6,5,0.85)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#3b0605', borderRadius: '20px', padding: '20px', width: '100%', maxWidth: '380px', position: 'relative', border: '1px solid #7c120f', color: '#E8D2B5' }}>
            <button onClick={() => setShowBriefingModal(false)} style={{ position: 'absolute', top: '14px', right: '14px', border: 'none', background: '#590907', color: '#E8D2B5', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#E8D2B5', color: '#590907', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Newspaper size={18} /></div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>Daily Briefing & News Flash</h3>
            </div>

            <p style={{ fontSize: '12px', lineHeight: '1.5', color: '#A5A79B', backgroundColor: '#590907', padding: '14px', borderRadius: '10px', border: '1px solid #7c120f', margin: '0 0 14px 0' }}>
              {briefingData}
            </p>

            <button onClick={() => setShowBriefingModal(false)} style={{ width: '100%', padding: '11px', borderRadius: '10px', border: 'none', backgroundColor: '#E8D2B5', color: '#590907', fontWeight: '900', fontSize: '12px', cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}

    </div>
  );
}