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
  const [statusText, setStatusText] = useState("Jarvis Core Active. Hamesha aapki aawaz sun raha hu...");
  const [continuousMode, setContinuousMode] = useState(true);

  // Watcher State (10 Manual Reminders + Every X Minutes)
  const [showWatcherModal, setShowWatcherModal] = useState(false);
  const [reminders, setReminders] = useState(['', '', '', '', '', '', '', '', '', '']);
  const [watcherIntervalMin, setWatcherIntervalMin] = useState(5);
  const [watcherActive, setWatcherActive] = useState(false);
  const watcherIntervalRef = useRef(null);
  const recognitionRef = useRef(null);

  const socketRef = useRef(null);

  const speakText = useCallback((text) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 0.85;
    utterance.lang = 'hi-IN'; // Pure Hindi Voice Output

    window.speechSynthesis.speak(utterance);
  }, [isMuted]);

  const handleVoiceCommand = useCallback((query) => {
    const lowerQ = query.toLowerCase();
    let reply = "Samajh nahi aaya Commander, kripya dobara bolein.";

    if (lowerQ.includes('traffic') || lowerQ.includes('raste') || lowerQ.includes('aage')) {
      reply = "Live traffic update: Aapke raste par SP Ring Road aur Vaishnodevi circle ke paas thoda traffic hai. Aapko alternative route lene ki salah di jati hai.";
    } else if (lowerQ.includes('status') || lowerQ.includes('jarvis') || lowerQ.includes('system')) {
      reply = "Arc reactor core 100 percent capacity par chal raha hai. Sabhi systems bilkul surakshit aur active hain.";
    } else if (lowerQ.includes('hello') || lowerQ.includes('namaste') || lowerQ.includes('sun rahe ho')) {
      reply = "Namaste Commander! Main aapki hi aawaz sun raha hu. Bataiye kya madad karu?";
    } else {
      reply = `Aapka adesh mil gaya hai: "${query}". Us par kaam shuru kar diya gaya hai.`;
    }

    setStatusText(reply);
    speakText(reply);
  }, [speakText]);

  // Continuous Speech Recognition Setup (Har waqt sunta rahega)
  useEffect(() => {
    socketRef.current = io(BACKEND_URL, { transports: ['websocket', 'polling'] });
    
    // Initial Morning Greeting in Hindi
    const timer = setTimeout(() => {
      const greeting = "Suprabhat Commander. Main Jarvis hu. Aap bataiye, aaj raste mein traffic kaisa hai ya koi aur madad chahiye?";
      setStatusText(greeting);
      speakText(greeting);
    }, 1000);

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'hi-IN'; // Hindi Speech Input
      recognition.continuous = true;
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        handleVoiceCommand(transcript);
      };

      recognition.onerror = () => {
        if (continuousMode) {
          try { recognition.start(); } catch (e) {}
        }
      };

      recognition.onend = () => {
        if (continuousMode) {
          try { recognition.start(); } catch (e) {}
        }
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
        setIsListening(true);
      } catch (e) {}
    }

    return () => {
      clearTimeout(timer);
      if (recognitionRef.current) recognitionRef.current.stop();
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [continuousMode, handleVoiceCommand, speakText]);

  const toggleContinuousListening = () => {
    if (continuousMode) {
      setContinuousMode(false);
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      setStatusText("Continuous listening band kar di gayi hai.");
    } else {
      setContinuousMode(true);
      if (recognitionRef.current) {
        try { recognitionRef.current.start(); } catch (e) {}
      }
      setIsListening(true);
      setStatusText("Continuous listening shuru ho gayi hai. Main sun raha hu...");
    }
  };

  const handleSetupWatcher = (e) => {
    e.preventDefault();
    const activeReminders = reminders.filter(r => r.trim() !== '');
    if (activeReminders.length === 0) {
      alert("Kripya kam se kam ek reminder task zaroor likhein.");
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
    alert(`Watcher system arm ho gaya hai! Har ${watcherIntervalMin} minute mein yaad dilata rahega.`);
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
            <span style={{ fontSize: '10px', color: '#38bdf8' }}>AI Voice Assistant (Hindi Mode)</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => { if (!watcherActive) setShowWatcherModal(true); else handleStopWatcher(); }}
            style={{ border: 'none', background: watcherActive ? '#059669' : '#38bdf8', color: '#030712', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <Clock size={14} /> {watcherActive ? "Watcher Active" : "Watcher"}
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
            0% { transform: scale(1); box-shadow: 0 0 25px rgba(56, 189, 248, 0.4), inset 0 0 25px rgba(56, 189, 248, 0.4); }
            50% { transform: scale(1.08); box-shadow: 0 0 60px rgba(56, 189, 248, 0.9), inset 0 0 50px rgba(56, 189, 248, 0.9); }
            100% { transform: scale(1); box-shadow: 0 0 25px rgba(56, 189, 248, 0.4), inset 0 0 25px rgba(56, 189, 248, 0.4); }
          }
          .jarvis-heart {
            width: 200px;
            height: 200px;
            border-radius: 50%;
            border: 3px solid #38bdf8;
            display: flex;
            align-items: center;
            justify-content: center;
            background: radial-gradient(circle, rgba(56,189,248,0.25) 0%, rgba(3,7,18,0.95) 70%);
            animation: pulseCore 2.5s infinite ease-in-out;
            cursor: pointer;
            position: relative;
          }
        `}</style>

        {/* Jarvis Heart Widget */}
        <div className="jarvis-heart" onClick={toggleContinuousListening} title="Click to toggle listening">
          <div style={{ width: '110px', height: '110px', borderRadius: '50%', border: '2px dashed #0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={54} color="#38bdf8" />
          </div>
        </div>

        <p style={{ marginTop: '24px', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800' }}>
          {isListening ? "Jarvis lagataar aapki aawaz sun raha hai..." : "Listening paused"}
        </p>

        <div style={{ marginTop: '16px', maxWidth: '520px', width: '100%', backgroundColor: '#0b0f19', border: '1px solid #1e293b', borderRadius: '16px', padding: '18px', boxSizing: 'border-box' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#f8fafc', lineHeight: '1.5', fontWeight: '700' }}>
            "{statusText}"
          </p>
        </div>

      </main>

      {/* Bottom Control Bar */}
      <footer style={{ padding: '16px', backgroundColor: '#0b0f19', borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'center', flexShrink: 0, boxSizing: 'border-box' }}>
        <button
          onClick={toggleContinuousListening}
          style={{ border: 'none', background: continuousMode ? '#059669' : '#dc2626', color: '#ffffff', padding: '14px 28px', borderRadius: '9999px', cursor: 'pointer', fontWeight: '900', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(56, 189, 248, 0.4)' }}
        >
          {continuousMode ? <Mic size={18} /> : <MicOff size={18} />}
          <span>{continuousMode ? "Continuous Voice On" : "Continuous Voice Off"}</span>
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
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>Watcher Reminders (10 Tasks)</h3>
            </div>

            <form onSubmit={handleSetupWatcher} style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Apne Tasks Darj Karein:</label>
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
                <label style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Kitne minute mein yaad dilaye?</label>
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
                Watcher Start Karein
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}