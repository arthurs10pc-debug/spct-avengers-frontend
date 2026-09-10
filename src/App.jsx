import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import confetti from 'canvas-confetti';
import { 
  Bike, UserCheck, Check, Phone, ArrowRight, ArrowLeft,
  MapPin, LogOut, MessageCircle, AlertCircle, X, 
  Navigation, Trash2, ChevronDown, Clock, Crown, Compass, Radio, RotateCw,
  Crosshair, ShieldCheck, Map, History, Send, Bell, AlertTriangle
} from 'lucide-react';

const BACKEND_URL = "https://spct-avengers-backend.onrender.com";
const ADMIN_EMAIL = "arthurs10pc@gmail.com";
const GOOGLE_CLIENT_ID = "644760404837-q0g258ajc1r1vjo8jqtru2c1cc11q1n7.apps.googleusercontent.com";
const PUBLIC_VAPID_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-8vMeAtA5cHmDkJ0d8Q9cW4vG0mJ5M3Q5lK0P8vWq6X5LwG0J7j6W0Yg';

const DEFAULT_CENTER = { lat: 23.0880, lng: 72.5350 };

const PRESET_LOCATIONS = [
  "Vaishnodevi Circle",
  "Silver Oak University",
  "Thaltej",
  "Iskon circle",
  "Tambul",
  "Zundal Circle",
  "Kathiyavadi Pan Parlour"
];

