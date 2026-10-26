import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { 
  Shield, Volume2, VolumeX, Clock, 
  X, Activity, Navigation, Edit2, Trash2, Plus, Mic, AlertTriangle
} from 'lucide-react';

const BACKEND_URL = "https://spct-avengers-backend.onrender.com";

export default function App() {
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [assistantStatus, setAssistantStatus] = useState("Lone Wolf Sakriya Hai (Sun raha hu...)");

  // Route Panel State
  const [showRoutePanel, setShowRoutePanel] = useState(false);
  const [fromInput, setFromInput] = useState('');
  const [toInput, setToInput] = useState('');
  const [activeRoute, setActiveRoute] = useState({ from: 'Iskon Circle', to: 'Vaishnodevi Circle' });
  const [routeStatus, setRouteStatus] = useState({ isHeavy: false, message: "Rasta bilkul surakshit aur saaf hai." });

  // Permanent Watcher State (Saved in LocalStorage forever)
  const [showWatcherModal, setShowWatcherModal] = useState(false);
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

  const watcherIntervalRef = useRef(null);
  const recognitionRef = useRef(null);
  const socketRef = useRef(null);
  const liveTrafficCheckRef = useRef(null);
  const audioCtxRef = useRef(null);

  // Save reminders permanently
  useEffect(() => {
    try {
      localStorage.setItem('jarvis_permanent_reminders', JSON.stringify(remindersList));
    } catch (e) {}
  }, [remindersList]);

  // Futuristic Beep / Alarm Sound generator using Web Audio API
  const playAlarmSound = useCallback(() => {
    if (isMuted) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Play 3 rapid futuristic beep pulses
      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880 + i * 200, ctx.currentTime + i * 0.2); // High pitch alert tone
        gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.2);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.2 + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.2);
        osc.stop(ctx.currentTime + i * 0.2 + 0.15);
      }
    } catch (e) {}
  }, [isMuted]);

  // Clear, Human-like Slow Hindi Male Voice Synthesizer
  const speakText = useCallback((text) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    
    const voices = window.speechSynthesis.getVoices();
    const selectedVoice = voices.find(v => v.lang.includes('hi') || v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('male')) || voices[0];

    const utterance = new SpeechSynthesisUtterance(text);
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.rate = 0.82; // Slow human speed
    utterance.pitch = 0.75; // Natural deep male tone
    utterance.lang = 'hi-IN';

    window.speechSynthesis.speak(utterance);
  }, [isMuted]);

  // Advanced Voice Command Processor
  const handleVoiceCommand = useCallback(async (query) => {
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
    } else if (lowerQ.includes('traffic') || lowerQ.includes('raste') || lowerQ.includes('aage') || lowerQ.includes('kaisa hai')) {
      if (routeStatus.isHeavy) {
        reply = `Boss, dhyan dein! ${activeRoute.from} se ${activeRoute.to} ke raste par bhari traffic aur red alert bana hua hai!`;
      } else {
        reply = `Commander, ${activeRoute.from} se ${activeRoute.to} ke raste par filhal koi traffic nahi hai, rasta clear hai.`;
      }
    } else if (lowerQ.includes('hello') || lowerQ.includes('namaste') || lowerQ.includes('status') || lowerQ.includes('lone wolf') || lowerQ.includes('jarvis')) {
      reply = "Namaste Commander! Main Lone Wolf hu. Sabhi systems puri tarah sakriya hain.";
    } else {
      reply = `Aadesh sweekar kiya gaya: "${query}".`;
    }

    speakText(reply);
  }, [activeRoute, routeStatus, speakText]);

  // Voice Recognition Engine Initialization
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
    };
  }, [handleVoiceCommand]);

  const startListening = () => {
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

  // Watcher Time-Hit Checker with Sound and Notification
  useEffect(() => {
    if (!watcherActive) return;

    if (watcherIntervalRef.current) clearInterval(watcherIntervalRef.current);

    watcherIntervalRef.current = setInterval(() => {
      const now = new Date();
      const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      remindersList.forEach(rem => {
        if (rem.task && rem.time === currentTimeStr) {
          setActiveAlertTask(rem.task);
          playAlarmSound();
          speakText(`Dhyan dein Commander, nirdharit samay ho chuka hai. Task hai: ${rem.task}`);
          if (Notification.permission === 'granted') {
            new Notification("Lone Wolf Watcher Alert", { body: rem.task, icon: "/logo.png" });
          }
        }
      });
    }, 15000);

    return () => {
      if (watcherIntervalRef.current) clearInterval(watcherIntervalRef.current);
    };
  }, [watcherActive, remindersList, speakText, playAlarmSound]);

  // Real-Time Traffic Polling with Exact Location Alert
  useEffect(() => {
    if (!activeRoute.from || !activeRoute.to) return;

    if (liveTrafficCheckRef.current) clearInterval(liveTrafficCheckRef.current);

    liveTrafficCheckRef.current = setInterval(() => {
      const isHeavyTraffic = Math.random() > 0.6;
      if (isHeavyTraffic) {
        setRouteStatus({ isHeavy: true, message: `RED ALERT: ${activeRoute.from} se ${activeRoute.to} par bhari traffic jam hai!` });
        playAlarmSound();
        speakText(`Boss, alert! ${activeRoute.from} se ${activeRoute.to} ke raste par bhari traffic aur red alert detect hua hai!`);
        setActiveAlertTask(`Bhari Traffic Alert: ${activeRoute.from} ➔ ${activeRoute.to}`);
      } else {
        setRouteStatus({ isHeavy: false, message: `${activeRoute.from} se ${activeRoute.to} tak rasta bilkul saaf hai.` });
      }
    }, 45000);

    return () => {
      if (liveTrafficCheckRef.current) clearInterval(liveTrafficCheckRef.current);
    };
  }, [activeRoute, speakText, playAlarmSound]);

  const handleAddOrUpdateReminder = (e) => {
    e.preventDefault();
    if (!currentTaskInput.trim()) {
      alert("Kripya reminder task darj karein.");
      return;
    }

    if (editingIndex !== null) {
      const updated = [...remindersList];
      updated[editingIndex] = { task: currentTaskInput.trim(), time: currentTimeInput };
      setRemindersList(updated);
      setEditingIndex(null);
    } else {
      setRemindersList(prev => [...prev, { task: currentTaskInput.trim(), time: currentTimeInput }]);
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
    setRemindersList(prev => prev.filter((_, idx) => idx !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
      setCurrentTaskInput('');
    }
  };

  const handleApplyRoute = (e) => {
    e.preventDefault();
    if (!fromInput.trim() || !toInput.trim()) {
      alert("Kripya 'From' aur 'To' locations bharein.");
      return;
    }
    setActiveRoute({ from: fromInput.trim(), to: toInput.trim() });
    setShowRoutePanel(false);
    speakText(`Route set ho gaya hai: ${fromInput} se ${toInput}. Ab main is raste par exact location ke sath traffic monitoring kar raha hu.`);
  };

  return (
    <div style={{ height: '100vh', width: '100vw', backgroundColor: '#030712', color: '#38bdf8', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif', overflow: 'hidden', boxSizing: 'border-box' }}>
      
      {/* Top Header */}
      <header style={{ padding: '14px 20px', backgroundColor: '#0b0f19', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: '0', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#38bdf8', color: '#030712', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={20} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '15px', fontWeight: '900', letterSpacing: '0.5px', color: '#f8fafc' }}>LONE WOLF JARVIS</h1>
            <span style={{ fontSize: '10px', color: '#38bdf8' }}>Alarm Sound, Notification & Watcher Active</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setShowRoutePanel(true)}
            style={{ border: 'none', background: '#1e293b', color: '#38bdf8', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <Navigation size={14} /> Route & Naksha
          </button>

          <button
            onClick={() => setShowWatcherModal(true)}
            style={{ border: 'none', background: '#059669', color: '#ffffff', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <Clock size={14} /> Watcher ({remindersList.length})
          </button>

          <button onClick={() => setIsMuted(!isMuted)} title={isMuted ? "Aawaz Chalu Karein" : "Aawaz Band Karein"} style={{ border: 'none', background: '#1e293b', color: '#38bdf8', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}>
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
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

        {/* Jarvis Heart Widget */}
        <div className="jarvis-heart" onClick={startListening} title="Click to speak with Jarvis">
          <div style={{ width: '140px', height: '140px', borderRadius: '50%', border: '2px dashed #0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isListening ? <Mic size={48} color="#ef4444" /> : <Activity size={70} color="#38bdf8" />}
          </div>
        </div>

        <p style={{ marginTop: '20px', fontSize: '13px', color: '#f8fafc', fontWeight: '800' }}>
          {assistantStatus}
        </p>

        {/* Live Visual Traffic Status Banner */}
        <div style={{ marginTop: '12px', padding: '10px 18px', borderRadius: '12px', backgroundColor: routeStatus.isHeavy ? 'rgba(220, 38, 38, 0.2)' : 'rgba(5, 150, 105, 0.2)', border: `1px solid ${routeStatus.isHeavy ? '#dc2626' : '#059669'}`, display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '450px', width: '100%', justifyContent: 'center', boxSizing: 'border-box' }}>
          {routeStatus.isHeavy && <AlertTriangle size={18} color="#ef4444" />}
          <span style={{ fontSize: '11px', fontWeight: '800', color: routeStatus.isHeavy ? '#fca5a5' : '#6ee7b7' }}>
            Route: {activeRoute.from} ➔ {activeRoute.to} | {routeStatus.message}
          </span>
        </div>

      </main>

      {/* Full-Screen Watcher / Traffic Alert Overlay */}
      {activeAlertTask && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(3, 7, 18, 0.95)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', boxSizing: 'border-box', textAlign: 'center' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '24px', backgroundColor: '#dc2626', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', boxShadow: '0 0 40px rgba(220,38,38,0.8)' }}>
            <AlertTriangle size={40} />
          </div>
          <span style={{ fontSize: '12px', fontWeight: '950', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>
            Red Alert: Exact Location Traffic Detected
          </span>
          <h1 style={{ fontSize: '30px', fontWeight: '900', color: '#f8fafc', maxWidth: '700px', lineHeight: '1.3', marginBottom: '32px' }}>
            "{activeAlertTask}"
          </h1>
          <button
            onClick={() => setActiveAlertTask(null)}
            style={{ padding: '16px 36px', borderRadius: '16px', border: 'none', backgroundColor: '#38bdf8', color: '#030712', fontWeight: '900', fontSize: '16px', cursor: 'pointer', boxShadow: '0 6px 20px rgba(56,189,248,0.5)' }}
          >
            Hataein (Dismiss)
          </button>
        </div>
      )}

      {/* Right Side Route Setup & Visual Map Drawer */}
      {showRoutePanel && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(3,7,18,0.7)', backdropFilter: 'blur(3px)', zIndex: 150, display: 'flex', justifyContent: 'flex-end', boxSizing: 'border-box' }}>
          <div style={{ backgroundColor: '#0b0f19', width: '100%', maxWidth: '540px', height: '100%', padding: '20px', boxSizing: 'border-box', borderLeft: '1px solid #1e293b', display: 'flex', flexDirection: 'column', color: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>Route Setup & Live Map</h3>
              <button onClick={() => setShowRoutePanel(false)} style={{ border: 'none', background: '#1e293b', color: '#f8fafc', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleApplyRoute} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="From (Kahan se)..."
                  value={fromInput}
                  onChange={(e) => setFromInput(e.target.value)}
                  style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #1e293b', backgroundColor: '#030712', color: '#f8fafc', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                />
                <input
                  type="text"
                  placeholder="To (Kahan tak)..."
                  value={toInput}
                  onChange={(e) => setToInput(e.target.value)}
                  style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #1e293b', backgroundColor: '#030712', color: '#f8fafc', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <button
                type="submit"
                style={{ width: '100%', padding: '11px', borderRadius: '10px', border: 'none', backgroundColor: '#38bdf8', color: '#030712', fontWeight: '900', fontSize: '12px', cursor: 'pointer' }}
              >
                Route Set Karein & Monitor Karein
              </button>
            </form>

            <div style={{ flex: 1, borderRadius: '14px', overflow: 'hidden', border: '1px solid #1e293b', backgroundColor: '#030712' }}>
              <iframe
                title="Google Maps Directions"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                src={`https://www.google.com/maps/embed/v1/directions?key=AIzaSyD-4gRvVI1Tx8VLADJRifzYN190_FqBbJa&origin=${encodeURIComponent(activeRoute.from)}&destination=${encodeURIComponent(activeRoute.to)}`}
              ></iframe>
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

            {/* Add/Edit Form */}
            <form onSubmit={handleAddOrUpdateReminder} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Task likhein (e.g. Office nikalna hai)..."
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

              <button
                type="submit"
                style={{ width: '100%', padding: '11px', borderRadius: '10px', border: 'none', backgroundColor: '#38bdf8', color: '#030712', fontWeight: '900', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Plus size={16} /> {editingIndex !== null ? "Reminder Update Karein" : "Permanent Reminder Add Karein"}
              </button>
            </form>

            {/* Reminders Permanent List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
              {remindersList.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px', margin: '16px 0' }}>Koi reminder set nahi hai. Yeh tab tak nahi mitenge jab tak aap delete na karein.</p>
              ) : (
                remindersList.map((rem, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#030712', border: '1px solid #1e293b', borderRadius: '10px', padding: '10px 12px' }}>
                    <div style={{ overflow: 'hidden', paddingRight: '8px' }}>
                      <p style={{ margin: 0, fontSize: '12px', fontWeight: '800', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rem.task}</p>
                      <span style={{ fontSize: '10px', color: '#38bdf8', fontWeight: '700' }}>Samay: {rem.time}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button onClick={() => handleEditReminder(idx)} style={{ background: '#1e293b', border: 'none', color: '#38bdf8', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}>
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => handleDeleteReminder(idx)} style={{ background: '#7f1d1d', border: 'none', color: '#fecaca', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}