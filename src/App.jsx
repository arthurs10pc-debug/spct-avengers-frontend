import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import confetti from 'canvas-confetti';
import { 
  Bike, UserCheck, Check, Phone, ArrowRight, 
  MapPin, LogOut, Sparkles, MessageCircle, AlertCircle, X, 
  Navigation, Trash2, ChevronDown, Shield, Users, Activity, Crown
} from 'lucide-react';

const BACKEND_URL = "https://spct-avengers-backend.onrender.com";
const ADMIN_EMAIL = "arthurs10pc@gmail.com";
const GOOGLE_CLIENT_ID = "644760404837-q0g258ajc1r1vjo8jqtru2c1cc11q1n7.apps.googleusercontent.com";

const PRESET_LOCATIONS = [
  "Vaishnodevi Circle",
  "Silver Oak University",
  "Thaltej",
  "Iskon circle",
  "Tambul",
  "Zundal Circle",
  "Kathiyavadi Pan Parlour"
];

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
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);

  const [rides, setRides] = useState([]);
  const [bikersList, setBikersList] = useState([]);
  const [matchedRide, setMatchedRide] = useState(null);

  const socketRef = useRef(null);
  const googleBtnRef = useRef(null);
  const fromContainerRef = useRef(null);
  const toContainerRef = useRef(null);

  const isAdmin = currentUser?.email === ADMIN_EMAIL;

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
    if (!window.confirm("Admin: Remove this ride permanently?")) return;
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

  const isBiker = currentUser?.role === 'biker';

  // LOGIN SCREEN
  if (!currentUser) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f1f4fa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ width: '100%', maxWidth: '380px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', padding: '14px', borderRadius: '22px', backgroundColor: '#0011ff', color: '#fff', boxShadow: '0 10px 25px rgba(0,17,255,0.25)', marginBottom: '14px' }}>
            <Sparkles size={32} />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', margin: '0 0 6px 0' }}>SPCT AVENGERS</h1>
          <p style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', marginBottom: '24px' }}>Hostel Ride-Pooling Hub</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <button
              onClick={() => { setSelectedRole('biker'); setShowAuthModal(true); setErrorMsg(''); setTempGoogleUser(null); }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', backgroundColor: '#fff', border: '2px solid #e2e8f0', borderRadius: '24px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '16px', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#009419' }}>
                  <Bike size={28} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <span style={{ fontSize: '10px', fontWeight: '900', color: '#009419', textTransform: 'uppercase' }}>Rider / Pilot</span>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#0f172a' }}>I Have a Bike</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Give lifts to hostel students</p>
                </div>
              </div>
              <ArrowRight size={20} color="#94a3b8" />
            </button>

            <button
              onClick={() => { setSelectedRole('ride_taker'); setShowAuthModal(true); setErrorMsg(''); setTempGoogleUser(null); }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', backgroundColor: '#fff', border: '2px solid #e2e8f0', borderRadius: '24px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '16px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0011ff' }}>
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
                  <button onClick={() => { setAuthTab('login'); setErrorMsg(''); }} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '12px', backgroundColor: authTab === 'login' ? '#fff' : 'transparent', color: authTab === 'login' ? '#0011ff' : '#64748b' }}>Log In</button>
                  <button onClick={() => { setAuthTab('signup'); setErrorMsg(''); }} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '12px', backgroundColor: authTab === 'signup' ? '#fff' : 'transparent', color: authTab === 'signup' ? '#0011ff' : '#64748b' }}>Sign Up</button>
                </div>
              )}

              <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', margin: '0 0 6px 0' }}>
                {tempGoogleUser ? "Contact Details" : (authTab === 'login' ? "Welcome Back" : `Join as ${selectedRole === 'biker' ? 'Rider' : 'Passenger'}`)}
              </h2>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '20px' }}>
                {tempGoogleUser ? "Enter your phone number for commuter contact" : "Sign in using your Google account"}
              </p>

              {errorMsg && (
                <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '11px', padding: '10px 14px', borderRadius: '14px', marginBottom: '14px', textAlign: 'left' }}>
                  {errorMsg}
                </div>
              )}

              {!tempGoogleUser ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50px' }}>
                  <div ref={googleBtnRef}></div>
                  {authLoading && <p style={{ fontSize: '12px', color: '#0011ff', fontWeight: 'bold', marginTop: '10px' }}>Connecting...</p>}
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

  // =========================================================================
  // VIEW A: ADMIN DASHBOARD (MATCHING 3-COLUMN WIREFRAME FOR ARTHURS10PC)
  // =========================================================================
  if (isAdmin) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f0f3f8', padding: '16px', boxSizing: 'border-box', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '32px', border: '3px solid #0f172a', boxShadow: '0 25px 50px rgba(15,23,42,0.1)', overflow: 'hidden' }}>
          
          {/* Admin Header */}
          <header style={{ padding: '18px 24px', backgroundColor: '#0f172a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '14px', backgroundColor: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a' }}>
                <Crown size={24} />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '900', letterSpacing: '-0.5px' }}>SPCT AVENGERS MASTER ADMIN</h1>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>Root Access: {currentUser.email}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ backgroundColor: '#10b981', color: '#fff', fontSize: '11px', fontWeight: '800', padding: '4px 10px', borderRadius: '9999px' }}>
                Live Database Online
              </span>
              <button onClick={handleLogout} title="Sign Out" style={{ border: 'none', background: '#334155', color: '#fff', padding: '8px 12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700' }}>
                <LogOut size={16} /> Logout
              </button>
            </div>
          </header>

          {/* 3-Column Wireframe Grid from Image */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 320px) 1fr minmax(280px, 340px)', minHeight: '740px' }}>
            
            {/* COLUMN 1: RIDERS LIST */}
            <div style={{ borderRight: '3px solid #0f172a', padding: '20px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bike size={20} color="#009419" /> Riders List
                </h2>
                <span style={{ fontSize: '11px', fontWeight: '800', backgroundColor: '#ecfdf5', color: '#009419', padding: '2px 8px', borderRadius: '8px' }}>
                  {bikersList.length} Registered
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', flex: 1, maxHeight: '640px' }}>
                {bikersList.length === 0 ? (
                  <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', marginTop: '40px' }}>No riders registered yet.</p>
                ) : (
                  bikersList.map((biker) => (
                    <div key={biker._id} style={{ backgroundColor: '#ffffff', border: '2px solid #e2e8f0', borderRadius: '18px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                      {biker.avatar ? (
                        <img src={biker.avatar} alt="Rider" style={{ width: '38px', height: '38px', borderRadius: '12px', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '38px', height: '38px', borderRadius: '12px', backgroundColor: '#009419', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '14px' }}>
                          {biker.fullName.charAt(0)}
                        </div>
                      )}
                      <div style={{ overflow: 'hidden', flex: 1 }}>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: '900', color: '#0f172a', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{biker.fullName}</p>
                        <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>{biker.phone || 'No Phone'}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* COLUMN 2: ADMIN FEATURES & CONTROLS */}
            <div style={{ padding: '24px', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Shield size={20} color="#0011ff" /> Admin Features & Master Controls
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>Monitor hostel network throughput, manage system state, and wipe live queues.</p>
              </div>

              {/* Metric stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                <div style={{ backgroundColor: '#eff6ff', border: '2px solid #bfdbfe', padding: '16px', borderRadius: '20px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#1d4ed8' }}>TOTAL POOL RIDES</span>
                  <p style={{ margin: '6px 0 0 0', fontSize: '28px', fontWeight: '900', color: '#0f172a' }}>{rides.length}</p>
                </div>
                <div style={{ backgroundColor: '#ecfdf5', border: '2px solid #a7f3d0', padding: '16px', borderRadius: '20px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#047857' }}>MATCHED SUCCESS</span>
                  <p style={{ margin: '6px 0 0 0', fontSize: '28px', fontWeight: '900', color: '#0f172a' }}>{rides.filter(r => r.status === 'accepted').length}</p>
                </div>
                <div style={{ backgroundColor: '#fef3c7', border: '2px solid #fde68a', padding: '16px', borderRadius: '20px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#b45309' }}>ACTIVE WAITING</span>
                  <p style={{ margin: '6px 0 0 0', fontSize: '28px', fontWeight: '900', color: '#0f172a' }}>{rides.filter(r => r.status !== 'accepted').length}</p>
                </div>
              </div>

              {/* Master Tools Section */}
              <div style={{ backgroundColor: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '24px', padding: '20px' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '900', color: '#0f172a' }}>Hostel Pool Operations</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button
                    onClick={handleClearAllRides}
                    style={{ padding: '14px 18px', borderRadius: '16px', border: 'none', backgroundColor: '#dc2626', color: '#ffffff', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(220,38,38,0.2)' }}
                  >
                    <Trash2 size={16} /> Flush & Wipe All Active Rides (Reset DB)
                  </button>

                  <button
                    onClick={() => {
                      axios.get(`${BACKEND_URL}/api/admin/bikers`).then(res => setBikersList(res.data));
                      axios.get(`${BACKEND_URL}/api/rides`).then(res => setRides(res.data));
                      alert("Stream and Rider Registry re-synced.");
                    }}
                    style={{ padding: '14px 18px', borderRadius: '16px', border: '2px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <Activity size={16} /> Force Sync Database & WebSocket Queues
                  </button>
                </div>
              </div>

              {/* Verified Locations Directory Reference */}
              <div style={{ backgroundColor: '#ffffff', border: '2px solid #e2e8f0', borderRadius: '24px', padding: '18px' }}>
                <span style={{ fontSize: '11px', fontWeight: '900', color: '#0011ff', textTransform: 'uppercase' }}>Active Hotspot Zones</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                  {PRESET_LOCATIONS.map((spot, i) => (
                    <span key={i} style={{ fontSize: '11px', fontWeight: '700', backgroundColor: '#f1f5f9', color: '#334155', padding: '6px 12px', borderRadius: '9999px', border: '1px solid #e2e8f0' }}>
                      📍 {spot}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* COLUMN 3: PASSENGERS ACTIVE REQUESTS */}
            <div style={{ borderLeft: '3px solid #0f172a', padding: '20px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserCheck size={20} color="#0011ff" /> Passengers Active Requests
                </h2>
                <span style={{ fontSize: '11px', fontWeight: '800', backgroundColor: '#eff6ff', color: '#0011ff', padding: '2px 8px', borderRadius: '8px' }}>
                  {rides.length} Live
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', flex: 1, maxHeight: '640px' }}>
                {rides.length === 0 ? (
                  <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', marginTop: '40px' }}>No active requests in queue.</p>
                ) : (
                  rides.map((ride) => (
                    <div key={ride._id} style={{ backgroundColor: '#ffffff', border: '2px solid #e2e8f0', borderRadius: '18px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '12px', fontWeight: '900', color: '#0f172a' }}>{ride.creatorName}</span>
                        <button
                          onClick={() => handleDeleteRide(ride._id)}
                          title="Admin Delete Request"
                          style={{ border: 'none', background: '#fef2f2', color: '#dc2626', padding: '4px', borderRadius: '8px', cursor: 'pointer' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div style={{ fontSize: '11px', color: '#334155', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{ride.fromLocation}</span>
                        <ArrowRight size={12} color="#0011ff" />
                        <span>{ride.toLocation}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '6px', fontSize: '11px' }}>
                        <span style={{ fontFamily: 'monospace', color: '#64748b' }}>{ride.creatorPhone}</span>
                        <span style={{ fontWeight: '800', color: ride.status === 'accepted' ? '#009419' : '#e28100' }}>
                          {ride.status === 'accepted' ? 'Accepted' : 'Waiting'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW B: REGULAR USER WORKSPACE (BIKER / PASSENGER)
  // =========================================================================
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#eaedf5', padding: '16px', boxSizing: 'border-box', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '32px', boxShadow: '0 20px 45px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        
        {/* Header */}
        <header style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {currentUser.avatar ? (
              <img src={currentUser.avatar} alt="Avatar" style={{ width: '42px', height: '42px', borderRadius: '14px', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '42px', height: '42px', borderRadius: '14px', backgroundColor: isBiker ? '#009419' : '#0011ff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '15px' }}>
                {currentUser.name?.charAt(0)}
              </div>
            )}
            <div>
              <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: '#0f172a' }}>{currentUser.name}</h2>
              <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', color: isBiker ? '#009419' : '#0011ff', backgroundColor: isBiker ? '#ecfdf5' : '#eff6ff', padding: '2px 8px', borderRadius: '6px' }}>
                {isBiker ? 'Rider / Pilot' : 'Passenger'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={handleLogout} title="Sign Out" style={{ border: 'none', background: '#f1f5f9', padding: '8px', borderRadius: '12px', cursor: 'pointer', color: '#64748b' }}>
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Workspace Body */}
        <main style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* 1. PASSENGER VIEW */}
          {!isBiker && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ backgroundColor: '#f8faff', border: '2px solid #e2e8f0', borderRadius: '28px', padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '12px', backgroundColor: '#0011ff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Navigation size={18} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#0f172a' }}>Request A Ride</h3>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Pick a spot or type your custom route</p>
                  </div>
                </div>

                <form onSubmit={handlePostRide} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* FROM LOCATION DROPDOWN */}
                  <div ref={fromContainerRef} style={{ position: 'relative' }}>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: '#334155', display: 'block', marginBottom: '4px' }}>From Location</label>
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
                        style={{ width: '100%', padding: '12px 36px 12px 14px', borderRadius: '14px', border: '2px solid #e2e8f0', fontSize: '13px', outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff', fontWeight: '600' }}
                      />
                      <ChevronDown size={18} color="#94a3b8" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    </div>

                    {showFromDropdown && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '6px', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 12px 24px rgba(0,0,0,0.08)', zIndex: 40, maxHeight: '180px', overflowY: 'auto' }}>
                        <div style={{ padding: '6px 12px', fontSize: '10px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Select Location</div>
                        {PRESET_LOCATIONS.map((loc, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setFromLoc(loc);
                              setShowFromDropdown(false);
                            }}
                            style={{ padding: '9px 14px', fontSize: '12px', fontWeight: '700', color: '#1e293b', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}
                          >
                            <MapPin size={13} color="#0011ff" />
                            <span>{loc}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* TO DESTINATION DROPDOWN */}
                  <div ref={toContainerRef} style={{ position: 'relative' }}>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: '#334155', display: 'block', marginBottom: '4px' }}>To Destination</label>
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
                        style={{ width: '100%', padding: '12px 36px 12px 14px', borderRadius: '14px', border: '2px solid #e2e8f0', fontSize: '13px', outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff', fontWeight: '600' }}
                      />
                      <ChevronDown size={18} color="#94a3b8" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    </div>

                    {showToDropdown && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '6px', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 12px 24px rgba(0,0,0,0.08)', zIndex: 40, maxHeight: '180px', overflowY: 'auto' }}>
                        <div style={{ padding: '6px 12px', fontSize: '10px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Select Destination</div>
                        {PRESET_LOCATIONS.map((loc, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setToLoc(loc);
                              setShowToDropdown(false);
                            }}
                            style={{ padding: '9px 14px', fontSize: '12px', fontWeight: '700', color: '#1e293b', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}
                          >
                            <MapPin size={13} color="#0011ff" />
                            <span>{loc}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button 
                    type="submit"
                    style={{ padding: '14px', borderRadius: '14px', border: 'none', backgroundColor: '#0011ff', color: '#fff', fontWeight: '900', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 6px 16px rgba(0,17,255,0.25)' }}
                  >
                    <span>Post Ride Request</span>
                    <ArrowRight size={16} />
                  </button>
                </form>
              </div>

              {/* Status List */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '900', color: '#0f172a' }}>Active Trip Requests</span>
                  <span style={{ fontSize: '11px', fontWeight: '800', padding: '3px 8px', backgroundColor: '#eff6ff', color: '#0011ff', borderRadius: '9999px' }}>
                    {rides.length} Active
                  </span>
                </div>

                {rides.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px', backgroundColor: '#f8fafc', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>No requests in the pool</p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Post your route above to notify departing bikers.</p>
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
                          border: '2px solid #e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '900', color: '#0f172a', marginBottom: '4px' }}>
                            <span>{ride.fromLocation}</span>
                            <ArrowRight size={14} color="#0011ff" />
                            <span>{ride.toLocation}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#64748b' }}>
                            <span style={{ fontWeight: '700', color: '#334155' }}>By: {ride.creatorName}</span>
                          </div>
                        </div>

                        {ride.status === 'accepted' ? (
                          <span style={{ fontSize: '11px', fontWeight: '800', color: '#009419', padding: '4px 10px', backgroundColor: '#ecfdf5', borderRadius: '10px' }}>
                            Accepted ✓
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', fontWeight: '800', color: '#e28100', padding: '4px 10px', backgroundColor: '#fef3c7', borderRadius: '10px' }}>
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

          {/* 2. RIDER VIEW */}
          {isBiker && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', padding: '16px 20px', backgroundColor: '#ecfdf5', borderRadius: '22px', border: '1px solid #bbf7d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#009419', display: 'inline-block' }} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: '#065f46' }}>Live Rider Stream</h3>
                    <p style={{ margin: 0, fontSize: '11px', color: '#047857' }}>Tap the green checkmark to accept a passenger's route</p>
                  </div>
                </div>
                <span style={{ fontSize: '12px', fontWeight: '900', padding: '4px 10px', backgroundColor: '#009419', color: '#fff', borderRadius: '9999px' }}>
                  {rides.filter(r => r.status !== 'accepted').length} Waiting
                </span>
              </div>

              {rides.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 20px', backgroundColor: '#f8faff', borderRadius: '28px', border: '2px solid #e2e8f0' }}>
                  <Bike size={36} color="#94a3b8" style={{ marginBottom: '10px' }} />
                  <p style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '900', color: '#0f172a' }}>Stream is quiet</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>When students post ride requests, they will show up here instantly.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                          <ArrowRight size={14} color="#009419" />
                          <span>{ride.toLocation}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', backgroundColor: '#eff6ff', color: '#0011ff' }}>
                            Passenger
                          </span>
                          <span>•</span>
                          <span style={{ fontWeight: '700', color: '#334155' }}>{ride.creatorName}</span>
                        </div>
                      </div>

                      {ride.status === 'accepted' ? (
                        <span style={{ fontSize: '12px', fontWeight: '800', color: '#009419', padding: '6px 12px', backgroundColor: '#ecfdf5', borderRadius: '14px' }}>
                          Connected
                        </span>
                      ) : (
                        <button 
                          onClick={() => handleAcceptRide(ride)}
                          title="Accept and give a ride"
                          style={{ width: '46px', height: '46px', borderRadius: '16px', border: 'none', backgroundColor: '#009419', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,148,25,0.25)' }}
                        >
                          <Check size={24} strokeWidth={3} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* MATCHED POPUP */}
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
              <p style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Contact Details</p>
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