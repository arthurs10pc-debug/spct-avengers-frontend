import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { 
  Shield, Mic, MicOff, Volume2, VolumeX, Clock, 
  Power, Send, X, Terminal, Radio, Cpu
} from 'lucide-react';

const BACKEND_URL = "https://spct-avengers-backend.onrender.com";
const ADMIN_EMAIL = "arthurs10pc@gmail.com";

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('lonewolf_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [adminEmailInput, setAdminEmailInput] = useState('');
  const [chatLogs, setChatLogs] = useState([
    { sender: 'wolf', text: 'Lone Wolf online. Awaiting your command, Commander. (Try asking: "Traffic kevu chhe?")' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Watcher State for Admin
  const [showWatcherModal, setShowWatcherModal] = useState(false);
  const [watcherTask, setWatcherTask] = useState('');
  const [watcherIntervalMin, setWatcherIntervalMin] = useState(5);
  const [watcherActive, setWatcherActive] = useState(false);
  const watcherIntervalRef = useRef(null);

  const socketRef = useRef(null);
  const chatScrollRef = useRef(null);
  const isAdmin = currentUser?.email === ADMIN_EMAIL;

  const speakText = useCallback((text) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 0.9;
    
    // Auto detect Gujarati or English keywords for accent approximation
    if (text.includes('traffic') || text.includes('raste')) {
      utterance.lang = 'gu-IN';
    } else {
      utterance.lang = 'en-US';
    }

    window.speechSynthesis.speak(utterance);
  }, [isMuted]);

  useEffect(() => {
    socketRef.current = io(BACKEND_URL, { transports: ['websocket', 'polling'] });
    return () => { if (socketRef.current) socketRef.current.disconnect(); };
  }, []);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatLogs]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!adminEmailInput.trim()) return;
    const userObj = { email: adminEmailInput.trim(), name: adminEmailInput.split('@')[0] };
    setCurrentUser(userObj);
    localStorage.setItem('lonewolf_user', JSON.stringify(userObj));
  };

  const handleLogout = () => {
    localStorage.removeItem('lonewolf_user');
    setCurrentUser(null);
  };

  const handleSendCommand = async (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const query = userInput.trim();
    setUserInput('');
    setChatLogs(prev => [...prev, { sender: 'user', text: query }]);

    let reply = "Command acknowledged, Commander. Processing telemetry...";
    const lowerQ = query.toLowerCase();

    if (lowerQ.includes('traffic') || lowerQ.includes('kevu chhe') || lowerQ.includes('raste')) {
      reply = "Raste par aage traffic normal chhe. Office pahochva mate lagbhag 14 minutes lagse. Safe drive rakhjo!";
    } else if (lowerQ.includes('status') || lowerQ.includes('system')) {
      reply = "All subsystems operational. Lone Wolf security protocols fully armed.";
    } else if (lowerQ.includes('hello') || lowerQ.includes('kem cho')) {
      reply = "Kem cho Commander! Lone Wolf is ready for your instructions.";
    } else {
      reply = `Directive received: "${query}". Executing protocols now.`;
    }

    setTimeout(() => {
      setChatLogs(prev => [...prev, { sender: 'wolf', text: reply }]);
      speakText(reply);
    }, 500);
  };

  const toggleListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Speech recognition is not supported in this browser. Please type your command.");
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'gu-IN'; // Supports Gujarati & English speech input

    if (!isListening) {
      setIsListening(true);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setUserInput(transcript);
        setIsListening(false);
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
    if (!watcherTask.trim()) return;

    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }

    if (watcherIntervalRef.current) clearInterval(watcherIntervalRef.current);

    const intervalMs = Math.max(1, parseInt(watcherIntervalMin) || 5) * 60 * 1000;
    watcherIntervalRef.current = setInterval(() => {
      speakText(`Reminder: ${watcherTask}`);
      if (Notification.permission === 'granted') {
        new Notification("Lone Wolf Watcher", { body: watcherTask, icon: "/logo.png" });
      }
    }, intervalMs);

    setWatcherActive(true);
    setShowWatcherModal(false);
    alert(`Lone Wolf Watcher armed! Reminding every ${watcherIntervalMin} minutes.`);
  };

  const handleStopWatcher = () => {
    if (watcherIntervalRef.current) {
      clearInterval(watcherIntervalRef.current);
      watcherIntervalRef.current = null;
    }
    setWatcherActive(false);
    alert("Watcher disarmed.");
  };

  if (!currentUser) {
    return (
      <div style={{ height: '100vh', width: '100vw', backgroundColor: '#090d16', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', padding: '16px', boxSizing: 'border-box' }}>
        <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '24px', padding: '32px', maxWidth: '380px', width: '100%', textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.7)', boxSizing: 'border-box' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '20px', backgroundColor: '#38bdf8', color: '#090d16', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            <Shield size={32} />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#f8fafc', margin: '0 0 4px 0' }}>LONE WOLF</h1>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '24px' }}>AI Personal Assistant Interface</p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input 
              type="email"
              required
              placeholder="Enter Commander Email..."
              value={adminEmailInput}
              onChange={(e) => setAdminEmailInput(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #374151', backgroundColor: '#090d16', color: '#f8fafc', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
            />
            <button
              type="submit"
              style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: '#38bdf8', color: '#090d16', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
            >
              Initialize System
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', width: '100vw', backgroundColor: '#090d16', color: '#f8fafc', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif', overflow: 'hidden', boxSizing: 'border-box' }}>
      
      {/* Header */}
      <header style={{ padding: '14px 20px', backgroundColor: '#111827', borderBottom: '1px solid #1f2937', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#38bdf8', color: '#090d16', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={20} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '15px', fontWeight: '900', letterSpacing: '0.5px' }}>LONE WOLF AI</h1>
            <span style={{ fontSize: '10px', color: '#38bdf8' }}>Commander: {currentUser.email}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isAdmin && (
            <button
              onClick={() => { if (!watcherActive) setShowWatcherModal(true); else handleStopWatcher(); }}
              style={{ border: 'none', background: watcherActive ? '#059669' : '#38bdf8', color: '#090d16', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <Clock size={14} /> {watcherActive ? "Watcher Active" : "Watcher"}
            </button>
          )}

          <button onClick={() => setIsMuted(!isMuted)} title={isMuted ? "Unmute Voice" : "Mute Voice"} style={{ border: 'none', background: '#1f2937', color: '#38bdf8', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}>
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>

          <button onClick={handleLogout} title="Disconnect" style={{ border: 'none', background: '#7f1d1d', color: '#fecaca', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}>
            <Power size={16} />
          </button>
        </div>
      </header>

      {/* Main Terminal Chat Area */}
      <main ref={chatScrollRef} style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', boxSizing: 'border-box', maxWidth: '900px', width: '100%', margin: '0 auto' }}>
        {chatLogs.map((log, idx) => (
          <div key={idx} style={{ alignSelf: log.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%', backgroundColor: log.sender === 'user' ? '#0369a1' : '#111827', border: '1px solid #1f2937', borderRadius: '14px', padding: '12px 16px', fontSize: '13px', lineHeight: '1.5', boxSizing: 'border-box' }}>
            <div style={{ fontSize: '9px', color: '#94a3b8', marginBottom: '2px', textTransform: 'uppercase', fontWeight: '800' }}>
              {log.sender === 'user' ? 'Commander' : 'Lone Wolf'}
            </div>
            {log.text}
          </div>
        ))}
      </main>

      {/* Command Input Bar */}
      <footer style={{ padding: '14px 16px', backgroundColor: '#111827', borderTop: '1px solid #1f2937', flexShrink: 0, boxSizing: 'border-box' }}>
        <form onSubmit={handleSendCommand} style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', gap: '10px', boxSizing: 'border-box' }}>
          <button
            type="button"
            onClick={toggleListening}
            style={{ border: 'none', background: isListening ? '#dc2626' : '#1f2937', color: isListening ? '#ffffff' : '#38bdf8', padding: '12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          <input 
            type="text"
            placeholder="Ask Lone Wolf (e.g. Traffic kevu chhe?)..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1px solid #1f2937', backgroundColor: '#090d16', color: '#f8fafc', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
          />

          <button
            type="submit"
            style={{ border: 'none', background: '#38bdf8', color: '#090d16', padding: '0 18px', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Send size={16} />
          </button>
        </form>
      </footer>

      {/* Watcher Setup Modal */}
      {showWatcherModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(9,13,22,0.85)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
          <div style={{ backgroundColor: '#111827', borderRadius: '24px', padding: '24px', width: '100%', maxWidth: '380px', position: 'relative', border: '1px solid #1f2937', color: '#f8fafc', boxSizing: 'border-box' }}>
            <button onClick={() => setShowWatcherModal(false)} style={{ position: 'absolute', top: '14px', right: '14px', border: 'none', background: '#1f2937', color: '#f8fafc', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={15} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#38bdf8', color: '#090d16', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>Setup Task Watcher</h3>
            </div>

            <form onSubmit={handleSetupWatcher} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Task to Remember</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Check office departure schedule"
                  value={watcherTask}
                  onChange={(e) => setWatcherTask(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #1f2937', backgroundColor: '#090d16', color: '#f8fafc', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Remind every (minutes)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={watcherIntervalMin}
                  onChange={(e) => setWatcherIntervalMin(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #1f2937', backgroundColor: '#090d16', color: '#f8fafc', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: '#38bdf8', color: '#090d16', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
              >
                Arm Watcher
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}