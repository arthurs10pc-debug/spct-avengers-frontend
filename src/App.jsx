import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import confetti from 'canvas-confetti';
import { 
  Bike, UserCheck, Check, Phone, ArrowRight, 
  MapPin, LogOut, Bell, Sparkles, MessageCircle, AlertCircle, X, 
  Search, Calendar, Radio, Navigation, Trash2, Compass, CheckCircle2,
  Clock, FileText, Activity, Globe, CreditCard, ChevronRight, LogIn, UserPlus
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
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [menuSearch, setMenuSearch] = useState('');

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
        confetti({ particleCount: 75, spread: 80, origin: { y: 0.6 } });
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
    if (!window.confirm("Do you want to wipe all live ride records from the cloud database?")) return;
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

  // Metrics calculation
  const isBiker = currentUser?.role === 'biker';
  const activeCount = rides.filter(r => r.status !== 'accepted').length;
  const matchedCount = rides.filter(r => r.status === 'accepted').length;
  const pendingCount = activeCount;
  const totalCount = rides.length;
  const chartRatio = totalCount > 0 ? (matchedCount / totalCount) : 0.25;

  // Sidebar Menu Items (Exact Replica of Image 2)
  const menuItems = [
    { name: 'Dashboard', icon: Home, bg: 'bg-[#1e50ff]' },
    { name: 'Attendance', icon: Calendar, bg: 'bg-[#1e50ff]' },
    { name: 'Work Report', icon: FileText, bg: 'bg-[#1e50ff]' },
    { name: 'Performance', icon: Activity, bg: 'bg-[#1e50ff]' },
    { name: 'Flexi Work', icon: Clock, bg: 'bg-[#1e50ff]' },
    { name: 'Leave', icon: Globe, bg: 'bg-[#1e50ff]' },
    { name: 'Pay Slip', icon: CreditCard, bg: 'bg-[#1e50ff]' },
    { name: 'Expense', icon: CheckCircle2, bg: 'bg-[#1e50ff]' },
    { name: 'Announcement', icon: Bell, bg: 'bg-[#1e50ff]', hasArrow: true }
  ];

  const filteredMenuItems = menuItems.filter(m => 
    m.name.toLowerCase().includes(menuSearch.toLowerCase())
  );

  // AUTHENTICATION SPLASH SCREEN
  if (!currentUser) {
    return (
      <main className="min-h-screen bg-[#f0f3fa] text-slate-800 flex flex-col items-center justify-center p-6 select-none font-sans">
        <div className="text-center mb-8">
          <div className="inline-flex p-3.5 rounded-2xl bg-[#0011ff] text-white shadow-xl shadow-blue-500/25 mb-3">
            <Sparkles size={30} />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">SPCT AVENGERS</h1>
          <p className="text-xs text-slate-500 font-bold mt-1">Hostel Bike Pooling & Verified Commute Engine</p>
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
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Pilot</span>
                <h2 className="text-base font-black text-slate-900">I Have a Bike</h2>
                <p className="text-xs text-slate-500">Pick up hostel students</p>
              </div>
            </div>
            <ArrowRight size={20} className="text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
          </button>

          <button
            onClick={() => { setSelectedRole('ride_taker'); setShowAuthModal(true); setErrorMsg(''); setTempGoogleUser(null); }}
            className="w-full bg-white hover:bg-blue-50/50 border-2 border-slate-200/80 hover:border-[#0011ff] p-5 rounded-3xl flex items-center justify-between transition-all duration-200 shadow-sm hover:shadow-xl active:scale-98 text-left cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0011ff] shadow-sm group-hover:scale-110 transition-transform">
                <UserCheck size={30} />
              </div>
              <div>
                <span className="text-[10px] font-black text-[#0011ff] uppercase tracking-widest">Passenger</span>
                <h2 className="text-base font-black text-slate-900">Need a Ride</h2>
                <p className="text-xs text-slate-500">Post route & catch leaving bikes</p>
              </div>
            </div>
            <ArrowRight size={20} className="text-slate-400 group-hover:text-[#0011ff] group-hover:translate-x-1 transition-all" />
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
                      authTab === 'login' ? 'bg-white text-[#0011ff] shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    Log In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthTab('signup'); setErrorMsg(''); }}
                    className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
                      authTab === 'signup' ? 'bg-white text-[#0011ff] shadow-sm' : 'text-slate-500'
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
                    <p className="text-xs text-[#0011ff] font-bold animate-pulse">Connecting to Google OAuth...</p>
                  )}
                </div>
              ) : (
                <form onSubmit={handleCompleteAuth} className="space-y-4 text-left">
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex items-center gap-3">
                    {tempGoogleUser.avatar ? (
                      <img src={tempGoogleUser.avatar} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#0011ff] text-white font-bold flex items-center justify-center">
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-[#0011ff] font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full bg-[#0011ff] hover:bg-blue-600 text-white font-bold py-3.5 rounded-2xl transition-all text-xs shadow-lg shadow-blue-600/30 cursor-pointer active:scale-98"
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

  // MAIN DASHBOARD INTERFACE
  return (
    <div className="min-h-screen bg-[#eaedf5] text-slate-900 flex justify-center p-2 sm:p-5 select-none font-sans">
      <div className="w-full max-w-[1350px] bg-white rounded-[40px] shadow-2xl border border-slate-200/80 flex flex-col md:flex-row overflow-hidden min-h-[820px]">
        
        {/* =====================================================================
            LEFT CAPSULE PILL SIDEBAR (MATCHING EXACT IMAGE 2)
           ===================================================================== */}
        <aside className="w-full md:w-[260px] bg-white border-r border-slate-200 p-5 flex flex-col justify-between shrink-0">
          <div className="space-y-4">
            
            {/* Search Input Box with Blue Outline & Shadow from Image 2 */}
            <div className="relative">
              <div className="w-full bg-white border-2 border-[#5764ec] shadow-[0_4px_14px_rgba(87,100,236,0.22)] rounded-full px-4 py-2.5 flex items-center gap-2.5">
                <Search size={18} className="text-slate-800 stroke-[2.5]" />
                <input 
                  type="text" 
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  placeholder="Search menu..." 
                  className="bg-transparent text-[13px] text-slate-800 placeholder-slate-400 outline-none w-full font-medium"
                />
              </div>
            </div>

            {/* Pill Navigation Items from Image 2 */}
            <div className="space-y-2.5 pt-2">
              {filteredMenuItems.map((item, idx) => {
                const isActive = activeMenu === item.name;
                const IconComponent = item.icon;

                return (
                  <button
                    key={idx}
                    onClick={() => setActiveMenu(item.name)}
                    className={`w-full py-2.5 px-4 rounded-full flex items-center justify-between text-[13px] font-black transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-gradient-to-b from-[#e3e6ed] to-[#cbd2e0] text-slate-900 border-2 border-slate-300/80 shadow-inner' 
                        : 'bg-[#f4f6fb] hover:bg-[#eef2f9] text-[#0011ff] border-2 border-slate-200/60 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#0011ff] flex items-center justify-center text-white shadow-sm shrink-0">
                        <IconComponent size={16} className="text-white stroke-[2.5]" />
                      </div>
                      <span className="truncate">{item.name}</span>
                    </div>
                    {item.hasArrow && (
                      <ChevronRight size={16} className="text-[#0011ff] stroke-[3]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom user profile & clear database tool */}
          <div className="pt-4 border-t border-slate-200 space-y-2.5">
            <div className="bg-[#f8faff] border border-slate-200 p-3 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2.5 overflow-hidden">
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt="User Avatar" className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-[#0011ff] text-white font-black flex items-center justify-center text-sm shrink-0">
                    {currentUser.name?.charAt(0)}
                  </div>
                )}
                <div className="truncate">
                  <p className="text-xs font-black text-slate-900 truncate">{currentUser.name}</p>
                  <p className="text-[10px] font-black text-[#0011ff] tracking-wide uppercase">
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

            {/* Clear Database live ride records */}
            <button
              onClick={handleClearAllRides}
              className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-[11px] font-black py-2.5 px-3 rounded-2xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 size={14} /> Clear All Live Rides
            </button>
          </div>
        </aside>

        {/* =====================================================================
            RIGHT WORKSPACE WITH IMAGE 1 BANNER, DOUGHNUT & CONDITIONAL FORM
           ===================================================================== */}
        <main className="flex-1 p-5 md:p-8 flex flex-col space-y-6 overflow-y-auto">
          
          {/* TOP SECTION: EXACT REPLICA OF ATTENDANCE OVERVIEW (IMAGE 1) */}
          <div className="w-full bg-white border-4 border-[#0011ff] rounded-[36px] overflow-hidden shadow-xl shadow-blue-500/10">
            
            {/* 1. Header Bar from Image 1 */}
            <div className="bg-[#0011ff] px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner">
                  <Calendar size={22} className="text-white stroke-[2.5]" />
                </div>
                <h2 className="text-xl md:text-2xl font-black tracking-tight">Attendance Overview</h2>
              </div>

              {/* Right pill badge from Image 1 */}
              <div className="bg-white/90 backdrop-blur-md px-5 py-2 rounded-full text-xs font-black text-slate-800 shadow-sm">
                Sep 2026
              </div>
            </div>

            {/* 2. Grid with 5 colorful pills + Doughnut Chart from Image 1 */}
            <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white">
              
              {/* 5 Vivid Cards (Green, Blue, Orange, Red, Dark Blue) */}
              <div className="lg:col-span-7 grid grid-cols-2 gap-4">
                
                {/* Green Pill: Present / Active */}
                <div className="bg-[#009419] text-white p-4 rounded-3xl flex items-center gap-3.5 shadow-md">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#009419] shrink-0 shadow-sm">
                    <Calendar size={22} className="stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block leading-none opacity-90">Present</span>
                    <span className="text-2xl font-black leading-tight">{activeCount || 6}</span>
                  </div>
                </div>

                {/* Sky Blue Pill: Late / Matched */}
                <div className="bg-[#307af2] text-white p-4 rounded-3xl flex items-center gap-3.5 shadow-md">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#307af2] shrink-0 shadow-sm">
                    <Clock size={22} className="stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block leading-none opacity-90">Late</span>
                    <span className="text-2xl font-black leading-tight">{matchedCount || 0}</span>
                  </div>
                </div>

                {/* Orange Pill: Half Day / Pending */}
                <div className="bg-[#e28100] text-white p-4 rounded-3xl flex items-center gap-3.5 shadow-md">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#e28100] shrink-0 shadow-sm">
                    <Calendar size={22} className="stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block leading-none opacity-90">Half Day</span>
                    <span className="text-2xl font-black leading-tight">{pendingCount || 0}</span>
                  </div>
                </div>

                {/* Crimson Red Pill: Absent */}
                <div className="bg-[#cf2020] text-white p-4 rounded-3xl flex items-center gap-3.5 shadow-md">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#cf2020] shrink-0 shadow-sm">
                    <X size={22} className="stroke-[3]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block leading-none opacity-90">Absent</span>
                    <span className="text-2xl font-black leading-tight">0</span>
                  </div>
                </div>

                {/* Blue Full Pill: Leave / Total */}
                <div className="col-span-2 bg-[#006ee4] text-white p-4 rounded-3xl flex items-center gap-3.5 shadow-md">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#006ee4] shrink-0 shadow-sm">
                    <Navigation size={22} className="stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block leading-none opacity-90">Leave</span>
                    <span className="text-2xl font-black leading-tight">{totalCount || 1}</span>
                  </div>
                </div>
              </div>

              {/* Exact Circular Doughnut Graphic from Image 1 */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center">
                <div className="relative w-56 h-56 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Green Segment */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#009419"
                      strokeWidth="16"
                      strokeDasharray="238.7"
                      strokeDashoffset={238.7 * (1 - (1 - chartRatio))}
                      strokeLinecap="butt"
                    />
                    {/* Blue Segment */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#006ee4"
                      strokeWidth="16"
                      strokeDasharray="238.7"
                      strokeDashoffset={238.7 * (1 - chartRatio)}
                      strokeLinecap="butt"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-base font-black text-slate-900 leading-tight">Attendance</span>
                    <span className="text-xs font-bold text-slate-500 leading-tight">Overview</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* LOWER INTERACTIVE SECTION: RIDE FORM (PASSENGERS ONLY) & LIVE STREAM */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* CONDITIONAL RENDER: Form is strictly hidden for Bikers */}
            {!isBiker ? (
              <div className="lg:col-span-5 bg-[#f8faff] border-2 border-slate-200 rounded-[32px] p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-[#0011ff] text-white flex items-center justify-center shadow-md">
                      <Navigation size={18} />
                    </div>
                    <h3 className="text-base font-black text-slate-900">Request A Ride</h3>
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-1 bg-blue-100 text-[#0011ff] rounded-full">
                    Need Ride
                  </span>
                </div>

                <form onSubmit={handlePostRide} className="space-y-3.5">
                  <div>
                    <label className="text-[11px] font-black text-slate-700 block mb-1">From Location</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Hostel Block B, Gate 2" 
                      value={fromLoc}
                      onChange={(e) => setFromLoc(e.target.value)}
                      className="w-full bg-white border-2 border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-[#0011ff] font-semibold transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-black text-slate-700 block mb-1">To Destination</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. College Campus, Metro" 
                      value={toLoc}
                      onChange={(e) => setToLoc(e.target.value)}
                      className="w-full bg-white border-2 border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-[#0011ff] font-semibold transition-all"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-[#0011ff] hover:bg-blue-600 text-white font-black py-3.5 rounded-2xl text-xs transition-all shadow-lg shadow-blue-500/25 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Broadcast Request to Bikers</span>
                    <ArrowRight size={16} />
                  </button>
                </form>
              </div>
            ) : (
              /* Biker Pilot View: Informative banner without request inputs */
              <div className="lg:col-span-5 bg-gradient-to-br from-[#009419] to-emerald-800 p-6 rounded-[32px] text-white shadow-xl">
                <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">
                  Rider Mode Active
                </span>
                <h3 className="text-xl font-black mt-3">Ready to offer a lift?</h3>
                <p className="text-xs text-emerald-100 mt-2 leading-relaxed">
                  As a registered Biker, you do not need to submit requests. Browse the live passenger requests from the feed on the right and tap the green tick to connect.
                </p>
                <div className="mt-6 flex items-center gap-3 bg-white/10 p-3.5 rounded-2xl border border-white/20 text-xs font-bold">
                  <CheckCircle2 size={20} className="text-white shrink-0" />
                  <span>Verified Google accounts guarantee authentic campus rides.</span>
                </div>
              </div>
            )}

            {/* LIVE RIDE STREAM FEED */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Radio size={16} className="text-emerald-600 animate-pulse" /> Live Ride Stream
                </span>
                <span className="text-[11px] font-black px-3 py-1 bg-blue-50 text-[#0011ff] rounded-full font-mono">
                  {rides.length} Requests
                </span>
              </div>

              {rides.length === 0 ? (
                <div className="text-center py-14 bg-[#f8faff] border-2 border-slate-200/80 rounded-[32px] p-6 shadow-sm">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-2 shadow-sm">
                    <Compass size={24} />
                  </div>
                  <p className="text-xs font-black text-slate-800">No active ride requests</p>
                  <p className="text-[11px] text-slate-400 mt-1">Live passenger requests will appear here automatically.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {rides.map((ride) => (
                    <div 
                      key={ride._id} 
                      className={`p-4 rounded-3xl flex items-center justify-between transition-all border-2 ${
                        ride.status === 'accepted' 
                          ? 'bg-slate-100/60 border-slate-200 opacity-60' 
                          : 'bg-white border-slate-200 hover:border-[#0011ff] shadow-sm hover:shadow-md'
                      }`}
                    >
                      <div className="space-y-1.5 overflow-hidden pr-3">
                        <div className="flex items-center gap-2 text-xs font-black text-slate-900">
                          <span className="truncate max-w-[140px]">{ride.fromLocation}</span>
                          <ArrowRight size={14} className="text-[#0011ff] shrink-0 stroke-[3]" />
                          <span className="truncate max-w-[140px]">{ride.toLocation}</span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span className={`px-2.5 py-0.5 rounded-lg font-black text-[9px] uppercase tracking-wider ${
                            ride.creatorRole === 'biker' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-[#0011ff] border border-blue-200'
                          }`}>
                            {ride.creatorRole === 'biker' ? 'Biker' : 'Needs Ride'}
                          </span>
                          <span>•</span>
                          <span className="font-bold text-slate-700 truncate">{ride.creatorName}</span>
                        </div>
                      </div>

                      {ride.status === 'accepted' ? (
                        <span className="text-[11px] font-black text-emerald-700 px-3.5 py-1.5 bg-emerald-50 rounded-2xl border border-emerald-200 shrink-0">
                          Matched
                        </span>
                      ) : (
                        <button 
                          onClick={() => handleAcceptRide(ride)}
                          title={isBiker ? "Accept Ride" : "Connect"}
                          className="w-12 h-12 rounded-2xl bg-[#009419] hover:bg-emerald-600 text-white flex items-center justify-center transition-all shadow-md shadow-emerald-600/30 active:scale-90 cursor-pointer shrink-0"
                        >
                          <Check size={24} strokeWidth={3.5} />
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

      {/* MATCHED REVEAL MODAL */}
      {matchedRide && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-[36px] p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-150 text-slate-800">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Check size={30} strokeWidth={3.5} />
            </div>

            <div>
              <span className="text-[10px] font-black text-emerald-600 tracking-wider uppercase bg-emerald-50 px-3 py-1 rounded-full">
                Commute Matched
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-1.5">Ride Confirmed!</h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                {matchedRide.fromLocation} ➔ {matchedRide.toLocation}
              </p>
            </div>

            <div className="bg-[#f8faff] border border-slate-200 rounded-2xl p-4 text-left space-y-2.5">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Direct Contact Info</p>
              
              <div className="flex justify-between items-center text-sm font-black text-slate-900">
                <span>{matchedRide.creatorId === currentUser._id ? matchedRide.acceptedBy?.name : matchedRide.creatorName}</span>
                <span className="text-[11px] font-black text-slate-500 uppercase bg-slate-200/70 px-2 py-0.5 rounded-md">
                  {matchedRide.creatorId === currentUser._id ? matchedRide.acceptedBy?.role : matchedRide.creatorRole}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-800 font-mono font-bold pt-1">
                <Phone size={16} className="text-emerald-600" />
                <span>{matchedRide.creatorId === currentUser._id ? matchedRide.acceptedBy?.phone : matchedRide.creatorPhone}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <a
                href={`tel:${matchedRide.creatorId === currentUser._id ? matchedRide.acceptedBy?.phone : matchedRide.creatorPhone}`}
                className="bg-[#009419] hover:bg-emerald-600 text-white font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25 active:scale-98"
              >
                <Phone size={16} /> Call Now
              </a>

              <a
                href={`https://wa.me/91${matchedRide.creatorId === currentUser._id ? matchedRide.acceptedBy?.phone : matchedRide.creatorPhone}`}
                target="_blank"
                rel="noreferrer"
                className="bg-slate-900 hover:bg-slate-800 text-white font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md shadow-slate-900/25 active:scale-98"
              >
                <MessageCircle size={16} /> WhatsApp
              </a>
            </div>

            <button 
              onClick={() => setMatchedRide(null)} 
              className="text-xs font-bold text-slate-400 hover:text-slate-700 pt-1 cursor-pointer block mx-auto"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}