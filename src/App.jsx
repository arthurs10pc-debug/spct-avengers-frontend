import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import confetti from 'canvas-confetti';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';
import { 
  Bike, UserCheck, Check, Phone, ArrowRight, 
  MapPin, LogOut, MessageCircle, X, 
  Navigation, Trash2, ChevronDown, Crown, Radio, RotateCw,
  History, Send, Bell, User, ShieldAlert, CheckCircle2, FileText, AlertOctagon
} from 'lucide-react';

const BACKEND_URL = "https://spct-avengers-backend.onrender.com";
const ADMIN_EMAIL = "arthurs10pc@gmail.com";
const GOOGLE_CLIENT_ID = "644760404837-q0g258ajc1r1vjo8jqtru2c1cc11q1n7.apps.googleusercontent.com";
const PUBLIC_VAPID_KEY = 'BNp5iirw54SBOS_8VOAKw7gpSzvkktgKWNzq_mDeAztqClikXufNCdCHk_vvB7cSD-djbSQXosHRzEtMERwEQhQ';

const firebaseConfig = {
  apiKey: "AIzaSyD-4gRvVI1Tx8VLADJRifzYN190_FqBbJa",
  authDomain: "spct-avengers-65de1.firebaseapp.com",
  projectId: "spct-avengers-65de1",
  storageBucket: "spct-avengers-65de1.appspot.com",
  messagingSenderId: "1085189203233",
  appId: "1:1085189203233:web:c568f971709a4c7846ca60",
  measurementId: "G-WJ3P8YTDZD"
};

const appFb = initializeApp(firebaseConfig);
const messaging = typeof window !== 'undefined' ? getMessaging(appFb) : null;

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

