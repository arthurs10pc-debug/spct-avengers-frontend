import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import confetti from 'canvas-confetti';
import { 
  Bike, UserCheck, Check, Phone, ArrowRight, 
  MapPin, LogOut, Bell, Sparkles, MessageCircle, AlertCircle, X, Crown, LogIn, UserPlus,
  Navigation, Compass, Radio, ShieldCheck, Flame
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

    socketRef.current.on('ride_accepted_broadcast', (updatedRide) => {
      setRides(prev => prev.map(r => r._id === updatedRide._id ? updatedRide : r));
      
      const localUser = JSON.parse(localStorage.getItem('spct_user') || '{}');
      if (localUser && (localUser._id === updatedRide.creatorId || localUser.phone === updatedRide.acceptedBy?.phone)) {
        setMatchedRide(updatedRide);
        confetti({ particleCount: 65, spread: 80, origin: { y: 0.6 } });
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
        throw new Error("Unable to parse Google token.");
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
          theme: 'filled_blue',
          size: 'large',
          width: 300,
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

  const handleLogout = () => {
    localStorage.removeItem('spct_user');
    setCurrentUser(null);
  };

  // SCREEN 1: Ultra Modern Hero Landing
  if (!currentUser) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900 flex flex-col items-center justify-center p-6 select-none font-sans relative overflow-hidden">
        
        {/* Glow ambient blurs */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-emerald-300/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-sky-300/30 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-10 z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 text-white shadow-lg mb-4 text-[11px] font-semibold tracking-wider uppercase">
            <Flame size={14} className="text-amber-400" /> SPCT Campus Pool
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            SPCT <span className="bg-gradient-to-r from-emerald-600 to-sky-600 bg-clip-text text-transparent">AVENGERS</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-2 max-w-xs mx-auto leading-relaxed">
            Instant hostel ride pairing. Safe, authenticated campus commuters.
          </p>
        </div>

        <div className="w-full max-w-sm space-y-4 z-10">
          {/* Card 1: Biker */}
          <button
            onClick={() => { setSelectedRole('biker'); setShowAuthModal(true); setErrorMsg(''); setTempGoogleUser(null); }}
            className="w-full bg-white/80 hover:bg-emerald-50/50 backdrop-blur-md border border-slate-200 hover:border-emerald-400 p-5 rounded-3xl flex items-center justify-between transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-0.5 active:scale-98 text-left cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600 shadow-sm group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                <Bike size={28} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-600 tracking-wider uppercase">Rider Pilot</span>
                <h2 className="text-base font-extrabold text-slate-900">I Have a Bike</h2>
                <p className="text-xs text-slate-500">Pick up hostel mates on your route</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
          </button>

          {/* Card 2: Ride Taker */}
          <button
            onClick={() => { setSelectedRole('ride_taker'); setShowAuthModal(true); setErrorMsg(''); setTempGoogleUser(null); }}
            className="w-full bg-white/80 hover:bg-sky-50/50 backdrop-blur-md border border-slate-200 hover:border-sky-400 p-5 rounded-3xl flex items-center justify-between transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-0.5 active:scale-98 text-left cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-200/60 flex items-center justify-center text-sky-600 shadow-sm group-hover:scale-110 group-hover:bg-sky-600 group-hover:text-white transition-all duration-300">
                <UserCheck size={28} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-sky-600 tracking-wider uppercase">Passenger</span>
                <h2 className="text-base font-extrabold text-slate-900">Need a Ride</h2>
                <p className="text-xs text-slate-500">Post route & catch departing bikes</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-slate-300 group-hover:text-sky-600 group-hover:translate-x-1 transition-all" />
          </button>
        </div>

        {/* Modal */}
        {showAuthModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-100 w-full max-w-sm rounded-[32px] p-6 shadow-2xl relative text-slate-800 animate-in zoom-in-95 duration-200 text-center">
              
              <button 
                onClick={() => { setShowAuthModal(false); setTempGoogleUser(null); }}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>

              {!tempGoogleUser && (
                <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6 shadow-inner">
                  <button
                    type="button"
                    onClick={() => { setAuthTab('login'); setErrorMsg(''); }}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      authTab === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <LogIn size={13} /> Log In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthTab('signup'); setErrorMsg(''); }}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      authTab === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <UserPlus size={13} /> Sign Up
                  </button>
                </div>
              )}

              <h2 className="text-xl font-extrabold text-slate-900 mb-1">
                {tempGoogleUser 
                  ? "Contact Setup" 
                  : (authTab === 'login' ? "Welcome Back!" : `Join as ${selectedRole === 'biker' ? 'Rider' : 'Ride Taker'}`)}
              </h2>
              <p className="text-xs text-slate-500 mb-6">
                {tempGoogleUser 
                  ? "Required for direct WhatsApp & phone reachability" 
                  : (authTab === 'login' 
                      ? "1-Click instant sign in with Google" 
                      : "Create your verified commuter profile")}
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
                    <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold animate-pulse">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span>Authenticating with Google...</span>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleCompleteAuth} className="space-y-4 text-left">
                  <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex items-center gap-3">
                    {tempGoogleUser.avatar ? (
                      <img src={tempGoogleUser.avatar} alt="Avatar" className="w-11 h-11 rounded-full border-2 border-white shadow-sm" />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center">
                        {tempGoogleUser.fullName.charAt(0)}
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-900 truncate">{tempGoogleUser.fullName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{tempGoogleUser.email}</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1.5 uppercase tracking-wide">
                      10-Digit Mobile Number
                    </label>
                    <input 
                      type="tel" 
                      required 
                      maxLength={10}
                      placeholder="e.g. 9876543210"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-2xl transition-all cursor-pointer text-xs shadow-lg shadow-slate-900/20 active:scale-98"
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

  // SCREEN 2: Polished Dashboard
  const isBiker = currentUser.role === 'biker';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col max-w-md mx-auto relative font-sans border-x border-slate-200/80 shadow-2xl">
      
      {/* Top Stylish App Header */}
      <header className="h-16 flex items-center justify-between px-4 border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="relative">
            {currentUser.avatar ? (
              <img src={currentUser.avatar} alt="User" className="w-10 h-10 rounded-2xl object-cover border border-slate-200 shadow-sm" />
            ) : (
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-sm ${isBiker ? 'bg-emerald-600' : 'bg-sky-600'}`}>
                {currentUser.name?.charAt(0)}
              </div>
            )}
            <div className={`absolute -bottom-1 -right-1 p-1 rounded-full text-white ${isBiker ? 'bg-emerald-600 ring-2 ring-white' : 'bg-sky-600 ring-2 ring-white'}`}>
              {isBiker ? <Bike size={10} /> : <UserCheck size={10} />}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-extrabold text-slate-900 leading-none truncate max-w-[170px]">{currentUser.name}</h1>
              {currentUser.email === ADMIN_EMAIL && (
                <span className="bg-amber-100 text-amber-900 text-[9px] px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5">
                  <Crown size={10} /> ADMIN
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mt-1 inline-block">
              {isBiker ? 'Biker Pilot' : 'Passenger Mode'}
            </span>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          title="Sign out"
          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-colors cursor-pointer"
        >
          <LogOut size={18} />
        </button>
      </header>

      {/* Main Stream Area */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto pb-24 bg-gradient-to-b from-slate-50 to-white">
        
        {/* CONDITIONAL RENDER: Only passengers who need a ride get the FROM / TO Form */}
        {!isBiker ? (
          <section className="bg-white border border-slate-200/80 p-5 rounded-[28px] shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Navigation size={15} className="text-sky-600" /> Request a Ride
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-sky-50 text-sky-700 rounded-full">
                Live Broadcast
              </span>
            </div>

            <form onSubmit={handlePostRide} className="space-y-3">
              <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full bg-sky-500 absolute left-3.5 top-3.5" />
                <input 
                  type="text" 
                  required
                  placeholder="From (e.g. Hostel Block B, Main Gate)" 
                  value={fromLoc}
                  onChange={(e) => setFromLoc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-8 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all font-medium"
                />
              </div>

              <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute left-3.5 top-3.5" />
                <input 
                  type="text" 
                  required
                  placeholder="To (e.g. Metro Station, Campus 2)" 
                  value={toLoc}
                  onChange={(e) => setToLoc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-8 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold py-3 rounded-2xl text-xs transition-all shadow-md shadow-sky-600/25 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Broadcast Request to Bikers</span>
                <ArrowRight size={14} />
              </button>
            </form>
          </section>
        ) : (
          /* Biker Dashboard Info Capsule */
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-5 rounded-[28px] text-white shadow-lg shadow-emerald-700/20">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full">
                  Rider Dashboard
                </span>
                <h2 className="text-lg font-black mt-2">Ready to offer a ride?</h2>
                <p className="text-xs text-emerald-100 mt-0.5 max-w-[240px]">
                  Pick students waiting for bikes below. Tap the green tick to accept and connect.
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white shrink-0 border border-white/20">
                <Bike size={30} />
              </div>
            </div>
          </div>
        )}

        {/* Live Requests Feed */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Radio size={14} className="text-emerald-600 animate-pulse" /> Live Ride Requests
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 bg-slate-200/70 text-slate-700 rounded-full font-mono">
              {rides.length} active
            </span>
          </div>

          {rides.length === 0 ? (
            <div className="text-center py-14 bg-white border border-slate-200/80 rounded-[28px] p-6 shadow-sm">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-2">
                <Compass size={24} />
              </div>
              <p className="text-xs font-bold text-slate-700">No active ride requests</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Students requesting rides will appear here in real-time.</p>
            </div>
          ) : (
            rides.map((ride) => (
              <div 
                key={ride._id} 
                className={`p-4 rounded-3xl flex items-center justify-between transition-all border ${
                  ride.status === 'accepted' 
                    ? 'bg-slate-100/60 border-slate-200 opacity-60' 
                    : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-sm hover:shadow-md'
                }`}
              >
                <div className="space-y-1.5 overflow-hidden pr-3">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-900">
                    <span className="truncate max-w-[120px]">{ride.fromLocation}</span>
                    <ArrowRight size={13} className="text-emerald-600 shrink-0" />
                    <span className="truncate max-w-[120px]">{ride.toLocation}</span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] uppercase tracking-wider ${
                      ride.creatorRole === 'biker' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-sky-50 text-sky-700 border border-sky-200'
                    }`}>
                      {ride.creatorRole === 'biker' ? 'Biker' : 'Needs Ride'}
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-slate-700 truncate">{ride.creatorName}</span>
                  </div>
                </div>

                {/* Connection Trigger */}
                {ride.status === 'accepted' ? (
                  <span className="text-[11px] font-bold text-emerald-700 px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-200 shrink-0">
                    Matched
                  </span>
                ) : (
                  <button 
                    onClick={() => handleAcceptRide(ride)}
                    title={isBiker ? "Accept this ride" : "Connect"}
                    className="w-11 h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition-all shadow-md shadow-emerald-600/30 active:scale-90 cursor-pointer shrink-0"
                  >
                    <Check size={22} strokeWidth={3} />
                  </button>
                )}
              </div>
            ))
          )}
        </section>
      </div>

      {/* REVEAL MODAL: Instant Connect on Green Tick */}
      {matchedRide && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 w-full max-w-sm rounded-[32px] p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200 text-slate-800">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Check size={28} strokeWidth={3} />
            </div>

            <div>
              <span className="text-[10px] font-extrabold text-emerald-600 tracking-wider uppercase bg-emerald-50 px-2.5 py-0.5 rounded-full">
                Matched Pair
              </span>
              <h2 className="text-lg font-black text-slate-900 mt-1">Ride Confirmed!</h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                {matchedRide.fromLocation} ➔ {matchedRide.toLocation}
              </p>
            </div>

            {/* Revealed Profile Card */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left space-y-2.5">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Direct Contact Details</p>
              
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

            {/* Actions */}
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
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}