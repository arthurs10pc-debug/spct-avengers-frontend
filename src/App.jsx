import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { 
  Shield, Mic, MicOff, Volume2, VolumeX, Clock, 
  Power, X, Radio, Cpu, Activity
} from 'lucide-react';

const BACKEND_URL = "https://spct-avengers-backend.onrender.com";

export default function App() {
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [statusText, setStatusText] = useState("Jarvis Core Active. Listening for commands...");
  const [jarvisActive, setJarvisActive] = useState(false);

  // Watcher State (Up to 10 manual reminders + Every X minutes)
  const [showWatcherModal, setShowWatcherModal] = useState(false);
  const [reminders, setReminders] = useState(['', '', '', '', '', '', '', '', '', '']);
  const [watcherIntervalMin, setWatcherIntervalMin] = useState(5);
  const [watcherActive, setWatcherActive] = useState(false);
  const watcherIntervalRef = useRef(null);

  const socketRef = useRef(null);

  const speakText = useCallback((text) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 0.85;
    
    if (text.includes('traffic') || text.includes('raste') || text.includes('kem cho')) {
      utterance.lang = 'gu-IN';
    } else {
      utterance.lang = 'en-US';
    }

    window.speechSynthesis.speak(utterance);
  }, [isMuted]);

  // Initial Greeting on mount
  useEffect(() => {
    socketRef.current = io(BACKEND_URL, { transports: ['websocket', 'polling'] });
    
    const timer = setTimeout(() => {
      const morningGreeting = "Good morning, Commander. All systems are online. How can I assist you on your route today?";
      setStatusText(morningGreeting);
      speakText(morningGreeting);
      setJarvisActive(true);
    }, 1000);

    return () => {
      clearTimeout(timer);
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [speakText]);

  const handleVoiceCommand = async (query) => {
    const lowerQ = query.toLowerCase();
    let reply = "Processing live telemetry, Commander.";

    if (lowerQ.includes('traffic') || lowerQ.includes('raste') || lowerQ.includes('kevu chhe')) {
      reply = "Live traffic update: Aapke raste par SP Ring Road aur Vaishnodevi circle ke beech halka congestion hai. Alternate route lene ki salah di jati hai.";
    } else if (lowerQ.includes('status') || lowerQ.includes('jarvis')) {
      reply = "Arc reactor core at 100 percent capacity. All operational parameters are nominal.";
    } else {
      reply = `Command executed successfully for query: ${query}`;
    }

    setStatusText(reply);
    speakText(reply);
  };

  const toggleListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'gu-IN';

    if (!isListening) {
      setIsListening(true);
      setStatusText("Listening to your voice command...");
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        handleVoiceCommand(transcript);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } else {
      setIsListening(false);
      recognition.stop();
    }
  };

  const handleSetupWatcher = (e) => {
    e.preventDefault();
    const activeReminders = reminders.filter(r => r.trim() !== '');
    if (activeReminders.length === 0) {
      alert("Kam se kam ek reminder task toh likhiye.");
      return;
    }

    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }

    if (watcherIntervalRef.current) clearInterval(watcherIntervalRef.current);

    const intervalMs = Math.max(1, parseInt(watcherIntervalMin) || 5) * 60 * 1000;
    watcherIntervalRef.current = setInterval(() => {
      const randomTask = activeReminders[Math.floor(Math.random() * activeReminders.length)];
      speakText(`Reminder alert: ${randomTask}`);
      if (Notification.permission === 'granted') {
        new Notification("Jarvis Watcher", { body: randomTask, icon: "/logo.png" });
      }
    }, intervalMs);

    setWatcherActive(true);
    setShowWatcherModal(false);
    alert(`Watcher armed with ${activeReminders.length} tasks, triggering every ${watcherIntervalMin} minutes.`);
  };

  const handleStopWatcher = () => {
    if (watcherIntervalRef.current) {
      clearInterval(watcherIntervalRef.current);
      watcherIntervalRef.current = null;
    }
    setWatcherActive(false);
    alert("Watcher disarmed.");
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
            <span style={{ fontSize: '10px', color: '#38bdf8' }}>AI Voice Assistant Core</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => { if (!watcherActive) setShowWatcherModal(true); else handleStopWatcher(); }}
            style={{ border: 'none', background: watcherActive ? '#059669' : '#38bdf8', color: '#030712', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <Clock size={14} /> {watcherActive ? "Watcher Active" : "Watcher"}
          </button>

          <button onClick={() => setIsMuted(!isMuted)} title={isMuted ? "Unmute" : "Mute"} style={{ border: 'none', background: '#1e293b', color: '#38bdf8', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}>
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>
      </header>

      {/* Main Jarvis Heart / Arc Reactor UI Center */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', boxSizing: 'border-box', textAlign: 'center' }}>
        
        <style>{`
          @keyframes pulseCore {
            0% { transform: scale(1); box-shadow: 0 0 20px rgba(56, 189, 248, 0.4), inset 0 0 20px rgba(56, 189, 248, 0.4); }
            50% { transform: scale(1.06); box-shadow: 0 0 50px rgba(56, 189, 248, 0.8), inset 0 0 40px rgba(56, 189, 248, 0.8); }
            100% { transform: scale(1); box-shadow: 0 0 20px rgba(56, 189, 248, 0.4), inset 0 0 20px rgba(56, 189, 248, 0.4); }
          }
          .jarvis-heart {
            width: 180px;
            height: 180px;
            border-radius: 50%;
            border: 3px solid #38bdf8;
            display: flex;
            align-items: center;
            justify-content: center;
            background: radial-gradient(circle, rgba(56,189,248,0.2) 0%, rgba(3,7,18,0.9) 70%);
            animation: pulseCore 3s infinite ease-in-out;
            cursor: pointer;
            position: relative;
          }
        `}</style>

        {/* Jarvis Heart Widget */}
        <div className="jarvis-heart" onClick={toggleListening} title="Tap to speak">
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', border: '2px dashed #0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={48} color="#38bdf8" />
          </div>
        </div>

        <p style={{ marginTop: '24px', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800' }}>
          {isListening ? "Listening..." : "Tap the core or mic to command"}
        </p>

        <div style={{ marginTop: '16px', maxWidth: '500px', width: '100%', backgroundColor: '#0b0f19', border: '1px solid #1e293b', borderRadius: '16px', padding: '16px', boxSizing: 'border-box' }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#f8fafc', lineHeight: '1.5', fontWeight: '600' }}>
            "{statusText}"
          </p>
        </div>

      </main>

      {/* Bottom Mic Control Bar */}
      <footer style={{ padding: '16px', backgroundColor: '#0b0f19', borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'center', flexShrink: 0, boxSizing: 'border-box' }}>
        <button
          onClick={toggleListening}
          style={{ border: 'none', background: isListening ? '#dc2626' : '#38bdf8', color: '#030712', padding: '14px 28px', borderRadius: '9999px', cursor: 'pointer', fontWeight: '900', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(56, 189, 248, 0.4)' }}
        >
          {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          <span>{isListening ? "Listening Active..." : "Speak to Jarvis"}</span>
        </button>
      </footer>

      {/* Watcher Modal (Up to 10 Reminders + Every-time interval) */}
      {showWatcherModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(3,7,18,0.85)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
          <div style={{ backgroundColor: '#0b0f19', borderRadius: '24px', padding: '24px', width: '100%', maxWidth: '420px', position: 'relative', border: '1px solid #1e293b', color: '#f8fafc', boxSizing: 'border-box', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setShowWatcherModal(false)} style={{ position: 'absolute', top: '14px', right: '14px', border: 'none', background: '#1e293b', color: '#f8fafc', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={15} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#38bdf8', color: '#030712', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>Setup Watcher Reminders</h3>
            </div>

            <form onSubmit={handleSetupWatcher} style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Enter up to 10 Reminder Tasks:</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                  {reminders.map((rem, idx) => (
                    <input
                      key={idx}
                      type="text"
                      placeholder={`Task ${idx + 1}...`}
                      value={rem}
                      onChange={(e) => {
                        const newR = [...reminders];
                        newR[idx] = e.target.value;
                        setReminders(newR);
                      }}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #1e293b', backgroundColor: '#030712', color: '#f8fafc', fontSize: '11px', outline: 'none', boxSizing: 'border-box' }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Repeat Every (Minutes)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={watcherIntervalMin}
                  onChange={(e) => setWatcherIntervalMin(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #1e293b', backgroundColor: '#030712', color: '#f8fafc', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: '#38bdf8', color: '#030712', fontWeight: '800', fontSize: '13px', cursor: 'pointer', marginTop: '6px' }}
              >
                Arm Watcher System
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}