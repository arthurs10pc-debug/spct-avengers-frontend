import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { 
  Shield, Volume2, VolumeX, Clock, 
  X, Activity, MapPin, Navigation, ExternalLink
} from 'lucide-react';

const BACKEND_URL = "https://spct-avengers-backend.onrender.com";

export default function App() {
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(true);

  // Route Panel State & Live Real Data
  const [showRoutePanel, setShowRoutePanel] = useState(false);
  const [originInput, setOriginInput] = useState('');
  const [destinationInput, setDestinationInput] = useState('');
  const [savedRoute, setSavedRoute] = useState({ origin: '', destination: '', distance: '', duration: '' });
  const [loadingRoute, setLoadingRoute] = useState(false);

  // Watcher State (10 Tasks + Full Screen Overlay Alert)
  const [showWatcherModal, setShowWatcherModal] = useState(false);
  const [reminders, setReminders] = useState(['', '', '', '', '', '', '', '', '', '']);
  const [watcherIntervalMin, setWatcherIntervalMin] = useState(5);
  const [watcherActive, setWatcherActive] = useState(false);
  const [activeAlertTask, setActiveAlertTask] = useState(null);

  const watcherIntervalRef = useRef(null);
  const recognitionRef = useRef(null);
  const socketRef = useRef(null);

  // Jarvis Male Voice Synthesizer
  const speakText = useCallback((text) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    
    const voices = window.speechSynthesis.getVoices();
    const maleVoice = voices.find(v => v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('george') || v.name.toLowerCase().includes('hi-in')) || voices[0];

    const utterance = new SpeechSynthesisUtterance(text);
    if (maleVoice) utterance.voice = maleVoice;
    utterance.rate = 0.95;
    utterance.pitch = 0.75;
    utterance.lang = 'hi-IN';

    window.speechSynthesis.speak(utterance);
  }, [isMuted]);

  const handleVoiceCommand = useCallback((query) => {
    const lowerQ = query.toLowerCase();
    let reply = "Maaf kijiye Commander, main samajh nahi paya.";

    if (lowerQ.includes('traffic') || lowerQ.includes('raste') || lowerQ.includes('aage') || lowerQ.includes('kesa hain')) {
      if (savedRoute.origin && savedRoute.destination) {
        reply = `Commander, aapke saved route ${savedRoute.origin} se ${savedRoute.destination} par live data ke mutabiq total distance ${savedRoute.distance} hai aur lagbhag ${savedRoute.duration} ka samay lagega. Traffic filhal nominal hai.`;
      } else {
        reply = "Commander, kripya pehle right side 'Route Setup' button par click karke apna origin aur destination configure karein.";
      }
    } else if (lowerQ.includes('status') || lowerQ.includes('jarvis') || lowerQ.includes('system')) {
      reply = "Arc reactor core 100 percent capacity par hai. Live mapping APIs connected hain.";
    } else {
      reply = `Aadesh sweekar kiya gaya: "${query}".`;
    }

    speakText(reply);
  }, [savedRoute, speakText]);

  // Continuous Listening Setup (Always On)
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
    };
  }, [handleVoiceCommand]);

  const handleSetupWatcher = (e) => {
    e.preventDefault();
    const activeReminders = reminders.filter(r => r.trim() !== '');
    if (activeReminders.length === 0) {
      alert("Kripya kam se kam ek reminder task zaroor darj karein.");
      return;
    }

    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }

    if (watcherIntervalRef.current) clearInterval(watcherIntervalRef.current);

    const intervalMs = Math.max(1, parseInt(watcherIntervalMin) || 5) * 60 * 1000;
    watcherIntervalRef.current = setInterval(() => {
      const randomTask = activeReminders[Math.floor(Math.random() * activeReminders.length)];
      setActiveAlertTask(randomTask);
      speakText(`Dhyan dein Commander, reminder task: ${randomTask}`);
      if (Notification.permission === 'granted') {
        new Notification("Jarvis Full-Screen Watcher", { body: randomTask, icon: "/logo.png" });
      }
    }, intervalMs);

    setWatcherActive(true);
    setShowWatcherModal(false);
    alert(`Watcher system arm ho gaya hai! Har ${watcherIntervalMin} minute mein full screen alert aayega.`);
  };

  const handleStopWatcher = () => {
    if (watcherIntervalRef.current) {
      clearInterval(watcherIntervalRef.current);
      watcherIntervalRef.current = null;
    }
    setWatcherActive(false);
    alert("Watcher system band kar diya gaya hai.");
  };

  // Real API Fetch using OpenStreetMap & OSRM
  const handleCalculateRealRoute = async (e) => {
    e.preventDefault();
    if (!originInput.trim() || !destinationInput.trim()) {
      alert("Kripya dono locations bharein.");
      return;
    }

    setLoadingRoute(true);
    try {
      // 1. Geocode Origin
      const originRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(originInput)}`);
      const originData = await originRes.json();

      // 2. Geocode Destination
      const destRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destinationInput)}`);
      const destData = await destRes.json();

      if (!originData.length || !destData.length) {
        throw new Error("Locations nahi mili. Kripya sahi naam darj karein.");
      }

      const oLat = originData[0].lat;
      const oLon = originData[0].lon;
      const dLat = destData[0].lat;
      const dLon = destData[0].lon;

      // 3. Get Real Route Data via OSRM Free API
      const routeRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${oLon},${oLat};${dLon},${dLat}?overview=false`);
      const routeData = await routeRes.json();

      if (routeData.routes && routeData.routes.length > 0) {
        const distKm = (routeData.routes[0].distance / 1000).toFixed(1) + " KM";
        const durMin = Math.round(routeData.routes[0].duration / 60) + " minutes";

        setSavedRoute({ origin: originInput, destination: destinationInput, distance: distKm, duration: durMin });
        setShowRoutePanel(false);
        speakText(`Route successfully connect ho gaya hai. Distance ${distKm} aur samay ${durMin} lagega.`);
      } else {
        throw new Error("Route calculate nahi ho paya.");
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoadingRoute(false);
    }
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
            <span style={{ fontSize: '10px', color: '#38bdf8' }}>Real API Connected (Live Mode)</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Route Setup Button */}
          <button
            onClick={() => setShowRoutePanel(true)}
            style={{ border: 'none', background: '#1e293b', color: '#38bdf8', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <Navigation size={14} /> Route Setup & Live Map
          </button>

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
            Watcher Task Reminder
          </span>
          <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#f8fafc', maxWidth: '700px', lineHeight: '1.3', marginBottom: '32px' }}>
            "{activeAlertTask}"
          </h1>
          <button
            onClick={() => setActiveAlertTask(null)}
            style={{ padding: '16px 36px', borderRadius: '16px', border: 'none', backgroundColor: '#38bdf8', color: '#030712', fontWeight: '900', fontSize: '16px', cursor: 'pointer', boxShadow: '0 6px 20px rgba(56,189,248,0.5)' }}
          >
            Dismiss Reminder
          </button>
        </div>
      )}

      {/* Right Side Route Setup & Embedded Google Map Drawer */}
      {showRoutePanel && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(3,7,18,0.7)', backdropFilter: 'blur(3px)', zIndex: 150, display: 'flex', justifyContent: 'flex-end', boxSizing: 'border-box' }}>
          <div style={{ backgroundColor: '#0b0f19', width: '100%', maxWidth: '420px', height: '100%', padding: '24px', boxSizing: 'border-box', borderLeft: '1px solid #1e293b', display: 'flex', flexDirection: 'column', color: '#f8fafc', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>Live Route & Google Map</h3>
              <button onClick={() => setShowRoutePanel(false)} style={{ border: 'none', background: '#1e293b', color: '#f8fafc', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCalculateRealRoute} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Origin (Kahan se)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science City Ahmedabad"
                  value={originInput}
                  onChange={(e) => setOriginInput(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #1e293b', backgroundColor: '#030712', color: '#f8fafc', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Destination (Kahan tak)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gift City Gandhinagar"
                  value={destinationInput}
                  onChange={(e) => setDestinationInput(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #1e293b', backgroundColor: '#030712', color: '#f8fafc', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                disabled={loadingRoute}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: '#38bdf8', color: '#030712', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
              >
                {loadingRoute ? "Connecting Live API..." : "Calculate Live Route"}
              </button>
            </form>

            {/* Embedded Google Map iframe for actual navigation/traffic view */}
            <div style={{ flex: 1, minHeight: '260px', borderRadius: '14px', overflow: 'hidden', border: '1px solid #1e293b', backgroundColor: '#030712' }}>
              <iframe
                title="Google Maps Live"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                src={`https://www.google.com/maps/embed/v1/directions?key=AIzaSyD-4gRvVI1Tx8VLADJRifzYN190_FqBbJa&origin=${encodeURIComponent(savedRoute.origin || 'Ahmedabad')} &destination=${encodeURIComponent(savedRoute.destination || 'Gandhinagar')}`}
              ></iframe>
            </div>
          </div>
        </div>
      )}

      {/* Watcher Modal (10 Tasks Setup) */}
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