import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import confetti from 'canvas-confetti';
import { 
  Bike, UserCheck, Check, Phone, ArrowRight, 
  MapPin, LogOut, Bell, Sparkles, MessageCircle, AlertCircle, X, Shield, Crown
} from 'lucide-react';

const BACKEND_URL = "https://spct-avengers-backend.onrender.com";
const ADMIN_EMAIL = "arthurs10pc@gmail.com";

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('spct_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [selectedRole, setSelectedRole] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [fromLoc, setFromLoc] = useState('');
  const [toLoc, setToLoc] = useState('');
  const [rides, setRides] = useState([]);
  const [matchedRide, setMatchedRide] = useState(null);

  const socketRef = useRef(null);

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
        confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
      }
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const validateNumberClient = (num) => {
    const clean = num.replace(/\D/g, '');
    if (clean.length !== 10) return false;
    if (!/^[6-9]/.test(clean)) return false;
    if (["1234567890", "0123456789", "9876543210", "1234567892"].includes(clean)) return false;
    if (/^(\d)\1{9}$/.test(clean)) return false;
    return true;
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim() || !email.trim() || !phone.trim()) {
      setErrorMsg("Please fill all details");
      return;
    }

    if (!validateNumberClient(phone)) {
      setErrorMsg("Please enter a valid 10-digit mobile number (starts with 6-9)");
      return;
    }

    setAuthLoading(true);

    try {
      await axios.post(`${BACKEND_URL}/api/auth/send-otp`, {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        role: selectedRole
      });
      setStep(2);
    } catch (err) {
      // Direct server error message display
      const serverError = err.response?.data?.error || err.message || "Network error. Backend might be sleeping.";
      setErrorMsg(serverError);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setErrorMsg('');

    try {
      const res = await axios.post(`${BACKEND_URL}/api/auth/verify-otp`, { 
        email: email.trim().toLowerCase(), 
        otp: otp.trim() 
      });
      if (res.data.success) {
        setCurrentUser(res.data.user);
        localStorage.setItem('spct_user', JSON.stringify(res.data.user));
        setShowAuthModal(false);
      }
    } catch (err) {
      const serverError = err.response?.data?.error || err.message || "Verification failed";
      setErrorMsg(serverError);
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
      creatorPhone: currentUser.phone,
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
          phone: currentUser.phone,
          role: currentUser.role
        }
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('spct_user');
    setCurrentUser(null);
    setSelectedRole(null);
  };

  if (!currentUser) {
    return (
      <main className="min-h-screen bg-white text-slate-800 flex flex-col items-center justify-center p-6 select-none font-sans">
        <div className="text-center mb-10">
          <div className="inline-flex p-3 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm mb-3">
            <Sparkles size={28} />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">SPCT AVENGERS</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Hostel Bike Pooling & Live Connect</p>
        </div>

        <div className="w-full max-w-sm space-y-4">
          <button
            onClick={() => { setSelectedRole('biker'); setShowAuthModal(true); setStep(1); setErrorMsg(''); }}
            className="w-full bg-slate-50 hover:bg-emerald-50/40 border border-slate-200 hover:border-emerald-300 p-6 rounded-3xl flex items-center justify-between transition-all duration-200 shadow-sm hover:shadow-md active:scale-98 text-left cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-emerald-600 shadow-sm group-hover:scale-110 transition-transform">
                <Bike size={30} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">I Have a Bike</h2>
                <p className="text-xs text-slate-500">Offer a ride to hostel friends</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
          </button>

          <button
            onClick={() => { setSelectedRole('ride_taker'); setShowAuthModal(true); setStep(1); setErrorMsg(''); }}
            className="w-full bg-slate-50 hover:bg-sky-50/40 border border-slate-200 hover:border-sky-300 p-6 rounded-3xl flex items-center justify-between transition-all duration-200 shadow-sm hover:shadow-md active:scale-98 text-left cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-sky-600 shadow-sm group-hover:scale-110 transition-transform">
                <UserCheck size={30} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Need a Ride</h2>
                <p className="text-xs text-slate-500">Find bikes leaving the hostel</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-slate-400 group-hover:text-sky-600 transition-colors" />
          </button>
        </div>

        {/* Modal */}
        {showAuthModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative text-slate-800 animate-in zoom-in-95 duration-150">
              <button 
                onClick={() => setShowAuthModal(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>

              <h2 className="text-lg font-bold text-slate-900 mb-1">
                {step === 1 ? `Join as ${selectedRole === 'biker' ? 'Biker' : 'Ride Taker'}` : "Verification Code"}
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                {step === 1 ? "One-time account registration" : `Enter the 6-digit code sent to ${email}`}
              </p>

              {/* Exact Error Feedback Display at Bottom/Middle */}
              {errorMsg && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl mb-4 font-mono break-words leading-relaxed shadow-sm flex items-start gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
                  <div>
                    <span className="font-bold block text-rose-800">Error Details:</span>
                    <span>{errorMsg}</span>
                  </div>
                </div>
              )}

              {step === 1 ? (
                <form onSubmit={handleSendOtp} className="space-y-3.5">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Full Name</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Jack Patel"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Gmail ID</label>
                    <input 
                      type="email" 
                      required 
                      placeholder="your.email@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-500 transition-all"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-semibold text-slate-600">Mobile Number</label>
                      <span className="text-[10px] text-emerald-600 font-medium">for connect purpose only</span>
                    </div>
                    <input 
                      type="tel" 
                      required 
                      maxLength={10}
                      placeholder="10-digit genuine number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-500 transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-colors cursor-pointer text-sm shadow-md shadow-emerald-600/20 active:scale-98"
                  >
                    {authLoading ? "Sending Code..." : "Send Gmail OTP"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <input 
                    type="text" 
                    required 
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full tracking-[8px] text-center text-2xl font-bold bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 outline-none focus:border-emerald-500 transition-all"
                  />

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-colors cursor-pointer text-sm shadow-md shadow-emerald-600/20"
                  >
                    {authLoading ? "Verifying..." : "Verify & Launch"}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setStep(1); setErrorMsg(''); }} 
                    className="w-full text-center text-xs font-medium text-slate-500 hover:text-slate-800"
                  >
                    Edit Email or Phone
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col max-w-md mx-auto relative font-sans border-x border-slate-100 shadow-sm">
      <header className="h-16 flex items-center justify-between px-4 border-b border-slate-100 bg-white/95 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${currentUser.role === 'biker' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-sky-50 text-sky-600 border border-sky-100'}`}>
            {currentUser.role === 'biker' ? <Bike size={20} /> : <UserCheck size={20} />}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold text-slate-900 leading-none">{currentUser.name}</h1>
              {currentUser.email === ADMIN_EMAIL && (
                <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                  <Crown size={10} /> ADMIN
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              {currentUser.role === 'biker' ? 'Hostel Biker' : 'Ride Taker'}
            </span>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          title="Sign out"
          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
        >
          <LogOut size={17} />
        </button>
      </header>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto pb-24 bg-[#fafafa]">
        <section className="bg-white border border-slate-200/80 p-4 rounded-3xl shadow-sm">
          <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <MapPin size={14} className="text-emerald-600" /> Post a Trip
          </h2>

          <form onSubmit={handlePostRide} className="space-y-2.5">
            <input 
              type="text" 
              required
              placeholder="From: (e.g. Hostel Block B)" 
              value={fromLoc}
              onChange={(e) => setFromLoc(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-500 transition-all"
            />
            <input 
              type="text" 
              required
              placeholder="To: (e.g. College Campus / Metro)" 
              value={toLoc}
              onChange={(e) => setToLoc(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-500 transition-all"
            />
            <button 
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-2xl text-xs transition-colors shadow-sm shadow-emerald-600/20 active:scale-98 cursor-pointer"
            >
              Broadcast Trip
            </button>
          </form>
        </section>

        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Bell size={13} className="text-sky-600" /> Live Ride Feed
            </span>
            <span className="text-[11px] text-slate-400 font-medium">{rides.length} available</span>
          </div>

          {rides.length === 0 ? (
            <div className="text-center py-12 bg-white border border-slate-200 rounded-3xl p-4">
              <p className="text-xs text-slate-400 font-medium">No ride requests active currently.</p>
            </div>
          ) : (
            rides.map((ride) => (
              <div 
                key={ride._id} 
                className={`p-4 rounded-2xl flex items-center justify-between transition-all border ${
                  ride.status === 'accepted' 
                    ? 'bg-slate-100/70 border-slate-200 opacity-60' 
                    : 'bg-white border-slate-200/90 shadow-sm'
                }`}
              >
                <div className="space-y-1 overflow-hidden pr-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 truncate">
                    <span>{ride.fromLocation}</span>
                    <ArrowRight size={13} className="text-emerald-600 shrink-0" />
                    <span>{ride.toLocation}</span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${ride.creatorRole === 'biker' ? 'bg-emerald-50 text-emerald-700' : 'bg-sky-50 text-sky-700'}`}>
                      {ride.creatorRole === 'biker' ? 'Biker' : 'Rider'}
                    </span>
                    <span>•</span>
                    <span>{ride.creatorName}</span>
                  </div>
                </div>

                {ride.status === 'accepted' ? (
                  <span className="text-[11px] text-emerald-700 font-medium px-2.5 py-1 bg-emerald-50 rounded-xl border border-emerald-200">
                    Connected
                  </span>
                ) : (
                  <button 
                    onClick={() => handleAcceptRide(ride)}
                    title="Connect with this user"
                    className="w-10 h-10 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition-transform active:scale-90 shadow-sm shadow-emerald-600/30 cursor-pointer shrink-0"
                  >
                    <Check size={20} strokeWidth={2.5} />
                  </button>
                )}
              </div>
            ))
          )}
        </section>
      </div>

      {matchedRide && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-150 text-slate-800">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <Check size={24} strokeWidth={3} />
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900">Ride Connected!</h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                {matchedRide.fromLocation} ➔ {matchedRide.toLocation}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2">
              <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Contact Details (Connect Purpose Only)</p>
              
              <div className="flex justify-between items-center text-sm font-bold text-slate-900">
                <span>{matchedRide.creatorId === currentUser._id ? matchedRide.acceptedBy?.name : matchedRide.creatorName}</span>
                <span className="text-xs text-slate-500 font-normal capitalize">
                  {matchedRide.creatorId === currentUser._id ? matchedRide.acceptedBy?.role : matchedRide.creatorRole}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-700 font-mono font-medium pt-1">
                <Phone size={14} className="text-emerald-600" />
                <span>{matchedRide.creatorId === currentUser._id ? matchedRide.acceptedBy?.phone : matchedRide.creatorPhone}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href={`tel:${matchedRide.creatorId === currentUser._id ? matchedRide.acceptedBy?.phone : matchedRide.creatorPhone}`}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Phone size={14} /> Call Now
              </a>

              <a
                href={`https://wa.me/91${matchedRide.creatorId === currentUser._id ? matchedRide.acceptedBy?.phone : matchedRide.creatorPhone}`}
                target="_blank"
                rel="noreferrer"
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm"
              >
                <MessageCircle size={14} /> WhatsApp
              </a>
            </div>

            <button 
              onClick={() => setMatchedRide(null)} 
              className="text-xs text-slate-400 hover:text-slate-700 pt-1 cursor-pointer block mx-auto"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}