import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { 
  Shield, Volume2, VolumeX, Clock, 
  X, Activity, MapPin, Navigation
} from 'lucide-react';

const BACKEND_URL = "https://spct-avengers-backend.onrender.com";
const GOOGLE_MAPS_API_KEY = "AIzaSyD-4gRvVI1Tx8VLADJRifzYN190_FqBbJa";

export default function App() {
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(true);

  // Route Panel State (Full Google Map)
  const [showRoutePanel, setShowRoutePanel] = useState(false);

  // Watcher State (10 Independent Reminders with Custom Times)
  const [showWatcherModal, setShowWatcherModal] = useState(false);
  const [reminders, setReminders] = useState([
    { task: '', time: '09:00' },
    { task: '', time: '10:00' },
    { task: '', time: '11:00' },
    { task: '', time: '12:00' },
    { task: '', time: '13:00' },
    { task: '', time: '14:00' },
    { task: '', time: '15:00' },
    { task: '', time: '16:00' },
    { task: '', time: '17:00' },
    { task: '', time: '18:00' }
  ]);
  const [watcherActive, setWatcherActive] = useState(false);
  const [activeAlertTask, setActiveAlertTask] = useState(null);

  const watcherIntervalRef = useRef(null);
  const recognitionRef = useRef(null);
  const socketRef = useRef(null);

  // Slow & Clear Hindi Male Voice Synthesizer
  const speakText = useCallback((text) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    
    const voices = window.speechSynthesis.getVoices();
    const maleVoice = voices.find(v => v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('george') || v.name.toLowerCase().includes('hi-in')) || voices[0];

    const utterance = new SpeechSynthesisUtterance(text);
    if (maleVoice) utterance.voice = maleVoice;
    utterance.rate = 0.85; // Slow speed
    utterance.pitch = 0.7; // Deep male voice tone
    utterance.lang = 'hi-IN';

    window.speechSynthesis.speak(utterance);
  }, [isMuted]);

  // Fetch Live Weather & Handle Voice Commands in Pure Hindi
  const handleVoiceCommand = useCallback(async (query) => {
    const lowerQ = query.toLowerCase();
    let reply = "Maaf kijiye Commander, main samajh nahi paya.";

    if (lowerQ.includes('taapman') || lowerQ.includes('temperature') || lowerQ.includes('mausam') || lowerQ.includes('weather') || lowerQ.includes('garmi')) {
      try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=23.0225&current_weather=true');
        const data = await res.json();
        if (data && data.current_weather) {
          const temp = data.current_weather.temperature;
          const wind = data.current_weather.windspeed;
          reply = `Commander, yahan ka vartaman taapman ${temp} degree Celsius hai, aur hawa ki raftaar ${wind} kilometer prati ghanta hai.`;
        } else {
          reply = "Commander, taapman ka data prapt nahi ho paya.";
        }
      } catch (err) {
        reply = "Weather API se connection establish nahi ho paya.";
      }
    } else if (lowerQ.includes('traffic') || lowerQ.includes('raste') || lowerQ.includes('aage') || lowerQ.includes('kesa hain') || lowerQ.includes('kaisa hai')) {
      reply = "Commander, live map telemetry ke anusar aapke aas-paas ka rasta bilkul saaf hai. Koi bhari traffic nahi hai.";
    } else if (lowerQ.includes('status') || lowerQ.includes('jarvis') || lowerQ.includes('system') || lowerQ.includes('lone wolf')) {
      reply = "Namaste Commander! Main Lone Wolf Jarvis hu. Arc reactor core puri tarah sakriya hai aur main aapki seva ke liye hamesha taiyar hu.";
    } else if (lowerQ.includes('hello') || lowerQ.includes('namaste') || lowerQ.includes('sun rahe ho')) {
      reply = "Ji Commander, main aapko sun raha hu. Bataiye kya aadesh hai?";
    } else {
      reply = `Aadesh sweekar kiya gaya: "${query}". Is par karya shuru kar diya gaya hai.`;
    }

    speakText(reply);
  }, [speakText]);

  // Continuous Listening Setup (Always On & Auto-Restart)
  useEffect(() => {
    socketRef.current = io(BACKEND_URL, { transports: ['websocket', 'polling'] });
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.getVoices(); };
    }

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'hi-IN';
      recognition.continuous = true;
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        handleVoiceCommand(transcript);
      };

      recognition.onerror = () => {
        try { recognition.start(); } catch (e) {}
      };

      recognition.onend = () => {
        try { recognition.start(); } catch (e) {}
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
        setIsListening(true);
      } catch (e) {}
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (socketRef.current) socketRef.current.disconnect();
      if (watcherIntervalRef.current) clearInterval(watcherIntervalRef.current);
    };
  }, [handleVoiceCommand]);

  // Watcher Time-Hit Checker
  useEffect(() => {
    if (!watcherActive) return;

    if (watcherIntervalRef.current) clearInterval(watcherIntervalRef.current);

    watcherIntervalRef.current = setInterval(() => {
      const now = new Date();
      const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      reminders.forEach(rem => {
        if (rem.task && rem.time === currentTimeStr) {
          setActiveAlertTask(rem.task);
          speakText(`Dhyan dein Commander, nirdharit samay ho chuka hai. Reminder task hai: ${rem.task}`);
          if (Notification.permission === 'granted') {
            new Notification("Jarvis Watcher Alert", { body: rem.task, icon: "/logo.png" });
          }
        }
      });
    }, 30000);

    return () => {
      if (watcherIntervalRef.current) clearInterval(watcherIntervalRef.current);
    };
  }, [watcherActive, reminders, speakText]);

  const handleSetupWatcher = (e) => {
    e.preventDefault();
    const activeReminders = reminders.filter(r => r.task.trim() !== '');
    if (activeReminders.length === 0) {
      alert("Kripya kam se kam ek reminder task aur samay darj karein.");
      return;
    }

    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }

    setWatcherActive(true);
    setShowWatcherModal(false);
    alert(`Watcher system arm ho gaya hai! Aapke ${activeReminders.length} reminders ke samay par full screen alert aayega.`);
  };

  const handleStopWatcher = () => {
    if (watcherIntervalRef.current) {
      clearInterval(watcherIntervalRef.current);
      watcherIntervalRef.current = null;
    }
    setWatcherActive(false);
    alert("Watcher system band kar diya gaya hai.");
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
            <span style={{ fontSize: '10px', color: '#38bdf8' }}>Sada Sakriya Awaaz aur Mausam Mode</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setShowRoutePanel(true)}
            style={{ border: 'none', background: '#1e293b', color: '#38bdf8', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <Navigation size={14} /> Naksha Dekhein
          </button>

          <button
            onClick={() => { if (!watcherActive) setShowWatcherModal(true); else handleStopWatcher(); }}
            style={{ border: 'none', background: watcherActive ? '#059669' : '#38bdf8', color: '#030712', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <Clock size={14} /> {watcherActive ? "Watcher Chalu Hai" : "Watcher (10 Reminders)"}
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
            position: relative;
          }
        `}</style>

        {/* Jarvis Heart Widget */}
        <div className="jarvis-heart">
          <div style={{ width: '140px', height: '140px', borderRadius: '50%', border: '2px dashed #0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={70} color="#38bdf8" />
          </div>
        </div>

      </main>

      {/* Full-Screen Watcher Reminder Alert Overlay */}
      {activeAlertTask && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(3, 7, 18, 0.95)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', boxSizing: 'border-box', textAlign: 'center' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '24px', backgroundColor: '#38bdf8', color: '#030712', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', boxShadow: '0 0 40px rgba(56,189,248,0.8)' }}>
            <Clock size={40} />
          </div>
          <span style={{ fontSize: '12px', fontWeight: '950', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>
            Nirdharit Samay Ho Chuka Hai
          </span>
          <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#f8fafc', maxWidth: '700px', lineHeight: '1.3', marginBottom: '32px' }}>
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

      {/* Right Side Full Google Map View Drawer */}
      {showRoutePanel && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(3,7,18,0.7)', backdropFilter: 'blur(3px)', zIndex: 150, display: 'flex', justifyContent: 'flex-end', boxSizing: 'border-box' }}>
          <div style={{ backgroundColor: '#0b0f19', width: '100%', maxWidth: '600px', height: '100%', padding: '20px', boxSizing: 'border-box', borderLeft: '1px solid #1e293b', display: 'flex', flexDirection: 'column', color: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>Live Google Map Darshan</h3>
              <button onClick={() => setShowRoutePanel(false)} style={{ border: 'none', background: '#1e293b', color: '#f8fafc', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ flex: 1, borderRadius: '14px', overflow: 'hidden', border: '1px solid #1e293b', backgroundColor: '#030712' }}>
              <iframe
                title="Google Maps Full View"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                src={`https://www.google.com/maps/embed/v1/view?key=${GOOGLE_MAPS_API_KEY}&center=23.0225,72.5714&zoom=12`}
              ></iframe>
            </div>
          </div>
        </div>
      )}

      {/* Watcher Modal (10 Independent Reminders Setup) */}
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
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>10 Alag-alag Reminders</h3>
            </div>

            <form onSubmit={handleSetupWatcher} style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Har Reminder ke liye Task aur Samay set karein:</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
                  {reminders.map((rem, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder={`Reminder ${idx + 1} Task...`}
                        value={rem.task}
                        onChange={(e) => {
                          const newR = [...reminders];
                          newR[idx].task = e.target.value;
                          setReminders(newR);
                        }}
                        style={{ flex: 1, padding: '8px 10px', borderRadius: '8px', border: '1px solid #1e293b', backgroundColor: '#030712', color: '#f8fafc', fontSize: '11px', outline: 'none', boxSizing: 'border-box' }}
                      />
                      <input
                        type="time"
                        value={rem.time}
                        onChange={(e) => {
                          const newR = [...reminders];
                          newR[idx].time = e.target.value;
                          setReminders(newR);
                        }}
                        style={{ width: '100px', padding: '8px 6px', borderRadius: '8px', border: '1px solid #1e293b', backgroundColor: '#030712', color: '#38bdf8', fontSize: '11px', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: '#38bdf8', color: '#030712', fontWeight: '800', fontSize: '13px', cursor: 'pointer', marginTop: '10px' }}
              >
                10 Reminders Chalu Karein
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}