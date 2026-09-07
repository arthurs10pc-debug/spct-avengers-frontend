import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import confetti from 'canvas-confetti';
import { 
  Bike, UserCheck, Check, Phone, ArrowRight, 
  MapPin, LogOut, Bell, Sparkles, MessageCircle, AlertCircle, X, 
  Search, Home, Calendar, FileText, Activity, Clock, Globe, CreditCard,
  Radio, Navigation, Trash2, ShieldCheck, Compass, CheckCircle2
} from 'lucide-react';

const BACKEND_URL = "https://spct-avengers-backend.onrender.com";
const ADMIN_EMAIL = "arthurs10pc@gmail.com";
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
    const saved = localStorage.getItem('spct_user');
    return saved ? JSON.parse(saved) : null;
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
  const [sidebarTab, setSidebarTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  const socketRef = useRef(null);
  const googleBtnRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(BACKEND_URL, {
      transports: ['websocket', 'polling']
    });

    axios.get(`${BACKEND_URL}/api/rides`)
      .then(res => setRides(res.data))
      .catch(() => {});

    socketRef.current.on('new_ride_broadcast', (newRide) => {
      setRides(prev => [newRide, ...prev]);
    });

    socketRef.current.on('all_rides_cleared', () => {
      setRides([]);
    });

    socketRef.current.on('ride_accepted_broadcast', (updatedRide) => {
      setRides(prev => prev.map(r => r._id === updatedRide._id ? updatedRide : r));
      
      const localUser = JSON.parse(localStorage.getItem('spct_user') || '{}');
      if (localUser && (localUser._id === updatedRide.creatorId || localUser.phone === updatedRide.acceptedBy?.phone)) {
        setMatchedRide(updatedRide);
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
      }
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
          width: 290,
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
    if (!fromLoc || !toLoc || !currentUser) return;

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
    if (!window.confirm("Are you sure you want to clear all active rides from the live database?")) return;
    try {
      await axios.delete(`${BACKEND_URL}/api/rides/clear-all`);
      setRides([]);
    } catch (err) {
      alert("Failed to clear rides: " + err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('spct_user');
    setCurrentUser(null);
  };

  // Metrics Data
  const isBiker = currentUser?.role === 'biker';
  const activeCount = rides.filter(r => r.status !== 'accepted').length;
  const acceptedCount = rides.filter(r => r.status === 'accepted').length;
  const totalCount = rides.length;
  const percentageCompleted = totalCount > 0 ? Math.round((acceptedCount / totalCount) * 100) : 0;

  const filteredRides = rides.filter(r => 
    r.fromLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.toLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.creatorName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // SCREEN 1: Splash / Clean Auth
  if (!currentUser) {
    return (
      <main className="min-h-screen bg-[#f3f4f9] text-slate-800 flex flex-col items-center justify-center p-6 select-none font-sans">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/30 mb-3">
            <Sparkles size={28} />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">SPCT AVENGERS</h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">Hostel Bike Pooling & Live Commute Engine</p>
        </div>

        <div className="w-full max-w-sm space-y-4">
          <button
            onClick={() => { setSelectedRole('biker'); setShowAuthModal(true); setErrorMsg(''); setTempGoogleUser(null); }}
            className="w-full bg-white hover:bg-emerald-50/50 border-2 border-slate-200/80 hover:border-emerald-500 p-5 rounded-3xl flex items-center justify-between transition-all duration-200 shadow-sm hover:shadow-xl active:scale-98 text-left cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm group-hover:scale-110 transition-transform">
                <Bike size={30} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Pilot</span>
                <h2 className="text-base font-black text-slate-900">I Have a Bike</h2>
                <p className="text-xs text-slate-500">Pick up hostel students</p>
              </div>
            </div>
            <ArrowRight size={20} className="text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
          </button>

          <button
            onClick={() => { setSelectedRole('ride_taker'); setShowAuthModal(true); setErrorMsg(''); setTempGoogleUser(null); }}
            className="w-full bg-white hover:bg-blue-50/50 border-2 border-slate-200/80 hover:border-blue-600 p-5 rounded-3xl flex items-center justify-between transition-all duration-200 shadow-sm hover:shadow-xl active:scale-98 text-left cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                <UserCheck size={30} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Passenger</span>
                <h2 className="text-base font-black text-slate-900">Need a Ride</h2>
                <p className="text-xs text-slate-500">Post route & catch leaving bikes</p>
              </div>
            </div>
            <ArrowRight size={20} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
          </button>
        </div>

        {showAuthModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 w-full max-w-sm rounded-[32px] p-6 shadow-2xl relative text-slate-800 text-center animate-in zoom-in-95 duration-150">
              <button 
                onClick={() => { setShowAuthModal(false); setTempGoogleUser(null); }}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-full bg-slate-100 cursor-pointer"
              >
                <X size={16} />
              </button>

              {!tempGoogleUser && (
                <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-5 shadow-inner">
                  <button
                    type="button"
                    onClick={() => { setAuthTab('login'); setErrorMsg(''); }}
                    className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
                      authTab === 'login' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    Log In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthTab('signup'); setErrorMsg(''); }}
                    className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
                      authTab === 'signup' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    Sign Up
                  </button>
                </div>
              )}

              <h2 className="text-xl font-black text-slate-900 mb-1">
                {tempGoogleUser ? "Verify Mobile Number" : (authTab === 'login' ? "Welcome Back!" : `Join as ${selectedRole === 'biker' ? 'Biker' : 'Ride Taker'}`)}
              </h2>
              <p className="text-xs text-slate-500 mb-6">
                {tempGoogleUser 
                  ? "Required for direct passenger & rider communication" 
                  : "Authenticate directly with your Google account"}
              </p>

              {errorMsg && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-2xl mb-4 font-mono break-words shadow-sm flex items-start gap-2 text-left">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {!tempGoogleUser ? (
                <div className="flex flex-col items-center justify-center py-2 space-y-4">
                  <div ref={googleBtnRef} className="flex justify-center w-full min-h-[44px]"></div>
                  {authLoading && (
                    <p className="text-xs text-blue-600 font-bold animate-pulse">Connecting to Google OAuth...</p>
                  )}
                </div>
              ) : (
                <form onSubmit={handleCompleteAuth} className="space-y-4 text-left">
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex items-center gap-3">
                    {tempGoogleUser.avatar ? (
                      <img src={tempGoogleUser.avatar} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center">
                        {tempGoogleUser.fullName.charAt(0)}
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-900 truncate">{tempGoogleUser.fullName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{tempGoogleUser.email}</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">10-Digit Genuine Contact Number</label>
                    <input 
                      type="tel" 
                      required 
                      maxLength={10}
                      placeholder="e.g. 9876543210"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-600 font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-2xl transition-all text-xs shadow-lg shadow-blue-600/30 cursor-pointer active:scale-98"
                  >
                    {authLoading ? "Launching..." : "Complete & Enter"}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </main>
    );
  }

  // SCREEN 2: Modern SaaS Dashboard matching Image 1 & 2
  return (
    <div className="min-h-screen bg-[#eff2f9] text-slate-800 flex justify-center font-sans antialiased p-3 sm:p-6 select-none">
      <div className="w-full max-w-6xl bg-white border border-slate-200/90 rounded-[36px] shadow-2xl shadow-blue-900/10 flex flex-col md:flex-row overflow-hidden min-h-[750px]">
        
        {/* LEFT PILL CAPSULE SIDEBAR (MATCHING REFERENCE 2) */}
        <aside className="w-full md:w-64 bg-[#f8faff] border-r border-slate-200/80 p-5 flex flex-col justify-between shrink-0">
          <div className="space-y-4">
            
            {/* Search menu bar */}
            <div className="relative">
              <div className="w-full bg-white border border-blue-500/80 shadow-[0_4px_12px_rgba(59,130,246,0.15)] rounded-full px-4 py-2 flex items-center gap-2">
                <Search size={16} className="text-slate-700" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search menu..." 
                  className="bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none w-full font-medium"
                />
              </div>
            </div>

            {/* Pill navigation list */}
            <nav className="space-y-2 pt-2">
              <button 
                onClick={() => setSidebarTab('dashboard')}
                className={`w-full py-2.5 px-4 rounded-full flex items-center gap-3 text-xs font-bold transition-all shadow-sm cursor-pointer ${
                  sidebarTab === 'dashboard' 
                    ? 'bg-gradient-to-r from-slate-200 to-slate-300 text-slate-900 border border-slate-300 shadow-inner' 
                    : 'bg-white hover:bg-slate-100 text-blue-700 border border-slate-200/70'
                }`}
              >
                <div className="w-7 h-7 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
                  <Home size={14} />
                </div>
                <span>Dashboard</span>
              </button>

              <button 
                onClick={() => setSidebarTab('rides')}
                className={`w-full py-2.5 px-4 rounded-full flex items-center gap-3 text-xs font-bold transition-all shadow-sm cursor-pointer ${
                  sidebarTab === 'rides' 
                    ? 'bg-gradient-to-r from-slate-200 to-slate-300 text-slate-900 border border-slate-300' 
                    : 'bg-white hover:bg-slate-100 text-blue-700 border border-slate-200/70'
                }`}
              >
                <div className="w-7 h-7 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
                  <Calendar size={14} />
                </div>
                <span>Live Feed</span>
              </button>

              <button 
                onClick={() => setSidebarTab('performance')}
                className="w-full bg-white hover:bg-slate-100 text-blue-700 border border-slate-200/70 py-2.5 px-4 rounded-full flex items-center gap-3 text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <div className="w-7 h-7 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
                  <Activity size={14} />
                </div>
                <span>Performance</span>
              </button>

              <button 
                onClick={() => setSidebarTab('leave')}
                className="w-full bg-white hover:bg-slate-100 text-blue-700 border border-slate-200/70 py-2.5 px-4 rounded-full flex items-center gap-3 text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <div className="w-7 h-7 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
                  <Globe size={14} />
                </div>
                <span>Hostel Zone</span>
              </button>

              <button 
                onClick={() => setSidebarTab('profile')}
                className="w-full bg-white hover:bg-slate-100 text-blue-700 border border-slate-200/70 py-2.5 px-4 rounded-full flex items-center gap-3 text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <div className="w-7 h-7 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
                  <CreditCard size={14} />
                </div>
                <span>Identity Card</span>
              </button>
            </nav>
          </div>

          {/* User profile & sign-out bottom pill */}
          <div className="pt-4 border-t border-slate-200/80 space-y-2.5">
            <div className="bg-white border border-slate-200 p-2.5 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2.5 overflow-hidden">
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt="User Avatar" className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-xs shrink-0">
                    {currentUser.name?.charAt(0)}
                  </div>
                )}
                <div className="truncate">
                  <p className="text-xs font-black text-slate-900 truncate">{currentUser.name}</p>
                  <p className="text-[10px] font-bold text-blue-600 tracking-wide uppercase">
                    {isBiker ? 'Biker Pilot' : 'Passenger'}
                  </p>
                </div>
              </div>

              <button 
                onClick={handleLogout}
                title="Sign out"
                className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
              >
                <LogOut size={16} />
              </button>
            </div>

            {/* Clear Database Button */}
            <button
              onClick={handleClearAllRides}
              className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-[11px] font-extrabold py-2 px-3 rounded-2xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 size={13} /> Clear Live Rides
            </button>
          </div>
        </aside>

        {/* RIGHT MAIN WORKSPACE */}
        <main className="flex-1 p-5 md:p-8 flex flex-col space-y-6 overflow-y-auto">
          
          {/* COLORFUL OVERVIEW COMPONENT (MATCHING REFERENCE 1) */}
          <section className="bg-white border-2 border-blue-600 rounded-[30px] overflow-hidden shadow-xl shadow-blue-600/10">
            {/* Vivid Cobalt Blue Header Banner */}
            <div className="bg-blue-600 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center shadow-inner">
                  <Calendar size={20} className="text-white" />
                </div>
                <h2 className="text-lg md:text-xl font-black tracking-tight">Ride Metrics Overview</h2>
              </div>

              <div className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-extrabold tracking-wide text-white border border-white/30">
                Sep 2026
              </div>
            </div>

            {/* Vibrant Metrics Grid + Circular Doughnut Graph */}
            <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              
              {/* Colorful Multi-tone Cards (Green, Blue, Amber, Crimson) */}
              <div className="lg:col-span-7 grid grid-cols-2 gap-3.5">
                
                {/* 1. Green Card: Active Trips */}
                <div className="bg-[#008a17] text-white p-3.5 rounded-2xl flex items-center gap-3 shadow-md shadow-emerald-800/20">
                  <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-[#008a17] shrink-0 shadow">
                    <Bike size={22} strokeWidth={2.5} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold block leading-none">Active</span>
                    <span className="text-2xl font-black leading-tight">{activeCount}</span>
                  </div>
                </div>

                {/* 2. Blue Card: Matched Pairs */}
                <div className="bg-[#2f7bf2] text-white p-3.5 rounded-2xl flex items-center gap-3 shadow-md shadow-blue-800/20">
                  <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-[#2f7bf2] shrink-0 shadow">
                    <CheckCircle2 size={22} strokeWidth={2.5} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold block leading-none">Matched</span>
                    <span className="text-2xl font-black leading-tight">{acceptedCount}</span>
                  </div>
                </div>

                {/* 3. Amber Card: Waiting Queue */}
                <div className="bg-[#e68200] text-white p-3.5 rounded-2xl flex items-center gap-3 shadow-md shadow-amber-800/20">
                  <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-[#e68200] shrink-0 shadow">
                    <Clock size={22} strokeWidth={2.5} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold block leading-none">Pending</span>
                    <span className="text-2xl font-black leading-tight">{activeCount}</span>
                  </div>
                </div>

                {/* 4. Crimson Red Card: Unmatched Drops */}
                <div className="bg-[#d32020] text-white p-3.5 rounded-2xl flex items-center gap-3 shadow-md shadow-rose-800/20">
                  <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-[#d32020] shrink-0 shadow">
                    <Radio size={22} strokeWidth={2.5} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold block leading-none">Broadcast</span>
                    <span className="text-2xl font-black leading-tight">{totalCount}</span>
                  </div>
                </div>

                {/* 5. Deep Royal Blue Full Width Card */}
                <div className="col-span-2 bg-[#0066e0] text-white p-3.5 rounded-2xl flex items-center gap-3 shadow-md">
                  <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-[#0066e0] shrink-0 shadow">
                    <Navigation size={22} strokeWidth={2.5} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold block leading-none">Total Campus Commutes</span>
                    <span className="text-2xl font-black leading-tight">{totalCount}</span>
                  </div>
                </div>
              </div>

              {/* Colorful Doughnut Chart Graphic (Green / Blue split from Reference 1) */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center p-2">
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background ring */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#008a17"
                      strokeWidth="14"
                    />
                    {/* Blue progress segment */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#2f7bf2"
                      strokeWidth="14"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 - (251.2 * percentageCompleted) / 100}
                      strokeLinecap="butt"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-sm font-black text-slate-800">Commute</span>
                    <span className="text-[11px] font-semibold text-slate-400">Overview</span>
                    <span className="text-xs font-black text-blue-600 mt-0.5">{percentageCompleted}%</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* WORKSPACE SECTION: FORM (PASSENGERS ONLY) vs RIDER FEED */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* CONDITIONAL RENDER: BIKER DOES NOT GET THE FORM (AS REQUESTED) */}
            {!isBiker ? (
              <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-[28px] p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Navigation size={16} />
                    </div>
                    <h3 className="text-sm font-black text-slate-900">Request A Ride</h3>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                    Live Broadcast
                  </span>
                </div>

                <form onSubmit={handlePostRide} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">From Location</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Hostel Block B, Gate 2" 
                      value={fromLoc}
                      onChange={(e) => setFromLoc(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-600 transition-all font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">To Destination</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Metro Station, Library" 
                      value={toLoc}
                      onChange={(e) => setToLoc(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-600 transition-all font-semibold"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-2xl text-xs transition-all shadow-md shadow-blue-600/25 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Broadcast Request to Bikers</span>
                    <ArrowRight size={14} />
                  </button>
                </form>
              </div>
            ) : (
              /* Biker Pilot Clean Status Capsule */
              <div className="lg:col-span-5 bg-gradient-to-br from-[#008a17] to-emerald-700 p-6 rounded-[28px] text-white shadow-lg shadow-emerald-700/20">
                <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">
                  Rider Pilot Mode Active
                </span>
                <h3 className="text-xl font-black mt-3">Ready to offer a lift?</h3>
                <p className="text-xs text-emerald-100 mt-1.5 leading-relaxed">
                  You are registered as a Rider. You don't need to post requests. Simply browse live student requests on the right and tap the green checkmark to accept.
                </p>
                <div className="mt-5 flex items-center gap-2 text-xs font-bold bg-white/10 p-3 rounded-2xl border border-white/20">
                  <ShieldCheck size={18} className="text-white" />
                  <span>Only genuine students with Google OAuth connect.</span>
                </div>
              </div>
            )}

            {/* LIVE STREAM FEED */}
            <div className={`${!isBiker ? 'lg:col-span-7' : 'lg:col-span-7'} space-y-3`}>
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Radio size={14} className="text-emerald-600 animate-pulse" /> Live Ride Stream
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full font-mono">
                  {filteredRides.length} Available
                </span>
              </div>

              {filteredRides.length === 0 ? (
                <div className="text-center py-12 bg-white border border-slate-200/80 rounded-[28px] p-6 shadow-sm">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-2">
                    <Compass size={24} />
                  </div>
                  <p className="text-xs font-bold text-slate-700">No active ride requests</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Live student commute requests will appear here instantly.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {filteredRides.map((ride) => (
                    <div 
                      key={ride._id} 
                      className={`p-4 rounded-3xl flex items-center justify-between transition-all border ${
                        ride.status === 'accepted' 
                          ? 'bg-slate-100/60 border-slate-200 opacity-60' 
                          : 'bg-white border-slate-200 hover:border-blue-400 shadow-sm hover:shadow-md'
                      }`}
                    >
                      <div className="space-y-1.5 overflow-hidden pr-3">
                        <div className="flex items-center gap-2 text-xs font-black text-slate-900">
                          <span className="truncate max-w-[140px]">{ride.fromLocation}</span>
                          <ArrowRight size={13} className="text-blue-600 shrink-0" />
                          <span className="truncate max-w-[140px]">{ride.toLocation}</span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] uppercase tracking-wider ${
                            ride.creatorRole === 'biker' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {ride.creatorRole === 'biker' ? 'Biker' : 'Needs Ride'}
                          </span>
                          <span>•</span>
                          <span className="font-semibold text-slate-700 truncate">{ride.creatorName}</span>
                        </div>
                      </div>

                      {ride.status === 'accepted' ? (
                        <span className="text-[11px] font-bold text-emerald-700 px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-200 shrink-0">
                          Matched
                        </span>
                      ) : (
                        <button 
                          onClick={() => handleAcceptRide(ride)}
                          title={isBiker ? "Accept Ride" : "Connect"}
                          className="w-11 h-11 rounded-2xl bg-[#008a17] hover:bg-emerald-600 text-white flex items-center justify-center transition-all shadow-md shadow-emerald-700/20 active:scale-90 cursor-pointer shrink-0"
                        >
                          <Check size={22} strokeWidth={3} />
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

      {/* REVEAL MODAL */}
      {matchedRide && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-[32px] p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-150 text-slate-800">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Check size={28} strokeWidth={3} />
            </div>

            <div>
              <span className="text-[10px] font-extrabold text-emerald-600 tracking-wider uppercase bg-emerald-50 px-2.5 py-0.5 rounded-full">
                Commute Matched
              </span>
              <h2 className="text-lg font-black text-slate-900 mt-1">Ride Confirmed!</h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                {matchedRide.fromLocation} ➔ {matchedRide.toLocation}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2.5">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Direct Connect Info</p>
              
              <div className="flex justify-between items-center text-sm font-extrabold text-slate-900">
                <span>{matchedRide.creatorId === currentUser._id ? matchedRide.acceptedBy?.name : matchedRide.creatorName}</span>
                <span className="text-[11px] font-bold text-slate-500 uppercase bg-slate-200/60 px-2 py-0.5 rounded-md">
                  {matchedRide.creatorId === currentUser._id ? matchedRide.acceptedBy?.role : matchedRide.creatorRole}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-800 font-mono font-bold pt-1">
                <Phone size={15} className="text-emerald-600" />
                <span>{matchedRide.creatorId === currentUser._id ? matchedRide.acceptedBy?.phone : matchedRide.creatorPhone}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <a
                href={`tel:${matchedRide.creatorId === currentUser._id ? matchedRide.acceptedBy?.phone : matchedRide.creatorPhone}`}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25 active:scale-98"
              >
                <Phone size={15} /> Call Now
              </a>

              <a
                href={`https://wa.me/91${matchedRide.creatorId === currentUser._id ? matchedRide.acceptedBy?.phone : matchedRide.creatorPhone}`}
                target="_blank"
                rel="noreferrer"
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md shadow-slate-900/25 active:scale-98"
              >
                <MessageCircle size={15} /> WhatsApp
              </a>
            </div>

            <button 
              onClick={() => setMatchedRide(null)} 
              className="text-xs font-semibold text-slate-400 hover:text-slate-700 pt-1 cursor-pointer block mx-auto"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}