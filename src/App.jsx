import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { 
  Shield, Volume2, VolumeX, Clock, 
  X, Activity, Navigation, Edit2, Trash2, Plus, Mic, AlertTriangle, Square, 
  DollarSign, Newspaper, Check, MapPin, BellRing, PieChart
} from 'lucide-react';

const BACKEND_URL = "https://spct-avengers-backend.onrender.com";

export default function App() {
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [assistantStatus, setAssistantStatus] = useState("Lone Wolf Sakriya Hai (Sun raha hu...)");

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
  const [routeStatus, setRouteStatus] = useState({ isHeavy: false, message: "Kripya 'From' aur 'To' select karein." });
  const [isMonitoringActive, setIsMonitoringActive] = useState(false);

  // Permanent Watcher State
  const [showWatcherModal, setShowWatcherModal] = useState(false);
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
      const saved = localStorage.getItem('jarvis_permanent_reminders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [currentTaskInput, setCurrentTaskInput] = useState('');
  const [currentTimeInput, setCurrentTimeInput] = useState('09:00');
  const [editingIndex, setEditingIndex] = useState(null);
  const [watcherActive, setWatcherActive] = useState(true);
  const [activeAlertTask, setActiveAlertTask] = useState(null);
  const [currentAlertTaskId, setCurrentAlertTaskId] = useState(null);

  // Advanced Expense & Pocket Money Tracker State
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
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Food / Chai');
  const [isSettingBudget, setIsSettingBudget] = useState(false);
  const [tempBudgetInput, setTempBudgetInput] = useState(monthlyBudget);

  // Daily Briefing State
  const [showBriefingModal, setShowBriefingModal] = useState(false);
  const [briefingData, setBriefingData] = useState("Briefing load ki ja rahi hai...");

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

  // Master Mute Handler
  useEffect(() => {
    if (isMuted) {
      window.speechSynthesis.cancel();
      if (alarmIntervalRef.current) {
        clearInterval(alarmIntervalRef.current);
        alarmIntervalRef.current = null;
      }
    }
  }, [isMuted]);

  // Jailer Flute BGM Alarm Sound
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
        if (ctx.state === 'suspended') ctx.resume();

        const notes = [587.33, 659.25, 783.99, 880.00, 783.99, 659.25];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.18);
          
          gain.gain.setValueAtTime(0.25, ctx.currentTime + idx * 0.18);
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

  // Ultra-Accurate HTML5 GPS Geolocation
  const handleGetCurrentLocation = (targetField) => {
    if (!navigator.geolocation) {
      alert("Aapka browser Geolocation support nahi karta.");
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
          speakText("Current GPS location set ho gayi hai.");
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
                  setRouteStatus({ isHeavy: true, message: `RED ALERT: Bhari traffic! (${durationMin} min)` });
                } else {
                  setRouteStatus({ isHeavy: false, message: `Rasta saaf hai. (${durationMin} min)` });
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
              speakText("From location select ho gayi hai. Ab map par To location par click karein.");
            } else {
              setToInput(placeName);
              setActiveRoute(prev => ({ ...prev, toName: placeName, toCoords: [lon, lat] }));
              clickStepRef.current = 0;
              speakText("To location select ho gayi hai. Route load ho raha hai.");
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
  }, [showRoutePanel, activeRoute, speakText]);

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
    let reply = "Maaf kijiye Commander, main samajh nahi paya.";

    setAssistantStatus(`Aadesh mila: "${query}"`);

    if (lowerQ.includes('taapman') || lowerQ.includes('temperature') || lowerQ.includes('mausam') || lowerQ.includes('weather')) {
      try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=23.0225&current_weather=true');
        const data = await res.json();
        if (data && data.current_weather) {
          const temp = data.current_weather.temperature;
          reply = `Commander, yahan ka vartaman taapman ${temp} degree Celsius hai.`;
        } else {
          reply = "Commander, taapman ka data prapt nahi ho paya.";
        }
      } catch (err) {
        reply = "Weather API se connection establish nahi ho paya.";
      }
    } else if (lowerQ.includes('kharcha') || lowerQ.includes('expense')) {
      const total = expenseList.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
      reply = `Commander, aapka kul kharcha abhi tak ${total} rupaye hai.`;
    } else if (lowerQ.includes('briefing') || lowerQ.includes('news') || lowerQ.includes('samachar')) {
      reply = "Commander, aaj ke sabhi systems nominal hain aur mausam bilkul thik hai.";
    } else if (lowerQ.includes('traffic') || lowerQ.includes('raste')) {
      if (!isMonitoringActive || !activeRoute.fromName) {
        reply = "Traffic monitoring abhi band hai.";
      } else if (routeStatus.isHeavy) {
        reply = `Boss, dhyan dein! ${activeRoute.fromName.split(',')[0]} se ${activeRoute.toName.split(',')[0]} par bhari traffic hai!`;
      } else {
        reply = `Commander, ${activeRoute.fromName.split(',')[0]} se ${activeRoute.toName.split(',')[0]} par rasta saaf hai.`;
      }
    } else if (lowerQ.includes('hello') || lowerQ.includes('namaste') || lowerQ.includes('lone wolf') || lowerQ.includes('jarvis')) {
      reply = "Namaste Commander! Main Lone Wolf hu. Sabhi systems sakriya hain.";
    } else {
      reply = `Aadesh sweekar kiya gaya: "${query}".`;
    }

    speakText(reply);
  }, [activeRoute, routeStatus, isMonitoringActive, expenseList, isMuted, speakText]);

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
      alert("Aapka browser Speech Recognition support nahi karta.");
      return;
    }
    try {
      window.speechSynthesis.cancel();
      recognitionRef.current.start();
      setIsListening(true);
      setAssistantStatus("Sun raha hu... Kripya bolein.");
    } catch (e) {
      setIsListening(false);
    }
  };

  // Watcher Time-Hit Checker
  useEffect(() => {
    if (!watcherActive || isMuted) return;

    if (watcherIntervalRef.current) clearInterval(watcherIntervalRef.current);

    watcherIntervalRef.current = setInterval(() => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${hours}:${minutes}`;

      if (triggeredMinuteRef.current === currentTimeStr) return;

      remindersList.forEach((rem, idx) => {
        if (rem.task && rem.time === currentTimeStr && !rem.completed) {
          triggeredMinuteRef.current = currentTimeStr;
          setActiveAlertTask(rem.task);
          setCurrentAlertTaskId(idx);
          startJailerFluteAlarm();
          
          if (Notification.permission === 'granted') {
            new Notification("Lone Wolf Watcher Alert", { body: rem.task, icon: "/logo.png" });
          }
        }
      });
    }, 3000);

    return () => {
      if (watcherIntervalRef.current) clearInterval(watcherIntervalRef.current);
    };
  }, [watcherActive, remindersList, startJailerFluteAlarm, isMuted]);

  // Handle Snooze
  const handleSnooze = () => {
    stopAlarmSound();
    if (currentAlertTaskId !== null && currentAlertTaskId >= 0) {
      const targetRem = remindersList[currentAlertTaskId];
      if (targetRem) {
        const [h, m] = targetRem.time.split(':').map(Number);
        const dateObj = new Date();
        dateObj.setHours(h);
        dateObj.setMinutes(m + snoozeMinutes);
        
        const newH = String(dateObj.getHours()).padStart(2, '0');
        const newM = String(dateObj.getMinutes()).padStart(2, '0');
        const newTimeStr = `${newH}:${newM}`;

        const updated = [...remindersList];
        updated[currentAlertTaskId].time = newTimeStr;
        setRemindersList(updated);
      }
    }
    setActiveAlertTask(null);
    setCurrentAlertTaskId(null);
    triggeredMinuteRef.current = '';
  };

  const handleAddOrUpdateReminder = (e) => {
    e.preventDefault();
    if (!currentTaskInput.trim()) {
      alert("Kripya reminder task darj karein.");
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
    setCurrentTimeInput('09:00');
  };

  const handleEditReminder = (index) => {
    setCurrentTaskInput(remindersList[index].task);
    setCurrentTimeInput(remindersList[index].time);
    setEditingIndex(index);
  };

  const handleDeleteReminder = (index) => {
    const taskName = remindersList[index].task;
    const confirmDelete = window.confirm(`Kya aap sach mein "${taskName}" reminder ko delete karna chahte hain? (Yes/No)`);
    if (confirmDelete) {
      setRemindersList(prev => prev.filter((_, idx) => idx !== index));
      if (editingIndex === index) {
        setEditingIndex(null);
        setCurrentTaskInput('');
      }
    }
  };

  // Advanced Expense Handlers with Strict Confirmation
  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!expenseTitle.trim() || !expenseAmount) {
      alert("Kripya title aur amount dono bharein.");
      return;
    }
    const newExp = {
      title: expenseTitle.trim(),
      amount: parseFloat(expenseAmount),
      category: expenseCategory,
      date: new Date().toLocaleDateString()
    };
    setExpenseList(prev => [...prev, newExp]);
    setExpenseTitle('');
    setExpenseAmount('');
    setExpenseCategory('Food / Chai');
  };

  const handleDeleteExpense = (index) => {
    const exp = expenseList[index];
    const confirmDelete = window.confirm(`Kya aap "${exp.title}" (₹${exp.amount}) expense record ko delete karna chahte hain? (Yes/No)`);
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
      speakText("Monthly pocket money budget update kar diya gaya hai.");
    }
  };

  const handleOpenBriefing = async () => {
    setShowBriefingModal(true);
    try {
      const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=23.0225&current_weather=true');
      const data = await res.json();
      const temp = data?.current_weather?.temperature || 'N/A';
      const wind = data?.current_weather?.windspeed || 'N/A';
      setBriefingData(`Suprabhat Commander! Aaj ka vartaman taapman ${temp}°C hai aur hawa ki raftaar ${wind} km/h hai. Financial systems active hain.`);
      speakText(`Suprabhat Commander! Aaj ka vartaman taapman ${temp} degree Celsius hai.`);
    } catch (e) {
      setBriefingData("Daily briefing data fetch karne mein samasya aayi.");
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
      alert("Kripya 'From' aur 'To' locations select karein.");
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
    setRouteStatus({ isHeavy: false, message: "Monitoring rok di gayi hai (Stopped)." });
    speakText("Sabhi monitoring aur traffic alerts rok diye gaye hain.");
  };

  // Calculate Total Expenses & Category Breakdown
  const totalSpent = expenseList.reduce((acc, curr) => acc + curr.amount, 0);
  const remainingBudget = monthlyBudget - totalSpent;

  const categoryTotals = expenseList.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {});

  return (
    <div style={{ height: '100vh', width: '100vw', backgroundColor: '#030712', color: '#38bdf8', display: 'flex', flexDirection: 'row', fontFamily: 'system-ui, sans-serif', overflow: 'hidden', boxSizing: 'border-box' }}>
      
      {/* Left Side Thin Navigation Sidebar */}
      <aside style={{ width: '64px', backgroundColor: '#0b0f19', borderRight: '1px solid #1e293b', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0', gap: '16px', flexShrink: 0, boxSizing: 'border-box' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#38bdf8', color: '#030712', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
          <Shield size={22} />
        </div>

        <button onClick={() => setShowRoutePanel(true)} title="Route & Naksha" style={{ background: 'transparent', border: 'none', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', padding: '8px', borderRadius: '8px', width: '48px' }}>
          <Navigation size={20} />
          <span style={{ fontSize: '9px', fontWeight: '700' }}>Route</span>
        </button>

        <button onClick={() => setShowWatcherModal(true)} title="Watcher Reminders" style={{ background: 'transparent', border: 'none', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', padding: '8px', borderRadius: '8px', width: '48px' }}>
          <Clock size={20} />
          <span style={{ fontSize: '9px', fontWeight: '700' }}>Watcher</span>
        </button>

        <button onClick={() => setShowExpenseModal(true)} title="Expense Tracker" style={{ background: 'transparent', border: 'none', color: '#38bdf8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', padding: '8px', borderRadius: '8px', width: '48px' }}>
          <DollarSign size={20} />
          <span style={{ fontSize: '9px', fontWeight: '700' }}>Expense</span>
        </button>

        <button onClick={handleOpenBriefing} title="Daily Briefing" style={{ background: 'transparent', border: 'none', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', padding: '8px', borderRadius: '8px', width: '48px' }}>
          <Newspaper size={20} />
          <span style={{ fontSize: '9px', fontWeight: '700' }}>Briefing</span>
        </button>

        <div style={{ marginTop: 'auto' }}>
          <button onClick={handleStopAll} title="Stop All" style={{ background: '#7f1d1d', border: 'none', color: '#fecaca', padding: '10px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Square size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', boxSizing: 'border-box' }}>
        
        {/* Top Header */}
        <header style={{ padding: '14px 20px', backgroundColor: '#0b0f19', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: '0', boxSizing: 'border-box' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '15px', fontWeight: '900', letterSpacing: '0.5px', color: '#f8fafc' }}>LONE WOLF JARVIS</h1>
            <span style={{ fontSize: '10px', color: '#38bdf8' }}>Advanced Expense & Pocket Money Hub Active</span>
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
              Route: {activeRoute.fromName ? `${activeRoute.fromName.split(',')[0]} ➔ ${activeRoute.toName.split(',')[0]}` : "Koi route set nahi hai"} | {routeStatus.message}
            </span>
          </div>

        </main>
      </div>

      {/* Full-Screen Watcher / Traffic Alert Overlay */}
      {activeAlertTask && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(3, 7, 18, 0.95)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', boxSizing: 'border-box', textAlign: 'center' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '24px', backgroundColor: '#dc2626', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', boxShadow: '0 0 40px rgba(220,38,38,0.8)' }}>
            <AlertTriangle size={40} />
          </div>
          <span style={{ fontSize: '12px', fontWeight: '950', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>
            Nirdharit Samay Ho Chuka Hai
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
                setCurrentAlertTaskId(null);
              }}
              style={{ padding: '14px 28px', borderRadius: '14px', border: 'none', backgroundColor: '#38bdf8', color: '#030712', fontWeight: '900', fontSize: '15px', cursor: 'pointer', boxShadow: '0 6px 20px rgba(56,189,248,0.5)' }}
            >
              Got It (Samajh Gaya)
            </button>
            <button
              onClick={handleSnooze}
              style={{ padding: '14px 28px', borderRadius: '14px', border: '1px solid #38bdf8', backgroundColor: '#1e293b', color: '#38bdf8', fontWeight: '900', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <BellRing size={18} /> Snooze (+{snoozeMinutes} min)
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
              <p style={{ margin: 0, fontSize: '10px', color: '#38bdf8', fontWeight: '700' }}>* Pehla click 'From' ke liye, doosra click 'To' ke liye hoga.</p>
              
              <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
                <div style={{ flex: 1, position: 'relative', display: 'flex', gap: '4px' }}>
                  <input
                    type="text"
                    placeholder="From (Kahan se)..."
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
                    placeholder="To (Kahan tak)..."
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
                Route Load Karein
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

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#030712', padding: '8px 12px', borderRadius: '10px', border: '1px solid #1e293b', marginBottom: '14px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8' }}>Snooze Duration:</span>
              <select 
                value={snoozeMinutes} 
                onChange={(e) => setSnoozeMinutes(Number(e.target.value))}
                style={{ background: '#1e293b', color: '#38bdf8', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', outline: 'none', cursor: 'pointer' }}
              >
                <option value={1}>1 Minute</option>
                <option value={5}>5 Minutes</option>
                <option value={10}>10 Minutes</option>
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
              </select>
            </div>

            <form onSubmit={handleAddOrUpdateReminder} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Task likhein..."
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
                <Plus size={16} /> {editingIndex !== null ? "Reminder Update Karein" : "Permanent Reminder Add Karein"}
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto', paddingRight: '4px' }}>
              {remindersList.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px', margin: '16px 0' }}>Koi reminder set nahi hai.</p>
              ) : (
                remindersList.map((rem, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#030712', border: '1px solid #1e293b', borderRadius: '10px', padding: '10px 12px' }}>
                    <div style={{ overflow: 'hidden', paddingRight: '8px' }}>
                      <p style={{ margin: 0, fontSize: '12px', fontWeight: '800', color: rem.completed ? '#6ee7b7' : '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {rem.task} {rem.completed && "✓"}
                      </p>
                      <span style={{ fontSize: '10px', color: '#38bdf8', fontWeight: '700' }}>Samay: {rem.time}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0, alignItems: 'center' }}>
                      {rem.completed && (
                        <div title="Task Completed" style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: 'rgba(5, 150, 105, 0.2)', border: '1px solid #059669', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                          <Check size={14} />
                        </div>
                      )}
                      <button onClick={() => handleEditReminder(idx)} style={{ background: '#1e293b', border: 'none', color: '#38bdf8', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}><Edit2 size={13} /></button>
                      <button onClick={() => handleDeleteReminder(idx)} style={{ background: '#7f1d1d', border: 'none', color: '#fecaca', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}><Trash2 size={13} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Advanced Expense & Pocket Money Tracker Modal */}
      {showExpenseModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(3,7,18,0.85)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
          <div style={{ backgroundColor: '#0b0f19', borderRadius: '24px', padding: '24px', width: '100%', maxWidth: '480px', position: 'relative', border: '1px solid #1e293b', color: '#f8fafc', boxSizing: 'border-box', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setShowExpenseModal(false)} style={{ position: 'absolute', top: '14px', right: '14px', border: 'none', background: '#1e293b', color: '#f8fafc', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={15} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#38bdf8', color: '#030712', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DollarSign size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>Expense & Pocket Money Dashboard</h3>
            </div>

            {/* Budget Summary Card */}
            <div style={{ backgroundColor: '#030712', border: '1px solid #1e293b', borderRadius: '14px', padding: '14px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700' }}>Monthly Budget / Pocket Money</span>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#f8fafc' }}>₹{monthlyBudget.toFixed(2)}</h2>
                </div>
                <button onClick={() => { setIsSettingBudget(!isSettingBudget); setTempBudgetInput(monthlyBudget); }} style={{ background: '#1e293b', border: 'none', color: '#38bdf8', padding: '6px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}>
                  {isSettingBudget ? "Cancel" : "Edit Budget"}
                </button>
              </div>

              {isSettingBudget && (
                <form onSubmit={handleUpdateBudget} style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="number" 
                    value={tempBudgetInput} 
                    onChange={(e) => setTempBudgetInput(e.target.value)} 
                    placeholder="New budget amount..."
                    style={{ flex: 1, padding: '8px 10px', borderRadius: '8px', border: '1px solid #1e293b', backgroundColor: '#0b0f19', color: '#f8fafc', fontSize: '12px', outline: 'none' }}
                  />
                  <button type="submit" style={{ background: '#38bdf8', color: '#030712', border: 'none', padding: '8px 14px', borderRadius: '8px', fontWeight: '900', fontSize: '11px', cursor: 'pointer' }}>Save</button>
                </form>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #1e293b', paddingTop: '8px' }}>
                <div>
                  <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: '700' }}>Total Spent</span>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: '#fca5a5' }}>₹{totalSpent.toFixed(2)}</p>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: '#10b981', fontWeight: '700' }}>Remaining Balance</span>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: '#6ee7b7' }}>₹{remainingBudget.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Add Expense Form with Categories */}
            <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Kharcha kahan kiya (e.g. Chai, Petrol)..."
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
                  style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #1e293b', backgroundColor: '#030712', color: '#38bdf8', fontSize: '12px', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="Food / Chai">Food / Chai</option>
                  <option value="Transport / Fuel">Transport / Fuel</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Bills & Recharges">Bills & Recharges</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>

                <button type="submit" style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#38bdf8', color: '#030712', fontWeight: '900', fontSize: '12px', cursor: 'pointer' }}>
                  Add Expense
                </button>
              </div>
            </form>

            {/* Category Breakdown Chips */}
            {Object.keys(categoryTotals).length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                {Object.entries(categoryTotals).map(([cat, amt], i) => (
                  <div key={i} style={{ backgroundColor: '#030712', border: '1px solid #1e293b', borderRadius: '8px', padding: '6px 10px', fontSize: '10px', fontWeight: '700', color: '#94a3b8' }}>
                    {cat}: <span style={{ color: '#38bdf8' }}>₹{amt.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Expense History List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
              {expenseList.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px', margin: '16px 0' }}>Koi kharcha darj nahi hai.</p>
              ) : (
                expenseList.map((exp, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#030712', border: '1px solid #1e293b', borderRadius: '10px', padding: '10px 12px' }}>
                    <div style={{ overflow: 'hidden', paddingRight: '8px' }}>
                      <p style={{ margin: 0, fontSize: '12px', fontWeight: '800', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {exp.title} - <span style={{ color: '#38bdf8' }}>₹{exp.amount}</span>
                      </p>
                      <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '700' }}>{exp.category} | {exp.date}</span>
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

            <button onClick={() => setShowBriefingModal(false)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: '#38bdf8', color: '#030712', fontWeight: '900', fontSize: '13px', cursor: 'pointer' }}>Band Karein</button>
          </div>
        </div>
      )}

    </div>
  );
}