const NOTICES_LIST = [
  "System Notice: Kindly allow all notifications & location permissions for seamless ride coordination.",
  "Operational Update: Keep GPS active so nearby pilots can accurately track active commutes.",
  "Security Advisory: Verify partner credentials and mobile numbers prior to trip commencement.",
  "Timing Protocol: Maintain punctuality at designated pickup nodes for optimal efficiency.",
  "Communication Standard: Utilize in-app messaging or direct calling channels for route adjustments."
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
      if (parsed && (parsed.name || parsed.email || parsed.fullName)) return parsed;
      return null;
    } catch {
      return null;
    }
  });

  const [selectedRole, setSelectedRole] = useState('ride_taker');
  const [authTab, setAuthTab] = useState('login');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [bottomNavTab, setBottomNavTab] = useState('ride');

  const [notificationGranted, setNotificationGranted] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(true);

  const [phoneInput, setPhoneInput] = useState('');
  const [tempGoogleUser, setTempGoogleUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [fromLoc, setFromLoc] = useState('');
  const [toLoc, setToLoc] = useState('');
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);

  const [rides, setRides] = useState([]);
  const [bikersList, setBikersList] = useState([]);
  const [allUsersList, setAllUsersList] = useState([]);
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
  const [bouncingBanner, setBouncingBanner] = useState(null);

  const [userLocation, setUserLocation] = useState(DEFAULT_CENTER);
  const [liveNearbyRiders, setLiveNearbyRiders] = useState([]);
  const [isRefreshingRadar, setIsRefreshingRadar] = useState(false);

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

  const playPingSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {}
  }, []);

  const triggerBouncingBanner = useCallback((rideObj) => {
    playPingSound();
    setBouncingBanner(rideObj);
    setTimeout(() => {
      setBouncingBanner(null);
    }, 10000);
  }, [playPingSound]);

  const reportPermissionStatus = async (granted, gpsActive) => {
    if (!currentUser) return;
    try {
      await axios.post(`${BACKEND_URL}/api/report-permission`, {
        userId: currentUser._id,
        email: currentUser.email,
        notificationAllowed: granted,
        gpsAllowed: gpsActive
      });
    } catch (e) {}
  };

  const requestNotificationPermissionAndSubscribe = async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setNotificationGranted(true);
        setShowPermissionModal(false);
        reportPermissionStatus(true, true);
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationGranted(true);
        setShowPermissionModal(false);
        reportPermissionStatus(true, true);

        const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        swRegistrationRef.current = reg;
        
        let subscription = await reg.pushManager.getSubscription();
        if (!subscription) {
          subscription = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
          });
        }
        await axios.post(`${BACKEND_URL}/api/save-subscription`, subscription);

        if (messaging) {
          try {
            await getToken(messaging, { serviceWorkerRegistration: reg, vapidKey: PUBLIC_VAPID_KEY });
          } catch (err) {}
        }
      } else {
        reportPermissionStatus(false, true);
        alert("Permission denied. Please enable notifications in your browser settings.");
      }
    } catch (e) {
      reportPermissionStatus(false, false);
    }
  };

  useEffect(() => {
    if (Notification.permission === 'granted') {
      setNotificationGranted(true);
      setShowPermissionModal(false);
      reportPermissionStatus(true, true);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/firebase-messaging-sw.js').then(async (reg) => {
          swRegistrationRef.current = reg;
          let subscription = await reg.pushManager.getSubscription();
          if (!subscription) {
            subscription = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
            });
          }
          await axios.post(`${BACKEND_URL}/api/save-subscription`, subscription);
        }).catch(() => {});
      }
    } else {
      reportPermissionStatus(false, true);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem('spct_trip_history', JSON.stringify(completedTripsHistory));
    } catch (e) {}
  }, [completedTripsHistory]);

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
              name: currentUser.name || currentUser.fullName,
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
    const interval = setInterval(fetchLiveGPS, 5000);
    return () => clearInterval(interval);
  }, [fetchLiveGPS]);

  const loadAdminData = useCallback(() => {
    if (isAdmin) {
      axios.get(`${BACKEND_URL}/api/admin/users`)
        .then(res => {
          const data = Array.isArray(res.data) ? res.data : [];
          setAllUsersList(data);
          setBikersList(data.filter(u => u.role === 'biker'));
        })
        .catch(() => {});
    }
  }, [isAdmin]);

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

    loadAdminData();

    socketRef.current.on('new_ride_broadcast', (newRide) => {
      if (newRide) {
        setRides(prev => [newRide, ...prev]);
        triggerBouncingBanner(newRide);
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
          confetti({ particleCount: 75, spread: 80, origin: { y: 0.6 } });
        }
      } catch (e) {}
    });

    socketRef.current.on('receive_in_app_chat', (msg) => {
      if (msg) {
        setChatMessages(prev => [...prev, msg]);
      }
    });

    socketRef.current.on('user_deleted_broadcast', (deletedUserId) => {
      if (currentUser && currentUser._id === deletedUserId) {
        localStorage.removeItem('spct_user');
        setCurrentUser(null);
        alert("Your account has been permanently removed by the administrator.");
      }
    });

    socketRef.current.on('db_cleared_broadcast', () => {
      if (currentUser && currentUser.email !== ADMIN_EMAIL) {
        localStorage.removeItem('spct_user');
        localStorage.removeItem('spct_trip_history');
        setCurrentUser(null);
        setRides([]);
        setCompletedTripsHistory([]);
        alert("Database has been reset by admin.");
      } else {
        setRides([]);
        loadAdminData();
      }
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [isAdmin, triggerBouncingBanner, fetchLiveGPS, loadAdminData, currentUser]);

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
        throw new Error("Unable to parse authentication token.");
      }

      const googleData = {
        fullName: decoded.name || 'User',
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
        }
      } else {
        setTempGoogleUser(googleData);
      }
    } catch (err) {
      const serverMsg = err.response?.data?.error;
      setErrorMsg(`Error: ${serverMsg || err.message}`);
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
      setErrorMsg("Please enter a valid 10-digit mobile number.");
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
      }
    } catch (err) {
      const serverMsg = err.response?.data?.error;
      setErrorMsg(`Error: ${serverMsg || err.message}`);
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePostRide = (e) => {
    e.preventDefault();
    if (!fromLoc.trim() || !toLoc.trim() || !currentUser) return;

    const payload = {
      creatorId: currentUser._id,
      creatorName: currentUser.name || currentUser.fullName,
      creatorPhone: currentUser.phone || '',
      creatorRole: currentUser.role,
      fromLocation: fromLoc.trim(),
      toLocation: `${toLoc.trim()} (Leaving Now)`
    };

    if (socketRef.current) {
      socketRef.current.emit('post_ride', payload);
    }

    setFromLoc('');
    setToLoc('');
    setShowFromDropdown(false);
    setShowToDropdown(false);
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
          name: currentUser.name || currentUser.fullName,
          phone: currentUser.phone || '',
          role: currentUser.role
        }
      });
    }
    setBouncingBanner(null);
  };

  const handleDeleteRide = async (rideId, rideObj) => {
    if (!window.confirm("Are you sure you want to complete and finalize this trip?")) return;
    try {
      if (rideObj) {
        const tripEntry = {
          id: rideObj._id || Date.now(),
          route: `${rideObj.fromLocation} to ${rideObj.toLocation}`,
          date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          kmSaved: (Math.random() * 4 + 1.5).toFixed(1),
          partner: (rideObj.creatorName === currentUser?.name || rideObj.creatorName === currentUser?.fullName) ? (rideObj.acceptedBy?.name || 'Pooled Student') : rideObj.creatorName
        };
        setCompletedTripsHistory(prev => [tripEntry, ...prev]);
      }

      await axios.delete(`${BACKEND_URL}/api/rides/${rideId}`);
      setRides(prev => prev.filter(r => r && r._id !== rideId));
      if (matchedRide?._id === rideId) setMatchedRide(null);
    } catch (err) {
      alert("Operation failed: " + err.message);
    }
  };

  const handleClearAllRides = async () => {
    if (!window.confirm("Are you sure you want to flush all active ride requests?")) return;
    try {
      await axios.delete(`${BACKEND_URL}/api/rides/clear-all`);
      setRides([]);
      alert("All active requests flushed successfully.");
    } catch (err) {
      alert("Failed to clear: " + err.message);
    }
  };

  const handleClearHistory = () => {
    const confirmation = window.confirm("Are you sure you want to clear all trip history? Click OK for Yes, Cancel for No.");
    if (!confirmation) return;
    setCompletedTripsHistory([]);
    localStorage.removeItem('spct_trip_history');
  };

  const handlePermanentDeleteUser = async (userId, userName) => {
    const confirmation = window.confirm(`Are you sure you want to permanently delete user "${userName}"? Click OK for Yes, Cancel for No.`);
    if (!confirmation) return;

    try {
      await axios.delete(`${BACKEND_URL}/api/admin/users/${userId}`);
      loadAdminData();
      alert("User permanently deleted.");
    } catch (err) {
      alert("Failed to delete user: " + err.message);
    }
  };

  const handleClearFullDB = async () => {
    const firstCheck = window.confirm("WARNING: You are about to clear all user profiles, riders, and ride requests! Admin account will remain active. Proceed?");
    if (!firstCheck) return;

    const secondCheck = window.confirm("FINAL CONFIRMATION: Are you 100% sure you want to wipe all non-admin database records?");
    if (!secondCheck) return;

    try {
      await axios.post(`${BACKEND_URL}/api/admin/clear-full-db`);
      setRides([]);
      loadAdminData();
      alert("Database cleared successfully. All users and rides removed except admin.");
    } catch (err) {
      alert("Failed to clear database: " + err.message);
    }
  };

  const handleExportDatabasePDF = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/admin/export-db`);
      const dbData = res.data;

      let htmlContent = `
        <html>
          <head>
            <title>SPCT Avengers Database Report</title>
            <style>
              body { font-family: Helvetica, Arial, sans-serif; color: #1e293b; padding: 20px; }
              h1 { color: #0f172a; border-bottom: 2px solid #38bdf8; padding-bottom: 10px; }
              h2 { color: #334155; margin-top: 30px; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th, td { border: 1px solid #cbd5e1; padding: 8px 12px; font-size: 11px; text-align: left; }
              th { background-color: #f1f5f9; font-weight: bold; }
            </style>
          </head>
          <body>
            <h1>SPCT Avengers - System Database Report</h1>
            <p><strong>Export Date:</strong> ${new Date(dbData.exportTimestamp).toLocaleString()}</p>
            <p><strong>Total Users:</strong> ${dbData.totalUsers} | <strong>Total Rides:</strong> ${dbData.totalRides}</p>

            <h2>1. Users Directory</h2>
            <table>
              <tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Notif Allowed</th><th>GPS Allowed</th></tr>
              ${dbData.users.map(u => `<tr><td>${u.fullName || '-'}</td><td>${u.email}</td><td>${u.phone || '-'}</td><td>${u.role}</td><td>${u.notificationAllowed}</td><td>${u.gpsAllowed}</td></tr>`).join('')}
            </table>

            <h2>2. Rides Pool</h2>
            <table>
              <tr><th>Creator</th><th>Phone</th><th>From</th><th>To</th><th>Status</th></tr>
              ${dbData.rides.map(r => `<tr><td>${r.creatorName}</td><td>${r.creatorPhone || '-'}</td><td>${r.fromLocation}</td><td>${r.toLocation}</td><td>${r.status}</td></tr>`).join('')}
            </table>
          </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    } catch (err) {
      alert("Failed to generate PDF report.");
    }
  };

  const handleSendChatMessage = (textToSend) => {
    if (!textToSend || !textToSend.trim() || !matchedRide) return;
    const senderName = currentUser.name || currentUser.fullName;
    const msgPayload = {
      rideId: matchedRide._id,
      senderName: senderName,
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

  if (showPermissionModal && !notificationGranted) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '24px', padding: '32px', maxWidth: '400px', width: '100%', textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: '#38bdf8', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            <Bell size={28} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 8px 0', color: '#f8fafc' }}>Instant Ride Alerts</h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.5', marginBottom: '24px' }}>
            Please allow notifications and location access to receive real-time ride requests and updates in the background.
          </p>
          <button
            onClick={requestNotificationPermissionAndSubscribe}
            style={{ width: '100%', padding: '14px', borderRadius: '14px', border: 'none', backgroundColor: '#38bdf8', color: '#0f172a', fontWeight: '800', fontSize: '14px', cursor: 'pointer' }}
          >
            Allow Notifications & GPS
          </button>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ width: '100%', maxWidth: '420px', textAlign: 'center' }}>
          
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
            <img 
              src="/logo.png" 
              alt="Logo" 
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
              style={{ width: '72px', height: '72px', objectFit: 'contain' }} 
            />
          </div>

          <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#f8fafc', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>SPCT AVENGERS</h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600', marginBottom: '32px' }}>Campus Ride-Pooling Infrastructure</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <button
              onClick={() => { setSelectedRole('biker'); setShowAuthModal(true); setErrorMsg(''); setTempGoogleUser(null); }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '20px', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '46px', height: '46px', borderRadius: '14px', backgroundColor: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a' }}>
                  <Bike size={22} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#f8fafc' }}>I Have a Bike</h3>
                  <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>Register as Rider Pilot</span>
                </div>
              </div>
              <ArrowRight size={18} color="#94a3b8" />
            </button>

            <button
              onClick={() => { setSelectedRole('ride_taker'); setShowAuthModal(true); setErrorMsg(''); setTempGoogleUser(null); }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '20px', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '46px', height: '46px', borderRadius: '14px', backgroundColor: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a' }}>
                  <UserCheck size={22} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#f8fafc' }}>Need a Ride</h3>
                  <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>Register as Passenger</span>
                </div>
              </div>
              <ArrowRight size={18} color="#94a3b8" />
            </button>
          </div>
        </div>

        {showAuthModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div style={{ backgroundColor: '#1e293b', borderRadius: '28px', padding: '24px', width: '100%', maxWidth: '380px', position: 'relative', textAlign: 'center', border: '1px solid #334155', color: '#f8fafc' }}>
              <button onClick={() => { setShowAuthModal(false); setTempGoogleUser(null); }} style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: '#334155', color: '#f8fafc', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>

              {!tempGoogleUser && (
                <div style={{ display: 'flex', backgroundColor: '#0f172a', padding: '4px', borderRadius: '14px', marginBottom: '20px', border: '1px solid #334155' }}>
                  <button onClick={() => { setAuthTab('login'); setErrorMsg(''); }} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', fontSize: '12px', backgroundColor: authTab === 'login' ? '#38bdf8' : 'transparent', color: authTab === 'login' ? '#0f172a' : '#94a3b8' }}>Login</button>
                  <button onClick={() => { setAuthTab('signup'); setErrorMsg(''); }} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', fontSize: '12px', backgroundColor: authTab === 'signup' ? '#38bdf8' : 'transparent', color: authTab === 'signup' ? '#0f172a' : '#94a3b8' }}>Register</button>
                </div>
              )}

              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#f8fafc', margin: '0 0 4px 0' }}>
                {tempGoogleUser ? "Contact Details" : (authTab === 'login' ? "Welcome Back" : "Create Account")}
              </h2>
              <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', marginBottom: '20px' }}>
                {tempGoogleUser ? "Enter mobile number for ride connectivity" : "Authenticate via Google Workspace"}
              </p>

              {errorMsg && (
                <div style={{ backgroundColor: '#7f1d1d', border: '1px solid #991b1b', color: '#fecaca', fontSize: '11px', padding: '10px 14px', borderRadius: '12px', marginBottom: '14px', textAlign: 'left' }}>
                  {errorMsg}
                </div>
              )}

              {!tempGoogleUser ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50px' }}>
                  <div ref={googleBtnRef}></div>
                  {authLoading && <p style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 'bold', marginTop: '12px' }}>Authenticating...</p>}
                </div>
              ) : (
                <form onSubmit={handleCompleteAuth} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid #334155' }}>
                    {tempGoogleUser.avatar ? (
                      <img src={tempGoogleUser.avatar} alt="User" style={{ width: '38px', height: '38px', borderRadius: '50%' }} />
                    ) : (
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#38bdf8', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        {tempGoogleUser.fullName.charAt(0)}
                      </div>
                    )}
                    <div style={{ overflow: 'hidden' }}>
                      <p style={{ margin: 0, fontSize: '12px', fontWeight: 'bold', color: '#f8fafc' }}>{tempGoogleUser.fullName}</p>
                      <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8' }}>{tempGoogleUser.email}</p>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>10-Digit Mobile Number</label>
                    <input 
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="9876543210"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#f8fafc', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: '#38bdf8', color: '#0f172a', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
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
    const inactiveUsers = allUsersList.filter(u => u.notificationAllowed === false || u.gpsAllowed === false);

    return (
      <div style={{ height: '100vh', width: '100vw', backgroundColor: '#0f172a', padding: '12px', boxSizing: 'border-box', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#f8fafc', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto', backgroundColor: '#1e293b', borderRadius: '24px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxSizing: 'border-box' }}>
          
          <header style={{ padding: '14px 20px', backgroundColor: '#0f172a', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a' }}>
                <Crown size={20} />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#f8fafc' }}>MASTER ADMIN DASHBOARD</h1>
                <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '600' }}>{currentUser.email}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={handleClearFullDB}
                style={{ border: 'none', background: '#7f1d1d', color: '#fecaca', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <AlertOctagon size={14} /> Clear Full DB
              </button>
              <button
                onClick={handleExportDatabasePDF}
                style={{ border: 'none', background: '#38bdf8', color: '#0f172a', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <FileText size={14} /> Export PDF
              </button>
              <button onClick={handleLogout} style={{ border: 'none', background: '#334155', color: '#f8fafc', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}>
                Logout
              </button>
            </div>
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr 340px', flex: 1, overflow: 'hidden' }}>
            
            {/* COLUMN 1: Users List with Permanent Delete */}
            <div style={{ borderRight: '1px solid #334155', padding: '16px', backgroundColor: '#1e293b', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid #334155', paddingBottom: '8px', flexShrink: 0 }}>
                <h2 style={{ margin: 0, fontSize: '14px', fontWeight: '800' }}>Users Directory</h2>
                <span style={{ fontSize: '10px', fontWeight: '800', backgroundColor: '#38bdf8', color: '#0f172a', padding: '2px 6px', borderRadius: '6px' }}>
                  {allUsersList.length} Total
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1 }}>
                {allUsersList.map((u) => (
                  <div key={u._id} style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#334155', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', flexShrink: 0 }}>
                        <User size={16} />
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <p style={{ margin: 0, fontSize: '12px', fontWeight: '800', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.fullName || u.email}</p>
                        <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8' }}>{u.role} | {u.phone || 'No phone'}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handlePermanentDeleteUser(u._id, u.fullName || u.email)}
                      title="Permanently Delete User"
                      style={{ border: 'none', background: '#7f1d1d', color: '#fecaca', padding: '6px', borderRadius: '8px', cursor: 'pointer', flexShrink: 0 }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* COLUMN 2: Metrics, Flush Button, and Permission Issues Audit */}
            <div style={{ padding: '16px', backgroundColor: '#1e293b', display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>
              <div style={{ borderBottom: '1px solid #334155', paddingBottom: '8px', flexShrink: 0 }}>
                <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>Platform Metrics & Permissions Audit</h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', flexShrink: 0 }}>
                <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', padding: '12px', borderRadius: '14px', textAlign: 'center' }}>
                  <span style={{ fontSize: '9px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Active Rides</span>
                  <p style={{ margin: '4px 0 0 0', fontSize: '22px', fontWeight: '900', color: '#38bdf8' }}>{rides.length}</p>
                </div>
                <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', padding: '12px', borderRadius: '14px', textAlign: 'center' }}>
                  <span style={{ fontSize: '9px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Matched</span>
                  <p style={{ margin: '4px 0 0 0', fontSize: '22px', fontWeight: '900', color: '#38bdf8' }}>{rides.filter(r => r.status === 'accepted').length}</p>
                </div>
                <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', padding: '12px', borderRadius: '14px', textAlign: 'center' }}>
                  <span style={{ fontSize: '9px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Permission Issues</span>
                  <p style={{ margin: '4px 0 0 0', fontSize: '22px', fontWeight: '900', color: '#f87171' }}>{inactiveUsers.length}</p>
                </div>
              </div>

              {/* Permission Failure Diagnostic Box */}
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '16px', padding: '14px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexShrink: 0 }}>
                  <ShieldAlert size={16} color="#f87171" />
                  <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#f8fafc' }}>Users with Missing Permissions</h3>
                </div>

                <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {inactiveUsers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '11px' }}>
                      <CheckCircle2 size={20} color="#38bdf8" style={{ margin: '0 auto 4px auto' }} />
                      No permission blocks detected across active users.
                    </div>
                  ) : (
                    inactiveUsers.map((u) => (
                      <div key={u._id} style={{ backgroundColor: '#1e293b', border: '1px solid #7f1d1d', borderRadius: '10px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ margin: 0, fontSize: '11px', fontWeight: '800', color: '#f8fafc' }}>{u.fullName || u.email}</p>
                          <span style={{ fontSize: '9px', color: '#f87171' }}>
                            {u.notificationAllowed === false ? 'Notifications Blocked' : ''} {u.gpsAllowed === false ? '| GPS Disabled' : ''}
                          </span>
                        </div>
                        <span style={{ fontSize: '9px', backgroundColor: '#7f1d1d', color: '#fecaca', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>Blocked</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '16px', padding: '12px', flexShrink: 0 }}>
                <button
                  onClick={handleClearAllRides}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: '#dc2626', color: '#ffffff', fontWeight: '800', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <Trash2 size={15} /> Flush All Active Requests
                </button>
              </div>
            </div>

            {/* COLUMN 3: Live Stream */}
            <div style={{ borderLeft: '1px solid #334155', padding: '16px', backgroundColor: '#1e293b', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid #334155', paddingBottom: '8px', flexShrink: 0 }}>
                <h2 style={{ margin: 0, fontSize: '14px', fontWeight: '800' }}>Live Commute Stream</h2>
                <span style={{ fontSize: '10px', fontWeight: '800', backgroundColor: '#38bdf8', color: '#0f172a', padding: '2px 6px', borderRadius: '6px' }}>
                  {rides.length} Active
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1 }}>
                {rides.map((r) => (
                  <div key={r._id} style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: '#f8fafc' }}>{r.creatorName}</span>
                      <button onClick={() => handleDeleteRide(r._id)} style={{ border: 'none', background: '#7f1d1d', color: '#fecaca', padding: '4px', borderRadius: '6px', cursor: 'pointer' }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>{r.fromLocation}</span>
                      <ArrowRight size={10} color="#38bdf8" />
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
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', paddingBottom: '80px', boxSizing: 'border-box', fontFamily: 'system-ui, -apple-system, sans-serif', position: 'relative', color: '#f8fafc', overflowX: 'hidden' }}>
      
      {bouncingBanner && isBiker && !riderAcceptedRide && (
        <div style={{
          position: 'fixed',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          width: '90%',
          maxWidth: '400px',
          backgroundColor: '#1e293b',
          border: '1px solid #38bdf8',
          borderRadius: '16px',
          padding: '14px 18px',
          boxShadow: '0 15px 35px rgba(0,0,0,0.6)',
          color: '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '9px', fontWeight: '800', backgroundColor: '#38bdf8', color: '#0f172a', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
              High Priority Ride Request
            </span>
            <button onClick={() => setBouncingBanner(null)} style={{ background: 'none', border: 'none', color: '#f8fafc', cursor: 'pointer' }}>
              <X size={14} />
            </button>
          </div>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: '800', color: '#38bdf8' }}>
            {bouncingBanner.fromLocation} to {bouncingBanner.toLocation}
          </h4>
          <p style={{ margin: '0 0 10px 0', fontSize: '11px', color: '#94a3b8' }}>
            Passenger: {bouncingBanner.creatorName}
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => handleAcceptRide(bouncingBanner)}
              style={{ flex: 1, padding: '8px', backgroundColor: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '11px', cursor: 'pointer' }}
            >
              Accept Ride Now
            </button>
            <button
              onClick={() => setBouncingBanner(null)}
              style={{ padding: '8px 12px', backgroundColor: '#334155', color: '#f8fafc', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '11px', cursor: 'pointer' }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '1080px', margin: '12px auto 0 auto', backgroundColor: '#1e293b', borderRadius: '24px', boxShadow: '0 20px 45px rgba(0,0,0,0.3)', border: '1px solid #334155', overflow: 'hidden', boxSizing: 'border-box' }}>
        
        <header style={{ padding: '14px 20px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {currentUser?.avatar ? (
              <img src={currentUser.avatar} alt="Avatar" style={{ width: '36px', height: '36px', borderRadius: '10px', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#38bdf8', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '13px' }}>
                {(currentUser?.name || currentUser?.fullName || currentUser?.email)?.charAt(0) || 'U'}
              </div>
            )}
            <div>
              <h2 style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#f8fafc' }}>{currentUser?.name || currentUser?.fullName || 'User'}</h2>
              <span style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', color: '#0f172a', backgroundColor: '#38bdf8', padding: '2px 6px', borderRadius: '4px' }}>
                {isBiker ? 'Rider Pilot' : 'Passenger'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowHistoryModal(true)}
              style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#f8fafc', fontWeight: '800', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <History size={13} /> History ({completedTripsHistory.length})
            </button>
            
            <button onClick={handleLogout} title="Sign Out" style={{ border: 'none', background: '#334155', padding: '6px', borderRadius: '8px', cursor: 'pointer', color: '#f8fafc' }}>
              <LogOut size={15} />
            </button>
          </div>
        </header>

        <main style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '420px', boxSizing: 'border-box' }}>
          
          {/* TAB 1: RIDE */}
          {bottomNavTab === 'ride' && (
            <div>
              {!isBiker ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '20px', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#38bdf8', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Navigation size={16} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#f8fafc' }}>Request Commute</h3>
                        <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8' }}>Connect with departing pilots instantly</p>
                      </div>
                    </div>

                    <form onSubmit={handlePostRide} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div ref={fromContainerRef} style={{ position: 'relative' }}>
                        <label style={{ fontSize: '10px', fontWeight: '800', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>From Location</label>
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
                            style={{ width: '100%', padding: '10px 32px 10px 12px', borderRadius: '10px', border: '1px solid #334155', fontSize: '12px', outline: 'none', boxSizing: 'border-box', backgroundColor: '#1e293b', fontWeight: '700', color: '#f8fafc' }}
                          />
                          <ChevronDown size={16} color="#94a3b8" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                        </div>

                        {showFromDropdown && (
                          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid #334155', boxShadow: '0 12px 24px rgba(0,0,0,0.3)', zIndex: 40, maxHeight: '160px', overflowY: 'auto' }}>
                            <div style={{ padding: '4px 10px', fontSize: '9px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Select Location</div>
                            {PRESET_LOCATIONS.map((loc, idx) => (
                              <div
                                key={idx}
                                onClick={() => {
                                  setFromLoc(loc);
                                  setShowFromDropdown(false);
                                }}
                                style={{ padding: '8px 12px', fontSize: '11px', fontWeight: '700', color: '#f8fafc', cursor: 'pointer', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '6px' }}
                              >
                                <MapPin size={12} color="#38bdf8" />
                                <span>{loc}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div ref={toContainerRef} style={{ position: 'relative' }}>
                        <label style={{ fontSize: '10px', fontWeight: '800', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>To Destination</label>
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
                            style={{ width: '100%', padding: '10px 32px 10px 12px', borderRadius: '10px', border: '1px solid #334155', fontSize: '12px', outline: 'none', boxSizing: 'border-box', backgroundColor: '#1e293b', fontWeight: '700', color: '#f8fafc' }}
                          />
                          <ChevronDown size={16} color="#94a3b8" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                        </div>

                        {showToDropdown && (
                          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid #334155', boxShadow: '0 12px 24px rgba(0,0,0,0.3)', zIndex: 40, maxHeight: '160px', overflowY: 'auto' }}>
                            <div style={{ padding: '4px 10px', fontSize: '9px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Select Destination</div>
                            {PRESET_LOCATIONS.map((loc, idx) => (
                              <div
                                key={idx}
                                onClick={() => {
                                  setToLoc(loc);
                                  setShowToDropdown(false);
                                }}
                                style={{ padding: '8px 12px', fontSize: '11px', fontWeight: '700', color: '#f8fafc', cursor: 'pointer', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '6px' }}
                              >
                                <MapPin size={12} color="#38bdf8" />
                                <span>{loc}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <button 
                        type="submit"
                        style={{ padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#38bdf8', color: '#0f172a', fontWeight: '800', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        <span>Post Ride Request</span>
                        <ArrowRight size={15} />
                      </button>
                    </form>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '800', color: '#f8fafc' }}>Active Trip Requests</span>
                      <span style={{ fontSize: '10px', fontWeight: '800', padding: '2px 8px', backgroundColor: '#38bdf8', color: '#0f172a', borderRadius: '9999px' }}>
                        {rides.length} Active
                      </span>
                    </div>

                    {rides.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '24px', backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid #334155' }}>
                        <p style={{ margin: '0 0 2px 0', fontSize: '12px', fontWeight: '800', color: '#f8fafc' }}>No requests in the pool</p>
                        <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8' }}>Post your route above to notify departing pilots.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {rides.map((ride) => (
                          <div 
                            key={ride._id} 
                            style={{
                              padding: '12px 16px',
                              borderRadius: '14px',
                              backgroundColor: '#0f172a',
                              border: '1px solid #334155',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '800', color: '#f8fafc', marginBottom: '2px' }}>
                                <span>{ride.fromLocation}</span>
                                <ArrowRight size={12} color="#38bdf8" />
                                <span>{ride.toLocation}</span>
                              </div>
                              <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                                <span>Passenger: {ride.creatorName}</span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {ride.status !== 'accepted' && (
                                <button
                                  onClick={() => {
                                    if (socketRef.current) {
                                      socketRef.current.emit('ping_riders', {
                                        rideId: ride._id,
                                        from: ride.fromLocation,
                                        to: ride.toLocation,
                                        passenger: ride.creatorName
                                      });
                                      alert("Alert ping dispatched to all active riders.");
                                    }
                                  }}
                                  style={{ padding: '6px 8px', backgroundColor: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '6px', fontWeight: '800', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <Bell size={11} /> Ring Pilot
                                </button>
                              )}

                              {ride.status === 'accepted' ? (
                                <span style={{ fontSize: '10px', fontWeight: '800', color: '#0f172a', padding: '3px 8px', backgroundColor: '#38bdf8', borderRadius: '6px' }}>
                                  Accepted
                                </span>
                              ) : (
                                <span style={{ fontSize: '10px', fontWeight: '800', color: '#fef08a', padding: '3px 8px', backgroundColor: '#713f12', borderRadius: '6px' }}>
                                  Waiting
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  {riderAcceptedRide ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ backgroundColor: '#0f172a', border: '1px solid #38bdf8', borderRadius: '20px', padding: '20px', boxShadow: '0 14px 30px rgba(0,0,0,0.4)', width: '100%', boxSizing: 'border-box' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', backgroundColor: '#38bdf8', color: '#0f172a', padding: '3px 10px', borderRadius: '9999px' }}>
                            Active Trip Assigned
                          </span>
                          <span style={{ fontSize: '10px', fontWeight: '800', color: '#f8fafc' }}>In Progress</span>
                        </div>

                        <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '800', color: '#f8fafc', wordBreak: 'break-word' }}>
                          {riderAcceptedRide.fromLocation} to {riderAcceptedRide.toLocation}
                        </h3>
                        <p style={{ margin: '0 0 14px 0', fontSize: '11px', color: '#94a3b8' }}>
                          Passenger: <strong style={{ color: '#f8fafc' }}>{riderAcceptedRide.creatorName}</strong>
                        </p>

                        <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '14px', marginBottom: '14px' }}>
                          <span style={{ fontSize: '9px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Passenger Mobile</span>
                          <p style={{ margin: '4px 0 0 0', fontSize: '15px', fontWeight: '800', color: '#38bdf8', fontFamily: 'monospace' }}>
                            {riderAcceptedRide.creatorPhone}
                          </p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <a
                            href={`tel:${riderAcceptedRide.creatorPhone}`}
                            style={{ padding: '10px', borderRadius: '10px', backgroundColor: '#38bdf8', color: '#0f172a', fontWeight: '800', fontSize: '11px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                          >
                            <Phone size={14} /> Call Passenger
                          </a>

                          <a
                            href={`https://wa.me/91${riderAcceptedRide.creatorPhone}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ padding: '10px', borderRadius: '10px', backgroundColor: '#334155', color: '#f8fafc', fontWeight: '800', fontSize: '11px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                          >
                            <MessageCircle size={14} /> WhatsApp
                          </a>
                        </div>

                        <button
                          onClick={() => handleDeleteRide(riderAcceptedRide._id, riderAcceptedRide)}
                          style={{ marginTop: '12px', width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#f8fafc', fontWeight: '800', fontSize: '11px', cursor: 'pointer' }}
                        >
                          Complete & Finish Trip
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', padding: '14px 18px', backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid #334155' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#38bdf8', display: 'inline-block' }} />
                          <div>
                            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#f8fafc' }}>Live Rider Stream</h3>
                            <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8' }}>Accept passenger requests from the queue</p>
                          </div>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: '800', padding: '3px 8px', backgroundColor: '#38bdf8', color: '#0f172a', borderRadius: '9999px' }}>
                          {unacceptedRidesForBikers.length} Pending
                        </span>
                      </div>

                      {unacceptedRidesForBikers.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 16px', backgroundColor: '#0f172a', borderRadius: '20px', border: '1px solid #334155' }}>
                          <Bike size={32} color="#38bdf8" style={{ marginBottom: '8px' }} />
                          <p style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: '800', color: '#f8fafc' }}>Stream is quiet</p>
                          <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8' }}>No passenger requests in the pool currently.</p>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {unacceptedRidesForBikers.map((ride) => (
                            <div 
                              key={ride._id} 
                              style={{
                                padding: '14px 18px',
                                borderRadius: '16px',
                                backgroundColor: '#0f172a',
                                border: '1px solid #334155',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                              }}
                            >
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '800', color: '#f8fafc', marginBottom: '2px' }}>
                                  <span>{ride.fromLocation}</span>
                                  <ArrowRight size={12} color="#38bdf8" />
                                  <span>{ride.toLocation}</span>
                                </div>
                                <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                                  <span>Passenger: {ride.creatorName}</span>
                                </div>
                              </div>

                              <button 
                                onClick={() => handleAcceptRide(ride)}
                                title="Accept Request"
                                style={{ width: '38px', height: '38px', borderRadius: '10px', border: 'none', backgroundColor: '#38bdf8', color: '#0f172a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                <Check size={18} strokeWidth={3} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RADAR */}
          {bottomNavTab === 'radar' && (
            <div>
              <style>{`
                @keyframes radarSweep {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
                .fighter-sweep-beam {
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  width: 240px;
                  height: 240px;
                  margin-top: -120px;
                  margin-left: -120px;
                  background: conic-gradient(from 0deg at 50% 50%, rgba(56, 189, 248, 0.4) 0deg, rgba(56, 189, 248, 0.0) 65deg, transparent 360deg);
                  border-radius: 50%;
                  animation: radarSweep 3.2s linear infinite;
                  pointer-events: none;
                  transform-origin: center center;
                }
              `}</style>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0f172a', padding: '10px 16px', borderRadius: '14px', marginBottom: '12px', border: '1px solid #334155' }}>
                <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '800' }}>Live Radar Tracking</h3>
                <button
                  onClick={handleRefreshRadar}
                  disabled={isRefreshingRadar}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#38bdf8', color: '#0f172a', border: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: '800', fontSize: '11px', cursor: 'pointer' }}
                >
                  <RotateCw size={13} style={{ animation: isRefreshingRadar ? 'spin 1s linear infinite' : 'none' }} />
                  <span>{isRefreshingRadar ? 'Scanning...' : 'Refresh'}</span>
                </button>
              </div>

              <div style={{ width: '100%', height: '340px', backgroundColor: '#0f172a', borderRadius: '20px', border: '1px solid #334155', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'absolute', width: '260px', height: '260px', borderRadius: '50%', border: '1px dashed rgba(56,189,248,0.3)' }} />
                <div style={{ position: 'absolute', width: '150px', height: '150px', borderRadius: '50%', border: '1px dashed rgba(56,189,248,0.4)' }} />
                <div className="fighter-sweep-beam" />

                <div style={{ width: '14px', height: '14px', backgroundColor: '#f8fafc', borderRadius: '50%', boxShadow: '0 0 12px #38bdf8', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '5px', height: '5px', backgroundColor: '#38bdf8', borderRadius: '50%' }} />
                </div>

                {bikersWithin2Km.length === 0 ? (
                  <div style={{ position: 'absolute', zIndex: 20, textAlign: 'center', backgroundColor: '#1e293b', padding: '10px 16px', borderRadius: '10px', border: '1px solid #334155' }}>
                    <p style={{ margin: 0, fontSize: '11px', fontWeight: '800', color: '#f8fafc' }}>Scanning 2 KM radius...</p>
                  </div>
                ) : (
                  bikersWithin2Km.map((biker, idx) => {
                    const angle = (idx * 90) * (Math.PI / 180);
                    const radius = 80 + (idx * 22);
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;

                    return (
                      <div
                        key={idx}
                        style={{ position: 'absolute', transform: `translate(${x}px, ${y}px)`, zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                      >
                        <div style={{ backgroundColor: '#38bdf8', padding: '4px', borderRadius: '50%', border: '1px solid #0f172a' }}>
                          <Bike size={14} color="#0f172a" />
                        </div>
                        <span style={{ fontSize: '8px', fontWeight: '800', backgroundColor: '#1e293b', color: '#f8fafc', padding: '2px 4px', borderRadius: '4px', marginTop: '2px', border: '1px solid #334155' }}>{biker.distance} KM</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PANEL */}
          {bottomNavTab === 'panel' && (
            <div style={{ backgroundColor: '#0f172a', height: '340px', borderRadius: '20px', border: '1px solid #334155', padding: '16px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid #334155', paddingBottom: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#f8fafc' }}>Important Campus Notices</h3>
              </div>

              <style>{`
                @keyframes scrollNotices {
                  0% { transform: translateY(0); }
                  100% { transform: translateY(-50%); }
                }
                .notice-ticker-container {
                  height: 220px;
                  overflow: hidden;
                  position: relative;
                  background: #1e293b;
                  border: 1px solid #334155;
                  border-radius: 14px;
                  padding: 10px;
                }
                .notice-ticker-track {
                  display: flex;
                  flex-direction: column;
                  gap: 10px;
                  animation: scrollNotices 10s linear infinite;
                }
                .notice-ticker-track:hover {
                  animation-play-state: paused;
                }
                .notice-item {
                  background: #0f172a;
                  border: 1px solid #334155;
                  border-radius: 10px;
                  padding: 12px 14px;
                  font-size: 12px;
                  font-weight: 700;
                  color: #f8fafc;
                }
              `}</style>

              <div className="notice-ticker-container">
                <div className="notice-ticker-track">
                  {[...NOTICES_LIST, ...NOTICES_LIST].map((notice, idx) => (
                    <div key={idx} className="notice-item">
                      {notice}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </main>

        {/* BOTTOM NAVIGATION BAR */}
        <nav style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#1e293b',
          borderTop: '1px solid #334155',
          padding: '8px 0 14px 0',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          zIndex: 90,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
          maxWidth: '1080px',
          margin: '0 auto',
          boxSizing: 'border-box'
        }}>
          <button
            onClick={() => setBottomNavTab('ride')}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              cursor: 'pointer',
              color: bottomNavTab === 'ride' ? '#38bdf8' : '#94a3b8',
              fontWeight: bottomNavTab === 'ride' ? '800' : '600',
              fontSize: '11px'
            }}
          >
            <Navigation size={18} color={bottomNavTab === 'ride' ? '#38bdf8' : '#94a3b8'} />
            <span>Ride</span>
          </button>

          <button
            onClick={() => setBottomNavTab('radar')}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              cursor: 'pointer',
              color: bottomNavTab === 'radar' ? '#38bdf8' : '#94a3b8',
              fontWeight: bottomNavTab === 'radar' ? '800' : '600',
              fontSize: '11px'
            }}
          >
            <Radio size={18} color={bottomNavTab === 'radar' ? '#38bdf8' : '#94a3b8'} />
            <span>Radar</span>
          </button>

          <button
            onClick={() => setBottomNavTab('panel')}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              cursor: 'pointer',
              color: bottomNavTab === 'panel' ? '#38bdf8' : '#94a3b8',
              fontWeight: bottomNavTab === 'panel' ? '800' : '600',
              fontSize: '11px'
            }}
          >
            <User size={18} color={bottomNavTab === 'panel' ? '#38bdf8' : '#94a3b8'} />
            <span>Panel</span>
          </button>
        </nav>

      </div>

      {matchedRide && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#1e293b', borderRadius: '24px', padding: '20px', width: '100%', maxWidth: '380px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', border: '1px solid #334155', maxHeight: '90vh', overflowY: 'auto', color: '#f8fafc' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: '#38bdf8', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px auto' }}>
              <Check size={24} />
            </div>

            <span style={{ fontSize: '9px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', backgroundColor: '#38bdf8', padding: '3px 10px', borderRadius: '9999px' }}>
              Commute Matched
            </span>
            <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#f8fafc', margin: '6px 0 2px 0' }}>Ride Confirmed</h2>
            <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 12px 0' }}>
              {matchedRide.fromLocation} to {matchedRide.toLocation}
            </p>

            <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '14px', padding: '10px', textAlign: 'left', marginBottom: '12px' }}>
              <p style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Partner Details</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#f8fafc' }}>
                  {matchedRide.creatorId === currentUser._id ? matchedRide.acceptedBy?.name : matchedRide.creatorName}
                </span>
                <span style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', padding: '2px 6px', backgroundColor: '#38bdf8', borderRadius: '4px', color: '#0f172a' }}>
                  {matchedRide.creatorId === currentUser._id ? matchedRide.acceptedBy?.role : matchedRide.creatorRole}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#38bdf8', fontWeight: '800' }}>
                <Phone size={13} color="#38bdf8" />
                <span>{matchedRide.creatorId === currentUser._id ? matchedRide.acceptedBy?.phone : matchedRide.creatorPhone}</span>
              </div>
            </div>

            <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '14px', padding: '10px', textAlign: 'left', marginBottom: '12px' }}>
              <p style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', margin: '0 0 6px 0' }}>
                In-App Quick Messages
              </p>

              <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '6px', height: '80px', overflowY: 'auto', marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {chatMessages.filter(m => m.rideId === matchedRide._id).length === 0 ? (
                  <p style={{ fontSize: '10px', color: '#94a3b8', textAlign: 'center', margin: 'auto' }}>No messages yet. Send a preset below.</p>
                ) : (
                  chatMessages.filter(m => m.rideId === matchedRide._id).map((m, idx) => (
                    <div key={idx} style={{ fontSize: '10px', backgroundColor: m.senderName === (currentUser.name || currentUser.fullName) ? '#0369a1' : '#334155', color: '#f8fafc', padding: '3px 6px', borderRadius: '6px', alignSelf: m.senderName === (currentUser.name || currentUser.fullName) ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                      <strong>{m.senderName}:</strong> {m.text} <span style={{ fontSize: '8px', opacity: 0.8 }}>({m.time})</span>
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
                    style={{ whiteSpace: 'nowrap', backgroundColor: '#334155', border: 'none', padding: '3px 6px', borderRadius: '6px', fontSize: '9px', fontWeight: '700', cursor: 'pointer', color: '#f8fafc' }}
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
                  style={{ flex: 1, padding: '6px 8px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#f8fafc', fontSize: '10px', outline: 'none' }}
                />
                <button
                  onClick={() => handleSendChatMessage(customChatMessage)}
                  style={{ background: '#38bdf8', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: '800', color: '#0f172a' }}
                >
                  <Send size={13} />
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <a 
                href={`tel:${matchedRide.creatorId === currentUser._id ? matchedRide.acceptedBy?.phone : matchedRide.creatorPhone}`}
                style={{ padding: '8px', borderRadius: '10px', backgroundColor: '#38bdf8', color: '#0f172a', fontWeight: '800', fontSize: '11px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                <Phone size={12} /> Call Partner
              </a>

              <a 
                href={`https://wa.me/91${matchedRide.creatorId === currentUser._id ? matchedRide.acceptedBy?.phone : matchedRide.creatorPhone}`}
                target="_blank"
                rel="noreferrer"
                style={{ padding: '8px', borderRadius: '10px', backgroundColor: '#334155', color: '#f8fafc', fontWeight: '800', fontSize: '11px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                <MessageCircle size={12} /> WhatsApp
              </a>
            </div>

            <button
              onClick={() => handleDeleteRide(matchedRide._id, matchedRide)}
              style={{ width: '100%', padding: '8px', borderRadius: '10px', border: '1px solid #7f1d1d', backgroundColor: '#7f1d1d', color: '#fecaca', fontWeight: '800', fontSize: '11px', cursor: 'pointer' }}
            >
              Finish & Save History
            </button>
          </div>
        </div>
      )}

      {showHistoryModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#1e293b', borderRadius: '24px', padding: '20px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', border: '1px solid #334155', maxHeight: '85vh', display: 'flex', flexDirection: 'column', color: '#f8fafc' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid #334155', paddingBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <History size={16} color="#38bdf8" />
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800' }}>Commute History & Stats</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {completedTripsHistory.length > 0 && (
                  <button onClick={handleClearHistory} title="Clear History" style={{ border: 'none', background: '#7f1d1d', color: '#fecaca', borderRadius: '6px', width: '26px', height: '26px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trash2 size={13} />
                  </button>
                )}
                <button onClick={() => setShowHistoryModal(false)} style={{ border: 'none', background: '#334155', color: '#f8fafc', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={15} />
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', padding: '12px', borderRadius: '14px', textAlign: 'center' }}>
                <span style={{ fontSize: '9px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Total Trips</span>
                <p style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: '900', color: '#38bdf8' }}>{completedTripsHistory.length}</p>
              </div>
              <div style={{ background: '#0f172a', border: '1px solid #334155', padding: '12px', borderRadius: '14px', textAlign: 'center' }}>
                <span style={{ fontSize: '9px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Est. KM Saved</span>
                <p style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: '900', color: '#38bdf8' }}>{totalKmSavedSum} KM</p>
              </div>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px' }}>
              {completedTripsHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 16px', color: '#94a3b8' }}>
                  <History size={28} color="#94a3b8" style={{ margin: '0 auto 6px auto' }} />
                  <p style={{ margin: 0, fontSize: '11px', fontWeight: '700' }}>No completed trips recorded</p>
                </div>
              ) : (
                completedTripsHistory.map((trip) => (
                  <div key={trip.id} style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: '#f8fafc' }}>{trip.route}</span>
                      <span style={{ fontSize: '9px', fontWeight: '800', backgroundColor: '#38bdf8', color: '#0f172a', padding: '2px 6px', borderRadius: '4px' }}>+{trip.kmSaved} KM</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#94a3b8' }}>
                      <span>Partner: {trip.partner}</span>
                      <span>{trip.date}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setShowHistoryModal(false)}
              style={{ marginTop: '14px', width: '100%', padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: '#38bdf8', color: '#0f172a', fontWeight: '800', fontSize: '11px', cursor: 'pointer' }}
            >
              Close History
            </button>
          </div>
        </div>
      )}

    </div>
  );
}