const QUICK_CHAT_PRESETS = [
  "At pickup location",
  "2 minutes away",
  "Where are you?",
  "Running slightly late",
  "En route to destination"
];

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(2);
};

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
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('spct_user');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (parsed && (parsed.name || parsed.email)) return parsed;
      return null;
    } catch {
      return null;
    }
  });

  const [selectedRole, setSelectedRole] = useState('ride_taker');
  const [authTab, setAuthTab] = useState('login');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showRadarPage, setShowRadarPage] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [tempGoogleUser, setTempGoogleUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [fromLoc, setFromLoc] = useState('');
  const [toLoc, setToLoc] = useState('');
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('');

  const [rides, setRides] = useState([]);
  const [bikersList, setBikersList] = useState([]);
  const [matchedRide, setMatchedRide] = useState(null);
  const [completedTripsHistory, setCompletedTripsHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('spct_trip_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [chatMessages, setChatMessages] = useState([]);
  const [customChatMessage, setCustomChatMessage] = useState('');
  const [glassNotification, setGlassNotification] = useState(null);

  const [userLocation, setUserLocation] = useState(DEFAULT_CENTER);
  const [liveNearbyRiders, setLiveNearbyRiders] = useState([]);
  const [isRefreshingRadar, setIsRefreshingRadar] = useState(false);
  const [selectedRiderDetail, setSelectedRiderDetail] = useState(null);

  const socketRef = useRef(null);
  const googleBtnRef = useRef(null);
  const fromContainerRef = useRef(null);
  const toContainerRef = useRef(null);
  const swRegistrationRef = useRef(null);

  const isAdmin = currentUser?.email === ADMIN_EMAIL;
  const isBiker = currentUser?.role === 'biker';

  const bikersWithin2Km = liveNearbyRiders
    .filter(r => r && r.userId !== currentUser?._id)
    .map(r => {
      const distance = userLocation 
        ? calculateDistanceKm(userLocation.lat, userLocation.lng, r.lat, r.lng)
        : '0.4';
      return { ...r, distance: distance || '0.5' };
    })
    .filter(r => parseFloat(r.distance) <= 2.0);

  const riderAcceptedRide = isBiker && rides.length > 0
    ? rides.find(r => r && r.status === 'accepted' && r.acceptedBy?.phone === currentUser?.phone)
    : null;

  const unacceptedRidesForBikers = rides.filter(r => r && r.status !== 'accepted');

  const playNotificationTone = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  }, []);

  const triggerGlassNotification = useCallback((title, message) => {
    playNotificationTone();
    setGlassNotification({ title, message, id: Date.now() });
    setTimeout(() => {
      setGlassNotification(null);
    }, 4500);
  }, [playNotificationTone]);

  useEffect(() => {
    try {
      localStorage.setItem('spct_trip_history', JSON.stringify(completedTripsHistory));
    } catch (e) {}
  }, [completedTripsHistory]);

  // Automatic Notification Permission & Service Worker Registration
  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.register('/sw.js').then(async (reg) => {
        swRegistrationRef.current = reg;
        try {
          if ('Notification' in window && Notification.permission === 'default') {
            await Notification.requestPermission();
          }
          if (Notification.permission === 'granted') {
            let subscription = await reg.pushManager.getSubscription();
            if (!subscription) {
              subscription = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
              });
            }
            await axios.post(`${BACKEND_URL}/api/save-subscription`, subscription).catch(() => {});
          }
        } catch (e) {}
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (fromContainerRef.current && !fromContainerRef.current.contains(e.target)) {
        setShowFromDropdown(false);
      }
      if (toContainerRef.current && !toContainerRef.current.contains(e.target)) {
        setShowToDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchLiveGPS = useCallback(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(coords);

          if (isBiker && socketRef.current && currentUser) {
            socketRef.current.emit('update_rider_gps', {
              userId: currentUser._id,
              name: currentUser.name,
              phone: currentUser.phone,
              avatar: currentUser.avatar,
              lat: coords.lat,
              lng: coords.lng
            });
          }
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }, [isBiker, currentUser]);

  useEffect(() => {
    fetchLiveGPS();
    const interval = setInterval(fetchLiveGPS, 8000);
    return () => clearInterval(interval);
  }, [fetchLiveGPS]);

  useEffect(() => {
    socketRef.current = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000
    });

    socketRef.current.on('connect', () => {
      fetchLiveGPS();
    });

    axios.get(`${BACKEND_URL}/api/rides`)
      .then(res => setRides(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});

    if (isAdmin) {
      axios.get(`${BACKEND_URL}/api/admin/bikers`)
        .then(res => setBikersList(Array.isArray(res.data) ? res.data : []))
        .catch(() => {});
    }

    socketRef.current.on('new_ride_broadcast', (newRide) => {
      if (newRide) {
        setRides(prev => [newRide, ...prev]);
        triggerGlassNotification("New Ride Request", `Passenger heading from ${newRide.fromLocation}`);
      }
    });

    socketRef.current.on('all_rides_cleared', () => {
      setRides([]);
    });

    socketRef.current.on('ride_deleted_broadcast', (deletedId) => {
      setRides(prev => prev.filter(r => r && r._id !== deletedId));
    });

    socketRef.current.on('nearby_riders_update', (ridersList) => {
      setLiveNearbyRiders(Array.isArray(ridersList) ? ridersList : []);
    });

    socketRef.current.on('ride_accepted_broadcast', (updatedRide) => {
      if (!updatedRide) return;
      setRides(prev => prev.map(r => r && r._id === updatedRide._id ? updatedRide : r));
      try {
        const localUser = JSON.parse(localStorage.getItem('spct_user') || '{}');
        if (localUser && (localUser._id === updatedRide.creatorId || localUser.phone === updatedRide.acceptedBy?.phone)) {
          setMatchedRide(updatedRide);
          triggerGlassNotification("Ride Confirmation", `${updatedRide.fromLocation} to ${updatedRide.toLocation}`);
          confetti({ particleCount: 75, spread: 80, origin: { y: 0.6 } });
        }
      } catch (e) {}
    });

    socketRef.current.on('receive_in_app_chat', (msg) => {
      if (msg) {
        setChatMessages(prev => [...prev, msg]);
        triggerGlassNotification(`Message from ${msg.senderName || 'Partner'}`, msg.text);
      }
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [isAdmin, triggerGlassNotification, fetchLiveGPS]);

  const handleRefreshRadar = () => {
    setIsRefreshingRadar(true);
    fetchLiveGPS();
    if (socketRef.current) {
      socketRef.current.emit('request_riders_refresh');
    }
    setTimeout(() => {
      setIsRefreshingRadar(false);
    }, 700);
  };

  const handleGoogleCallback = async (response) => {
    setErrorMsg('');
    setAuthLoading(true);

    try {
      const decoded = parseJwt(response.credential);
      if (!decoded || !decoded.email) {
        throw new Error("Unable to parse Google authentication token.");
      }

      const googleData = {
        fullName: decoded.name || 'Hostel Student',
        email: decoded.email,
        avatar: decoded.picture || '',
        role: selectedRole
      };

      if (authTab === 'login') {
        const res = await axios.post(`${BACKEND_URL}/api/auth/google-login`, {
          ...googleData,
          mode: 'login'
        });

        if (res.data && res.data.success && res.data.user) {
          setCurrentUser(res.data.user);
          localStorage.setItem('spct_user', JSON.stringify(res.data.user));
          setShowAuthModal(false);
          setTempGoogleUser(null);
          triggerGlassNotification("Authentication Successful", `Welcome back, ${res.data.user.name}`);
        }
      } else {
        setTempGoogleUser(googleData);
      }
    } catch (err) {
      const serverMsg = err.response?.data?.error;
      const status = err.response?.status;
      setErrorMsg(`Server [${status || 'Error'}]: ${serverMsg || err.message}`);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    if (!showAuthModal || tempGoogleUser) return;

    const initializeGoogleSignIn = () => {
      if (window.google && googleBtnRef.current) {
        googleBtnRef.current.innerHTML = "";
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback,
          auto_select: false
        });

        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          width: 280,
          text: authTab === 'login' ? 'signin_with' : 'signup_with',
          shape: 'pill'
        });
      }
    };

    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleSignIn;
      document.body.appendChild(script);
    } else {
      initializeGoogleSignIn();
    }
  }, [showAuthModal, authTab, tempGoogleUser]);

  const handleCompleteAuth = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanPhone = phoneInput.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number");
      return;
    }

    setAuthLoading(true);

    try {
      const res = await axios.post(`${BACKEND_URL}/api/auth/google-login`, {
        ...tempGoogleUser,
        phone: cleanPhone,
        role: selectedRole,
        mode: 'signup'
      });

      if (res.data && res.data.success && res.data.user) {
        setCurrentUser(res.data.user);
        localStorage.setItem('spct_user', JSON.stringify(res.data.user));
        setShowAuthModal(false);
        setTempGoogleUser(null);
        triggerGlassNotification("Registration Complete", "Welcome to SPCT Avengers Hub");
      }
    } catch (err) {
      const serverMsg = err.response?.data?.error;
      const status = err.response?.status;
      setErrorMsg(`Server [${status || 'Error'}]: ${serverMsg || err.message}`);
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePostRide = (e) => {
    e.preventDefault();
    if (!fromLoc.trim() || !toLoc.trim() || !currentUser) return;

    const departureInfo = isScheduled && scheduleTime 
      ? `Scheduled: ${scheduleTime.replace('T', ' ')}` 
      : 'Leaving Now';

    const payload = {
      creatorId: currentUser._id,
      creatorName: currentUser.name,
      creatorPhone: currentUser.phone || '',
      creatorRole: currentUser.role,
      fromLocation: fromLoc.trim(),
      toLocation: `${toLoc.trim()} (${departureInfo})`
    };

    if (socketRef.current) {
      socketRef.current.emit('post_ride', payload);
    }

    setFromLoc('');
    setToLoc('');
    setIsScheduled(false);
    setScheduleTime('');
    setShowFromDropdown(false);
    setShowToDropdown(false);
    triggerGlassNotification("Ride Posted", "Nearby pilots have been notified.");
  };

  const handleAcceptRide = (ride) => {
    if (!currentUser || ride.status === 'accepted') return;
    if (ride.creatorId === currentUser._id) {
      alert("This is your own ride request.");
      return;
    }

    if (socketRef.current) {
      socketRef.current.emit('accept_ride', {
        rideId: ride._id,
        accepter: {
          name: currentUser.name,
          phone: currentUser.phone || '',
          role: currentUser.role
        }
      });
    }
  };

  const handleDeleteRide = async (rideId, rideObj) => {
    if (!window.confirm("Complete and finalize this trip?")) return;
    try {
      if (rideObj) {
        const tripEntry = {
          id: rideObj._id || Date.now(),
          route: `${rideObj.fromLocation} to ${rideObj.toLocation}`,
          date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          kmSaved: (Math.random() * 4 + 1.5).toFixed(1),
          partner: rideObj.creatorName === currentUser?.name ? (rideObj.acceptedBy?.name || 'Pooled Student') : rideObj.creatorName
        };
        setCompletedTripsHistory(prev => [tripEntry, ...prev]);
      }

      await axios.delete(`${BACKEND_URL}/api/rides/${rideId}`);
      setRides(prev => prev.filter(r => r && r._id !== rideId));
      if (matchedRide?._id === rideId) setMatchedRide(null);
      triggerGlassNotification("Trip Finalized", "Recorded to your commuting history.");
    } catch (err) {
      alert("Operation failed: " + err.message);
    }
  };

  const handleClearAllRides = async () => {
    if (!window.confirm("Clear all active requests?")) return;
    try {
      await axios.delete(`${BACKEND_URL}/api/rides/clear-all`);
      setRides([]);
    } catch (err) {
      alert("Failed to clear: " + err.message);
    }
  };

  const handleSendPermissionAlert = async (bikerEmail, bikerPhone) => {
    try {
      await axios.post(`${BACKEND_URL}/api/admin/send-alert`, {
        targetEmail: bikerEmail,
        targetPhone: bikerPhone,
        title: "Action Required: Enable Notifications",
        body: "Please enable browser notifications to receive active ride requests instantly."
      });
      alert("Notification warning sent successfully to the rider.");
    } catch (err) {
      alert("Failed to send alert: " + (err.response?.data?.error || err.message));
    }
  };

  const handleSendChatMessage = (textToSend) => {
    if (!textToSend || !textToSend.trim() || !matchedRide) return;
    const msgPayload = {
      rideId: matchedRide._id,
      senderName: currentUser.name,
      text: textToSend.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    if (socketRef.current) {
      socketRef.current.emit('send_in_app_chat', msgPayload);
    }
    setChatMessages(prev => [...prev, msgPayload]);
    setCustomChatMessage('');
  };

  const handleLogout = () => {
    localStorage.removeItem('spct_user');
    setCurrentUser(null);
  };

  const totalKmSavedSum = completedTripsHistory.reduce((acc, curr) => acc + parseFloat(curr.kmSaved || 0), 0).toFixed(1);

  if (showRadarPage) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#fdfdfd', color: '#000000', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        
        <style>{`
          @keyframes radarSweep {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .fighter-sweep-beam {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 260px;
            height: 260px;
            margin-top: -130px;
            margin-left: -130px;
            background: conic-gradient(from 0deg at 50% 50%, rgba(104, 216, 216, 0.5) 0deg, rgba(104, 216, 216, 0.0) 65deg, transparent 360deg);
            border-radius: 50%;
            animation: radarSweep 3.2s linear infinite;
            pointer-events: none;
            transform-origin: center center;
          }
        `}</style>

        <div style={{ padding: '16px', maxWidth: '1100px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc', padding: '12px 20px', borderRadius: '22px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
            <button
              onClick={() => setShowRadarPage(false)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: '#68D8D8', color: '#000000', padding: '10px 18px', borderRadius: '14px', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
            >
              <ArrowLeft size={16} /> Back to Dashboard
            </button>

            <button
              onClick={handleRefreshRadar}
              disabled={isRefreshingRadar}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#68D8D8',
                color: '#000000',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '14px',
                fontWeight: '800',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              <RotateCw size={15} style={{ animation: isRefreshingRadar ? 'spin 1s linear infinite' : 'none' }} />
              <span>{isRefreshingRadar ? 'Scanning...' : 'Refresh Radar'}</span>
            </button>
          </div>
        </div>

        <div style={{ padding: '0 16px 14px 16px', maxWidth: '1100px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
          <div style={{ backgroundColor: '#f8fafc', border: '2px solid #68D8D8', padding: '16px 20px', borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#000000' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: '800', backgroundColor: '#68D8D8', padding: '4px 12px', borderRadius: '9999px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Active Geofence
              </span>
              <h2 style={{ margin: '8px 0 2px 0', fontSize: '20px', fontWeight: '900' }}>Live Radar Tracking</h2>
            </div>
            <div style={{ backgroundColor: '#68D8D8', border: '2px solid #000', padding: '8px 16px', borderRadius: '14px', textAlign: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}>Online Pilots</span>
              <p style={{ margin: 0, fontSize: '18px', fontWeight: '900' }}>{bikersWithin2Km.length}</p>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, position: 'relative', width: '100%', maxWidth: '1100px', margin: '0 auto 16px auto', padding: '0 16px', boxSizing: 'border-box', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '100%', height: '420px', backgroundColor: '#f8fafc', borderRadius: '28px', border: '2px solid #68D8D8', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            
            <div style={{ position: 'absolute', width: '340px', height: '340px', borderRadius: '50%', border: '1px dashed rgba(104,216,216,0.6)' }} />
            <div style={{ position: 'absolute', width: '220px', height: '220px', borderRadius: '50%', border: '1px dashed rgba(104,216,216,0.7)' }} />
            <div style={{ position: 'absolute', width: '100px', height: '100px', borderRadius: '50%', border: '1px dashed rgba(104,216,216,0.8)' }} />
            
            <div className="fighter-sweep-beam" />

            <div style={{ width: '20px', height: '20px', backgroundColor: '#000', borderRadius: '50%', boxShadow: '0 0 15px #68D8D8', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '6px', height: '6px', backgroundColor: '#68D8D8', borderRadius: '50%' }} />
            </div>

            {bikersWithin2Km.length === 0 ? (
              <div style={{ position: 'absolute', zIndex: 20, textAlign: 'center', backgroundColor: '#ffffff', padding: '16px 24px', borderRadius: '16px', border: '2px solid #68D8D8' }}>
                <Compass size={28} color="#000" style={{ margin: '0 auto 6px auto', animation: 'spin 4s linear infinite' }} />
                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '900' }}>Scanning Radius (2 KM)...</h4>
              </div>
            ) : (
              bikersWithin2Km.map((biker, idx) => {
                const angle = (idx * 90) * (Math.PI / 180);
                const radius = 100 + (idx * 25);
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedRiderDetail(biker)}
                    style={{
                      position: 'absolute',
                      transform: `translate(${x}px, ${y}px)`,
                      zIndex: 20,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ backgroundColor: '#68D8D8', padding: '6px', borderRadius: '50%', border: '2px solid #000000' }}>
                      <Bike size={18} color="#000000" />
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: '800', backgroundColor: '#fff', padding: '2px 6px', borderRadius: '6px', marginTop: '3px', border: '1px solid #68D8D8' }}>
                      {biker.distance} KM
                    </span>
                  </div>
                );
              })
            )}

            {selectedRiderDetail && (
              <div style={{ position: 'absolute', bottom: '16px', left: '16px', right: '16px', maxWidth: '320px', margin: '0 auto', zIndex: 50, backgroundColor: '#ffffff', borderRadius: '20px', padding: '16px', border: '2px solid #68D8D8', textAlign: 'center' }}>
                <h4 style={{ margin: '0 0 2px 0', fontSize: '15px', fontWeight: '900' }}>{selectedRiderDetail.name}</h4>
                <p style={{ margin: '0 0 12px 0', fontSize: '11px', color: '#334155', fontWeight: '700' }}>Distance: {selectedRiderDetail.distance} KM away</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <a href={`tel:${selectedRiderDetail.phone}`} style={{ padding: '8px', borderRadius: '10px', backgroundColor: '#68D8D8', color: '#000', fontWeight: '800', fontSize: '12px', textDecoration: 'none' }}>Call Pilot</a>
                  <a href={`https://wa.me/91${selectedRiderDetail.phone}`} target="_blank" rel="noreferrer" style={{ padding: '8px', borderRadius: '10px', backgroundColor: '#000', color: '#68D8D8', fontWeight: '800', fontSize: '12px', textDecoration: 'none' }}>WhatsApp</a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#fdfdfd', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ width: '100%', maxWidth: '420px', textAlign: 'center' }}>
          
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
            <img 
              src="/logo.png" 
              alt="Logo" 
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
              style={{ width: '80px', height: '80px', objectFit: 'contain' }} 
            />
          </div>

          <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#000000', margin: '0 0 4px 0' }}>SPCT AVENGERS</h1>
          <p style={{ fontSize: '13px', color: '#334155', fontWeight: '800', marginBottom: '28px' }}>Campus Ride-Pooling System</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <button
              onClick={() => { setSelectedRole('biker'); setShowAuthModal(true); setErrorMsg(''); setTempGoogleUser(null); }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', backgroundColor: '#f8fafc', border: '2px solid #68D8D8', borderRadius: '26px', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '16px', backgroundColor: '#68D8D8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
                  <Bike size={24} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900' }}>I Have a Bike</h3>
                  <span style={{ fontSize: '12px', color: '#334155', fontWeight: '700' }}>Register as Rider / Pilot</span>
                </div>
              </div>
              <ArrowRight size={20} color="#000" />
            </button>

            <button
              onClick={() => { setSelectedRole('ride_taker'); setShowAuthModal(true); setErrorMsg(''); setTempGoogleUser(null); }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', backgroundColor: '#f8fafc', border: '2px solid #68D8D8', borderRadius: '26px', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '16px', backgroundColor: '#68D8D8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
                  <UserCheck size={24} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900' }}>Need a Ride</h3>
                  <span style={{ fontSize: '12px', color: '#334155', fontWeight: '700' }}>Register as Passenger</span>
                </div>
              </div>
              <ArrowRight size={20} color="#000" />
            </button>

            <button
              onClick={() => setShowRadarPage(true)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', backgroundColor: '#000000', border: '2px solid #68D8D8', borderRadius: '26px', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '16px', backgroundColor: '#68D8D8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
                  <Radio size={24} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#fff' }}>Live GPS Radar</h3>
                  <span style={{ fontSize: '12px', color: '#68D8D8', fontWeight: '700' }}>Track 2 KM Radius</span>
                </div>
              </div>
              <ArrowRight size={20} color="#68D8D8" />
            </button>
          </div>
        </div>

        {showAuthModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div style={{ backgroundColor: '#fff', borderRadius: '32px', padding: '24px', width: '100%', maxWidth: '360px', position: 'relative', textAlign: 'center', border: '2px solid #68D8D8' }}>
              <button onClick={() => { setShowAuthModal(false); setTempGoogleUser(null); }} style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: '#f1f5f9', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>

              {!tempGoogleUser && (
                <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '16px', marginBottom: '16px' }}>
                  <button onClick={() => { setAuthTab('login'); setErrorMsg(''); }} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '900', fontSize: '12px', backgroundColor: authTab === 'login' ? '#68D8D8' : 'transparent', color: '#000' }}>Login</button>
                  <button onClick={() => { setAuthTab('signup'); setErrorMsg(''); }} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '900', fontSize: '12px', backgroundColor: authTab === 'signup' ? '#68D8D8' : 'transparent', color: '#000' }}>Register</button>
                </div>
              )}

              <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#000', margin: '0 0 4px 0' }}>
                {tempGoogleUser ? "Contact Details" : (authTab === 'login' ? "Welcome Back" : "Create Account")}
              </h2>
              <p style={{ fontSize: '12px', color: '#334155', fontWeight: '700', marginBottom: '20px' }}>
                {tempGoogleUser ? "Enter mobile number for ride connection" : "Sign in using Google"}
              </p>

              {errorMsg && (
                <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '11px', padding: '10px 14px', borderRadius: '12px', marginBottom: '14px', textAlign: 'left' }}>
                  {errorMsg}
                </div>
              )}

              {!tempGoogleUser ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50px' }}>
                  <div ref={googleBtnRef}></div>
                  {authLoading && <p style={{ fontSize: '12px', color: '#000', fontWeight: 'bold', marginTop: '10px' }}>Authenticating...</p>}
                </div>
              ) : (
                <form onSubmit={handleCompleteAuth} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1.5px solid #68D8D8' }}>
                    {tempGoogleUser.avatar ? (
                      <img src={tempGoogleUser.avatar} alt="User" style={{ width: '38px', height: '38px', borderRadius: '50%' }} />
                    ) : (
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#68D8D8', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        {tempGoogleUser.fullName.charAt(0)}
                      </div>
                    )}
                    <div style={{ overflow: 'hidden' }}>
                      <p style={{ margin: 0, fontSize: '12px', fontWeight: 'bold', color: '#000' }}>{tempGoogleUser.fullName}</p>
                      <p style={{ margin: 0, fontSize: '10px', color: '#334155' }}>{tempGoogleUser.email}</p>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '900', color: '#000', display: 'block', marginBottom: '4px' }}>10-Digit Mobile Number</label>
                    <input 
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="9876543210"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: '14px', border: '2px solid #68D8D8', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    style={{ width: '100%', padding: '14px', borderRadius: '14px', border: 'none', backgroundColor: '#68D8D8', color: '#000', fontWeight: '900', fontSize: '13px', cursor: 'pointer' }}
                  >
                    {authLoading ? "Saving..." : "Complete & Enter Hub"}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#fdfdfd', padding: '16px', boxSizing: 'border-box', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '32px', border: '3px solid #000', overflow: 'hidden' }}>
          <header style={{ padding: '18px 24px', backgroundColor: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '14px', backgroundColor: '#68D8D8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
                <Crown size={24} />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '900' }}>MASTER ADMIN DASHBOARD</h1>
                <span style={{ fontSize: '11px', color: '#68D8D8', fontWeight: '600' }}>{currentUser.email}</span>
              </div>
            </div>

            <button onClick={handleLogout} style={{ border: 'none', background: '#334155', color: '#fff', padding: '8px 14px', borderRadius: '12px', cursor: 'pointer', fontSize: '12px', fontWeight: '800' }}>
              Logout
            </button>
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 340px) 1fr minmax(300px, 360px)', minHeight: '700px' }}>
            
            <div style={{ borderRight: '3px solid #000', padding: '20px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '2px solid #68D8D8', paddingBottom: '10px' }}>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#000' }}>Registered Riders</h2>
                <span style={{ fontSize: '11px', fontWeight: '900', backgroundColor: '#68D8D8', color: '#000', padding: '3px 10px', borderRadius: '8px' }}>
                  {bikersList.length} Active
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', flex: 1, maxHeight: '600px' }}>
                {bikersList.map((b) => (
                  <div key={b._id} style={{ backgroundColor: '#fff', border: '2px solid #68D8D8', borderRadius: '18px', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '12px', backgroundColor: '#68D8D8', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', shrink: 0 }}>
                        <Bike size={20} />
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: '900', truncate: true }}>{b.fullName}</p>
                        <p style={{ margin: 0, fontSize: '11px', color: '#334155', fontFamily: 'monospace' }}>{b.phone || 'No phone'}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSendPermissionAlert(b.email, b.phone)}
                      title="Send Notification Permission Reminder"
                      style={{
                        backgroundColor: '#fef2f2',
                        border: '1.5px solid #fecaca',
                        color: '#dc2626',
                        padding: '8px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        shrink: 0
                      }}
                    >
                      <AlertTriangle size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: '24px', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ borderBottom: '2px solid #68D8D8', paddingBottom: '10px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#000' }}>Operations & Metrics</h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                <div style={{ backgroundColor: '#f8fafc', border: '2px solid #68D8D8', padding: '16px', borderRadius: '20px', textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: '900', color: '#334155' }}>TOTAL RIDES</span>
                  <p style={{ margin: '6px 0 0 0', fontSize: '28px', fontWeight: '900', color: '#000' }}>{rides.length}</p>
                </div>
                <div style={{ backgroundColor: '#f8fafc', border: '2px solid #68D8D8', padding: '16px', borderRadius: '20px', textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: '900', color: '#334155' }}>MATCHED</span>
                  <p style={{ margin: '6px 0 0 0', fontSize: '28px', fontWeight: '900', color: '#000' }}>{rides.filter(r => r.status === 'accepted').length}</p>
                </div>
                <div style={{ backgroundColor: '#f8fafc', border: '2px solid #68D8D8', padding: '16px', borderRadius: '20px', textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: '900', color: '#334155' }}>PENDING</span>
                  <p style={{ margin: '6px 0 0 0', fontSize: '28px', fontWeight: '900', color: '#000' }}>{rides.filter(r => r.status !== 'accepted').length}</p>
                </div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', border: '2px solid #68D8D8', borderRadius: '24px', padding: '20px' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '900', color: '#000' }}>System Maintenance</h3>
                <button
                  onClick={handleClearAllRides}
                  style={{ width: '100%', padding: '14px 18px', borderRadius: '16px', border: 'none', backgroundColor: '#dc2626', color: '#ffffff', fontWeight: '900', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <Trash2 size={16} /> Flush All Active Requests
                </button>
              </div>
            </div>

            <div style={{ borderLeft: '3px solid #000', padding: '20px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '2px solid #68D8D8', paddingBottom: '10px' }}>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#000' }}>Live Commute Stream</h2>
                <span style={{ fontSize: '11px', fontWeight: '900', backgroundColor: '#68D8D8', color: '#000', padding: '3px 10px', borderRadius: '8px' }}>
                  {rides.length} Active
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', flex: 1, maxHeight: '600px' }}>
                {rides.map((r) => (
                  <div key={r._id} style={{ backgroundColor: '#ffffff', border: '2px solid #68D8D8', borderRadius: '18px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '13px', fontWeight: '900', color: '#000' }}>{r.creatorName}</span>
                      <button onClick={() => handleDeleteRide(r._id)} style={{ border: 'none', background: '#fef2f2', color: '#dc2626', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div style={{ fontSize: '11px', color: '#334155', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{r.fromLocation}</span>
                      <ArrowRight size={12} color="#000" />
                      <span>{r.toLocation}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fdfdfd', padding: '16px', boxSizing: 'border-box', fontFamily: 'system-ui, -apple-system, sans-serif', position: 'relative' }}>
      
      {glassNotification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 999,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(12px)',
          border: '1.5px solid #68D8D8',
          borderRadius: '20px',
          padding: '14px 20px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          maxWidth: '360px'
        }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '12px', backgroundColor: '#68D8D8', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bell size={20} />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '900', color: '#000' }}>{glassNotification.title}</h4>
            <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#334155', fontWeight: '700', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{glassNotification.message}</p>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '1080px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '32px', boxShadow: '0 20px 45px rgba(0,0,0,0.06)', border: '2px solid #68D8D8', overflow: 'hidden' }}>
        
        <header style={{ padding: '16px 24px', borderBottom: '2px solid #68D8D8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {currentUser?.avatar ? (
              <img src={currentUser.avatar} alt="Avatar" style={{ width: '42px', height: '42px', borderRadius: '14px', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '42px', height: '42px', borderRadius: '14px', backgroundColor: '#68D8D8', color: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '15px' }}>
                {currentUser?.name?.charAt(0) || 'U'}
              </div>
            )}
            <div>
              <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: '#000000' }}>{currentUser?.name || 'User'}</h2>
              <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', color: '#000', backgroundColor: '#68D8D8', padding: '2px 8px', borderRadius: '6px' }}>
                {isBiker ? 'Rider Pilot' : 'Passenger'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowRadarPage(true)}
              style={{ padding: '8px 14px', borderRadius: '12px', border: '2px solid #000000', backgroundColor: '#68D8D8', color: '#000000', fontWeight: '900', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Radio size={14} /> Live Radar
            </button>

            <button
              onClick={() => setShowHistoryModal(true)}
              style={{ padding: '8px 14px', borderRadius: '12px', border: '2px solid #000000', backgroundColor: '#f8fafc', color: '#000000', fontWeight: '900', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <History size={14} /> History ({completedTripsHistory.length})
            </button>

            <button
              onClick={handleClearAllRides}
              style={{ padding: '8px 12px', borderRadius: '12px', border: '1px solid #fecaca', backgroundColor: '#fef2f2', color: '#dc2626', fontWeight: '900', fontSize: '11px', cursor: 'pointer' }}
              title="Clear Stream"
            >
              <Trash2 size={14} />
            </button>
            
            <button onClick={handleLogout} title="Sign Out" style={{ border: 'none', background: '#f1f5f9', padding: '8px', borderRadius: '12px', cursor: 'pointer', color: '#000' }}>
              <LogOut size={16} />
            </button>
          </div>
        </header>

        <main style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {!isBiker && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <div style={{ backgroundColor: '#f8fafc', border: '2px solid #68D8D8', borderRadius: '28px', padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '12px', backgroundColor: '#68D8D8', color: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Navigation size={18} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#000000' }}>Request Commute</h3>
                    <p style={{ margin: 0, fontSize: '12px', color: '#334155', fontWeight: '700' }}>Specify route to notify nearby pilots</p>
                  </div>
                </div>

                <form onSubmit={handlePostRide} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div ref={fromContainerRef} style={{ position: 'relative' }}>
                    <label style={{ fontSize: '11px', fontWeight: '900', color: '#000000', display: 'block', marginBottom: '4px' }}>From Location</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="text" 
                        required
                        placeholder="Hostel Block B, Main Gate" 
                        value={fromLoc}
                        onFocus={() => setShowFromDropdown(true)}
                        onChange={(e) => {
                          setFromLoc(e.target.value);
                          setShowFromDropdown(true);
                        }}
                        style={{ width: '100%', padding: '12px 36px 12px 14px', borderRadius: '14px', border: '2px solid #68D8D8', fontSize: '13px', outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff', fontWeight: '700', color: '#000' }}
                      />
                      <ChevronDown size={18} color="#000000" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    </div>

                    {showFromDropdown && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '6px', backgroundColor: '#ffffff', borderRadius: '16px', border: '2px solid #68D8D8', boxShadow: '0 12px 24px rgba(0,0,0,0.08)', zIndex: 40, maxHeight: '180px', overflowY: 'auto' }}>
                        <div style={{ padding: '6px 12px', fontSize: '10px', fontWeight: '900', color: '#000000', textTransform: 'uppercase' }}>Select Location</div>
                        {PRESET_LOCATIONS.map((loc, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setFromLoc(loc);
                              setShowFromDropdown(false);
                            }}
                            style={{ padding: '9px 14px', fontSize: '12px', fontWeight: '800', color: '#000000', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}
                          >
                            <MapPin size={13} color="#000000" />
                            <span>{loc}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div ref={toContainerRef} style={{ position: 'relative' }}>
                    <label style={{ fontSize: '11px', fontWeight: '900', color: '#000000', display: 'block', marginBottom: '4px' }}>To Destination</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="text" 
                        required
                        placeholder="Metro Station, Campus Academic Block" 
                        value={toLoc}
                        onFocus={() => setShowToDropdown(true)}
                        onChange={(e) => {
                          setToLoc(e.target.value);
                          setShowToDropdown(true);
                        }}
                        style={{ width: '100%', padding: '12px 36px 12px 14px', borderRadius: '14px', border: '2px solid #68D8D8', fontSize: '13px', outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff', fontWeight: '700', color: '#000' }}
                      />
                      <ChevronDown size={18} color="#000000" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    </div>

                    {showToDropdown && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '6px', backgroundColor: '#ffffff', borderRadius: '16px', border: '2px solid #68D8D8', boxShadow: '0 12px 24px rgba(0,0,0,0.08)', zIndex: 40, maxHeight: '180px', overflowY: 'auto' }}>
                        <div style={{ padding: '6px 12px', fontSize: '10px', fontWeight: '900', color: '#000000', textTransform: 'uppercase' }}>Select Destination</div>
                        {PRESET_LOCATIONS.map((loc, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setToLoc(loc);
                              setShowToDropdown(false);
                            }}
                            style={{ padding: '9px 14px', fontSize: '12px', fontWeight: '800', color: '#000000', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}
                          >
                            <MapPin size={13} color="#000000" />
                            <span>{loc}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button 
                    type="submit"
                    style={{ padding: '14px', borderRadius: '14px', border: '2px solid #000000', backgroundColor: '#68D8D8', color: '#000000', fontWeight: '900', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 6px 16px rgba(0,0,0,0.1)' }}
                  >
                    <span>Post Ride Request</span>
                    <ArrowRight size={16} />
                  </button>
                </form>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '900', color: '#000000' }}>Active Trip Requests</span>
                  <span style={{ fontSize: '11px', fontWeight: '900', padding: '3px 10px', backgroundColor: '#68D8D8', color: '#000000', borderRadius: '9999px' }}>
                    {rides.length} Active
                  </span>
                </div>

                {rides.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px', backgroundColor: '#f8fafc', borderRadius: '24px', border: '2px solid #68D8D8' }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: '900', color: '#000000' }}>No requests in the pool</p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#334155', fontWeight: '700' }}>Post your route above to notify departing pilots.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {rides.map((ride) => (
                      <div 
                        key={ride._id} 
                        style={{
                          padding: '14px 18px',
                          borderRadius: '20px',
                          backgroundColor: '#ffffff',
                          border: '2px solid #68D8D8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '900', color: '#000000', marginBottom: '4px' }}>
                            <span>{ride.fromLocation}</span>
                            <ArrowRight size={14} color="#000000" />
                            <span>{ride.toLocation}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#334155', fontWeight: '700' }}>
                            <span>Passenger: {ride.creatorName}</span>
                          </div>
                        </div>

                        {ride.status === 'accepted' ? (
                          <span style={{ fontSize: '11px', fontWeight: '900', color: '#000000', padding: '4px 10px', backgroundColor: '#68D8D8', borderRadius: '10px' }}>
                            Accepted
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', fontWeight: '900', color: '#000000', padding: '4px 10px', backgroundColor: '#fef3c7', borderRadius: '10px' }}>
                            Waiting
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* RIDER VIEW FIXED WITH RESPONSIVE FLEX LAYOUT (NO BREAKDOWN) */}
          {isBiker && (
            <div>
              {riderAcceptedRide ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ backgroundColor: '#ffffff', border: '3px solid #68D8D8', borderRadius: '28px', padding: '24px', boxShadow: '0 14px 30px rgba(0,0,0,0.08)', width: '100%', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', backgroundColor: '#68D8D8', color: '#000000', padding: '4px 12px', borderRadius: '9999px' }}>
                        Active Trip Assigned
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: '900', color: '#000000' }}>In Progress</span>
                    </div>

                    <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: '900', color: '#000000', wordBreak: 'break-word' }}>
                      {riderAcceptedRide.fromLocation} to {riderAcceptedRide.toLocation}
                    </h3>
                    <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#334155', fontWeight: '700' }}>
                      Passenger: <strong style={{ color: '#000000' }}>{riderAcceptedRide.creatorName}</strong>
                    </p>

                    <div style={{ backgroundColor: '#f8fafc', border: '2px solid #68D8D8', borderRadius: '18px', padding: '16px', marginBottom: '18px' }}>
                      <span style={{ fontSize: '10px', fontWeight: '900', color: '#000000', textTransform: 'uppercase' }}>Passenger Mobile</span>
                      <p style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: '900', color: '#000000', fontFamily: 'monospace' }}>
                        {riderAcceptedRide.creatorPhone}
                      </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <a
                        href={`tel:${riderAcceptedRide.creatorPhone}`}
                        style={{ padding: '12px', borderRadius: '14px', backgroundColor: '#68D8D8', color: '#000000', fontWeight: '900', fontSize: '12px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        <Phone size={15} /> Call Passenger
                      </a>

                      <a
                        href={`https://wa.me/91${riderAcceptedRide.creatorPhone}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ padding: '12px', borderRadius: '14px', backgroundColor: '#000000', color: '#68D8D8', fontWeight: '900', fontSize: '12px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        <MessageCircle size={15} /> WhatsApp
                      </a>
                    </div>

                    <button
                      onClick={() => handleDeleteRide(riderAcceptedRide._id, riderAcceptedRide)}
                      style={{ marginTop: '14px', width: '100%', padding: '12px', borderRadius: '14px', border: '2px solid #68D8D8', backgroundColor: '#f8fafc', color: '#000000', fontWeight: '900', fontSize: '12px', cursor: 'pointer' }}
                    >
                      Complete & Finish Trip
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', padding: '16px 20px', backgroundColor: '#f8fafc', borderRadius: '22px', border: '2px solid #68D8D8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#000000', display: 'inline-block' }} />
                      <div>
                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: '#000000' }}>Live Rider Stream</h3>
                        <p style={{ margin: 0, fontSize: '11px', color: '#334155', fontWeight: '700' }}>Accept passenger requests from the queue</p>
                      </div>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: '900', padding: '4px 10px', backgroundColor: '#68D8D8', color: '#000000', borderRadius: '9999px' }}>
                      {unacceptedRidesForBikers.length} Pending
                    </span>
                  </div>

                  {unacceptedRidesForBikers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '50px 20px', backgroundColor: '#f8fafc', borderRadius: '28px', border: '2px solid #68D8D8' }}>
                      <Bike size={36} color="#000000" style={{ marginBottom: '10px' }} />
                      <p style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '900', color: '#000000' }}>Stream is quiet</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#334155', fontWeight: '700' }}>No passenger requests in the pool currently.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {unacceptedRidesForBikers.map((ride) => (
                        <div 
                          key={ride._id} 
                          style={{
                            padding: '16px 20px',
                            borderRadius: '24px',
                            backgroundColor: '#ffffff',
                            border: '2px solid #68D8D8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '900', color: '#000000', marginBottom: '4px' }}>
                              <span>{ride.fromLocation}</span>
                              <ArrowRight size={14} color="#000000" />
                              <span>{ride.toLocation}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#334155', fontWeight: '700' }}>
                              <span>Passenger: {ride.creatorName}</span>
                            </div>
                          </div>

                          <button 
                            onClick={() => handleAcceptRide(ride)}
                            title="Accept Request"
                            style={{ width: '46px', height: '46px', borderRadius: '16px', border: '2px solid #000000', backgroundColor: '#68D8D8', color: '#000000', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                          >
                            <Check size={24} strokeWidth={3} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {matchedRide && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '32px', padding: '24px', width: '100%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', border: '2px solid #68D8D8', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '20px', backgroundColor: '#68D8D8', color: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
              <Check size={32} />
            </div>

            <span style={{ fontSize: '10px', fontWeight: '900', color: '#000000', textTransform: 'uppercase', backgroundColor: '#68D8D8', padding: '4px 12px', borderRadius: '9999px' }}>
              Commute Matched
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#000000', margin: '8px 0 2px 0' }}>Ride Confirmed</h2>
            <p style={{ fontSize: '12px', color: '#334155', fontWeight: '700', margin: '0 0 14px 0' }}>
              {matchedRide.fromLocation} to {matchedRide.toLocation}
            </p>

            <div style={{ backgroundColor: '#f8fafc', border: '2px solid #68D8D8', borderRadius: '18px', padding: '12px', textAlign: 'left', marginBottom: '14px' }}>
              <p style={{ fontSize: '10px', color: '#334155', fontWeight: '900', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Partner Details</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: '900', color: '#000000' }}>
                  {matchedRide.creatorId === currentUser._id ? matchedRide.acceptedBy?.name : matchedRide.creatorName}
                </span>
                <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', padding: '2px 6px', backgroundColor: '#68D8D8', borderRadius: '6px', color: '#000000' }}>
                  {matchedRide.creatorId === currentUser._id ? matchedRide.acceptedBy?.role : matchedRide.creatorRole}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#000000', fontWeight: '900' }}>
                <Phone size={14} color="#000000" />
                <span>{matchedRide.creatorId === currentUser._id ? matchedRide.acceptedBy?.phone : matchedRide.creatorPhone}</span>
              </div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', border: '2px solid #68D8D8', borderRadius: '18px', padding: '12px', textAlign: 'left', marginBottom: '14px' }}>
              <p style={{ fontSize: '10px', color: '#334155', fontWeight: '900', textTransform: 'uppercase', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MessageCircle size={13} /> In-App Quick Messages
              </p>

              <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '8px', height: '90px', overflowY: 'auto', marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {chatMessages.filter(m => m.rideId === matchedRide._id).length === 0 ? (
                  <p style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', margin: 'auto' }}>No messages yet. Send a preset below.</p>
                ) : (
                  chatMessages.filter(m => m.rideId === matchedRide._id).map((m, idx) => (
                    <div key={idx} style={{ fontSize: '11px', backgroundColor: m.senderName === currentUser.name ? '#eff6ff' : '#f1f5f9', padding: '4px 8px', borderRadius: '8px', alignSelf: m.senderName === currentUser.name ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                      <strong>{m.senderName}:</strong> {m.text} <span style={{ fontSize: '9px', color: '#64748b' }}>({m.time})</span>
                    </div>
                  ))
                )}
              </div>

              <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none', marginBottom: '8px' }}>
                {QUICK_CHAT_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendChatMessage(preset)}
                    style={{ whiteSpace: 'nowrap', backgroundColor: '#e2e8f0', border: 'none', padding: '4px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: '800', cursor: 'pointer', color: '#000000' }}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  placeholder="Type message..."
                  value={customChatMessage}
                  onChange={(e) => setCustomChatMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSendChatMessage(customChatMessage); }}
                  style={{ flex: 1, padding: '8px 10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '11px', outline: 'none' }}
                />
                <button
                  onClick={() => handleSendChatMessage(customChatMessage)}
                  style={{ background: '#68D8D8', border: 'none', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', fontWeight: '900' }}
                >
                  <Send size={14} />
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <a 
                href={`tel:${matchedRide.creatorId === currentUser._id ? matchedRide.acceptedBy?.phone : matchedRide.creatorPhone}`}
                style={{ padding: '10px', borderRadius: '14px', backgroundColor: '#68D8D8', color: '#000000', fontWeight: '900', fontSize: '12px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Phone size={13} /> Call Partner
              </a>

              <a 
                href={`https://wa.me/91${matchedRide.creatorId === currentUser._id ? matchedRide.acceptedBy?.phone : matchedRide.creatorPhone}`}
                target="_blank"
                rel="noreferrer"
                style={{ padding: '10px', borderRadius: '14px', backgroundColor: '#000000', color: '#68D8D8', fontWeight: '900', fontSize: '12px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <MessageCircle size={13} /> WhatsApp
              </a>
            </div>

            <button
              onClick={() => handleDeleteRide(matchedRide._id, matchedRide)}
              style={{ width: '100%', padding: '10px', borderRadius: '14px', border: '2px solid #dc2626', backgroundColor: '#fef2f2', color: '#dc2626', fontWeight: '900', fontSize: '12px', cursor: 'pointer' }}
            >
              Finish & Save History
            </button>
          </div>
        </div>
      )}

      {showHistoryModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '32px', padding: '24px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', border: '2px solid #68D8D8', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '2px solid #68D8D8', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={20} color="#000000" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#000000' }}>Commute History & Stats</h3>
              </div>
              <button onClick={() => setShowHistoryModal(false)} style={{ border: 'none', background: '#f1f5f9', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div style={{ backgroundColor: '#f8fafc', border: '2px solid #68D8D8', padding: '14px', borderRadius: '20px', textAlign: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: '900', color: '#334155', textTransform: 'uppercase' }}>Total Trips</span>
                <p style={{ margin: '4px 0 0 0', fontSize: '22px', fontWeight: '900', color: '#000000' }}>{completedTripsHistory.length}</p>
              </div>
              <div style={{ backgroundColor: '#f8fafc', border: '2px solid #68D8D8', padding: '14px', borderRadius: '20px', textAlign: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: '900', color: '#334155', textTransform: 'uppercase' }}>Est. KM Saved</span>
                <p style={{ margin: '4px 0 0 0', fontSize: '22px', fontWeight: '900', color: '#000000' }}>{totalKmSavedSum} KM</p>
              </div>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px' }}>
              {completedTripsHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                  <History size={36} color="#94a3b8" style={{ margin: '0 auto 8px auto' }} />
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#000000' }}>No completed trips recorded</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#334155' }}>Finalized pooled rides will appear here.</p>
                </div>
              ) : (
                completedTripsHistory.map((trip) => (
                  <div key={trip.id} style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: '900', color: '#000000' }}>{trip.route}</span>
                      <span style={{ fontSize: '10px', fontWeight: '900', backgroundColor: '#68D8D8', color: '#000000', padding: '2px 8px', borderRadius: '6px' }}>+{trip.kmSaved} KM</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#334155', fontWeight: '700' }}>
                      <span>Partner: {trip.partner}</span>
                      <span>{trip.date}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setShowHistoryModal(false)}
              style={{ marginTop: '16px', width: '100%', padding: '12px', borderRadius: '14px', border: 'none', backgroundColor: '#68D8D8', color: '#000000', fontWeight: '900', fontSize: '12px', cursor: 'pointer' }}
            >
              Close History
            </button>
          </div>
        </div>
      )}

    </div>
  );
}