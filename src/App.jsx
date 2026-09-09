import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import confetti from 'canvas-confetti';
import { 
  Bike, UserCheck, Check, Phone, ArrowRight, ArrowLeft,
  MapPin, LogOut, MessageCircle, AlertCircle, X, 
  Navigation, Trash2, ChevronDown, Clock, Crown, Compass, Radio, RotateCw,
  Crosshair, ShieldCheck, Map
} from 'lucide-react';

const BACKEND_URL = "https://spct-avengers-backend.onrender.com";
const ADMIN_EMAIL = "arthurs10pc@gmail.com";
const GOOGLE_CLIENT_ID = "644760404837-q0g258ajc1r1vjo8jqtru2c1cc11q1n7.apps.googleusercontent.com";

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
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [selectedRole, setSelectedRole] = useState('ride_taker');
  const [authTab, setAuthTab] = useState('login');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showRadarPage, setShowRadarPage] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [tempGoogleUser, setTempGoogleUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Trip booking states
  const [fromLoc, setFromLoc] = useState('');
  const [toLoc, setToLoc] = useState('');
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('');

  const [rides, setRides] = useState([]);
  const [bikersList, setBikersList] = useState([]);
  const [matchedRide, setMatchedRide] = useState(null);

  // Real-time GPS & Radar states
  const [userLocation, setUserLocation] = useState(DEFAULT_CENTER);
  const [liveNearbyRiders, setLiveNearbyRiders] = useState([]);
  const [isRefreshingRadar, setIsRefreshingRadar] = useState(false);
  const [selectedRiderDetail, setSelectedRiderDetail] = useState(null);

  const socketRef = useRef(null);
  const googleBtnRef = useRef(null);
  const fromContainerRef = useRef(null);
  const toContainerRef = useRef(null);

  const isAdmin = currentUser?.email === ADMIN_EMAIL;
  const isBiker = currentUser?.role === 'biker';

  const bikersWithin2Km = liveNearbyRiders
    .filter(r => r.userId !== currentUser?._id)
    .map(r => {
      const distance = userLocation 
        ? calculateDistanceKm(userLocation.lat, userLocation.lng, r.lat, r.lng)
        : '0.4';
      return { ...r, distance: distance || '0.5' };
    })
    .filter(r => parseFloat(r.distance) <= 2.0);

  const riderAcceptedRide = isBiker 
    ? rides.find(r => r.status === 'accepted' && r.acceptedBy?.phone === currentUser.phone)
    : null;

  const unacceptedRidesForBikers = rides.filter(r => r.status !== 'accepted');

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

  const fetchLiveGPS = () => {
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
  };

  useEffect(() => {
    fetchLiveGPS();
    const interval = setInterval(fetchLiveGPS, 12000);
    return () => clearInterval(interval);
  }, [currentUser, isBiker]);

  useEffect(() => {
    socketRef.current = io(BACKEND_URL, {
      transports: ['websocket', 'polling']
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
      setRides(prev => [newRide, ...prev]);
    });

    socketRef.current.on('all_rides_cleared', () => {
      setRides([]);
    });

    socketRef.current.on('ride_deleted_broadcast', (deletedId) => {
      setRides(prev => prev.filter(r => r._id !== deletedId));
    });

    socketRef.current.on('nearby_riders_update', (ridersList) => {
      setLiveNearbyRiders(Array.isArray(ridersList) ? ridersList : []);
    });

    socketRef.current.on('ride_accepted_broadcast', (updatedRide) => {
      setRides(prev => prev.map(r => r._id === updatedRide._id ? updatedRide : r));
      try {
        const localUser = JSON.parse(localStorage.getItem('spct_user') || '{}');
        if (localUser && (localUser._id === updatedRide.creatorId || localUser.phone === updatedRide.acceptedBy?.phone)) {
          setMatchedRide(updatedRide);
          confetti({ particleCount: 75, spread: 80, origin: { y: 0.6 } });
        }
      } catch (e) {}
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [isAdmin]);

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

        if (res.data.success) {
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

      if (res.data.success) {
        setCurrentUser(res.data.user);
        localStorage.setItem('spct_user', JSON.stringify(res.data.user));
        setShowAuthModal(false);
        setTempGoogleUser(null);
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
  };

  const handleAcceptRide = (ride) => {
    if (!currentUser || ride.status === 'accepted') return;
    if (ride.creatorId === currentUser._id) {
      alert("This is your own ride request!");
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

  const handleDeleteRide = async (rideId) => {
    if (!window.confirm("Remove this ride record permanently?")) return;
    try {
      await axios.delete(`${BACKEND_URL}/api/rides/${rideId}`);
      setRides(prev => prev.filter(r => r._id !== rideId));
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  const handleClearAllRides = async () => {
    if (!window.confirm("Do you want to clear all active rides from the database?")) return;
    try {
      await axios.delete(`${BACKEND_URL}/api/rides/clear-all`);
      setRides([]);
    } catch (err) {
      alert("Failed to clear: " + err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('spct_user');
    setCurrentUser(null);
  };

  // VIEW 1: MINT & EMERALD THEME 2 KM RADAR VIEW
  if (showRadarPage) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f0fdf4', color: '#065f46', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        
        {/* Top Header */}
        <div style={{ padding: '16px', maxWidth: '1100px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff', padding: '12px 20px', borderRadius: '22px', boxShadow: '0 4px 14px rgba(16,185,129,0.08)', border: '1px solid #a7f3d0' }}>
            <button
              onClick={() => setShowRadarPage(false)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: '#ecfdf5', color: '#059669', padding: '10px 18px', borderRadius: '14px', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
            >
              <ArrowLeft size={16} /> Back to Home
            </button>

            <button
              onClick={handleRefreshRadar}
              disabled={isRefreshingRadar}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#10b981',
                color: '#ffffff',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '14px',
                fontWeight: '800',
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
              }}
            >
              <RotateCw size={15} style={{ animation: isRefreshingRadar ? 'spin 1s linear infinite' : 'none' }} />
              <span>{isRefreshingRadar ? 'Scanning...' : 'Refresh Radar'}</span>
            </button>
          </div>
        </div>

        {/* Live Geofence Banner */}
        <div style={{ padding: '0 16px 14px 16px', maxWidth: '1100px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
          <div style={{ backgroundColor: '#064e3b', border: '1px solid #047857', padding: '20px 24px', borderRadius: '26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', color: '#ffffff', boxShadow: '0 10px 25px rgba(6,78,59,0.2)' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: '900', color: '#a7f3d0', textTransform: 'uppercase', letterSpacing: '0.8px', backgroundColor: 'rgba(167,243,208,0.2)', padding: '4px 12px', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#34d399', display: 'inline-block' }} /> REAL-TIME CAMPUS GEOFENCE
              </span>
              <h1 style={{ margin: '8px 0 2px 0', fontSize: '24px', fontWeight: '900', color: '#ffffff' }}>Live Bikers Radar (Within 2 KM)</h1>
              <p style={{ margin: 0, fontSize: '12px', color: '#6ee7b7' }}>
                Detects active hostel riders who have GPS enabled within 2 KM range.
              </p>
            </div>

            <div style={{ backgroundColor: '#065f46', border: '2px solid #059669', padding: '10px 20px', borderRadius: '18px', textAlign: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: '800', color: '#a7f3d0', letterSpacing: '0.5px' }}>ONLINE WITHIN 2 KM</span>
              <p style={{ margin: '2px 0 0 0', fontSize: '22px', fontWeight: '900', color: '#ffffff' }}>{bikersWithin2Km.length} Riders</p>
            </div>
          </div>
        </div>

        {/* RADAR SWEEP ANIMATION CONTAINER */}
        <div style={{ flex: 1, position: 'relative', width: '100%', maxWidth: '1100px', margin: '0 auto 16px auto', padding: '0 16px', boxSizing: 'border-box', minHeight: '440px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '100%', height: '460px', backgroundColor: '#022c22', borderRadius: '28px', border: '2px solid #047857', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(4,120,87,0.25)' }}>
            
            {/* Concentric Radar Rings */}
            <div style={{ position: 'absolute', width: '360px', height: '360px', borderRadius: '50%', border: '1px dashed rgba(52,211,153,0.25)' }} />
            <div style={{ position: 'absolute', width: '240px', height: '240px', borderRadius: '50%', border: '1px dashed rgba(52,211,153,0.35)' }} />
            <div style={{ position: 'absolute', width: '120px', height: '120px', borderRadius: '50%', border: '1px dashed rgba(52,211,153,0.45)' }} />
            
            {/* Center User Dot */}
            <div style={{ width: '20px', height: '20px', backgroundColor: '#34d399', borderRadius: '50%', boxShadow: '0 0 20px #34d399', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '8px', height: '8px', backgroundColor: '#ffffff', borderRadius: '50%' }} />
            </div>

            {/* Floating Bike Icons around Radar */}
            {bikersWithin2Km.length === 0 ? (
              <div style={{ position: 'absolute', zIndex: 20, textAlign: 'center', backgroundColor: 'rgba(6,78,59,0.9)', padding: '16px 24px', borderRadius: '20px', border: '1px solid #059669', color: '#fff' }}>
                <Compass size={32} color="#34d399" style={{ margin: '0 auto 8px auto', animation: 'spin 4s linear infinite' }} />
                <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '900' }}>Scanning 2 KM Radius...</h4>
                <p style={{ margin: 0, fontSize: '11px', color: '#a7f3d0' }}>Waiting for active bikers to report GPS coordinates</p>
              </div>
            ) : (
              bikersWithin2Km.map((biker, idx) => {
                const angle = (idx * 90) * (Math.PI / 180);
                const radius = 110 + (idx * 25);
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
                      alignItems: 'center',
                      animation: 'bounce 2s infinite'
                    }}
                  >
                    <div style={{ backgroundColor: '#10b981', padding: '8px', borderRadius: '50%', border: '2px solid #ffffff', boxShadow: '0 0 15px rgba(16,185,129,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Bike size={20} color="#ffffff" />
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: '900', backgroundColor: '#022c22', color: '#34d399', padding: '2px 6px', borderRadius: '6px', marginTop: '4px', border: '1px solid #047857' }}>
                      {biker.name} ({biker.distance} KM)
                    </span>
                  </div>
                );
              })
            )}

            {/* Selected Rider Popup Card */}
            {selectedRiderDetail && (
              <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', maxWidth: '340px', margin: '0 auto', zIndex: 50, backgroundColor: '#ffffff', color: '#065f46', borderRadius: '24px', padding: '16px 20px', boxShadow: '0 14px 35px rgba(4,120,87,0.3)', border: '2px solid #a7f3d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '10px', fontWeight: '900', color: '#047857', backgroundColor: '#ecfdf5', padding: '2px 8px', borderRadius: '6px' }}>
                    🏍️ {selectedRiderDetail.distance} KM AWAY
                  </span>
                  <button onClick={() => setSelectedRiderDetail(null)} style={{ border: 'none', background: '#f1f5f9', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={14} />
                  </button>
                </div>
                <h4 style={{ margin: '0 0 2px 0', fontSize: '16px', fontWeight: '900' }}>{selectedRiderDetail.name}</h4>
                <p style={{ margin: '0 0 12px 0', fontSize: '11px', color: '#047857' }}>Active GPS Pilot within 2 KM range</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <a href={`tel:${selectedRiderDetail.phone}`} style={{ padding: '10px', borderRadius: '12px', backgroundColor: '#10b981', color: '#ffffff', fontWeight: '800', fontSize: '12px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Phone size={13} /> Call
                  </a>
                  <a href={`https://wa.me/91${selectedRiderDetail.phone}`} target="_blank" rel="noreferrer" style={{ padding: '10px', borderRadius: '12px', backgroundColor: '#064e3b', color: '#ffffff', fontWeight: '800', fontSize: '12px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <MessageCircle size={13} /> WhatsApp
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bikers List */}
        <div style={{ padding: '0 16px 20px 16px', maxWidth: '1100px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
          {bikersWithin2Km.length > 0 && (
            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '6px', scrollbarWidth: 'none' }}>
              {bikersWithin2Km.map((biker, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedRiderDetail(biker)}
                  style={{ minWidth: '240px', backgroundColor: '#ffffff', color: '#065f46', padding: '14px', borderRadius: '20px', border: '1px solid #a7f3d0', cursor: 'pointer', flexShrink: 0, boxShadow: '0 4px 12px rgba(16,185,129,0.08)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '12px', backgroundColor: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Bike size={20} />
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '900', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{biker.name}</h4>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: '#059669' }}>📍 {biker.distance} KM</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#047857', fontWeight: '700' }}>Tap to view contact</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // VIEW 2: SPLASH / ROLE SELECTION (MINT & EMERALD THEME)
  if (!currentUser) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ width: '100%', maxWidth: '420px', textAlign: 'center' }}>
          
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
            <img 
              src="/logo.png" 
              alt="Pirate Logo" 
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
              style={{ width: '90px', height: '90px', objectFit: 'contain', filter: 'drop-shadow(0 8px 16px rgba(16,185,129,0.25))' }} 
            />
          </div>

          <h1 style={{ fontSize: '30px', fontWeight: '900', color: '#065f46', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>SPCT AVENGERS</h1>
          <p style={{ fontSize: '13px', color: '#047857', fontWeight: '700', marginBottom: '28px' }}>Hostel Ride-Pooling Hub</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <button
              onClick={() => { setSelectedRole('biker'); setShowAuthModal(true); setErrorMsg(''); setTempGoogleUser(null); }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', backgroundColor: '#fff', border: '2px solid #a7f3d0', borderRadius: '26px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(16,185,129,0.06)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '54px', height: '54px', borderRadius: '18px', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                  <Bike size={28} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <span style={{ fontSize: '10px', fontWeight: '900', color: '#10b981', textTransform: 'uppercase' }}>RIDER / PILOT</span>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#065f46' }}>I Have a Bike</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#047857' }}>Give lifts to hostel students</p>
                </div>
              </div>
              <ArrowRight size={20} color="#10b981" />
            </button>

            <button
              onClick={() => { setSelectedRole('ride_taker'); setShowAuthModal(true); setErrorMsg(''); setTempGoogleUser(null); }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', backgroundColor: '#fff', border: '2px solid #a7f3d0', borderRadius: '26px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(16,185,129,0.06)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '54px', height: '54px', borderRadius: '18px', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                  <UserCheck size={28} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <span style={{ fontSize: '10px', fontWeight: '900', color: '#059669', textTransform: 'uppercase' }}>PASSENGER</span>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#065f46' }}>Need a Ride</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#047857' }}>Request bikes leaving hostel</p>
                </div>
              </div>
              <ArrowRight size={20} color="#10b981" />
            </button>

            <button
              onClick={() => setShowRadarPage(true)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', backgroundColor: '#064e3b', border: '2px solid #059669', borderRadius: '26px', cursor: 'pointer', boxShadow: '0 6px 18px rgba(6,78,59,0.25)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '54px', height: '54px', borderRadius: '18px', backgroundColor: '#065f46', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
                  <Radio size={28} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <span style={{ fontSize: '10px', fontWeight: '900', color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.5px' }}>GPS RADAR</span>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#ffffff' }}>Live Radar (2 KM)</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#a7f3d0' }}>Visual pulse of active nearby bikes</p>
                </div>
              </div>
              <ArrowRight size={20} color="#34d399" />
            </button>
          </div>
        </div>

        {showAuthModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(6,78,59,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div style={{ backgroundColor: '#fff', borderRadius: '32px', padding: '24px', width: '100%', maxWidth: '360px', position: 'relative', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
              <button onClick={() => { setShowAuthModal(false); setTempGoogleUser(null); }} style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: '#ecfdf5', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#047857' }}>
                <X size={16} />
              </button>

              {!tempGoogleUser && (
                <div style={{ display: 'flex', backgroundColor: '#ecfdf5', padding: '4px', borderRadius: '16px', marginBottom: '16px' }}>
                  <button onClick={() => { setAuthTab('login'); setErrorMsg(''); }} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '12px', backgroundColor: authTab === 'login' ? '#fff' : 'transparent', color: authTab === 'login' ? '#10b981' : '#047857' }}>Log In</button>
                  <button onClick={() => { setAuthTab('signup'); setErrorMsg(''); }} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '12px', backgroundColor: authTab === 'signup' ? '#fff' : 'transparent', color: authTab === 'signup' ? '#10b981' : '#047857' }}>Sign Up</button>
                </div>
              )}

              <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#065f46', margin: '0 0 6px 0' }}>
                {tempGoogleUser ? "Contact Details" : (authTab === 'login' ? "Welcome Back" : `Join as ${selectedRole === 'biker' ? 'Rider' : 'Passenger'}`)}
              </h2>
              <p style={{ fontSize: '12px', color: '#047857', marginBottom: '20px' }}>
                {tempGoogleUser ? "Enter your mobile number for commuter connection" : "Sign in using your Google account"}
              </p>

              {errorMsg && (
                <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '11px', padding: '10px 14px', borderRadius: '14px', marginBottom: '14px', textAlign: 'left' }}>
                  {errorMsg}
                </div>
              )}

              {!tempGoogleUser ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50px' }}>
                  <div ref={googleBtnRef}></div>
                  {authLoading && <p style={{ fontSize: '12px', color: '#10b981', fontWeight: 'bold', marginTop: '10px' }}>Connecting...</p>}
                </div>
              ) : (
                <form onSubmit={handleCompleteAuth} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px solid #a7f3d0' }}>
                    {tempGoogleUser.avatar ? (
                      <img src={tempGoogleUser.avatar} alt="User" style={{ width: '38px', height: '38px', borderRadius: '50%' }} />
                    ) : (
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        {tempGoogleUser.fullName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p style={{ margin: 0, fontSize: '12px', fontWeight: 'bold', color: '#065f46' }}>{tempGoogleUser.fullName}</p>
                      <p style={{ margin: 0, fontSize: '10px', color: '#047857' }}>{tempGoogleUser.email}</p>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: '#065f46', display: 'block', marginBottom: '4px' }}>10-Digit Mobile Number</label>
                    <input 
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="e.g. 9876543210"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: '14px', border: '2px solid #a7f3d0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    style={{ width: '100%', padding: '14px', borderRadius: '14px', border: 'none', backgroundColor: '#10b981', color: '#fff', fontWeight: '800', fontSize: '13px', cursor: 'pointer', boxShadow: '0 8px 18px rgba(16,185,129,0.3)' }}
                  >
                    {authLoading ? "Launching..." : "Complete & Enter"}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // VIEW 3: MASTER ADMIN WORKSPACE
  if (isAdmin) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f0fdf4', padding: '16px', boxSizing: 'border-box', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '32px', border: '3px solid #065f46', boxShadow: '0 25px 50px rgba(6,78,59,0.1)', overflow: 'hidden' }}>
          <header style={{ padding: '18px 24px', backgroundColor: '#065f46', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '14px', backgroundColor: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#065f46' }}>
                <Crown size={24} />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '900' }}>SPCT AVENGERS MASTER ADMIN</h1>
                <span style={{ fontSize: '11px', color: '#a7f3d0', fontWeight: '600' }}>Root: {currentUser.email}</span>
              </div>
            </div>

            <button onClick={handleLogout} style={{ border: 'none', background: '#047857', color: '#fff', padding: '8px 12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700' }}>
              <LogOut size={16} /> Logout
            </button>
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 320px) 1fr minmax(280px, 340px)', minHeight: '740px' }}>
            <div style={{ borderRight: '3px solid #065f46', padding: '20px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '2px solid #a7f3d0', paddingBottom: '10px' }}>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#065f46', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bike size={20} color="#10b981" /> Riders List
                </h2>
                <span style={{ fontSize: '11px', fontWeight: '800', backgroundColor: '#ecfdf5', color: '#10b981', padding: '2px 8px', borderRadius: '8px' }}>
                  {bikersList.length} Registered
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', flex: 1, maxHeight: '640px' }}>
                {bikersList.map((biker) => (
                  <div key={biker._id} style={{ backgroundColor: '#ffffff', border: '2px solid #a7f3d0', borderRadius: '18px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {biker.avatar ? (
                      <img src={biker.avatar} alt="Rider" style={{ width: '38px', height: '38px', borderRadius: '12px', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '38px', height: '38px', borderRadius: '12px', backgroundColor: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900' }}>
                        {biker.fullName.charAt(0)}
                      </div>
                    )}
                    <div style={{ overflow: 'hidden', flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: '900', color: '#065f46', truncate: true }}>{biker.fullName}</p>
                      <p style={{ margin: 0, fontSize: '11px', color: '#047857', fontFamily: 'monospace' }}>{biker.phone || 'No Phone'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: '24px', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ borderBottom: '2px solid #a7f3d0', paddingBottom: '10px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#065f46' }}>Admin Controls & Operations</h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                <div style={{ backgroundColor: '#ecfdf5', border: '2px solid #a7f3d0', padding: '16px', borderRadius: '20px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#047857' }}>TOTAL RIDES</span>
                  <p style={{ margin: '6px 0 0 0', fontSize: '28px', fontWeight: '900', color: '#065f46' }}>{rides.length}</p>
                </div>
                <div style={{ backgroundColor: '#f0fdf4', border: '2px solid #34d399', padding: '16px', borderRadius: '20px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#059669' }}>CONNECTED</span>
                  <p style={{ margin: '6px 0 0 0', fontSize: '28px', fontWeight: '900', color: '#065f46' }}>{rides.filter(r => r.status === 'accepted').length}</p>
                </div>
                <div style={{ backgroundColor: '#fffbeb', border: '2px solid #fde68a', padding: '16px', borderRadius: '20px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#b45309' }}>WAITING</span>
                  <p style={{ margin: '6px 0 0 0', fontSize: '28px', fontWeight: '900', color: '#065f46' }}>{rides.filter(r => r.status !== 'accepted').length}</p>
                </div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', border: '2px solid #a7f3d0', borderRadius: '24px', padding: '20px' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '900', color: '#065f46' }}>Hostel Pool Actions</h3>
                <button
                  onClick={handleClearAllRides}
                  style={{ width: '100%', padding: '14px 18px', borderRadius: '16px', border: 'none', backgroundColor: '#dc2626', color: '#ffffff', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <Trash2 size={16} /> Flush & Wipe All Active Rides
                </button>
              </div>
            </div>

            <div style={{ borderLeft: '3px solid #065f46', padding: '20px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '2px solid #a7f3d0', paddingBottom: '10px' }}>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#065f46', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserCheck size={20} color="#10b981" /> Active Requests
                </h2>
                <span style={{ fontSize: '11px', fontWeight: '800', backgroundColor: '#ecfdf5', color: '#10b981', padding: '2px 8px', borderRadius: '8px' }}>
                  {rides.length} Live
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', flex: 1, maxHeight: '640px' }}>
                {rides.map((ride) => (
                  <div key={ride._id} style={{ backgroundColor: '#ffffff', border: '2px solid #a7f3d0', borderRadius: '18px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', fontWeight: '900', color: '#065f46' }}>{ride.creatorName}</span>
                      <button onClick={() => handleDeleteRide(ride._id)} style={{ border: 'none', background: '#fef2f2', color: '#dc2626', padding: '4px', borderRadius: '8px', cursor: 'pointer' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div style={{ fontSize: '11px', color: '#047857', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{ride.fromLocation}</span>
                      <ArrowRight size={12} color="#10b981" />
                      <span>{ride.toLocation}</span>
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

  // VIEW 4: MAIN WORKSPACE (PASSENGER / RIDER - MINT & EMERALD THEME)
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0fdf4', padding: '16px', boxSizing: 'border-box', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '1080px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '32px', boxShadow: '0 20px 45px rgba(16,185,129,0.08)', border: '1px solid #a7f3d0', overflow: 'hidden' }}>
        
        <header style={{ padding: '16px 24px', borderBottom: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {currentUser.avatar ? (
              <img src={currentUser.avatar} alt="Avatar" style={{ width: '42px', height: '42px', borderRadius: '14px', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '42px', height: '42px', borderRadius: '14px', backgroundColor: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '15px' }}>
                {currentUser.name?.charAt(0)}
              </div>
            )}
            <div>
              <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: '#065f46' }}>{currentUser.name}</h2>
              <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', color: '#059669', backgroundColor: '#ecfdf5', padding: '2px 8px', borderRadius: '6px' }}>
                {isBiker ? 'Rider / Pilot' : 'Passenger'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setShowRadarPage(true)}
              style={{ padding: '8px 14px', borderRadius: '12px', border: '1px solid #059669', backgroundColor: '#064e3b', color: '#34d399', fontWeight: '800', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Radio size={14} /> Open 2 KM Radar
            </button>

            <button
              onClick={handleClearAllRides}
              style={{ padding: '8px 12px', borderRadius: '12px', border: '1px solid #fecaca', backgroundColor: '#fef2f2', color: '#dc2626', fontWeight: '800', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Trash2 size={14} /> Clear Stream
            </button>
            
            <button onClick={handleLogout} title="Sign Out" style={{ border: 'none', background: '#ecfdf5', padding: '8px', borderRadius: '12px', cursor: 'pointer', color: '#047857' }}>
              <LogOut size={16} />
            </button>
          </div>
        </header>

        <main style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {!isBiker && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <div style={{ backgroundColor: '#f0fdf4', border: '2px solid #a7f3d0', borderRadius: '28px', padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '12px', backgroundColor: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Navigation size={18} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#065f46' }}>Request A Ride</h3>
                    <p style={{ margin: 0, fontSize: '12px', color: '#047857' }}>Pick a spot or type your custom route</p>
                  </div>
                </div>

                <form onSubmit={handlePostRide} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div ref={fromContainerRef} style={{ position: 'relative' }}>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: '#065f46', display: 'block', marginBottom: '4px' }}>From Location</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Hostel Block B, Main Gate" 
                        value={fromLoc}
                        onFocus={() => setShowFromDropdown(true)}
                        onChange={(e) => {
                          setFromLoc(e.target.value);
                          setShowFromDropdown(true);
                        }}
                        style={{ width: '100%', padding: '12px 36px 12px 14px', borderRadius: '14px', border: '2px solid #a7f3d0', fontSize: '13px', outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff', fontWeight: '600' }}
                      />
                      <ChevronDown size={18} color="#059669" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    </div>

                    {showFromDropdown && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '6px', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #a7f3d0', boxShadow: '0 12px 24px rgba(16,185,129,0.1)', zIndex: 40, maxHeight: '180px', overflowY: 'auto' }}>
                        <div style={{ padding: '6px 12px', fontSize: '10px', fontWeight: '800', color: '#047857', textTransform: 'uppercase' }}>Select Location</div>
                        {PRESET_LOCATIONS.map((loc, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setFromLoc(loc);
                              setShowFromDropdown(false);
                            }}
                            style={{ padding: '9px 14px', fontSize: '12px', fontWeight: '700', color: '#065f46', cursor: 'pointer', borderBottom: '1px solid #ecfdf5', display: 'flex', alignItems: 'center', gap: '8px' }}
                          >
                            <MapPin size={13} color="#10b981" />
                            <span>{loc}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div ref={toContainerRef} style={{ position: 'relative' }}>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: '#065f46', display: 'block', marginBottom: '4px' }}>To Destination</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Metro Station, Campus 2" 
                        value={toLoc}
                        onFocus={() => setShowToDropdown(true)}
                        onChange={(e) => {
                          setToLoc(e.target.value);
                          setShowToDropdown(true);
                        }}
                        style={{ width: '100%', padding: '12px 36px 12px 14px', borderRadius: '14px', border: '2px solid #a7f3d0', fontSize: '13px', outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff', fontWeight: '600' }}
                      />
                      <ChevronDown size={18} color="#059669" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    </div>

                    {showToDropdown && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '6px', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #a7f3d0', boxShadow: '0 12px 24px rgba(16,185,129,0.1)', zIndex: 40, maxHeight: '180px', overflowY: 'auto' }}>
                        <div style={{ padding: '6px 12px', fontSize: '10px', fontWeight: '800', color: '#047857', textTransform: 'uppercase' }}>Select Destination</div>
                        {PRESET_LOCATIONS.map((loc, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setToLoc(loc);
                              setShowToDropdown(false);
                            }}
                            style={{ padding: '9px 14px', fontSize: '12px', fontWeight: '700', color: '#065f46', cursor: 'pointer', borderBottom: '1px solid #ecfdf5', display: 'flex', alignItems: 'center', gap: '8px' }}
                          >
                            <MapPin size={13} color="#10b981" />
                            <span>{loc}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ backgroundColor: '#ffffff', border: '2px solid #a7f3d0', borderRadius: '18px', padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={16} color="#10b981" />
                        <span style={{ fontSize: '12px', fontWeight: '800', color: '#065f46' }}>
                          Timing: <span style={{ color: '#059669' }}>{isScheduled ? 'Scheduled Ahead' : 'Now (Instant)'}</span>
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsScheduled(!isScheduled)}
                        style={{ border: 'none', background: isScheduled ? '#ecfdf5' : '#f8fafc', color: isScheduled ? '#059669' : '#047857', fontSize: '11px', fontWeight: '800', padding: '6px 12px', borderRadius: '10px', cursor: 'pointer' }}
                      >
                        {isScheduled ? 'Switch to Now' : '+ Pick Future Time'}
                      </button>
                    </div>

                    {isScheduled && (
                      <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #a7f3d0' }}>
                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#047857', display: 'block', marginBottom: '4px' }}>Choose Departure Date & Time</label>
                        <input
                          type="datetime-local"
                          required={isScheduled}
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1px solid #a7f3d0', fontSize: '12px', fontWeight: '700', color: '#065f46', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                    )}
                  </div>

                  <button 
                    type="submit"
                    style={{ padding: '14px', borderRadius: '14px', border: 'none', backgroundColor: '#10b981', color: '#fff', fontWeight: '900', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 6px 16px rgba(16,185,129,0.3)' }}
                  >
                    <span>Post Ride Request</span>
                    <ArrowRight size={16} />
                  </button>
                </form>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '900', color: '#065f46' }}>Active Trip Requests</span>
                  <span style={{ fontSize: '11px', fontWeight: '800', padding: '3px 8px', backgroundColor: '#ecfdf5', color: '#059669', borderRadius: '9999px' }}>
                    {rides.length} Active
                  </span>
                </div>

                {rides.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px', backgroundColor: '#f0fdf4', borderRadius: '24px', border: '1px solid #a7f3d0' }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: '800', color: '#065f46' }}>No requests in the pool</p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#047857' }}>Post your route above to notify departing bikers.</p>
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
                          border: '2px solid #a7f3d0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '900', color: '#065f46', marginBottom: '4px' }}>
                            <span>{ride.fromLocation}</span>
                            <ArrowRight size={14} color="#10b981" />
                            <span>{ride.toLocation}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#047857' }}>
                            <span style={{ fontWeight: '700', color: '#065f46' }}>By: {ride.creatorName}</span>
                          </div>
                        </div>

                        {ride.status === 'accepted' ? (
                          <span style={{ fontSize: '11px', fontWeight: '800', color: '#047857', padding: '4px 10px', backgroundColor: '#ecfdf5', borderRadius: '10px' }}>
                            Accepted ✓
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', fontWeight: '800', color: '#b45309', padding: '4px 10px', backgroundColor: '#fef3c7', borderRadius: '10px' }}>
                            Waiting...
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {isBiker && (
            <div>
              {riderAcceptedRide ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', alignItems: 'start' }}>
                  <div style={{ backgroundColor: '#ffffff', border: '3px solid #10b981', borderRadius: '28px', padding: '24px', boxShadow: '0 14px 30px rgba(16,185,129,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', backgroundColor: '#ecfdf5', color: '#10b981', padding: '4px 12px', borderRadius: '9999px' }}>
                        ● CURRENT ACCEPTED RIDE
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: '#047857' }}>In Progress</span>
                    </div>

                    <h3 style={{ margin: '0 0 6px 0', fontSize: '20px', fontWeight: '900', color: '#065f46' }}>
                      {riderAcceptedRide.fromLocation} ➔ {riderAcceptedRide.toLocation}
                    </h3>
                    <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#047857' }}>
                      Passenger: <strong style={{ color: '#065f46' }}>{riderAcceptedRide.creatorName}</strong>
                    </p>

                    <div style={{ backgroundColor: '#f0fdf4', border: '2px solid #a7f3d0', borderRadius: '18px', padding: '16px', marginBottom: '18px' }}>
                      <span style={{ fontSize: '10px', fontWeight: '800', color: '#059669', textTransform: 'uppercase' }}>Passenger Phone</span>
                      <p style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: '900', color: '#065f46', fontFamily: 'monospace' }}>
                        {riderAcceptedRide.creatorPhone}
                      </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <a
                        href={`tel:${riderAcceptedRide.creatorPhone}`}
                        style={{ padding: '12px', borderRadius: '14px', backgroundColor: '#10b981', color: '#fff', fontWeight: '800', fontSize: '12px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        <Phone size={15} /> Call Passenger
                      </a>

                      <a
                        href={`https://wa.me/91${riderAcceptedRide.creatorPhone}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ padding: '12px', borderRadius: '14px', backgroundColor: '#064e3b', color: '#fff', fontWeight: '800', fontSize: '12px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        <MessageCircle size={15} /> WhatsApp
                      </a>
                    </div>

                    <button
                      onClick={() => handleDeleteRide(riderAcceptedRide._id)}
                      style={{ marginTop: '14px', width: '100%', padding: '12px', borderRadius: '14px', border: '2px solid #a7f3d0', backgroundColor: '#f0fdf4', color: '#065f46', fontWeight: '800', fontSize: '12px', cursor: 'pointer' }}
                    >
                      Complete / Finish Trip
                    </button>
                  </div>

                  <div style={{ backgroundColor: '#f0fdf4', border: '2px solid #a7f3d0', borderRadius: '28px', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '900', color: '#065f46' }}>Other Waiting Requests</span>
                      <span style={{ fontSize: '11px', fontWeight: '800', padding: '2px 8px', backgroundColor: '#ecfdf5', color: '#059669', borderRadius: '8px' }}>
                        {unacceptedRidesForBikers.length}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
                      {unacceptedRidesForBikers.length === 0 ? (
                        <p style={{ fontSize: '12px', color: '#047857', textAlign: 'center', padding: '20px' }}>No other waiting requests.</p>
                      ) : (
                        unacceptedRidesForBikers.map((ride) => (
                          <div key={ride._id} style={{ backgroundColor: '#ffffff', border: '2px solid #a7f3d0', borderRadius: '18px', padding: '12px 14px' }}>
                            <div style={{ fontSize: '12px', fontWeight: '900', color: '#065f46', marginBottom: '4px' }}>
                              {ride.fromLocation} ➔ {ride.toLocation}
                            </div>
                            <div style={{ fontSize: '11px', color: '#047857' }}>
                              {ride.creatorName} • Waiting
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', padding: '16px 20px', backgroundColor: '#ecfdf5', borderRadius: '22px', border: '1px solid #a7f3d0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
                      <div>
                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: '#065f46' }}>Live Rider Stream</h3>
                        <p style={{ margin: 0, fontSize: '11px', color: '#047857' }}>Tap the green checkmark to accept a passenger's route</p>
                      </div>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: '900', padding: '4px 10px', backgroundColor: '#10b981', color: '#fff', borderRadius: '9999px' }}>
                      {unacceptedRidesForBikers.length} Waiting
                    </span>
                  </div>

                  {unacceptedRidesForBikers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '50px 20px', backgroundColor: '#f0fdf4', borderRadius: '28px', border: '2px solid #a7f3d0' }}>
                      <Bike size={36} color="#059669" style={{ marginBottom: '10px' }} />
                      <p style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '900', color: '#065f46' }}>Stream is quiet</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#047857' }}>All requests have been accepted or no student has requested yet.</p>
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
                            border: '2px solid #a7f3d0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            boxShadow: '0 4px 12px rgba(16,185,129,0.06)'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '900', color: '#065f46', marginBottom: '4px' }}>
                              <span>{ride.fromLocation}</span>
                              <ArrowRight size={14} color="#10b981" />
                              <span>{ride.toLocation}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#047857' }}>
                              <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', backgroundColor: '#ecfdf5', color: '#059669' }}>
                                Passenger
                              </span>
                              <span>•</span>
                              <span style={{ fontWeight: '700', color: '#065f46' }}>{ride.creatorName}</span>
                            </div>
                          </div>

                          <button 
                            onClick={() => handleAcceptRide(ride)}
                            title="Accept and give a ride"
                            style={{ width: '46px', height: '46px', borderRadius: '16px', border: 'none', backgroundColor: '#10b981', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}
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

      {/* Matched Ride Modal */}
      {matchedRide && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(6,78,59,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '32px', padding: '24px', width: '100%', maxWidth: '360px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '20px', backgroundColor: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
              <Check size={32} />
            </div>

            <span style={{ fontSize: '10px', fontWeight: '900', color: '#10b981', textTransform: 'uppercase', backgroundColor: '#ecfdf5', padding: '4px 12px', borderRadius: '9999px' }}>
              Commute Matched
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#065f46', margin: '8px 0 2px 0' }}>Ride Confirmed!</h2>
            <p style={{ fontSize: '12px', color: '#047857', margin: '0 0 16px 0' }}>
              {matchedRide.fromLocation} ➔ {matchedRide.toLocation}
            </p>

            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #a7f3d0', borderRadius: '18px', padding: '14px', textAlign: 'left', marginBottom: '16px' }}>
              <p style={{ fontSize: '10px', color: '#047857', fontWeight: '800', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Contact Details</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '14px', fontWeight: '900', color: '#065f46' }}>
                  {matchedRide.creatorId === currentUser._id ? matchedRide.acceptedBy?.name : matchedRide.creatorName}
                </span>
                <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', padding: '2px 6px', backgroundColor: '#a7f3d0', borderRadius: '6px', color: '#065f46' }}>
                  {matchedRide.creatorId === currentUser._id ? matchedRide.acceptedBy?.role : matchedRide.creatorRole}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#065f46', fontWeight: '800' }}>
                <Phone size={14} color="#10b981" />
                <span>{matchedRide.creatorId === currentUser._id ? matchedRide.acceptedBy?.phone : matchedRide.creatorPhone}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <a 
                href={`tel:${matchedRide.creatorId === currentUser._id ? matchedRide.acceptedBy?.phone : matchedRide.creatorPhone}`}
                style={{ padding: '12px', borderRadius: '14px', backgroundColor: '#10b981', color: '#fff', fontWeight: '800', fontSize: '12px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Phone size={14} /> Call Now
              </a>

              <a 
                href={`https://wa.me/91${matchedRide.creatorId === currentUser._id ? matchedRide.acceptedBy?.phone : matchedRide.creatorPhone}`}
                target="_blank"
                rel="noreferrer"
                style={{ padding: '12px', borderRadius: '14px', backgroundColor: '#064e3b', color: '#fff', fontWeight: '800', fontSize: '12px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <MessageCircle size={14} /> WhatsApp
              </a>
            </div>

            <button 
              onClick={() => setMatchedRide(null)}
              style={{ marginTop: '12px', border: 'none', background: 'transparent', fontSize: '12px', fontWeight: '700', color: '#047857', cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}