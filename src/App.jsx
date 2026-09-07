import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import confetti from 'canvas-confetti';
import { 
  Bike, UserCheck, Check, Phone, ArrowRight, 
  MapPin, LogOut, Sparkles, MessageCircle, AlertCircle, X, 
  Search, Calendar, Clock, ChevronRight, Navigation, Trash2, Home, Activity, Globe, CreditCard
} from 'lucide-react';

const BACKEND_URL = "https://spct-avengers-backend.onrender.com";
const GOOGLE_CLIENT_ID = "644760404837-q0g258ajc1r1vjo8jqtru2c1cc11q1n7.apps.googleusercontent.com";

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
  const [phoneInput, setPhoneInput] = useState('');
  const [tempGoogleUser, setTempGoogleUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [fromLoc, setFromLoc] = useState('');
  const [toLoc, setToLoc] = useState('');
  const [rides, setRides] = useState([]);
  const [matchedRide, setMatchedRide] = useState(null);
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [menuSearch, setMenuSearch] = useState('');

  const socketRef = useRef(null);
  const googleBtnRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(BACKEND_URL, {
      transports: ['websocket', 'polling']
    });

    axios.get(`${BACKEND_URL}/api/rides`)
      .then(res => setRides(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});

    socketRef.current.on('new_ride_broadcast', (newRide) => {
      setRides(prev => [newRide, ...prev]);
    });

    socketRef.current.on('all_rides_cleared', () => {
      setRides([]);
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
  }, []);

  const handleGoogleCallback = async (response) => {
    setErrorMsg('');
    setAuthLoading(true);

    try {
      const decoded = parseJwt(response.credential);
      if (!decoded || !decoded.email) {
        throw new Error("Unable to parse Google login token.");
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

    const payload = {
      creatorId: currentUser._id,
      creatorName: currentUser.name,
      creatorPhone: currentUser.phone || '',
      creatorRole: currentUser.role,
      fromLocation: fromLoc.trim(),
      toLocation: toLoc.trim()
    };

    if (socketRef.current) {
      socketRef.current.emit('post_ride', payload);
    }

    setFromLoc('');
    setToLoc('');
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

  const isBiker = currentUser?.role === 'biker';
  const activeCount = rides.filter(r => r.status !== 'accepted').length;
  const matchedCount = rides.filter(r => r.status === 'accepted').length;
  const totalCount = rides.length;

  const sidebarItems = [
    { name: 'Dashboard', icon: <Home size={16} color="#ffffff" /> },
    { name: 'Attendance', icon: <Calendar size={16} color="#ffffff" /> },
    { name: 'Work Report', icon: <Clock size={16} color="#ffffff" /> },
    { name: 'Performance', icon: <Activity size={16} color="#ffffff" /> },
    { name: 'Leave', icon: <Globe size={16} color="#ffffff" /> },
    { name: 'Pay Slip', icon: <CreditCard size={16} color="#ffffff" /> },
    { name: 'Announcement', icon: <Sparkles size={16} color="#ffffff" />, hasArrow: true }
  ];

  const filteredItems = sidebarItems.filter(item => 
    item.name.toLowerCase().includes(menuSearch.toLowerCase())
  );

  // AUTH VIEW (Sign In / Sign Up)
  if (!currentUser) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f0f3fa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ width: '100%', maxWidth: '380px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', padding: '14px', borderRadius: '20px', backgroundColor: '#0011ff', color: '#fff', boxShadow: '0 10px 25px rgba(0,17,255,0.3)', marginBottom: '14px' }}>
            <Sparkles size={32} />
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', margin: '0 0 6px 0' }}>SPCT AVENGERS</h1>
          <p style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', marginBottom: '24px' }}>Hostel Bike Pooling Portal</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <button
              onClick={() => { setSelectedRole('biker'); setShowAuthModal(true); setErrorMsg(''); setTempGoogleUser(null); }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', backgroundColor: '#fff', border: '2px solid #e2e8f0', borderRadius: '24px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '16px', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                  <Bike size={28} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <span style={{ fontSize: '10px', fontWeight: '900', color: '#059669', textTransform: 'uppercase' }}>Pilot</span>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#0f172a' }}>I Have a Bike</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Give rides to hostel friends</p>
                </div>
              </div>
              <ArrowRight size={20} color="#94a3b8" />
            </button>

            <button
              onClick={() => { setSelectedRole('ride_taker'); setShowAuthModal(true); setErrorMsg(''); setTempGoogleUser(null); }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', backgroundColor: '#fff', border: '2px solid #e2e8f0', borderRadius: '24px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '16px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0011ff' }}>
                  <UserCheck size={28} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <span style={{ fontSize: '10px', fontWeight: '900', color: '#0011ff', textTransform: 'uppercase' }}>Passenger</span>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#0f172a' }}>Need a Ride</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Request bikes leaving hostel</p>
                </div>
              </div>
              <ArrowRight size={20} color="#94a3b8" />
            </button>
          </div>
        </div>

        {showAuthModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div style={{ backgroundColor: '#fff', borderRadius: '32px', padding: '24px', width: '100%', maxWidth: '360px', position: 'relative', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
              <button onClick={() => { setShowAuthModal(false); setTempGoogleUser(null); }} style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: '#f1f5f9', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>

              {!tempGoogleUser && (
                <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '16px', marginBottom: '16px' }}>
                  <button onClick={() => { setAuthTab('login'); setErrorMsg(''); }} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '12px', backgroundColor: authTab === 'login' ? '#fff' : 'transparent', color: authTab === 'login' ? '#0011ff' : '#64748b', boxShadow: authTab === 'login' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none' }}>Log In</button>
                  <button onClick={() => { setAuthTab('signup'); setErrorMsg(''); }} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '12px', backgroundColor: authTab === 'signup' ? '#fff' : 'transparent', color: authTab === 'signup' ? '#0011ff' : '#64748b', boxShadow: authTab === 'signup' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none' }}>Sign Up</button>
                </div>
              )}

              <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', margin: '0 0 6px 0' }}>
                {tempGoogleUser ? "Contact Number" : (authTab === 'login' ? "Welcome Back" : `Join as ${selectedRole === 'biker' ? 'Biker' : 'Rider'}`)}
              </h2>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '20px' }}>
                {tempGoogleUser ? "Enter your phone number for passenger contact" : "Authenticate seamlessly using Google"}
              </p>

              {errorMsg && (
                <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '11px', padding: '10px 14px', borderRadius: '14px', marginBottom: '14px', textAlign: 'left' }}>
                  {errorMsg}
                </div>
              )}

              {!tempGoogleUser ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50px' }}>
                  <div ref={googleBtnRef}></div>
                  {authLoading && <p style={{ fontSize: '12px', color: '#0011ff', fontWeight: 'bold', marginTop: '10px' }}>Authenticating...</p>}
                </div>
              ) : (
                <form onSubmit={handleCompleteAuth} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    {tempGoogleUser.avatar ? (
                      <img src={tempGoogleUser.avatar} alt="User" style={{ width: '38px', height: '38px', borderRadius: '50%' }} />
                    ) : (
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#0011ff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        {tempGoogleUser.fullName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p style={{ margin: 0, fontSize: '12px', fontWeight: 'bold', color: '#0f172a' }}>{tempGoogleUser.fullName}</p>
                      <p style={{ margin: 0, fontSize: '10px', color: '#64748b' }}>{tempGoogleUser.email}</p>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: '#334155', display: 'block', marginBottom: '4px' }}>10-Digit Mobile Number</label>
                    <input 
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="e.g. 9876543210"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: '14px', border: '2px solid #e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    style={{ width: '100%', padding: '14px', borderRadius: '14px', border: 'none', backgroundColor: '#0011ff', color: '#fff', fontWeight: '800', fontSize: '13px', cursor: 'pointer', boxShadow: '0 8px 18px rgba(0,17,255,0.25)' }}
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

  // MAIN RESPONSIVE DASHBOARD: DESKTOP + LAPTOP + MOBILE
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#eaedf5', padding: '16px', boxSizing: 'border-box', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '1320px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '36px', boxShadow: '0 20px 45px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'row', flexWrap: 'wrap', overflow: 'hidden' }}>
        
        {/* =========================================================
            LEFT CAPSULE PILL SIDEBAR (EXACT IMAGE 2 REPLICA)
           ========================================================= */}
        <aside style={{ width: '260px', padding: '24px', backgroundColor: '#ffffff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box', flexShrink: 0 }}>
          <div>
            {/* Search menu bar with purple/blue outline and drop shadow */}
            <div style={{ position: 'relative', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', backgroundColor: '#ffffff', border: '2px solid #5764ec', borderRadius: '9999px', boxShadow: '0 4px 14px rgba(87,100,236,0.2)' }}>
                <Search size={16} color="#0f172a" />
                <input 
                  type="text" 
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  placeholder="Search menu..." 
                  style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '13px', color: '#0f172a', width: '100%', fontWeight: '600' }}
                />
              </div>
            </div>

            {/* Pill Navigation Items from Image 2 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredItems.map((item, idx) => {
                const isActive = activeMenu === item.name;

                return (
                  <button
                    key={idx}
                    onClick={() => setActiveMenu(item.name)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 16px',
                      borderRadius: '9999px',
                      border: isActive ? '2px solid #cbd5e1' : '2px solid #f1f5f9',
                      background: isActive ? 'linear-gradient(180deg, #e2e8f0 0%, #cbd5e1 100%)' : '#f8fafc',
                      color: isActive ? '#0f172a' : '#0011ff',
                      fontWeight: '800',
                      fontSize: '13px',
                      cursor: 'pointer',
                      boxShadow: isActive ? 'inset 0 2px 4px rgba(0,0,0,0.06)' : '0 2px 4px rgba(0,0,0,0.02)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '30px', height: '30px', borderRadius: '10px', backgroundColor: '#0011ff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,17,255,0.25)' }}>
                        {item.icon}
                      </div>
                      <span>{item.name}</span>
                    </div>
                    {item.hasArrow && <ChevronRight size={16} color="#0011ff" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* User Profile Footer & Clear Database Button */}
          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '18px', border: '1px solid #e2e8f0', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt="Avatar" style={{ width: '36px', height: '36px', borderRadius: '12px', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '36px', height: '36px', borderRadius: '12px', backgroundColor: '#0011ff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '13px' }}>
                    {currentUser.name?.charAt(0)}
                  </div>
                )}
                <div style={{ overflow: 'hidden' }}>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: '900', color: '#0f172a', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{currentUser.name}</p>
                  <p style={{ margin: 0, fontSize: '10px', fontWeight: '800', color: '#0011ff', textTransform: 'uppercase' }}>
                    {isBiker ? 'Biker Pilot' : 'Passenger'}
                  </p>
                </div>
              </div>

              <button onClick={handleLogout} title="Sign Out" style={{ border: 'none', background: 'transparent', padding: '6px', borderRadius: '10px', cursor: 'pointer', color: '#94a3b8' }}>
                <LogOut size={16} />
              </button>
            </div>

            <button
              onClick={handleClearAllRides}
              style={{ width: '100%', padding: '10px', borderRadius: '16px', border: '1px solid #fecaca', backgroundColor: '#fef2f2', color: '#dc2626', fontWeight: '800', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Trash2 size={14} /> Clear All Live Rides
            </button>
          </div>
        </aside>

        {/* =========================================================
            RIGHT WORKSPACE (IMAGE 1 OVERVIEW BANNER & LIVE STREAM)
           ========================================================= */}
        <main style={{ flex: 1, minWidth: '320px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', boxSizing: 'border-box' }}>
          
          {/* TOP SECTION: EXACT REPLICA OF ATTENDANCE OVERVIEW (IMAGE 1) */}
          <div style={{ backgroundColor: '#ffffff', border: '4px solid #0011ff', borderRadius: '32px', overflow: 'hidden', boxShadow: '0 16px 36px rgba(0,17,255,0.08)' }}>
            
            {/* 1. Cobalt Blue Header Banner */}
            <div style={{ backgroundColor: '#0011ff', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#ffffff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '14px', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={22} color="#ffffff" />
                </div>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '900', letterSpacing: '-0.5px' }}>Attendance Overview</h2>
              </div>

              {/* Right pill badge: Sep 2026 */}
              <div style={{ backgroundColor: '#e2e8f0', color: '#0f172a', padding: '8px 20px', borderRadius: '9999px', fontSize: '13px', fontWeight: '900' }}>
                Sep 2026
              </div>
            </div>

            {/* 2. Grid with 5 colorful pills + Doughnut Chart from Image 1 */}
            <div style={{ padding: '24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
              
              {/* 5 Vivid Cards (Green, Blue, Orange, Red, Dark Blue) */}
              <div style={{ flex: '1 1 380px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px' }}>
                
                {/* 1. Green Card: Present */}
                <div style={{ backgroundColor: '#009419', color: '#fff', padding: '16px', borderRadius: '22px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 6px 14px rgba(0,148,25,0.2)' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#009419', flexShrink: 0 }}>
                    <Calendar size={20} />
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: '700', display: 'block', opacity: 0.9 }}>Present</span>
                    <span style={{ fontSize: '24px', fontWeight: '900' }}>{activeCount || 6}</span>
                  </div>
                </div>

                {/* 2. Sky Blue Card: Late */}
                <div style={{ backgroundColor: '#307af2', color: '#fff', padding: '16px', borderRadius: '22px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 6px 14px rgba(48,122,242,0.2)' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#307af2', flexShrink: 0 }}>
                    <Clock size={20} />
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: '700', display: 'block', opacity: 0.9 }}>Late</span>
                    <span style={{ fontSize: '24px', fontWeight: '900' }}>{matchedCount || 0}</span>
                  </div>
                </div>

                {/* 3. Orange Card: Half Day */}
                <div style={{ backgroundColor: '#e28100', color: '#fff', padding: '16px', borderRadius: '22px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 6px 14px rgba(226,129,0,0.2)' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e28100', flexShrink: 0 }}>
                    <Calendar size={20} />
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: '700', display: 'block', opacity: 0.9 }}>Half Day</span>
                    <span style={{ fontSize: '24px', fontWeight: '900' }}>{activeCount || 0}</span>
                  </div>
                </div>

                {/* 4. Crimson Red Card: Absent */}
                <div style={{ backgroundColor: '#cf2020', color: '#fff', padding: '16px', borderRadius: '22px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 6px 14px rgba(207,32,32,0.2)' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cf2020', flexShrink: 0 }}>
                    <X size={20} />
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: '700', display: 'block', opacity: 0.9 }}>Absent</span>
                    <span style={{ fontSize: '24px', fontWeight: '900' }}>0</span>
                  </div>
                </div>

                {/* 5. Deep Royal Blue Full Width Card: Leave */}
                <div style={{ gridColumn: '1 / -1', backgroundColor: '#006ee4', color: '#fff', padding: '16px', borderRadius: '22px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 6px 14px rgba(0,110,228,0.2)' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#006ee4', flexShrink: 0 }}>
                    <Navigation size={20} />
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: '700', display: 'block', opacity: 0.9 }}>Leave</span>
                    <span style={{ fontSize: '24px', fontWeight: '900' }}>{totalCount || 1}</span>
                  </div>
                </div>
              </div>

              {/* Exact Circular Doughnut Graphic from Image 1 */}
              <div style={{ flex: '1 1 240px', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '220px' }}>
                <div style={{ position: 'relative', width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#009419" strokeWidth="15" strokeDasharray="238.7" strokeDashoffset="60" />
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#006ee4" strokeWidth="15" strokeDasharray="238.7" strokeDashoffset="180" />
                  </svg>
                  <div style={{ position: 'absolute', textAlign: 'center' }}>
                    <span style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a', display: 'block', lineHeight: '1.2' }}>Attendance</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748b' }}>Overview</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* LOWER INTERACTIVE SECTION: FORM (PASSENGERS ONLY) vs RIDER FEED */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-start' }}>
            
            {/* CONDITIONAL RENDER: Form is strictly hidden for Bikers */}
            {!isBiker ? (
              <div style={{ flex: '1 1 340px', backgroundColor: '#f8faff', border: '2px solid #e2e8f0', borderRadius: '28px', padding: '24px', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '12px', backgroundColor: '#0011ff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Navigation size={18} />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#0f172a' }}>Request A Ride</h3>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: '800', padding: '4px 10px', backgroundColor: '#eff6ff', color: '#0011ff', borderRadius: '9999px' }}>
                    Passenger Mode
                  </span>
                </div>

                <form onSubmit={handlePostRide} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: '#334155', display: 'block', marginBottom: '4px' }}>From Location</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Hostel Block B, Gate 2" 
                      value={fromLoc}
                      onChange={(e) => setFromLoc(e.target.value)}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: '14px', border: '2px solid #e2e8f0', fontSize: '13px', outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff', fontWeight: '600' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: '#334155', display: 'block', marginBottom: '4px' }}>To Destination</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. College Campus, Metro" 
                      value={toLoc}
                      onChange={(e) => setToLoc(e.target.value)}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: '14px', border: '2px solid #e2e8f0', fontSize: '13px', outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff', fontWeight: '600' }}
                    />
                  </div>

                  <button 
                    type="submit"
                    style={{ padding: '14px', borderRadius: '14px', border: 'none', backgroundColor: '#0011ff', color: '#fff', fontWeight: '900', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 6px 16px rgba(0,17,255,0.25)' }}
                  >
                    <span>Broadcast Request to Bikers</span>
                    <ArrowRight size={16} />
                  </button>
                </form>
              </div>
            ) : (
              /* Biker Pilot View */
              <div style={{ flex: '1 1 340px', backgroundColor: '#009419', borderRadius: '28px', padding: '24px', color: '#ffffff', boxShadow: '0 12px 28px rgba(0,148,25,0.25)', boxSizing: 'border-box' }}>
                <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', backgroundColor: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '9999px' }}>
                  Rider Mode Active
                </span>
                <h3 style={{ fontSize: '20px', fontWeight: '900', margin: '14px 0 6px 0' }}>Ready to offer a lift?</h3>
                <p style={{ fontSize: '13px', color: '#dcfce7', lineHeight: '1.5', margin: 0 }}>
                  As a registered Biker, you do not need to submit requests. Simply browse live passenger requests from the feed and tap the green tick to accept.
                </p>
                <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'rgba(255,255,255,0.15)', padding: '12px 16px', borderRadius: '16px', fontSize: '12px', fontWeight: '700' }}>
                  <Check size={18} />
                  <span>Google-verified authenticated campus pool.</span>
                </div>
              </div>
            )}

            {/* LIVE RIDE STREAM FEED */}
            <div style={{ flex: '1 1 420px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span style={{ fontSize: '14px', fontWeight: '900', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#009419' }} /> Live Ride Stream
                </span>
                <span style={{ fontSize: '12px', fontWeight: '800', padding: '4px 10px', backgroundColor: '#eff6ff', color: '#0011ff', borderRadius: '9999px' }}>
                  {rides.length} Requests
                </span>
              </div>

              {rides.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: '#f8faff', borderRadius: '28px', border: '2px solid #e2e8f0' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '900', color: '#0f172a' }}>No active ride requests</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Live student requests will appear here in real-time.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
                  {rides.map((ride) => (
                    <div 
                      key={ride._id} 
                      style={{
                        padding: '16px 20px',
                        borderRadius: '24px',
                        backgroundColor: '#ffffff',
                        border: '2px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        opacity: ride.status === 'accepted' ? 0.6 : 1,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '900', color: '#0f172a', marginBottom: '4px' }}>
                          <span>{ride.fromLocation}</span>
                          <ArrowRight size={14} color="#0011ff" />
                          <span>{ride.toLocation}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', backgroundColor: ride.creatorRole === 'biker' ? '#ecfdf5' : '#eff6ff', color: ride.creatorRole === 'biker' ? '#009419' : '#0011ff' }}>
                            {ride.creatorRole === 'biker' ? 'Biker' : 'Needs Ride'}
                          </span>
                          <span>•</span>
                          <span style={{ fontWeight: '700', color: '#334155' }}>{ride.creatorName}</span>
                        </div>
                      </div>

                      {ride.status === 'accepted' ? (
                        <span style={{ fontSize: '12px', fontWeight: '800', color: '#009419', padding: '6px 12px', backgroundColor: '#ecfdf5', borderRadius: '14px' }}>
                          Matched
                        </span>
                      ) : (
                        <button 
                          onClick={() => handleAcceptRide(ride)}
                          title={isBiker ? "Accept Ride" : "Connect"}
                          style={{ width: '44px', height: '44px', borderRadius: '16px', border: 'none', backgroundColor: '#009419', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,148,25,0.25)' }}
                        >
                          <Check size={22} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* MATCHED REVEAL POPUP MODAL */}
      {matchedRide && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '32px', padding: '24px', width: '100%', maxWidth: '360px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '20px', backgroundColor: '#ecfdf5', color: '#009419', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
              <Check size={32} />
            </div>

            <span style={{ fontSize: '10px', fontWeight: '900', color: '#009419', textTransform: 'uppercase', backgroundColor: '#ecfdf5', padding: '4px 12px', borderRadius: '9999px' }}>
              Commute Matched
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: '8px 0 2px 0' }}>Ride Confirmed!</h2>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px 0' }}>
              {matchedRide.fromLocation} ➔ {matchedRide.toLocation}
            </p>

            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '14px', textAlign: 'left', marginBottom: '16px' }}>
              <p style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Direct Contact</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '14px', fontWeight: '900', color: '#0f172a' }}>
                  {matchedRide.creatorId === currentUser._id ? matchedRide.acceptedBy?.name : matchedRide.creatorName}
                </span>
                <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', padding: '2px 6px', backgroundColor: '#e2e8f0', borderRadius: '6px' }}>
                  {matchedRide.creatorId === currentUser._id ? matchedRide.acceptedBy?.role : matchedRide.creatorRole}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#0f172a', fontWeight: '800' }}>
                <Phone size={14} color="#009419" />
                <span>{matchedRide.creatorId === currentUser._id ? matchedRide.acceptedBy?.phone : matchedRide.creatorPhone}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <a 
                href={`tel:${matchedRide.creatorId === currentUser._id ? matchedRide.acceptedBy?.phone : matchedRide.creatorPhone}`}
                style={{ padding: '12px', borderRadius: '14px', backgroundColor: '#009419', color: '#fff', fontWeight: '800', fontSize: '12px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Phone size={14} /> Call Now
              </a>

              <a 
                href={`https://wa.me/91${matchedRide.creatorId === currentUser._id ? matchedRide.acceptedBy?.phone : matchedRide.creatorPhone}`}
                target="_blank"
                rel="noreferrer"
                style={{ padding: '12px', borderRadius: '14px', backgroundColor: '#0f172a', color: '#fff', fontWeight: '800', fontSize: '12px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <MessageCircle size={14} /> WhatsApp
              </a>
            </div>

            <button 
              onClick={() => setMatchedRide(null)}
              style={{ marginTop: '12px', border: 'none', background: 'transparent', fontSize: '12px', fontWeight: '700', color: '#94a3b8', cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}