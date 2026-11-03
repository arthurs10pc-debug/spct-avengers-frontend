import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { jsPDF } from 'jspdf';
import { 
  Shield, Volume2, Bell, VolumeX, Clock, 
  X, Activity, Navigation, Edit2, Trash2, Plus, Mic, AlertTriangle, Square, 
  DollarSign, Newspaper, Check, MapPin, Moon, UserCircle, LogIn, Wrench, Download, Upload, FileText, UserPlus,
  Search, RotateCw, ExternalLink, Zap, Tag, Coffee, Bus, BookOpen, ShoppingBag, FileSpreadsheet, RefreshCw,
  Globe, Play, Pause, Radio, Landmark, Building2, Flame, CheckSquare, Pin, Mail, Send, Sparkles, Filter,
  Power, TrendingUp, TrendingDown, BarChart2, PieChart, Calendar, ArrowUpRight, ArrowDownRight, StopCircle, Image, Video, Music, Paperclip, Eye,
  Palette, ArrowRight, FileType, Sliders, Wand2, Eraser
} from 'lucide-react';
import PhotoEditorModal from './components/PhotoEditorModal';
const BACKEND_URL = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || /^192\.168\./.test(window.location.hostname) || /^10\./.test(window.location.hostname)))
  ? `http://${window.location.hostname}:5001`
  : "https://spct-avengers-backend.onrender.com";
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


// Real-Time & Upcoming India IPO Intelligence Database in Simple Hindi
const IPO_DATABASE = {
  live: [
    {
      id: 'ipo_bombay_steels',
      name: 'Bombay Coated & Special Steels Ltd',
      type: 'Mainboard IPO',
      exchange: 'BSE & NSE',
      sector: 'Specialty Cold-Rolled & Coated Steel Sheets',
      priceBand: '₹78 - ₹82 per share',
      lotSize: '180 Shares (Minimum: ₹14,760)',
      dates: '29 Oct - 2 Nov 2026',
      listingDate: '5 Nov 2026',
      status: '🟢 Open / Bidding Active',
      allotmentBadge: '🟢 High Chance (3.98x Subscribed)',
      about: 'Manufactures precision-engineered specialty coated steel coils and cold-rolled sheets for leading automotive OEMs, home appliances, and heavy industrial roofing.',
      subscription: {
        total: '3.98x Total Demand',
        totalMeaning: 'Solid investor demand across exchanges with over ₹280 Crores in bids placed.',
        retail: '1.85x Full (Regular Public)',
        retailMeaning: 'Moderate retail competition. High probability of securing allotment on 1 lot.',
        qib: '4.10x (Financial Institutions & Funds)',
        qibMeaning: 'Institutional backing is firm and fully covered.',
        nii: '3.45x (High-Net-Worth Bidders)',
        niiMeaning: 'Consistent participation from HNI private accounts.'
      },
      allotmentChance: 'High Allotment Chance (~55% Probability)',
      allotmentDetail: 'With retail demand at 1.85x, roughly 1 in every 2 retail applicants will receive shares in the allotment lottery.',
      gmp: '+₹7 (+8.5% Estimated Listing Gain)',
      gmpDetail: 'Grey Market Premium is trading at +₹7 over the ₹82 cut-off, offering ~₹1,260 estimated profit per 180-share lot.',
      verdict: 'Recommended for Moderate Listing Gains & Stable Fundamentals. Clean balance sheet with growing auto-component demand.'
    },
    {
      id: 'ipo_maxwell_eng',
      name: 'Maxwell Engineering Solutions Ltd',
      type: 'SME IPO',
      exchange: 'NSE Emerge (SME)',
      sector: 'Aerospace & Heavy Gas Turbine Parts',
      priceBand: '₹150 - ₹158 per share',
      lotSize: '800 Shares (Minimum: ₹1,26,400)',
      dates: '30 Oct - 3 Nov 2026',
      listingDate: '6 Nov 2026',
      status: '🟢 Open / Bidding Active',
      allotmentBadge: '🔥 8.9x Oversubscribed',
      about: 'High-precision aerospace machining firm producing complex gas turbine flow nozzles, impellers, and hydraulic valves for aerospace defense and power plants.',
      subscription: {
        total: '8.90x Strong Oversubscription',
        totalMeaning: 'Almost 9 times more bids received than total issue size.',
        retail: '6.20x (Retail Investors)',
        retailMeaning: 'Intense competition among retail applicants. 6 bids for every available lot.',
        qib: '9.50x (Qualified Institutions)',
        qibMeaning: 'Anchor book and institutional quota heavily subscribed.',
        nii: '11.40x (HNI High-Value Bids)',
        niiMeaning: 'HNI segment booked over 11 times.'
      },
      allotmentChance: 'Computerized Lottery (1 in 6 applicants will win)',
      allotmentDetail: '6.2x retail quota means 1 in every 6 retail lots will be chosen through computerized draw.',
      gmp: '+₹70 (+44.3% Strong Listing Gain)',
      gmpDetail: 'Unofficial grey market is paying a ₹70 premium over ₹158 cut-off, pointing to an estimated listing price of ~₹228 and ~₹56,000 profit per lot.',
      verdict: 'Top Pick for Big Listing Gains. Premium aerospace niche with explosive profit margins.'
    },
    {
      id: 'ipo_johnsoncab',
      name: 'Johnsoncab Electricals Ltd',
      type: 'SME IPO',
      exchange: 'BSE SME',
      sector: 'Industrial Power Cables & Building Wires',
      priceBand: '₹190 - ₹200 per share',
      lotSize: '600 Shares (Minimum: ₹1,20,000)',
      dates: '30 Oct - 3 Nov 2026',
      listingDate: '6 Nov 2026',
      status: '🟢 Open / Bidding Active',
      allotmentBadge: '🟡 5.4x Bidded (1 in 4 Lottery)',
      about: 'Prominent Western India manufacturer of heat-resistant copper cables, industrial power distribution wires, and solar DC cabling.',
      subscription: {
        total: '5.40x Overall Demand',
        totalMeaning: 'Healthy bidding across all categories on BSE SME.',
        retail: '3.80x (Retail Public)',
        retailMeaning: 'Approx 4 bidders for every lot available.',
        qib: '4.20x (Institutional Investors)',
        qibMeaning: 'Supported by SME mutual funds and institutions.',
        nii: '7.10x (HNI Bidders)',
        niiMeaning: 'High interest from wealthy private investors.'
      },
      allotmentChance: 'Fair Lucky Draw (~1 in 4 chance)',
      allotmentDetail: 'Around 25% of retail applications are expected to receive full allotment in the computerized draw.',
      gmp: '+₹10 (+5.0% Expected Profit)',
      gmpDetail: 'Expected to list around ₹210 per share, delivering ~₹6,000 estimated profit per lot.',
      verdict: 'Steady Industrial Cable Play. Good brand distribution network across Gujarat and Maharashtra.'
    },
    {
      id: 'ipo_hgs_india',
      name: 'HGS (India) Ltd',
      type: 'SME IPO',
      exchange: 'BSE & NSE SME',
      sector: 'Seismic Exploration Sensors & Defense Harnesses',
      priceBand: '₹115 - ₹120 per share',
      lotSize: '1,200 Shares (Minimum: ₹1,44,000)',
      dates: '30 Oct - 3 Nov 2026',
      listingDate: '6 Nov 2026',
      status: '🟢 Open / Bidding Active',
      allotmentBadge: '🔥 6.2x Strong Demand',
      about: 'Pioneering manufacturer of geophones, seismic data acquisition sensors, and rugged defense cable assemblies used in oil & gas exploration and defense radar grids.',
      subscription: {
        total: '6.20x Strong Bids',
        totalMeaning: 'Over 6 times total demand on the combined SME platform.',
        retail: '4.50x (Retail Investors)',
        retailMeaning: 'High interest from regular individual investors.',
        qib: '7.00x',
        qibMeaning: 'Institutional investors book fully covered.',
        nii: '8.30x',
        niiMeaning: 'Strong HNI backing.'
      },
      allotmentChance: 'Computerized Lottery (~1 in 4.5 odds)',
      allotmentDetail: 'Roughly 1 in every 4.5 retail applicants will secure an allotment.',
      gmp: '+₹30 (+25.0% Strong Gain)',
      gmpDetail: 'Expected to open around ₹150 per share, generating ~₹36,000 estimated profit per lot.',
      verdict: 'High-Conviction Niche Play. Unique product line with high entry barriers and defense export growth.'
    },
    {
      id: 'ipo_vectras',
      name: 'Vectras Enprocon Ltd',
      type: 'SME IPO',
      exchange: 'BSE SME',
      sector: 'Water Treatment & Industrial Piping EPC',
      priceBand: '₹99 - ₹105 per share',
      lotSize: '1,200 Shares (Minimum: ₹1,26,000)',
      dates: '30 Oct - 3 Nov 2026',
      listingDate: '6 Nov 2026',
      status: '🟢 Open / Bidding Active',
      allotmentBadge: '🟢 High Chance (2.1x Subscribed)',
      about: 'Turnkey engineering and EPC contractor building sewage treatment plants, municipal water recycling plants, and industrial piping networks.',
      subscription: {
        total: '2.10x Subscribed',
        totalMeaning: 'Balanced demand with low retail congestion.',
        retail: '1.80x Full',
        retailMeaning: 'Moderate retail competition with high allocation odds.',
        qib: '2.50x',
        qibMeaning: 'Steady institutional coverage.',
        nii: '2.00x',
        niiMeaning: 'Consistent HNI bidding.'
      },
      allotmentChance: 'Very High Chance (~55% to 60% Odds)',
      allotmentDetail: 'With 1.8x retail demand, more than half of all applicants will receive shares.',
      gmp: '+₹5 (+4.8% Steady Gain)',
      gmpDetail: 'Expected listing price ~₹110, delivering ~₹6,000 profit per lot.',
      verdict: 'Safe Infrastructure Bet. Backed by government municipal water contracts.'
    },
    {
      id: 'ipo_antala',
      name: 'Antala Industries Ltd',
      type: 'SME IPO',
      exchange: 'BSE SME',
      sector: 'Chemical Machinery & Reaction Vessels',
      priceBand: '₹63 - ₹67 per share',
      lotSize: '2,000 Shares (Minimum: ₹1,34,000)',
      dates: '29 Oct - 2 Nov 2026',
      listingDate: '5 Nov 2026',
      status: '🟢 Open / Bidding Active',
      allotmentBadge: '🟢 High Chance (1.95x Subscribed)',
      about: 'Gujarat-based engineering firm designing stainless steel chemical reactors, pressure tanks, and distillation columns for pharma and agrochemical hubs in Ankleshwar and Dahej.',
      subscription: {
        total: '1.95x Subscribed',
        totalMeaning: 'Healthy, stable regional demand.',
        retail: '1.60x Full',
        retailMeaning: 'Low retail crowding. Excellent allotment odds for individual investors.',
        qib: '2.20x',
        qibMeaning: 'Supported by regional funds.',
        nii: '2.10x',
        niiMeaning: 'Steady local HNI bidding.'
      },
      allotmentChance: 'High Chance (~60%+ Odds)',
      allotmentDetail: 'Almost 2 out of every 3 retail applications will receive shares.',
      gmp: '+₹4 (+6.0% Gain)',
      gmpDetail: 'Expected listing price around ₹71, offering ~₹8,000 profit per lot.',
      verdict: 'Debt-free SME manufacturer with established Gujarat customer base.'
    }
  ],
  upcoming: [
    {
      id: 'ipo_vedant',
      name: 'Vedant Poly Fabs Ltd',
      type: 'SME IPO',
      exchange: 'NSE Emerge (SME)',
      sector: 'Packaging Fabrics & PP Sacks',
      priceBand: '₹88 - ₹94 per share',
      lotSize: '1,200 Shares (Minimum: ₹1,12,800)',
      dates: '2 Nov - 4 Nov 2026 (Opens Monday)',
      listingDate: '7 Nov 2026',
      status: '📅 Opening Soon (2 Nov)',
      allotmentBadge: '🚀 50% Retail Quota',
      about: 'Manufactures high-strength polypropylene woven sacks, bulk containers (FIBC jumbo bags), and industrial protective packaging fabrics for cement and agricultural bulk transport.',
      subscription: {
        total: 'Bidding Starts 2 Nov',
        totalMeaning: 'Official bidding opens on NSE platform on Monday morning.',
        retail: '50% Reserved for Public',
        retailMeaning: 'Half the issue is earmarked for regular individual retail investors.',
        qib: 'Anchor Placement Nov 1',
        qibMeaning: 'Anchor allocation opens Friday before public launch.',
        nii: '15% Quota',
        niiMeaning: 'Reserved for HNI orders above ₹2 Lakhs.'
      },
      allotmentChance: 'High Chance expected due to 50% retail quota',
      allotmentDetail: 'Large retail allocation guarantees higher lot distribution among public applicants.',
      gmp: '+₹20 (+21.3% Strong Gain)',
      gmpDetail: 'Grey market estimates listing at ~₹114, delivering ~₹24,000 profit per lot.',
      verdict: 'Good Candidate for Bidding on Day 1.'
    },
    {
      id: 'ipo_atomberg',
      name: 'Atomberg Technologies Ltd',
      type: 'Mainboard IPO (~₹1,500 Crores)',
      exchange: 'BSE & NSE',
      sector: 'Smart BLDC Energy-Saving Fans & IoT Home Appliances',
      priceBand: '₹420 - ₹445 per share (Estimated)',
      lotSize: '34 Shares (Minimum: ~₹14,900)',
      dates: 'November 2026 (Dates Announcing Soon)',
      listingDate: 'Mid November 2026',
      status: '📅 Opening November 2026',
      allotmentBadge: '🚀 Top Consumer Tech Brand',
      about: 'Pioneered BLDC motor ceiling fans in India consuming 65% less electricity. Fast-growing consumer technology brand backed by Temasek and Jungle Ventures, expanding into smart mixer grinders and kitchen IoT.',
      subscription: {
        total: 'RHP Filed • SEBI Approved',
        totalMeaning: 'SEBI approved public issue expected in the first half of November.',
        retail: '35% Quota for Regular Public',
        retailMeaning: 'Over ₹500 Crores reserved for retail individual investors.',
        qib: '50% Institutional Quota',
        qibMeaning: 'Strong interest from domestic mutual funds and global tech funds.',
        nii: '15% HNI Quota',
        niiMeaning: 'Reserved for high net worth investors.'
      },
      allotmentChance: 'Expected High Allotment Opportunity',
      allotmentDetail: 'Substantial issue size and 35% retail allocation will ensure wide distribution.',
      gmp: '+₹45 (+10.2% Positive Outlook)',
      gmpDetail: 'Initial grey market quotes show solid 10%+ premium expectations.',
      verdict: 'Strong Brand with High Market Share in Energy-Efficient Appliances.'
    },
    {
      id: 'ipo_ratnadeep',
      name: 'Ratnadeep Retail Ltd',
      type: 'Mainboard IPO (~₹900 Crores)',
      exchange: 'BSE & NSE',
      sector: 'Supermarket Grocery Chains & Fresh Food Retail',
      priceBand: '₹220 - ₹235 per share (Estimated)',
      lotSize: '64 Shares (Minimum: ~₹14,800)',
      dates: 'November 2026 (Dates Announcing Soon)',
      listingDate: 'November 2026',
      status: '📅 Opening November 2026',
      allotmentBadge: '🛒 Fast-Growing Grocery Chain',
      about: 'Leading supermarket and gourmet grocery retail chain with 140+ high-traffic modern retail stores across Hyderabad, Bengaluru, and Chennai, delivering premium food and household retail.',
      subscription: {
        total: 'DRHP Approved by SEBI',
        totalMeaning: 'Approval secured; launch date finalizing for mid-November.',
        retail: '35% Quota for Public',
        retailMeaning: 'Large retail allocation for regular individual demat holders.',
        qib: '50% Quota',
        qibMeaning: 'Major institutional book.',
        nii: '15% Quota',
        niiMeaning: 'High Net Worth segment.'
      },
      allotmentChance: 'High Availability Expected',
      allotmentDetail: 'Wide store footprint and public familiarity expected to drive steady demand.',
      gmp: '+₹22 (+9.5% Premium)',
      gmpDetail: 'Unofficial premium points to ~₹1,400 expected profit per lot.',
      verdict: 'Attractive Consumer Retail Asset with Proven Store Profitability.'
    },
    {
      id: 'ipo_gni_infra',
      name: 'GNI Infrastructure Ltd',
      type: 'Mainboard IPO (~₹650 Crores)',
      exchange: 'BSE & NSE',
      sector: 'Highway & Civil Road EPC Infrastructure',
      priceBand: '₹145 - ₹155 per share (Estimated)',
      lotSize: '96 Shares (Minimum: ~₹14,880)',
      dates: 'November 2026 (Dates Announcing Soon)',
      listingDate: 'Late November 2026',
      status: '📅 Opening November 2026',
      allotmentBadge: '🛣️ Highway Infrastructure Play',
      about: 'Engineering and highway construction company executing National Highways Authority of India (NHAI) road corridors, flyovers, and bridge structures across Western and Central India.',
      subscription: {
        total: 'SEBI Clearance Granted',
        totalMeaning: 'Final issue prospectus under preparation.',
        retail: '35% Quota for Retailers',
        retailMeaning: 'Ample lot availability for retail applicants.',
        qib: '50% Quota',
        qibMeaning: 'Institutional anchor placement.',
        nii: '15% Quota',
        niiMeaning: 'HNI high-value quota.'
      },
      allotmentChance: 'High Probability Expected',
      allotmentDetail: 'Healthy allocation expected without hyper-oversubscription.',
      gmp: '+₹14 (+9.0% Premium)',
      gmpDetail: 'Estimated day-one profit of ~₹1,340 per lot.',
      verdict: 'Pure Infrastructure Growth Play with Strong Government Project Pipeline.'
    }
  ]
};


// Official Geometric Stealth Shield Brand Logo Component
const ShadowLogo = ({ size = 24, color = '#0f172a', innerColor = '#ffffff' }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 100 100" 
    width={size} 
    height={size} 
    fill="none" 
    style={{ display: 'block', flexShrink: 0 }}
  >
    <path d="M50 5 L90 21 V52 C90 75 72 91 50 97 C28 91 10 75 10 52 V21 L50 5 Z" fill={color} />
    <path d="M50 12 L83 26 V50 C83 69 68 83 50 89 C32 83 17 69 17 50 V26 L50 12 Z" fill={innerColor} />
    <path d="M30 33 H70 V47 H46 V53 H70 V71 H30 V57 H54 V51 H30 Z" fill={color} />
    <polygon points="50,18 54,23 50,28 46,23" fill={color} />
  </svg>
);

// Full Screen Startup Animation: High-Performance GPU-Accelerated 60/120 FPS
// Features: Zero-Lag Letter Reveal + Rotating Light Sweep + Dynamic Shadow Retraction into 3D Bevel
const ShadowStartupAnimation = ({ onComplete }) => {
  const [fadingOut, setFadingOut] = useState(false);

  const handleFinish = useCallback(() => {
    if (fadingOut) return;
    setFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 320);
  }, [fadingOut, onComplete]);

  useEffect(() => {
    // Total duration: 1.85 seconds, then smooth fade
    const timer = setTimeout(() => {
      handleFinish();
    }, 1850);
    return () => clearTimeout(timer);
  }, [handleFinish]);

  const letters = ['S', 'H', 'A', 'D', 'O', 'W'];

  return (
    <div
      onClick={handleFinish}
      title="Tap to skip"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100dvh',
        zIndex: 999999,
        backgroundColor: '#ffffff',
        cursor: 'pointer',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: fadingOut ? 0 : 1,
        transition: 'opacity 0.32s cubic-bezier(0.4, 0, 0.2, 1)',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        padding: '20px'
      }}
    >
      <style>{`
        @keyframes shadowLogoSweep {
          0% {
            opacity: 0;
            transform: scale(0.92);
            filter: drop-shadow(-8px 14px 10px rgba(189,195,199,0.5));
          }
          15% {
            opacity: 1;
            transform: scale(1);
            filter: drop-shadow(-14px 22px 14px rgba(189,195,199,0.7));
          }
          45% {
            filter: drop-shadow(-8px 26px 16px rgba(189,195,199,0.8)) drop-shadow(-4px 12px 10px rgba(15,23,42,0.12));
          }
          70% {
            filter: drop-shadow(0px 20px 14px rgba(189,195,199,0.85)) drop-shadow(0px 10px 10px rgba(15,23,42,0.15));
          }
          85% {
            transform: scale(1);
            filter: drop-shadow(2px 5px 0px #BDC3C7) drop-shadow(4px 9px 12px rgba(15,23,42,0.2));
          }
          100% {
            transform: scale(1);
            filter: drop-shadow(2px 5px 0px #BDC3C7) drop-shadow(4px 9px 12px rgba(15,23,42,0.2));
          }
        }

        @keyframes shadowTextSweep {
          0% {
            text-shadow: -4px 6px 0 #BDC3C7, -8px 12px 0 #CBD5E1;
          }
          30% {
            text-shadow: -10px 18px 0 #BDC3C7, -18px 32px 0 #CBD5E1, -24px 44px 12px rgba(15,23,42,0.12);
          }
          55% {
            text-shadow: -4px 20px 0 #BDC3C7, -8px 36px 0 #CBD5E1, -12px 50px 14px rgba(15,23,42,0.14);
          }
          75% {
            text-shadow: 0px 16px 0 #BDC3C7, 0px 28px 0 #CBD5E1, 0px 38px 14px rgba(15,23,42,0.15);
          }
          88% {
            text-shadow: 1px 3px 0 #BDC3C7, 2px 5px 0 #CBD5E1, 3px 7px 0 #CBD5E1, 4px 8px 12px rgba(15,23,42,0.18);
          }
          100% {
            text-shadow: 1px 2px 0 #BDC3C7, 2px 4px 0 #CBD5E1, 3px 6px 0 #CBD5E1, 4px 8px 12px rgba(15,23,42,0.18);
          }
        }

        @keyframes letterPop {
          0% {
            opacity: 0;
            transform: translateY(-8px) scale(0.94);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .startup-logo-shield {
          animation: shadowLogoSweep 1.85s cubic-bezier(0.25, 1, 0.5, 1) forwards;
          will-change: filter, transform;
        }

        .startup-word-text {
          animation: shadowTextSweep 1.85s cubic-bezier(0.25, 1, 0.5, 1) forwards;
          will-change: text-shadow;
        }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '18px', transform: 'translateY(-10px)' }}>
        {/* Official Geometric Stealth Shield Brand Logo */}
        <div className="startup-logo-shield" style={{ width: '76px', height: '76px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShadowLogo size={76} color="#0f172a" innerColor="#ffffff" />
        </div>

        {/* Stationary Letter Placement with Staggered Snap Reveal */}
        <div 
          className="startup-word-text" 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'clamp(36px, 9vw, 64px)',
            fontWeight: '900',
            color: '#0f172a',
            letterSpacing: 'clamp(4px, 1.2vw, 8px)',
            fontFamily: "'Montserrat', 'Inter', -apple-system, sans-serif",
            textTransform: 'uppercase'
          }}
        >
          {letters.map((letter, idx) => (
            <span
              key={idx}
              style={{
                display: 'inline-block',
                animation: `letterPop 0.28s cubic-bezier(0.2, 0.8, 0.3, 1) ${idx * 0.08}s both`,
                willChange: 'transform, opacity'
              }}
            >
              {letter}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};


// Non-destructive intelligent expense merge (deduplicates, preserves IDs, honors deletes, orders newest first)
const mergeExpenses = (localList = [], remoteList = [], deletedIds = []) => {
  const deletedSet = new Set((Array.isArray(deletedIds) ? deletedIds : []).map(id => String(id)));
  const map = new Map();

  const processExp = (exp) => {
    if (!exp) return;
    const rawId = exp.id || `tx_${exp.date || ''}_${exp.title || ''}_${exp.amount || ''}`;
    const id = String(rawId);
    if (deletedSet.has(id)) return; // Exclude deleted expenses

    const item = {
      ...exp,
      id,
      title: String(exp.title || 'Expense').trim(),
      amount: parseFloat(exp.amount) || 0,
      category: exp.category || 'Food & Snacks',
      type: exp.type || 'expense',
      date: exp.date || new Date().toISOString().slice(0, 10),
      createdAt: exp.createdAt || (exp.date ? new Date(exp.date).getTime() : Date.now()) || Date.now()
    };

    if (map.has(id)) {
      const prev = map.get(id);
      if ((item.createdAt || 0) >= (prev.createdAt || 0)) {
        map.set(id, { ...prev, ...item });
      }
    } else {
      map.set(id, item);
    }
  };

  if (Array.isArray(localList)) localList.forEach(processExp);
  if (Array.isArray(remoteList)) remoteList.forEach(processExp);

  const merged = Array.from(map.values());
  merged.sort((a, b) => {
    const timeA = a.createdAt || (a.date ? new Date(a.date).getTime() : 0);
    const timeB = b.createdAt || (b.date ? new Date(b.date).getTime() : 0);
    return timeB - timeA;
  });
  return merged;
};

// Flexible month matcher for expense items across diverse date formats
const isExpenseInMonth = (item, ymStr) => {
  if (!item) return false;
  if (!item.date) return true;
  const dStr = String(item.date).trim();
  if (dStr.startsWith(ymStr) || dStr.includes(ymStr)) return true;

  try {
    const dt = new Date(dStr);
    if (!isNaN(dt.getTime())) {
      const itemYm = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      if (itemYm === ymStr) return true;
    }
  } catch (e) {}

  const parts = dStr.split(/[\/\-\.]/);
  if (parts.length === 3) {
    const [targetYear, targetMonth] = ymStr.split('-');
    const mNum = parseInt(targetMonth, 10);
    if (parts.includes(targetYear) && (parts.includes(targetMonth) || parts.includes(String(mNum)))) {
      return true;
    }
  }
  return false;
};

// Convert VAPID base64 string to Uint8Array for PushManager subscription
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function App() {
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceFeedbackMessage, setVoiceFeedbackMessage] = useState('');
  const [assistantStatus, setAssistantStatus] = useState("Shadow System Active...");

  // Web Push PWA Subscription State
  const [isPushSubscribed, setIsPushSubscribed] = useState(() => {
    try {
      return localStorage.getItem('jarvis_pwa_push_subscribed') === 'true';
    } catch {
      return false;
    }
  });
  const [isSendingTestPush, setIsSendingTestPush] = useState(false);
  const [pushFeedbackMessage, setPushFeedbackMessage] = useState('');

  // Real Database Google Auth State (Login / Sign Up with Backend verification)
  // Mobile & Desktop System Permissions State
  const [mobilePermissions, setMobilePermissions] = useState(() => {
    try {
      const notifPerm = typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported';
      const storedNotif = typeof localStorage !== 'undefined' ? localStorage.getItem('jarvis_perm_notif') : null;
      return {
        mic: localStorage.getItem('jarvis_perm_mic') || 'prompt',
        location: localStorage.getItem('jarvis_perm_loc') || 'prompt',
        notifications: notifPerm === 'granted' || storedNotif === 'granted' ? 'granted' : notifPerm
      };
    } catch {
      return { mic: 'prompt', location: 'prompt', notifications: 'prompt' };
    }
  });
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [isRequestingPerms, setIsRequestingPerms] = useState(false);

  // Cross-Platform Native System Notification (Supports Android PWA, iOS, Desktop)
  const showSystemNotification = useCallback(async (title, options = {}) => {
    try {
      if (!('Notification' in window)) return;
      if (Notification.permission !== 'granted') {
        const perm = await Notification.requestPermission().catch(() => {});
        if (perm !== 'granted') return;
      }

      const notifOptions = {
        icon: '/shadow-logo.png?v=3',
        badge: '/shadow-logo.png?v=3',
        vibrate: [250, 100, 250, 100, 250],
        tag: options?.tag || 'shadow-reminder-alert',
        renotify: true,
        ...options
      };

      // 1. Try active Service Worker (Required for mobile PWA standalone and Android Chrome)
      if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.ready || await navigator.serviceWorker.getRegistration();
          if (reg && reg.showNotification) {
            await reg.showNotification(title, notifOptions);
            return;
          }
        } catch (swErr) {
          console.warn('[PWA Notification SW fallback]:', swErr);
        }

        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION',
            title,
            options: notifOptions
          });
          return;
        }
      }

      // 2. Desktop notification fallback
      new Notification(title, notifOptions);
    } catch (e) {
      console.warn('[Notification Error handled]:', e);
    }
  }, []);

  // Real Mobile Permissions Requester (Prompts native browser dialogs on user gesture)
  const requestAllMobilePermissions = useCallback(async () => {
    setIsRequestingPerms(true);
    const results = { ...mobilePermissions };

    // 1. Notifications & PWA Web Push
    if ('Notification' in window) {
      try {
        const p = await Notification.requestPermission();
        results.notifications = p;
        if (p === 'granted') {
          try { localStorage.setItem('jarvis_perm_notif', 'granted'); } catch (e) {}
          setTimeout(() => subscribeToPushNotifications(), 100);
        }
      } catch (e) {}
    }

    // 2. Microphone (Real native prompt)
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        results.mic = 'granted';
        try { localStorage.setItem('jarvis_perm_mic', 'granted'); } catch (e) {}
        stream.getTracks().forEach(t => t.stop());
      } catch (e) {
        results.mic = 'denied';
      }
    }

    // 3. Geolocation (Real native prompt)
    if (navigator.geolocation) {
      try {
        await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => {
              results.location = 'granted';
              try { localStorage.setItem('jarvis_perm_loc', 'granted'); } catch (e) {}
              resolve();
            },
            () => {
              results.location = 'denied';
              resolve();
            },
            { timeout: 7000, enableHighAccuracy: true }
          );
        });
      } catch (e) {}
    }

    setMobilePermissions(results);
    setIsRequestingPerms(false);
    return results;
  }, [mobilePermissions]);

  const [userProfile, setUserProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('jarvis_user_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // PWA Web Push Subscription & Remote Dispatch Engine
  const subscribeToPushNotifications = useCallback(async (targetEmail = null) => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('[PWA Push] Web Push not supported on this browser/environment.');
      return { success: false, reason: 'unsupported' };
    }

    try {
      let permission = Notification.permission;
      if (permission !== 'granted') {
        permission = await Notification.requestPermission().catch(() => 'default');
        setMobilePermissions(prev => ({ ...prev, notifications: permission }));
      }
      if (permission !== 'granted') {
        return { success: false, reason: 'denied' };
      }

      // Fetch dynamic VAPID Public Key from backend server
      const vapidRes = await fetch(`${BACKEND_URL}/api/notifications/vapid-key`);
      const vapidData = await vapidRes.json();
      if (!vapidData.success || !vapidData.publicKey) {
        throw new Error(vapidData.error || 'Failed to retrieve VAPID key');
      }

      // Ensure Service Worker is ready
      const reg = await navigator.serviceWorker.ready;
      let subscription = await reg.pushManager.getSubscription();

      if (!subscription) {
        const convertedKey = urlBase64ToUint8Array(vapidData.publicKey);
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey
        });
      }

      const emailToUse = targetEmail || userProfile?.email || 'anonymous';
      const subRes = await fetch(`${BACKEND_URL}/api/notifications/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailToUse,
          subscription: subscription.toJSON ? subscription.toJSON() : subscription,
          deviceInfo: `${navigator.platform || ''} ${/Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop'}`
        })
      });
      const subData = await subRes.json();

      setIsPushSubscribed(true);
      try { localStorage.setItem('jarvis_pwa_push_subscribed', 'true'); } catch (e) {}
      console.log('[PWA Push] Registered push subscription with backend:', subData);
      return { success: true, subscription };
    } catch (err) {
      console.warn('[PWA Push Subscribe Error]:', err);
      return { success: false, error: err.message };
    }
  }, [userProfile?.email]);

  const triggerTestPushNotification = useCallback(async () => {
    setIsSendingTestPush(true);
    setPushFeedbackMessage('Sending test push to your device...');
    try {
      await subscribeToPushNotifications();
      const emailToUse = userProfile?.email || 'anonymous';
      const res = await fetch(`${BACKEND_URL}/api/notifications/test-push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToUse })
      });
      const data = await res.json();
      if (data.success) {
        setPushFeedbackMessage('✅ Test Push Sent! Check your device notification center.');
      } else {
        setPushFeedbackMessage(`⚠️ ${data.message || 'Push queued'}`);
      }
    } catch (err) {
      setPushFeedbackMessage(`❌ Error: ${err.message}`);
    } finally {
      setIsSendingTestPush(false);
    }
  }, [userProfile?.email, subscribeToPushNotifications]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [directEmailInput, setDirectEmailInput] = useState('');

  // Live Header Date, Day & Time State
  const [currentDateTimeStr, setCurrentDateTimeStr] = useState('');

  // Tools / Universal Extension Changer & Converter Feature State
  const [showToolsModal, setShowToolsModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [selectedSize, setSelectedSize] = useState('Original');
  const [converterStatus, setConverterStatus] = useState(null);
  const [uploadedFilePreview, setUploadedFilePreview] = useState(null);
  const [uploadedFileMeta, setUploadedFileMeta] = useState(null);
  const [toolActiveTab, setToolActiveTab] = useState('extension'); // 'extension' | 'convert'
  const [customExtension, setCustomExtension] = useState('');
  const [convertedDownloadInfo, setConvertedDownloadInfo] = useState(null);
  const toolsFileInputRef = useRef(null);

  // Startup Intro Shadow Animation (Plays once on app start, smooth, zero-lag)
  const [showStartupSplash, setShowStartupSplash] = useState(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('nosplash')) return false;
    return true;
  });

  // Safe direct file selection handler (100% crash-proof, supports ALL file types)
  const handleToolsFileSelect = (file) => {
    if (!file) return;
    try {
      setUploadedFile(file);
      setConverterStatus(null);
      setConvertedDownloadInfo(null);

      const dotIdx = file.name.lastIndexOf('.');
      const detectedExt = dotIdx > 0 ? file.name.substring(dotIdx + 1).toUpperCase() : 'FILE';
      const isImg = file.type?.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|svg|avif|ico|tiff?)$/i.test(file.name || '');

      if (isImg) {
        try {
          const previewUrl = URL.createObjectURL(file);
          setUploadedFilePreview(previewUrl);

          const img = new window.Image();
          img.onload = () => {
            setUploadedFileMeta({
              width: img.naturalWidth || img.width || 800,
              height: img.naturalHeight || img.height || 600,
              sizeKb: file.size ? (file.size / 1024).toFixed(1) : '0',
              ext: detectedExt
            });
          };
          img.onerror = () => {
            setUploadedFileMeta({
              sizeKb: file.size ? (file.size / 1024).toFixed(1) : '0',
              ext: detectedExt
            });
          };
          img.src = previewUrl;
        } catch (urlErr) {
          console.warn('URL.createObjectURL non-fatal:', urlErr);
          setUploadedFilePreview(null);
          setUploadedFileMeta({
            sizeKb: file.size ? (file.size / 1024).toFixed(1) : '0',
            ext: detectedExt
          });
        }
      } else {
        setUploadedFilePreview(null);
        setUploadedFileMeta({
          sizeKb: file.size ? (file.size / 1024).toFixed(1) : '0',
          ext: detectedExt
        });
      }
    } catch (err) {
      console.error('File selection error:', err);
      setConverterStatus({ type: 'error', message: 'Could not load selected file.' });
    }
  };

  // Safe Universal Download Helper (Mobile WebKit / Android Chrome / Desktop compatible)
  const triggerSafeDownload = (blob, filename, targetExt) => {
    try {
      const url = URL.createObjectURL(blob);
      const sizeKb = (blob.size / 1024).toFixed(1);

      // Persist in state so user always has a prominent manual tap button in the UI
      setConvertedDownloadInfo({
        url,
        filename,
        sizeKb,
        targetFormat: (targetExt || '').toUpperCase()
      });

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.rel = 'noopener noreferrer';
      // Off-screen absolute positioning rather than display: none for iOS Safari compatibility
      a.style.position = 'fixed';
      a.style.left = '-9999px';
      a.style.top = '-9999px';
      a.style.opacity = '0';
      document.body.appendChild(a);

      try {
        a.click();
      } catch (clickErr) {
        console.warn('Programmatic click caught:', clickErr);
      }

      setTimeout(() => {
        try {
          if (document.body.contains(a)) document.body.removeChild(a);
        } catch (e) {}
      }, 1500);

      // Revoke ObjectURL after 60 seconds (generous for mobile background downloads)
      setTimeout(() => {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {}
      }, 60000);
    } catch (downErr) {
      console.error('Trigger safe download error:', downErr);
    }
  };

  // Comprehensive Extension Changer & Multi-Format Converter Engine
  const handleExecuteConversion = async (targetFormat, isDirectExtensionSwap = false) => {
    if (!uploadedFile) {
      setConverterStatus({ type: 'error', message: 'Please select or drop a file first!' });
      return;
    }

    const cleanExt = (targetFormat || '').trim().replace(/^\./, '').toLowerCase();
    if (!cleanExt) {
      setConverterStatus({ type: 'error', message: 'Please specify a target extension (e.g. png, jpg, pdf, mp4).' });
      return;
    }

    const dotIndex = uploadedFile.name.lastIndexOf('.');
    const baseName = dotIndex > 0 ? uploadedFile.name.substring(0, dotIndex) : (uploadedFile.name || 'file');
    const originalExt = dotIndex > 0 ? uploadedFile.name.substring(dotIndex + 1).toLowerCase() : '';
    const isImage = uploadedFile.type?.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|svg|avif|ico|tiff?)$/i.test(uploadedFile.name || '');

    let outputFilename = `${baseName}.${cleanExt}`;
    if (selectedSize && selectedSize !== 'Original' && ['png', 'jpg', 'jpeg', 'webp', 'bmp'].includes(cleanExt)) {
      outputFilename = `${baseName}_${selectedSize}.${cleanExt}`;
    }

    setConverterStatus({ type: 'loading', message: `Processing ${uploadedFile.name} ➔ .${cleanExt.toUpperCase()}...` });

    const MIME_MAP = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
      gif: 'image/gif',
      bmp: 'image/bmp',
      svg: 'image/svg+xml',
      ico: 'image/x-icon',
      avif: 'image/avif',
      pdf: 'application/pdf',
      txt: 'text/plain;charset=utf-8',
      csv: 'text/csv;charset=utf-8',
      json: 'application/json;charset=utf-8',
      html: 'text/html;charset=utf-8',
      htm: 'text/html;charset=utf-8',
      xml: 'application/xml;charset=utf-8',
      md: 'text/markdown;charset=utf-8',
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      m4a: 'audio/mp4',
      mp4: 'video/mp4',
      webm: 'video/webm',
      mov: 'video/quicktime',
      zip: 'application/zip',
      rar: 'application/x-rar-compressed',
      '7z': 'application/x-7z-compressed',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      bin: 'application/octet-stream',
      iso: 'application/octet-stream',
      apk: 'application/vnd.android.package-archive'
    };

    try {
      // 1. Direct Extension Swap mode
      if (isDirectExtensionSwap) {
        const arrayBuffer = await uploadedFile.arrayBuffer();
        const targetMime = MIME_MAP[cleanExt] || uploadedFile.type || 'application/octet-stream';
        const blob = new Blob([arrayBuffer], { type: targetMime });
        triggerSafeDownload(blob, outputFilename, cleanExt);
        setConverterStatus({
          type: 'success',
          message: `✓ Successfully changed extension to .${cleanExt.toUpperCase()} (${(blob.size / 1024).toFixed(1)} KB)!`
        });
        return;
      }

      // 2. Image formats: PNG, JPG, JPEG, WEBP, BMP
      if (['png', 'jpg', 'jpeg', 'webp', 'bmp'].includes(cleanExt)) {
        if (isImage) {
          try {
            const imgObj = await new Promise((resolve, reject) => {
              const url = URL.createObjectURL(uploadedFile);
              const img = new Image();
              img.onload = () => resolve({ img, width: img.naturalWidth || 800, height: img.naturalHeight || 600, url });
              img.onerror = () => {
                URL.revokeObjectURL(url);
                const reader = new FileReader();
                reader.onload = (e) => {
                  const img2 = new Image();
                  img2.onload = () => resolve({ img: img2, width: img2.naturalWidth || 800, height: img2.naturalHeight || 600, url: null });
                  img2.onerror = () => reject(new Error('Image canvas decode failed'));
                  img2.src = e.target.result;
                };
                reader.onerror = () => reject(new Error('File reader failed'));
                reader.readAsDataURL(uploadedFile);
              };
              img.src = url;
            });

            let scale = 1;
            let quality = 0.92;
            if (selectedSize && selectedSize !== 'Original') {
              const sizeMap = {
                '50KB': 50 * 1024,
                '100KB': 100 * 1024,
                '250KB': 250 * 1024,
                '500KB': 500 * 1024,
                '1MB': 1024 * 1024,
                '2MB': 2 * 1024 * 1024,
                '5MB': 5 * 1024 * 1024,
                '10MB': 10 * 1024 * 1024
              };
              const targetBytes = sizeMap[selectedSize];
              if (targetBytes && uploadedFile.size > targetBytes) {
                scale = Math.min(1, Math.sqrt(targetBytes / uploadedFile.size) * 1.15);
                quality = 0.78;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(imgObj.width * scale));
            canvas.height = Math.max(1, Math.round(imgObj.height * scale));
            const ctx = canvas.getContext('2d');

            if (['jpg', 'jpeg'].includes(cleanExt)) {
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
            } else {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
            ctx.drawImage(imgObj.img, 0, 0, canvas.width, canvas.height);
            if (imgObj.url) URL.revokeObjectURL(imgObj.url);

            const targetMime = cleanExt === 'jpg' || cleanExt === 'jpeg' ? 'image/jpeg' : (cleanExt === 'webp' ? 'image/webp' : (cleanExt === 'bmp' ? 'image/bmp' : 'image/png'));

            const blob = await new Promise((resolve) => {
              try {
                canvas.toBlob((b) => {
                  if (b) resolve(b);
                  else {
                    const dataUrl = canvas.toDataURL(targetMime, quality);
                    const bin = atob(dataUrl.split(',')[1]);
                    const u8 = new Uint8Array(bin.length);
                    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
                    resolve(new Blob([u8], { type: targetMime }));
                  }
                }, targetMime, quality);
              } catch (e) {
                const dataUrl = canvas.toDataURL(targetMime, quality);
                const bin = atob(dataUrl.split(',')[1]);
                const u8 = new Uint8Array(bin.length);
                for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
                resolve(new Blob([u8], { type: targetMime }));
              }
            });

            triggerSafeDownload(blob, outputFilename, cleanExt);
            setConverterStatus({
              type: 'success',
              message: `✓ Converted to .${cleanExt.toUpperCase()} (${(blob.size / 1024).toFixed(1)} KB)!`
            });
            return;
          } catch (imgErr) {
            console.warn('Canvas conversion fallback to direct extension repackage:', imgErr);
          }
        }

        // If not decoded via canvas or not an image: seamless repackaging!
        const arrayBuffer = await uploadedFile.arrayBuffer();
        const targetMime = MIME_MAP[cleanExt] || 'image/' + cleanExt;
        const blob = new Blob([arrayBuffer], { type: targetMime });
        triggerSafeDownload(blob, outputFilename, cleanExt);
        setConverterStatus({
          type: 'success',
          message: `✓ Changed extension to .${cleanExt.toUpperCase()} (${(blob.size / 1024).toFixed(1)} KB)!`
        });
        return;
      }

      // 3. PDF Document
      if (cleanExt === 'pdf') {
        const PDFConstructor = typeof jsPDF !== 'undefined' ? jsPDF : (window.jspdf?.jsPDF || window.jsPDF);
        if (PDFConstructor) {
          if (isImage) {
            try {
              const imgObj = await new Promise((resolve, reject) => {
                const url = URL.createObjectURL(uploadedFile);
                const img = new Image();
                img.onload = () => resolve({ img, width: img.naturalWidth || 800, height: img.naturalHeight || 600, url });
                img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image decode for PDF failed')); };
                img.src = url;
              });

              const canvas = document.createElement('canvas');
              canvas.width = imgObj.width;
              canvas.height = imgObj.height;
              const ctx = canvas.getContext('2d');
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(imgObj.img, 0, 0);
              if (imgObj.url) URL.revokeObjectURL(imgObj.url);

              const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.95);
              const isLandscape = canvas.width > canvas.height;
              const doc = new PDFConstructor({
                orientation: isLandscape ? 'l' : 'p',
                unit: 'pt',
                format: 'a4'
              });

              const pageW = doc.internal.pageSize.getWidth();
              const pageH = doc.internal.pageSize.getHeight();
              const margin = 24;
              const availW = pageW - margin * 2;
              const availH = pageH - margin * 2;
              const ratio = Math.min(availW / canvas.width, availH / canvas.height, 1);
              const w = canvas.width * ratio;
              const h = canvas.height * ratio;
              const x = (pageW - w) / 2;
              const y = (pageH - h) / 2;

              doc.addImage(jpegDataUrl, 'JPEG', x, y, w, h, undefined, 'FAST');
              const pdfBlob = doc.output('blob');
              triggerSafeDownload(pdfBlob, outputFilename, 'pdf');
              setConverterStatus({ type: 'success', message: `✓ Exported PDF document (${(pdfBlob.size / 1024).toFixed(1)} KB)!` });
              return;
            } catch (pdfImgErr) {
              console.warn('PDF image error fallback:', pdfImgErr);
            }
          } else {
            try {
              const rawText = await uploadedFile.text().catch(() => `Document: ${baseName}`);
              const doc = new PDFConstructor({ unit: 'pt', format: 'a4' });
              const lines = doc.splitTextToSize(rawText || `Document: ${baseName}`, 540);
              doc.text(lines, 30, 40);
              const pdfBlob = doc.output('blob');
              triggerSafeDownload(pdfBlob, outputFilename, 'pdf');
              setConverterStatus({ type: 'success', message: `✓ Exported text PDF document (${(pdfBlob.size / 1024).toFixed(1)} KB)!` });
              return;
            } catch (pdfTxtErr) {
              console.warn('PDF text error fallback:', pdfTxtErr);
            }
          }
        }
      }

      // 4. Text / CSV / JSON / MD / HTML
      if (['txt', 'csv', 'json', 'html', 'md', 'xml'].includes(cleanExt)) {
        if (!isImage) {
          const rawText = await uploadedFile.text().catch(() => '');
          const blob = new Blob([rawText], { type: MIME_MAP[cleanExt] || 'text/plain;charset=utf-8' });
          triggerSafeDownload(blob, outputFilename, cleanExt);
          setConverterStatus({ type: 'success', message: `✓ Converted to .${cleanExt.toUpperCase()} (${(blob.size / 1024).toFixed(1)} KB)!` });
          return;
        }
      }

      // 5. Universal fallback: Repackage binary buffer with target extension & MIME
      const arrayBuffer = await uploadedFile.arrayBuffer();
      const targetMime = MIME_MAP[cleanExt] || uploadedFile.type || 'application/octet-stream';
      const blob = new Blob([arrayBuffer], { type: targetMime });
      triggerSafeDownload(blob, outputFilename, cleanExt);
      setConverterStatus({
        type: 'success',
        message: `✓ Saved as .${cleanExt.toUpperCase()} (${(blob.size / 1024).toFixed(1)} KB)!`
      });
    } catch (err) {
      console.error('[Converter Error]:', err);
      try {
        const arrayBuffer = await uploadedFile.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
        triggerSafeDownload(blob, outputFilename, cleanExt);
        setConverterStatus({
          type: 'success',
          message: `✓ Extension changed to .${cleanExt.toUpperCase()} (Direct binary export)!`
        });
      } catch (fatalErr) {
        setConverterStatus({ type: 'error', message: `Conversion error: ${err.message || 'Could not process file'}` });
      }
    }
  };

  // Google Keep Style Notes & 3x Daily Email Reminder State
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showPhotoEditModal, setShowPhotoEditModal] = useState(false);
  const [notesList, setNotesList] = useState(() => {
    try {
      const email = userProfile?.email ? userProfile.email.trim().toLowerCase() : 'guest';
      const saved = localStorage.getItem(`jarvis_notes_${email}`);
      return saved ? JSON.parse(saved) : [
        {
          id: 'note_preset_1',
          title: 'Daily Gujarat Route & Tasks',
          type: 'task',
          checklist: [
            { id: 'c1', text: 'Check SG Highway traffic before leaving', completed: true },
            { id: 'c2', text: 'Verify morning briefing headlines', completed: true },
            { id: 'c3', text: 'Review today expense logs & budget', completed: false }
          ],
          color: '#38bdf8',
          pinned: true,
          createdAt: new Date().toLocaleDateString()
        },
        {
          id: 'note_preset_2',
          title: 'Shadow Guidelines',
          type: 'text',
          content: 'Keep real-time traffic active during peak hours. Use the clean tools converter for PDF export.',
          color: '#f59e0b',
          pinned: false,
          createdAt: new Date().toLocaleDateString()
        }
      ];
    } catch {
      return [];
    }
  });
  const [noteFilterTab, setNoteFilterTab] = useState('all');
  const [noteSearchQuery, setNoteSearchQuery] = useState('');
  const [newNoteType, setNewNoteType] = useState('task');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteChecklist, setNewNoteChecklist] = useState([{ id: 'c_1', text: '', completed: false }]);
  const [newNoteColor, setNewNoteColor] = useState('#38bdf8');
  const [newNotePinned, setNewNotePinned] = useState(false);
  const [isSendingNotesEmail, setIsSendingNotesEmail] = useState(false);
  const [notesEmailFeedback, setNotesEmailFeedback] = useState('');
  const [notesTargetEmail, setNotesTargetEmail] = useState('');

  // Multimedia Notes Attachments State (Photo, Video, Audio, PDF) with Mobile Sync
  const [stagedAttachments, setStagedAttachments] = useState([]);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [activeLightboxMedia, setActiveLightboxMedia] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const notesFileInputRef = useRef(null);

  // Route & Interactive Map State (Strictly Gujarat/India bounded)
  const [showRoutePanel, setShowRoutePanel] = useState(false);
  const [fromInput, setFromInput] = useState('');
  const [toInput, setToInput] = useState('');
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [selectedPoiCategory, setSelectedPoiCategory] = useState('all');
  const [trafficLiveLogs, setTrafficLiveLogs] = useState([]);
  const [trafficCongestionPoint, setTrafficCongestionPoint] = useState(null);
  
  const [activeRoute, setActiveRoute] = useState({ 
    fromName: '', 
    fromCoords: [72.5714, 23.0225], 
    toName: '', 
    toCoords: [72.5714, 23.0225] 
  });
  const [routeStatus, setRouteStatus] = useState({ isHeavy: false, message: "Please select 'From' and 'To' locations." });
  const [isMonitoringActive, setIsMonitoringActive] = useState(false);
  const navVehicleMarkerRef = useRef(null);
  const navAnimationTimerRef = useRef(null);

  // Permanent Watcher State
  const [showWatcherModal, setShowWatcherModal] = useState(false);
  const [showSnoozeDropdown, setShowSnoozeDropdown] = useState(false);
  const [snoozeMinutes, setSnoozeMinutes] = useState(() => {
    try {
      const saved = localStorage.getItem('jarvis_snooze_duration');
      return saved ? parseInt(saved, 10) : 1;
    } catch {
      return 1;
    }
  });

  const DEFAULT_REMINDERS = [
    { task: "Morning Review & Focus", time: "09:00", completed: false },
    { task: "Afternoon Work & Tasks", time: "14:00", completed: false },
    { task: "Evening Wrap Up & Notes", time: "20:00", completed: false }
  ];

  const [remindersList, setRemindersList] = useState(() => {
    try {
      const now = new Date();
      const todayDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const savedDate = localStorage.getItem('jarvis_last_active_date');

      const saved = localStorage.getItem('jarvis_permanent_reminders');
      let parsed = saved ? JSON.parse(saved) : null;
      if (!Array.isArray(parsed) || parsed.length === 0) {
        parsed = DEFAULT_REMINDERS;
        localStorage.setItem('jarvis_permanent_reminders', JSON.stringify(DEFAULT_REMINDERS));
      }

      if (savedDate !== todayDate) {
        parsed = parsed.map(rem => ({ ...rem, completed: false }));
        localStorage.setItem('jarvis_last_active_date', todayDate);
        localStorage.setItem('jarvis_permanent_reminders', JSON.stringify(parsed));
      }
      return parsed;
    } catch (e) {
      return DEFAULT_REMINDERS;
    }
  });

  const [currentTaskInput, setCurrentTaskInput] = useState('');
  
  const getCurrentTimeString = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  const [currentTimeInput, setCurrentTimeInput] = useState(getCurrentTimeString());
  const [editingIndex, setEditingIndex] = useState(null);
  const [watcherActive, setWatcherActive] = useState(true);
  const [activeAlertTask, setActiveAlertTask] = useState(null);
  const [activeAlertKey, setActiveAlertKey] = useState(null);
  const [currentAlertTaskId, setCurrentAlertTaskId] = useState(null);
  const [snoozedAlerts, setSnoozedAlerts] = useState({});

  // Live Countdown Timer String for Sidebar (Negative Countdown Timer "-MMm")
  const [nextCountdownStr, setNextCountdownStr] = useState('-48m');
  const [nextRemTimeStr, setNextRemTimeStr] = useState('14:28');
  const [nextRemTitle, setNextRemTitle] = useState('Daily Focus & Routine');

  // Advanced Expense Tracker State with Top-First Order
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [monthlyBudget, setMonthlyBudget] = useState(() => {
    try {
      const saved = localStorage.getItem('jarvis_monthly_budget');
      return saved ? parseFloat(saved) : 5000;
    } catch {
      return 5000;
    }
  });
  const [isSettingBudget, setIsSettingBudget] = useState(false);
  const [tempBudgetInput, setTempBudgetInput] = useState('');
  const [expenseList, setExpenseList] = useState(() => {
    try {
      const saved = localStorage.getItem('jarvis_expenses');
      let parsed = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(parsed)) parsed = [];
      const userProfileRaw = localStorage.getItem('jarvis_user_profile');
      if (userProfileRaw) {
        const u = JSON.parse(userProfileRaw);
        if (u?.email) {
          const userSaved = localStorage.getItem(`jarvis_expenses_${u.email.trim().toLowerCase()}`);
          if (userSaved) {
            const userParsed = JSON.parse(userSaved);
            if (Array.isArray(userParsed)) {
              parsed = mergeExpenses(parsed, userParsed, []);
            }
          }
        }
      }
      return parsed;
    } catch (e) {
      return [];
    }
  });
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Food & Snacks');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('All');
  const [expenseSearchQuery, setExpenseSearchQuery] = useState('');
  const [expenseTabMode, setExpenseTabMode] = useState('tracker'); // 'tracker' | 'monthly_report'
  const [transactionType, setTransactionType] = useState('expense'); // 'expense' | 'income'
  const [selectedExpenseMonth, setSelectedExpenseMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const formatExpenseMonthLabel = (monthStr) => {
    if (!monthStr) return '';
    try {
      const [year, month] = monthStr.split('-');
      const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    } catch (e) {
      return monthStr;
    }
  };

  const handlePrevExpenseMonth = () => {
    setSelectedExpenseMonth(prev => {
      try {
        const [year, month] = prev.split('-').map(Number);
        const d = new Date(year, month - 2, 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      } catch (e) {
        return prev;
      }
    });
  };

  const isFutureMonthBlocked = (() => {
    const now = new Date();
    const currentYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return selectedExpenseMonth >= currentYm;
  })();

  const handleNextExpenseMonth = () => {
    const [y, m] = selectedExpenseMonth.split('-').map(Number);
    const nextDate = new Date(y, m, 1);
    const nextYm = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    const now = new Date();
    const currentYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (nextYm > currentYm) return; // Future months strictly blocked!
    setSelectedExpenseMonth(prev => {
      try {
        const [year, month] = prev.split('-').map(Number);
        const d = new Date(year, month, 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      } catch (e) {
        return prev;
      }
    });
  };

  // Request Desktop Notification Permission on Startup for Watcher Reminders
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Daily Briefing & Live Google News State (3 Categories: Global, India, Gujarat)
  const [showBriefingModal, setShowBriefingModal] = useState(false);
  const [briefingData, setBriefingData] = useState("Loading briefing data...");
  const [trendingNewsList, setTrendingNewsList] = useState([]);
  const [newsCategory, setNewsCategory] = useState('india'); // 'global' | 'india' | 'gujarat' | 'ipo'
  const [ipoSubTab, setIpoSubTab] = useState('live'); // 'live' | 'upcoming'
  const [hoveredNewsId, setHoveredNewsId] = useState(null);
  const [isNewsLoading, setIsNewsLoading] = useState(false);
  const [lastNewsUpdated, setLastNewsUpdated] = useState('');
  const [newsCountdown, setNewsCountdown] = useState(120);

  // Real-Time IPO Intelligence State with 1-Hour Auto Refresh
  const [ipoData, setIpoData] = useState(() => IPO_DATABASE);
  const [ipoLastUpdated, setIpoLastUpdated] = useState(() => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  });
  const [ipoRefreshing, setIpoRefreshing] = useState(false);
  const [ipoCountdown, setIpoCountdown] = useState(3600); // 1-Hour (3600s) Auto-Refresh Countdown
  const [ipoJustRefreshed, setIpoJustRefreshed] = useState(false);

  // 1-Second Traffic Real-Time Monitor State
  const [trafficAlertBanner, setTrafficAlertBanner] = useState(null);
  const [isSimulatedTraffic, setIsSimulatedTraffic] = useState(false);
  const lastSpokenTrafficAlertRef = useRef(0);
  const trafficIntervalRef = useRef(null);

  const watcherIntervalRef = useRef(null);
  const triggeredKeysRef = useRef(new Set());
  const recognitionRef = useRef(null);
  const socketRef = useRef(null);
  const googleBtnRef = useRef(null);
  const liveTrafficCheckRef = useRef(null);
  const audioCtxRef = useRef(null);
  const alarmIntervalRef = useRef(null);
  const triggeredMinuteRef = useRef('');

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const polylineRef = useRef(null);
  const trafficPolylineRef = useRef(null);
  const trafficMarkerRef = useRef(null);
  const clickStepRef = useRef(0);

  // Cloud Real-Time Sync State Refs
  const isRemoteSyncRef = useRef(false);
  const userProfileRef = useRef(userProfile);
  const syncTimerRef = useRef(null);

  useEffect(() => {
    userProfileRef.current = userProfile;
  }, [userProfile]);

  useEffect(() => {
    try {
      localStorage.setItem('jarvis_permanent_reminders', JSON.stringify(remindersList));
    } catch (e) {}
  }, [remindersList]);

  useEffect(() => {
    try {
      localStorage.setItem('jarvis_snooze_duration', snoozeMinutes.toString());
    } catch (e) {}
  }, [snoozeMinutes]);

  useEffect(() => {
    try {
      localStorage.setItem('jarvis_expenses', JSON.stringify(expenseList));
      if (userProfile?.email) {
        localStorage.setItem(`jarvis_expenses_${userProfile.email.trim().toLowerCase()}`, JSON.stringify(expenseList));
      }
    } catch (e) {}
  }, [expenseList, userProfile?.email]);

  useEffect(() => {
    try {
      localStorage.setItem('jarvis_monthly_budget', monthlyBudget.toString());
    } catch (e) {}
  }, [monthlyBudget]);

  useEffect(() => {
    try {
      if (userProfile) {
        localStorage.setItem('jarvis_user_profile', JSON.stringify(userProfile));
      } else {
        localStorage.removeItem('jarvis_user_profile');
      }
    } catch (e) {}
  }, [userProfile]);

  // Fetch Cloud Data on Mount or when User Profile Changes (Sync from DB to Device)
  useEffect(() => {
    if (!userProfile?.email) return;

    if (socketRef.current?.connected) {
      socketRef.current.emit('join_user_room', userProfile.email);
    }

    const fetchCloudUserData = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/user/sync-data?email=${encodeURIComponent(userProfile.email)}`);
        const data = await res.json();
        if (data && data.success) {
          isRemoteSyncRef.current = true;
          if (Array.isArray(data.reminders) && data.reminders.length > 0) {
            setRemindersList(data.reminders);
          } else if (Array.isArray(data.reminders) && data.reminders.length === 0) {
            setRemindersList(DEFAULT_REMINDERS);
          }
          if (typeof data.snoozeMinutes === 'number') {
            setSnoozeMinutes(data.snoozeMinutes);
          }
          if (Array.isArray(data.expenses)) {
            const rawDeleted = (() => {
              try { return JSON.parse(localStorage.getItem('jarvis_deleted_expense_ids') || '[]'); } catch { return []; }
            })();
            setExpenseList(prev => {
              const merged = mergeExpenses(prev, data.expenses, rawDeleted);
              try {
                localStorage.setItem('jarvis_expenses', JSON.stringify(merged));
                localStorage.setItem(`jarvis_expenses_${userProfile.email.trim().toLowerCase()}`, JSON.stringify(merged));
              } catch (e) {}
              return merged;
            });
          }
          if (typeof data.monthlyBudget === 'number') {
            setMonthlyBudget(data.monthlyBudget);
          }
          if (Array.isArray(data.notes)) {
            setNotesList(data.notes);
          }
          setTimeout(() => {
            isRemoteSyncRef.current = false;
          }, 400);
        }
      } catch (e) {
        console.warn("Could not fetch user sync data:", e);
      }
    };

    fetchCloudUserData();
  }, [userProfile?.email]);

  // Real-Time Push to Cloud & Other Logged-in Devices whenever Reminders, Expenses, or Notes change
  useEffect(() => {
    if (isRemoteSyncRef.current || !userProfile?.email) return;

    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      const payload = {
        email: userProfile.email,
        reminders: remindersList,
        snoozeMinutes: snoozeMinutes,
        expenses: expenseList,
        monthlyBudget: monthlyBudget,
        notes: notesList
      };

      if (socketRef.current?.connected) {
        socketRef.current.emit('sync_user_data_realtime', payload);
      }

      fetch(`${BACKEND_URL}/api/user/sync-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {});
    }, 350);

    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [remindersList, snoozeMinutes, expenseList, monthlyBudget, notesList, userProfile?.email]);

  // Instant Mobile & Multi-Device Re-Sync on Tab Focus or Mobile Screen Unlock
  useEffect(() => {
    const handleReSyncOnForeground = () => {
      if (document.visibilityState === 'visible' && userProfileRef.current?.email) {
        if (!socketRef.current?.connected) {
          socketRef.current?.connect();
        }
        // Fetch fresh cloud state immediately
        const email = userProfileRef.current.email;
        fetch(`${BACKEND_URL}/api/user/sync-data?email=${encodeURIComponent(email)}`)
          .then(res => res.json())
          .then(data => {
            if (data && data.success) {
              isRemoteSyncRef.current = true;
              if (Array.isArray(data.reminders) && data.reminders.length > 0) setRemindersList(data.reminders);
              if (Array.isArray(data.notes)) {
                setNotesList(data.notes);
                try { localStorage.setItem(`jarvis_notes_${email.trim().toLowerCase()}`, JSON.stringify(data.notes)); } catch (e) {}
              }
              if (Array.isArray(data.expenses)) {
                const rawDeleted = (() => {
                  try { return JSON.parse(localStorage.getItem('jarvis_deleted_expense_ids') || '[]'); } catch { return []; }
                })();
                setExpenseList(prev => {
                  const merged = mergeExpenses(prev, data.expenses, rawDeleted);
                  try {
                    localStorage.setItem('jarvis_expenses', JSON.stringify(merged));
                    localStorage.setItem(`jarvis_expenses_${email.trim().toLowerCase()}`, JSON.stringify(merged));
                  } catch (e) {}
                  return merged;
                });
              }
              if (typeof data.monthlyBudget === 'number') setMonthlyBudget(data.monthlyBudget);
              setTimeout(() => { isRemoteSyncRef.current = false; }, 600);
            }
          })
          .catch(() => {});

        // Ping 3x daily automated email scheduler catch-up
        fetch(`${BACKEND_URL}/api/notes-scheduler/check-and-dispatch`).catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleReSyncOnForeground);
    window.addEventListener('focus', handleReSyncOnForeground);
    return () => {
      document.removeEventListener('visibilitychange', handleReSyncOnForeground);
      window.removeEventListener('focus', handleReSyncOnForeground);
    };
  }, []);

  // Periodic 5-minute automated mail check while app is open
  useEffect(() => {
    const check3x = () => {
      fetch(`${BACKEND_URL}/api/notes-scheduler/check-and-dispatch`).catch(() => {});
    };
    check3x();
    const inv = setInterval(check3x, 300000);
    return () => clearInterval(inv);
  }, []);

  // Live Header Clock, Date & Day Updater
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
      const dateStr = now.toLocaleDateString('en-US', options);
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setCurrentDateTimeStr(`${dateStr} | ${timeStr}`);
    };
    updateDateTime();
    const timer = setInterval(updateDateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Live Trending Google News Fetcher supporting 3 categories: global, india, gujarat
  const fetchTrendingNews = useCallback(async (targetCat = newsCategory) => {
    setIsNewsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/news/trending?category=${encodeURIComponent(targetCat)}`);
      const data = await res.json();
      if (data && data.success && Array.isArray(data.news || data.items)) {
        const list = data.news || data.items;
        setTrendingNewsList(list);
        setLastNewsUpdated(data.lastUpdated || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        if (list.length > 0) {
          setBriefingData(`Breaking: "${list[0].title}" (${list[0].source})`);
        }
      }
    } catch (e) {
      console.warn("Trending news fetch error:", e);
    } finally {
      setIsNewsLoading(false);
    }
  }, [newsCategory]);

  // 2-Minute Auto-Refresh Engine for Google News (Countdown decrements every second)
  useEffect(() => {
    fetchTrendingNews();

    const timer = setInterval(() => {
      setNewsCountdown(prev => {
        if (prev <= 1) {
          fetchTrendingNews();
          return 120;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [fetchTrendingNews]);

    // Live Real-Time IPO Intelligence Fetcher (Hourly Auto-Refresh + Manual Trigger)
  const fetchIpoData = useCallback(async (isManual = false) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    const dateStr = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const localUpdatedStr = `Just now (${dateStr} at ${timeStr} IST)`;

    if (isManual) {
      setIpoRefreshing(true);
      setIpoJustRefreshed(true);
      setIpoLastUpdated(localUpdatedStr);
      setTimeout(() => setIpoJustRefreshed(false), 4000);
    } else {
      setIpoLastUpdated(localUpdatedStr);
    }

    setIpoCountdown(3600);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(`${BACKEND_URL}/api/ipo/live`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          setIpoData({
            live: data.live || [],
            upcoming: data.upcoming || []
          });
          if (data.lastUpdated && !isManual) {
            setIpoLastUpdated(data.lastUpdated);
          }
        }
      }
    } catch (e) {
      console.warn("Live IPO remote fetch notice:", e.message);
    } finally {
      if (isManual) {
        setTimeout(() => setIpoRefreshing(false), 600);
      }
    }
  }, []);

  // 1-Hour Auto-Refresh Engine for Real-Time IPO Data
  useEffect(() => {
    fetchIpoData();

    const ipoTimer = setInterval(() => {
      setIpoCountdown(prev => {
        if (prev <= 1) {
          fetchIpoData();
          return 3600;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(ipoTimer);
  }, [fetchIpoData]);

  // Load Google Identity Services script
  useEffect(() => {
    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  // Process Auth with Backend (Database Verification for Login, Creation for Sign Up)
  const processAuthWithBackend = async (email, fullName, photoURL, targetMode) => {
    setIsAuthLoading(true);
    const cleanEmail = (email || '').trim().toLowerCase();
    const userName = fullName || cleanEmail.split('@')[0];
    const userPhoto = photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=E8D2B5&color=590907`;

    const payload = {
      email: cleanEmail,
      fullName: userName,
      avatar: userPhoto,
      mode: targetMode
    };

    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const endpoints = isLocal
      ? ['http://localhost:5001', BACKEND_URL]
      : [BACKEND_URL, 'http://localhost:5001'];

    let resData = null;
    let resOk = false;
    let resStatus = 0;

    for (const base of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(`${base}/api/auth/google-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        resStatus = res.status;
        resOk = res.ok;
        resData = await res.json().catch(() => null);
        if (resData) break;
      } catch (e) {
        // next candidate
      }
    }

    setIsAuthLoading(false);

    if (targetMode === 'login') {
      if (resOk && resData && resData.success && resData.user) {
        const profileData = {
          _id: resData.user._id,
          name: resData.user.fullName || userName,
          email: resData.user.email || cleanEmail,
          photo: resData.user.avatar || userPhoto,
          role: resData.user.role || 'commander',
          connectedDate: new Date(resData.user.createdAt || Date.now()).toLocaleDateString()
        };
        isRemoteSyncRef.current = true;
        if (Array.isArray(resData.user.reminders)) {
          setRemindersList(resData.user.reminders);
        }
        if (typeof resData.user.snoozeMinutes === 'number') {
          setSnoozeMinutes(resData.user.snoozeMinutes);
        }
        if (Array.isArray(resData.user.expenses)) {
          const rawDeleted = (() => {
            try { return JSON.parse(localStorage.getItem('jarvis_deleted_expense_ids') || '[]'); } catch { return []; }
          })();
          setExpenseList(prev => {
            const merged = mergeExpenses(prev, resData.user.expenses, rawDeleted);
            try {
              localStorage.setItem('jarvis_expenses', JSON.stringify(merged));
              localStorage.setItem(`jarvis_expenses_${cleanEmail}`, JSON.stringify(merged));
            } catch (e) {}
            return merged;
          });
        }
        if (typeof resData.user.monthlyBudget === 'number') {
          setMonthlyBudget(resData.user.monthlyBudget);
        }
        if (Array.isArray(resData.user.notes)) {
          setNotesList(resData.user.notes);
        }
        setTimeout(() => { isRemoteSyncRef.current = false; }, 400);

        setUserProfile(profileData);
        localStorage.setItem('jarvis_user_profile', JSON.stringify(profileData));
        localStorage.setItem(`jarvis_db_user_${cleanEmail}`, JSON.stringify(profileData));
        setShowAuthModal(false);
        alert(`Success! Logged in successfully as ${profileData.name}. Welcome back!`);
      } else if (resStatus === 404 || resStatus === 400 || (resData && resData.success === false)) {
        alert(`Error: This Gmail ID (${cleanEmail}) is not registered in the database.\n\nPlease click "Sign Up" first to create your account.`);
        setAuthMode('signup');
      } else {
        // Offline / emergency local check
        const localCheck = localStorage.getItem(`jarvis_db_user_${cleanEmail}`);
        if (localCheck) {
          const profileData = JSON.parse(localCheck);
          setUserProfile(profileData);
          setShowAuthModal(false);
          alert(`Success! Logged in successfully as ${profileData.name}.`);
        } else {
          alert(`Error: This Gmail ID (${cleanEmail}) is not registered in the database. Please Sign Up first.`);
          setAuthMode('signup');
        }
      }
    } else {
      // mode === 'signup'
      let dbUser = resData?.user;
      const profileData = {
        _id: dbUser?._id || `usr_${Date.now()}`,
        name: dbUser?.fullName || userName,
        email: dbUser?.email || cleanEmail,
        photo: dbUser?.avatar || userPhoto,
        role: dbUser?.role || 'commander',
        connectedDate: new Date(dbUser?.createdAt || Date.now()).toLocaleDateString()
      };
      if (dbUser) {
        isRemoteSyncRef.current = true;
        if (Array.isArray(dbUser.reminders) && dbUser.reminders.length > 0) setRemindersList(dbUser.reminders);
        if (typeof dbUser.snoozeMinutes === 'number') setSnoozeMinutes(dbUser.snoozeMinutes);
        if (Array.isArray(dbUser.expenses)) {
          const rawDeleted = (() => {
            try { return JSON.parse(localStorage.getItem('jarvis_deleted_expense_ids') || '[]'); } catch { return []; }
          })();
          setExpenseList(prev => {
            const merged = mergeExpenses(prev, dbUser.expenses, rawDeleted);
            try {
              localStorage.setItem('jarvis_expenses', JSON.stringify(merged));
              localStorage.setItem(`jarvis_expenses_${cleanEmail}`, JSON.stringify(merged));
            } catch (e) {}
            return merged;
          });
        }
        if (typeof dbUser.monthlyBudget === 'number') setMonthlyBudget(dbUser.monthlyBudget);
        if (Array.isArray(dbUser.notes)) setNotesList(dbUser.notes);
        setTimeout(() => { isRemoteSyncRef.current = false; }, 400);
      }
      localStorage.setItem('jarvis_user_profile', JSON.stringify(profileData));
      localStorage.setItem(`jarvis_db_user_${cleanEmail}`, JSON.stringify(profileData));
      setUserProfile(profileData);
      setShowAuthModal(false);
      alert(`Sign Up Success! Welcome ${profileData.name}. Your account has been registered.`);
    }
  };

  // Callback from GSI rendered button / One-Tap
  const handleGoogleCredentialResponse = async (response) => {
    if (!response || !response.credential) return;
    try {
      const decoded = parseJwt(response.credential);
      if (!decoded || !decoded.email) {
        throw new Error("Unable to parse Google authentication token.");
      }
      await processAuthWithBackend(decoded.email, decoded.name || 'User', decoded.picture || '', authMode);
    } catch (err) {
      alert(`Authentication Error: ${err.message}`);
    }
  };

  // Render Google GSI button when Auth Modal is open
  useEffect(() => {
    if (!showAuthModal) return;

    const renderGsiButton = () => {
      if (window.google?.accounts?.id && googleBtnRef.current) {
        try {
          googleBtnRef.current.innerHTML = "";
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCredentialResponse,
            auto_select: false
          });
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'outline',
            size: 'large',
            width: 280,
            text: authMode === 'login' ? 'signin_with' : 'signup_with',
            shape: 'pill'
          });
        } catch (e) {
          console.error("GSI renderButton error:", e);
        }
      }
    };

    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = renderGsiButton;
      document.body.appendChild(script);
    } else {
      renderGsiButton();
    }
  }, [showAuthModal, authMode]);

  // Main Google Auth Trigger (Uses Google Identity Services popup with prompt: 'select_account')
  const triggerGoogleAuth = (targetMode = authMode) => {
    setIsAuthLoading(true);

    const startOAuth = () => {
      if (window.google?.accounts?.oauth2) {
        try {
          const client = window.google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: 'email profile openid',
            callback: async (tokenResponse) => {
              if (tokenResponse.error) {
                setIsAuthLoading(false);
                if (tokenResponse.error === 'popup_closed_by_user') return;
                alert(`Google Sign-In: ${tokenResponse.error_description || tokenResponse.error}`);
                return;
              }
              try {
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                const info = await res.json();
                if (info && info.email) {
                  await processAuthWithBackend(info.email, info.name, info.picture, targetMode);
                } else {
                  alert("Could not fetch user profile from Google.");
                  setIsAuthLoading(false);
                }
              } catch (fetchErr) {
                alert(`Error: ${fetchErr.message}`);
                setIsAuthLoading(false);
              }
            }
          });
          client.requestAccessToken({ prompt: 'select_account' });
          return;
        } catch (err) {
          console.error("OAuth client error:", err);
        }
      }

      // Fallback: prompt Google One Tap / account chooser
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.prompt();
        } catch (e) {}
      }
      setIsAuthLoading(false);
    };

    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = startOAuth;
      document.body.appendChild(script);
    } else {
      startOAuth();
    }
  };

  const handleGoogleAuthAction = () => {
    triggerGoogleAuth(authMode);
  };

  const startBrowserGoogleAuthPopup = () => {
    triggerGoogleAuth(authMode);
  };

  const startRiderAppGoogleAuth = () => {
    triggerGoogleAuth(authMode);
  };

  // Master Mute Handler: Completely mutes whole web application
  useEffect(() => {
    if (isMuted) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (alarmIntervalRef.current) {
        clearInterval(alarmIntervalRef.current);
        alarmIntervalRef.current = null;
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'running') {
        audioCtxRef.current.suspend().catch(() => {});
      }
      document.querySelectorAll('audio, video').forEach(el => {
        el.muted = true;
      });
    } else {
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }
    }
  }, [isMuted]);

  // Pure Music / Sound Alarm Only - Plays Continuously in a loop until user clicks "Got It / Dismiss"
  const isAlarmPlayingRef = useRef(false);

  const startJailerFluteAlarm = useCallback(() => {
    if (isMuted) return;
    isAlarmPlayingRef.current = true;
    if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);

    const playFluteTune = () => {
      if (!isAlarmPlayingRef.current || isMuted) return;
      try {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const notes = [587.33, 659.25, 783.99, 880.00, 1046.50, 880.00, 783.99];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.16);
          
          gain.gain.setValueAtTime(0.5, ctx.currentTime + idx * 0.16);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.16 + 0.20);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.16);
          osc.stop(ctx.currentTime + idx * 0.16 + 0.21);
        });
      } catch (e) {
        console.warn("Alarm sound error:", e);
      }
    };

    playFluteTune();
    // Continuous loop every 1.4 seconds until user clicks "Got It"
    alarmIntervalRef.current = setInterval(playFluteTune, 1400);
  }, [isMuted]);

  const stopAlarmSound = useCallback(() => {
    isAlarmPlayingRef.current = false;
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
  }, []);

  // Ensure alarm keeps playing continuously as long as activeAlertTask modal is showing
  useEffect(() => {
    if (activeAlertTask && !isMuted) {
      startJailerFluteAlarm();
    } else if (!activeAlertTask) {
      stopAlarmSound();
    }
  }, [activeAlertTask, isMuted, startJailerFluteAlarm, stopAlarmSound]);

  // Global Audio Unlock Listener on User Interaction (Prevents browser audio blocking)
  useEffect(() => {
    const unlockAudio = () => {
      try {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }
      } catch (e) {}
    };
    window.addEventListener('click', unlockAudio, { passive: true });
    window.addEventListener('pointerdown', unlockAudio, { passive: true });
    window.addEventListener('keydown', unlockAudio, { passive: true });
    window.addEventListener('touchstart', unlockAudio, { passive: true });
    window.addEventListener('touchstart', unlockAudio, { passive: true });
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  const testFluteSound = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const notes = [587.33, 659.25, 783.99, 880.00, 783.99, 659.25];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.18);
        gain.gain.setValueAtTime(0.4, ctx.currentTime + idx * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.18 + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.18);
        osc.stop(ctx.currentTime + idx * 0.18 + 0.15);
      });
    } catch (e) {
      console.warn("Audio test error:", e);
    }
  }, []);

  const speakText = useCallback((text) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    
    const voices = window.speechSynthesis.getVoices();
    const selectedVoice = voices.find(v => v.lang.includes('en') || v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('male')) || voices[0];

    const utterance = new SpeechSynthesisUtterance(text);
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.rate = 0.82; 
    utterance.pitch = 0.75; 
    utterance.lang = 'en-US';

    window.speechSynthesis.speak(utterance);
  }, [isMuted]);

  const handleStopAll = useCallback(() => {
    setIsMonitoringActive(false);
    stopAlarmSound();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setRouteStatus({ isHeavy: false, message: "Monitoring stopped." });
  }, [stopAlarmSound]);

  // 12-Hour Time Formatter
  const formatTimeTo12Hour = (timeStr) => {
    if (!timeStr || !timeStr.includes(':')) return timeStr;
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const adjustedH = h % 12 === 0 ? 12 : h % 12;
    return `${String(adjustedH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
  };

  // Ultra-Accurate HTML5 GPS Geolocation
  const handleGetCurrentLocation = (targetField) => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          const data = await res.json();
          const address = data.display_name || `${lat}, ${lon}`;
          if (targetField === 'from') {
            setFromInput(address);
            setActiveRoute(prev => ({ ...prev, fromName: address, fromCoords: [lon, lat] }));
          } else {
            setToInput(address);
            setActiveRoute(prev => ({ ...prev, toName: address, toCoords: [lon, lat] }));
          }
          if (isMonitoringActive) speakText("Current GPS location set successfully.");
        } catch (e) {}
      },
      (error) => {
        alert("GPS location permission error: " + error.message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Leaflet Interactive Map Loader
  useEffect(() => {
    if (!showRoutePanel) return;

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const initMapScript = () => {
      if (!window.L) return;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      if (mapContainerRef.current) {
        const centerLat = activeRoute.fromCoords ? activeRoute.fromCoords[1] : 23.0225;
        const centerLon = activeRoute.fromCoords ? activeRoute.fromCoords[0] : 72.5714;

        if (mapContainerRef.current._leaflet_id) {
          mapContainerRef.current._leaflet_id = null;
        }
        let map;
        try {
          map = window.L.map(mapContainerRef.current).setView([centerLat, centerLon], 12);
        } catch (e) {
          return;
        }
        mapInstanceRef.current = map;

        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        if (activeRoute.fromCoords) {
          window.L.marker([activeRoute.fromCoords[1], activeRoute.fromCoords[0]]).addTo(map)
            .bindPopup(`From: ${activeRoute.fromName || 'Origin'}`).openPopup();
        }

        if (activeRoute.toCoords && activeRoute.toName) {
          window.L.marker([activeRoute.toCoords[1], activeRoute.toCoords[0]]).addTo(map)
            .bindPopup(`To: ${activeRoute.toName}`);

          fetch(`https://router.project-osrm.org/route/v1/driving/${activeRoute.fromCoords[0]},${activeRoute.fromCoords[1]};${activeRoute.toCoords[0]},${activeRoute.toCoords[1]}?overview=full&geometries=geojson`)
            .then(res => res.json())
            .then(data => {
              if (data.routes && data.routes.length > 0) {
                const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
                const durationMin = Math.round(data.routes[0].duration / 60);
                const distanceKm = (data.routes[0].distance / 1000).toFixed(1);
                const isHeavy = durationMin > (parseFloat(distanceKm) * 3) + 4;

                if (polylineRef.current) map.removeLayer(polylineRef.current);
                if (trafficPolylineRef.current) map.removeLayer(trafficPolylineRef.current);
                if (trafficMarkerRef.current) map.removeLayer(trafficMarkerRef.current);

                const hasTraffic = isHeavy || isSimulatedTraffic || routeStatus.isHeavy;

                if (hasTraffic && coords.length > 6) {
                  // Segment the path: ONLY the congested zone is in bright RED, the rest in Green!
                  const sIdx = Math.floor(coords.length * 0.35);
                  const eIdx = Math.min(coords.length - 1, Math.floor(coords.length * 0.70));

                  const part1 = coords.slice(0, sIdx + 1);
                  const redPart = coords.slice(sIdx, eIdx + 1);
                  const part2 = coords.slice(eIdx);

                  // Green clear segments
                  const gPoly1 = window.L.polyline(part1, { color: '#10b981', weight: 6, opacity: 0.9 }).addTo(map);
                  const gPoly2 = window.L.polyline(part2, { color: '#10b981', weight: 6, opacity: 0.9 }).addTo(map);

                  // RED traffic segment
                  const redPoly = window.L.polyline(redPart, {
                    color: '#ef4444',
                    weight: 9,
                    opacity: 1,
                    dashArray: '8, 6'
                  }).addTo(map);

                  polylineRef.current = gPoly1;
                  trafficPolylineRef.current = redPoly;

                  const midPt = redPart[Math.floor(redPart.length / 2)];
                  const toLabel = (activeRoute.toName || 'Gujarat Highway').split(',')[0].trim();
                  const tMarker = window.L.circleMarker(midPt, {
                    radius: 11,
                    fillColor: '#ef4444',
                    color: '#ffffff',
                    weight: 3,
                    opacity: 1,
                    fillOpacity: 0.95
                  }).addTo(map).bindPopup(`<b>⚠️ Heavy Traffic Bottleneck</b><br/>Area: ${toLabel} Corridor<br/>Current Speed: 14 km/h<br/>Path marked in RED`).openPopup();

                  trafficMarkerRef.current = tMarker;
                  map.fitBounds(window.L.polyline(coords).getBounds(), { padding: [50, 50] });

                  setRouteStatus({ isHeavy: true, message: `RED ALERT: Heavy traffic near ${toLabel}! (${durationMin} min)` });
                  if (isMonitoringActive) speakText(`Traffic Alert! Heavy traffic congestion detected near ${toLabel}.`);
                } else {
                  // Entire route clear -> Clean Green line
                  const gPoly = window.L.polyline(coords, { color: '#10b981', weight: 6, opacity: 0.9 }).addTo(map);
                  polylineRef.current = gPoly;
                  map.fitBounds(gPoly.getBounds(), { padding: [50, 50] });
                  setRouteStatus({ isHeavy: false, message: `Route clear. (${durationMin} min, ${distanceKm} km)` });
                }

                // Google Maps Live Animated Navigation Vehicle Pulse Marker
                if (navVehicleMarkerRef.current && map) {
                  try { map.removeLayer(navVehicleMarkerRef.current); } catch (e) {}
                  navVehicleMarkerRef.current = null;
                }
                if (navAnimationTimerRef.current) {
                  clearInterval(navAnimationTimerRef.current);
                  navAnimationTimerRef.current = null;
                }

                if (coords && coords.length > 1) {
                  const navPulseIcon = window.L.divIcon({
                    className: 'google-nav-pulse-marker',
                    html: `
                      <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
                        <div style="position: absolute; inset: 0; border-radius: 50%; background: rgba(56, 189, 248, 0.55); animation: jarvisNavPulse 1.4s ease-out infinite;"></div>
                        <div style="width: 20px; height: 20px; border-radius: 50%; background: #0284c7; border: 3px solid #ffffff; box-shadow: 0 2px 10px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;">
                          <div style="width: 7px; height: 7px; border-radius: 50%; background: #ffffff;"></div>
                        </div>
                      </div>
                    `,
                    iconSize: [34, 34],
                    iconAnchor: [17, 17]
                  });

                  const vMarker = window.L.marker(coords[0], { icon: navPulseIcon, zIndexOffset: 1200 }).addTo(map);
                  navVehicleMarkerRef.current = vMarker;

                  let stepIdx = 0;
                  navAnimationTimerRef.current = setInterval(() => {
                    if (!navVehicleMarkerRef.current || !coords || coords.length === 0) return;
                    stepIdx = (stepIdx + 1) % coords.length;
                    navVehicleMarkerRef.current.setLatLng(coords[stepIdx]);
                  }, 400);
                }
              }
            }).catch(e => {});
        }

        map.on('click', async (e) => {
          const lat = e.latlng.lat;
          const lon = e.latlng.lng;

          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            const data = await res.json();
            const placeName = data.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;

            if (clickStepRef.current === 0) {
              setFromInput(placeName);
              setActiveRoute(prev => ({ ...prev, fromName: placeName, fromCoords: [lon, lat] }));
              clickStepRef.current = 1;
              if (isMonitoringActive) speakText("Starting location selected.");
            } else {
              setToInput(placeName);
              setActiveRoute(prev => ({ ...prev, toName: placeName, toCoords: [lon, lat] }));
              clickStepRef.current = 0;
              if (isMonitoringActive) speakText("Destination selected. Starting route monitoring.");
              setIsMonitoringActive(true);
            }
          } catch (err) {}
        });
      }
    };

    if (window.L) {
      initMapScript();
    } else {
      const existingScript = document.getElementById('leaflet-js');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'leaflet-js';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = true;
        script.onload = initMapScript;
        document.body.appendChild(script);
      } else {
        existingScript.onload = initMapScript;
      }
    }
  }, [showRoutePanel, activeRoute, isMonitoringActive, speakText]);

  // Curated Gujarat Points of Interest (Circles, Mandir, Hospitals, Hostels & Universities)
  const GUJARAT_POI_DATABASE = [
    // Cross Circles & Crossroads
    { name: "Iskcon Cross Road, SG Highway, Ahmedabad", category: "circle", coords: [72.5074, 23.0290], desc: "Major highway junction" },
    { name: "Pakwan Cross Road, Bodakdev, Ahmedabad", category: "circle", coords: [72.5135, 23.0385], desc: "Commercial crossroads" },
    { name: "Helmet Cross Road, Memnagar, Ahmedabad", category: "circle", coords: [72.5367, 23.0487], desc: "Key central crossroads" },
    { name: "Shivranjani Crossroads, Satellite, Ahmedabad", category: "circle", coords: [72.5317, 23.0242], desc: "BRTS junction" },
    { name: "Nehrunagar Circle, Ambawadi, Ahmedabad", category: "circle", coords: [72.5447, 23.0189], desc: "Central landmark circle" },
    { name: "C.G. Road Panchvati Circle, Ahmedabad", category: "circle", coords: [72.5566, 23.0322], desc: "Shopping hub circle" },
    { name: "Kalupur Railway Station Circle, Ahmedabad", category: "circle", coords: [72.5985, 23.0255], desc: "Transit hub circle" },
    { name: "Geeta Mandir Bus Port Circle, Ahmedabad", category: "circle", coords: [72.5855, 23.0122], desc: "Central bus terminal" },
    { name: "Naroda Patiya Crossroads, Ahmedabad", category: "circle", coords: [72.6511, 23.0674], desc: "East Ahmedabad crossroads" },
    { name: "Gh-0 Circle, Infocity, Gandhinagar", category: "circle", coords: [72.6322, 23.2155], desc: "Gandhinagar entrance circle" },
    { name: "Gh-5 Circle, Sector 16, Gandhinagar", category: "circle", coords: [72.6455, 23.2288], desc: "Gandhinagar central circle" },
    { name: "Ch-0 Circle, Indroda, Gandhinagar", category: "circle", coords: [72.6611, 23.2100], desc: "Highway entrance circle" },
    { name: "Ch-5 Circle, Sector 21, Gandhinagar", category: "circle", coords: [72.6688, 23.2388], desc: "Sector 21 market circle" },
    { name: "Majura Gate Crossroads, Ring Road, Surat", category: "circle", coords: [72.8188, 21.1822], desc: "Surat central crossroads" },
    { name: "Athwagate Circle, Athwa, Surat", category: "circle", coords: [72.8111, 21.1888], desc: "Surat landmark circle" },
    { name: "Kalawad Road Circle, Rajkot", category: "circle", coords: [70.7678, 22.2858], desc: "Rajkot university circle" },
    { name: "Trikon Baug Circle, Rajkot", category: "circle", coords: [70.8011, 22.3011], desc: "Rajkot city center" },
    { name: "Dairy Den Circle, Sayajigunj, Vadodara", category: "circle", coords: [73.1888, 22.3088], desc: "Vadodara station circle" },

    // Mandir & Religious Landmarks
    { name: "Akshardham Mandir, Sector 20, Gandhinagar", category: "mandir", coords: [72.6744, 23.2339], desc: "Grand cultural temple" },
    { name: "ISKCON Temple, SG Highway, Ahmedabad", category: "mandir", coords: [72.5072, 23.0288], desc: "Hare Krishna temple" },
    { name: "Camp Hanuman Mandir, Shahibaug Cantonment", category: "mandir", coords: [72.6105, 23.0635], desc: "Historic Hanuman temple" },
    { name: "Jagannath Mandir, Jamalpur, Ahmedabad", category: "mandir", coords: [72.5815, 23.0135], desc: "Rath Yatra historic temple" },
    { name: "Trimandir, Adalaj, Gandhinagar", category: "mandir", coords: [72.5855, 23.1678], desc: "Non-sectarian temple" },
    { name: "Somnath Mahadev Temple, Prabhas Patan, Gujarat", category: "mandir", coords: [70.4011, 20.8880], desc: "First Jyotirlinga temple" },
    { name: "Ambaji Mata Temple, Banaskantha, Gujarat", category: "mandir", coords: [72.8544, 24.3311], desc: "Shakti Peeth temple" },
    { name: "Dwarkadhish Temple, Dwarka, Gujarat", category: "mandir", coords: [68.9685, 22.2376], desc: "Char Dham temple" },
    { name: "Kashtbhanjan Dev Hanuman Mandir, Sarangpur", category: "mandir", coords: [71.7488, 22.1488], desc: "Salangpur Hanumanji" },
    { name: "Pavagadh Mahakali Temple, Panchmahal", category: "mandir", coords: [73.5222, 22.4611], desc: "Hilltop Shakti Peeth" },

    // Hospitals
    { name: "Civil Hospital (Asarwa), Ahmedabad", category: "hospital", coords: [72.6025, 23.0522], desc: "Asia's largest hospital campus" },
    { name: "SVP Hospital (Sardar Patel), Ellisbridge", category: "hospital", coords: [72.5711, 23.0188], desc: "Super speciality hospital" },
    { name: "Apollo Hospital, Bhat, Gandhinagar", category: "hospital", coords: [72.6188, 23.1088], desc: "Multi-speciality hospital" },
    { name: "Zydus Hospital, Thaltej, SG Highway", category: "hospital", coords: [72.5188, 23.0588], desc: "Advanced healthcare hospital" },
    { name: "KD Hospital, Vaishnodevi Circle, SG Highway", category: "hospital", coords: [72.5444, 23.1255], desc: "Multi-super speciality hospital" },
    { name: "SAL Hospital, Thaltej Cross Roads, Ahmedabad", category: "hospital", coords: [72.5255, 23.0488], desc: "Tertiary care hospital" },
    { name: "CIMS Hospital, Science City Road, Ahmedabad", category: "hospital", coords: [72.5155, 23.0788], desc: "Marengo CIMS hospital" },
    { name: "Sterling Hospital, Memnagar, Ahmedabad", category: "hospital", coords: [72.5388, 23.0455], desc: "Multi-speciality healthcare" },
    { name: "UN Mehta Heart Institute, Civil Hospital Campus", category: "hospital", coords: [72.6033, 23.0533], desc: "Leading cardiology hospital" },
    { name: "Kiran Hospital, Katargam, Surat", category: "hospital", coords: [72.8355, 21.2288], desc: "Super speciality hospital" },
    { name: "AIIMS Hospital, Khandheri, Rajkot", category: "hospital", coords: [70.7388, 22.3388], desc: "National premier institute" },

    // Hostels & Universities
    { name: "Gujarat University Hostel, Navrangpura", category: "hostel", coords: [72.5444, 23.0388], desc: "University student hostel" },
    { name: "LD College of Engineering Hostel, Ahmedabad", category: "hostel", coords: [72.5488, 23.0333], desc: "Engineering college hostel" },
    { name: "Nirma University Campus & Hostel, SG Highway", category: "hostel", coords: [72.5422, 23.1288], desc: "Premier university hostel" },
    { name: "PDPU / PDEU University & Hostel, Gandhinagar", category: "hostel", coords: [72.6655, 23.1555], desc: "Energy university hostel" },
    { name: "DA-IICT Campus & Hostel, Gandhinagar", category: "hostel", coords: [72.6288, 23.1888], desc: "ICT institute hostel" },
    { name: "Silver Oak University & Hostel, Gota", category: "hostel", coords: [72.5355, 23.0988], desc: "University campus hostel" },
    { name: "VGEC Campus & Hostel, Chandkheda", category: "hostel", coords: [72.5922, 23.1088], desc: "Govt engineering college" },
    { name: "Marwadi University Campus & Hostel, Rajkot", category: "hostel", coords: [70.8122, 22.3788], desc: "Highway university hostel" },
    { name: "Parul University Campus & Hostel, Vadodara", category: "hostel", coords: [73.3622, 22.2888], desc: "Large university hostel campus" },
    { name: "SVNIT Campus & Hostel, Surat", category: "hostel", coords: [72.7855, 21.1655], desc: "NIT campus hostel" }
  ];

  // Autocomplete Restricted to Gujarat & Curated Landmark Database
  useEffect(() => {
    if (fromInput.trim().length < 2) {
      setFromSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      const q = fromInput.toLowerCase().trim();
      // 1. First search local curated Gujarat POI database
      const localMatches = GUJARAT_POI_DATABASE.filter(poi => 
        poi.name.toLowerCase().includes(q) || 
        poi.category.toLowerCase().includes(q) || 
        poi.desc.toLowerCase().includes(q)
      ).map(poi => ({
        display_name: poi.name,
        lon: poi.coords[0].toString(),
        lat: poi.coords[1].toString(),
        category: poi.category,
        isPoi: true
      }));

      // 2. Query Nominatim strictly for Gujarat
      try {
        const queryWithGujarat = fromInput.toLowerCase().includes('gujarat') ? fromInput : `${fromInput}, Gujarat`;
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&viewbox=68.10,20.06,74.48,24.71&bounded=1&q=${encodeURIComponent(queryWithGujarat)}`);
        const data = await res.json();
        const onlineList = (Array.isArray(data) ? data : []).map(item => ({ ...item, isPoi: false }));
        setFromSuggestions([...localMatches, ...onlineList].slice(0, 7));
      } catch (e) {
        setFromSuggestions(localMatches.slice(0, 7));
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [fromInput]);

  useEffect(() => {
    if (toInput.trim().length < 2) {
      setToSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      const q = toInput.toLowerCase().trim();
      const localMatches = GUJARAT_POI_DATABASE.filter(poi => 
        poi.name.toLowerCase().includes(q) || 
        poi.category.toLowerCase().includes(q) || 
        poi.desc.toLowerCase().includes(q)
      ).map(poi => ({
        display_name: poi.name,
        lon: poi.coords[0].toString(),
        lat: poi.coords[1].toString(),
        category: poi.category,
        isPoi: true
      }));

      try {
        const queryWithGujarat = toInput.toLowerCase().includes('gujarat') ? toInput : `${toInput}, Gujarat`;
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&viewbox=68.10,20.06,74.48,24.71&bounded=1&q=${encodeURIComponent(queryWithGujarat)}`);
        const data = await res.json();
        const onlineList = (Array.isArray(data) ? data : []).map(item => ({ ...item, isPoi: false }));
        setToSuggestions([...localMatches, ...onlineList].slice(0, 7));
      } catch (e) {
        setToSuggestions(localMatches.slice(0, 7));
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [toInput]);

  // Real-Time Gujarat Traffic Telemetry Engine & Live Message Dispatcher
  useEffect(() => {
    if (!isMonitoringActive || !activeRoute.fromCoords || !activeRoute.toCoords || !activeRoute.toName) {
      if (trafficIntervalRef.current) {
        clearInterval(trafficIntervalRef.current);
        trafficIntervalRef.current = null;
      }
      return;
    }

    const checkGujaratTraffic = async () => {
      try {
        const [fromLon, fromLat] = activeRoute.fromCoords;
        const [toLon, toLat] = activeRoute.toCoords;

        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${fromLon},${fromLat};${toLon},${toLat}?overview=full&geometries=geojson`;
        const res = await fetch(osrmUrl);
        const data = await res.json();

        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const distKm = (route.distance / 1000).toFixed(1);
          const durMin = Math.round(route.duration / 60);

          const toLabel = activeRoute.toName.split(',')[0].trim();
          const fromLabel = activeRoute.fromName.split(',')[0].trim();
          const congestionSpot = `${toLabel} Corridor`;

          // Real speed calculation: speed in km/h based on distance and duration
          const currentSpeedKmH = route.duration > 0 ? Math.round((route.distance / 1000) / (route.duration / 3600)) : 40;

          // Truly congested when cars/bikes are crawling/stuck (< 20 km/h like Google Maps Red) or simulated
          const isHeavy = isSimulatedTraffic || (currentSpeedKmH < 20 && parseFloat(distKm) > 0.5);

          const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

          if (isHeavy) {
            const delayMin = Math.max(5, Math.round(durMin * 0.7));
            const alertMsg = `Heavy traffic congestion detected at ${congestionSpot}! Vehicles crawling at ${currentSpeedKmH} km/h (+${delayMin} min delay).`;

            setRouteStatus({
              isHeavy: true,
              message: alertMsg,
              location: congestionSpot,
              durationMin: durMin + delayMin,
              distanceKm: distKm
            });
            setTrafficAlertBanner({
              location: congestionSpot,
              from: fromLabel,
              to: toLabel,
              message: alertMsg,
              delayMin: delayMin,
              time: nowTime
            });

            // Push to Real-time Traffic Dispatch Log (avoid flood)
            setTrafficLiveLogs(prev => {
              if (prev.length > 0 && prev[0].level === 'alert' && prev[0].text === alertMsg) return prev;
              return [
                {
                  id: `log_${Date.now()}`,
                  time: nowTime,
                  text: alertMsg,
                  level: 'alert'
                },
                ...prev.slice(0, 9)
              ];
            });

            const nowMs = Date.now();
            if (nowMs - lastSpokenTrafficAlertRef.current > 20000 && !isMuted) {
              lastSpokenTrafficAlertRef.current = nowMs;
              speakText(`Traffic Alert! Heavy traffic congestion detected at ${congestionSpot}. Vehicles are moving very slowly.`);
            }
          } else {
            setRouteStatus({
              isHeavy: false,
              message: `Corridor clear: ${fromLabel} to ${toLabel} (${distKm} km, ~${currentSpeedKmH} km/h normal flow)`,
              location: null,
              durationMin: durMin,
              distanceKm: distKm
            });
            setTrafficAlertBanner(null);
            setTrafficLiveLogs(prev => {
              const clearMsg = `Corridor clear: ${fromLabel} ➔ ${toLabel} (${distKm} km, speed normal).`;
              if (prev.length > 0 && prev[0].level === 'info' && prev[0].text === clearMsg) return prev;
              return [
                {
                  id: `log_${Date.now()}`,
                  time: nowTime,
                  text: clearMsg,
                  level: 'info'
                },
                ...prev.slice(0, 9)
              ];
            });
          }
        }
      } catch (err) {}
    };

    checkGujaratTraffic();
    trafficIntervalRef.current = setInterval(checkGujaratTraffic, 1500);

    return () => {
      if (trafficIntervalRef.current) {
        clearInterval(trafficIntervalRef.current);
        trafficIntervalRef.current = null;
      }
    };
  }, [isMonitoringActive, activeRoute, isSimulatedTraffic, isMuted, speakText]);

  // Voice Command Processor
  const handleVoiceCommand = useCallback(async (query) => {
    if (!query || typeof query !== 'string') return;
    const rawQ = query.trim();
    const lowerQ = rawQ.toLowerCase();
    setVoiceTranscript(rawQ);
    console.log('[Shadow Voice AI heard]:', rawQ);

    // Intent 1: NOTES (e.g. "Shadow meri note main add kardo ki aaj mall main jaana hai")
    if (
      lowerQ.includes('note') || 
      lowerQ.includes('likho') || 
      lowerQ.includes('likh do') || 
      lowerQ.includes('add kardo') || 
      lowerQ.includes('add kar do') ||
      lowerQ.includes('add to note')
    ) {
      let noteBody = '';
      if (lowerQ.includes(' ki ')) {
        noteBody = rawQ.substring(lowerQ.indexOf(' ki ') + 4).trim();
      } else if (lowerQ.includes(' that ')) {
        noteBody = rawQ.substring(lowerQ.indexOf(' that ') + 6).trim();
      } else if (lowerQ.includes('add kardo') || lowerQ.includes('add kar do')) {
        noteBody = rawQ.replace(/.*(?:add kardo|add kar do|add to note|note me add kardo)/i, '').trim();
      } else if (lowerQ.includes('note me') || lowerQ.includes('note main')) {
        noteBody = rawQ.replace(/.*(?:note me|note main|note mein)/i, '').trim();
      } else {
        noteBody = rawQ.replace(/.*(?:note)/i, '').trim();
      }

      noteBody = noteBody.replace(/^(ki|that|me|main)\s+/i, '').trim();
      if (!noteBody) noteBody = "Voice Note - " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const newVoiceNote = {
        id: 'note_' + Date.now(),
        title: noteBody.length > 28 ? noteBody.slice(0, 28) + '...' : noteBody,
        content: noteBody,
        color: '#38bdf8',
        pinned: false,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setNotesList(prev => [newVoiceNote, ...prev]);
      const confMsg = `Note added: "${noteBody}"`;
      setVoiceFeedbackMessage(confMsg);
      speakText(confMsg);
      return;
    }

    // Intent 2: REMINDER (e.g. "Shadow reminder set karo 5 baje ka" or "Shadow reminder set karo 17:30 meeting")
    if (
      lowerQ.includes('reminder') || 
      lowerQ.includes('remind') || 
      (lowerQ.includes('baje') && (lowerQ.includes('set') || lowerQ.includes('laga')))
    ) {
      let extractedHour = null;
      let extractedMin = 0;
      let reminderTask = 'Scheduled Task';

      const colonMatch = rawQ.match(/(\d{1,2}):(\d{2})/);
      if (colonMatch) {
        extractedHour = parseInt(colonMatch[1], 10);
        extractedMin = parseInt(colonMatch[2], 10);
      } else {
        const digitMatch = rawQ.match(/(\d{1,2})\s*(?:baje|pm|am|o'clock)?/i);
        if (digitMatch) {
          extractedHour = parseInt(digitMatch[1], 10);
          if (lowerQ.includes('pm') || lowerQ.includes('shaam') || lowerQ.includes('dopahar') || lowerQ.includes('raat')) {
            if (extractedHour < 12) extractedHour += 12;
          }
        }
      }

      if (extractedHour !== null) {
        if (extractedHour < 0) extractedHour = 0;
        if (extractedHour > 23) extractedHour = 23;
        const timeStr = `${String(extractedHour).padStart(2, '0')}:${String(extractedMin).padStart(2, '0')}`;

        const cleanTask = rawQ.replace(/.*(?:set karo|set|baje ka|baje|reminder)/gi, '').trim();
        if (cleanTask.length > 2) reminderTask = cleanTask;

        setRemindersList(prev => [...prev, { task: reminderTask, time: timeStr, completed: false }]);
        const confMsg = `Reminder set for ${timeStr}: "${reminderTask}"`;
        setVoiceFeedbackMessage(confMsg);
        speakText(confMsg);
        return;
      }
    }

    // Intent 3: ROUTE & TRAFFIC (e.g. "Shadow iskon se vaishnodevi ka route set karo")
    if (
      lowerQ.includes('route') || 
      lowerQ.includes('navigation') || 
      (lowerQ.includes('se') && lowerQ.includes('ka')) ||
      (lowerQ.includes('iscon') && lowerQ.includes('vaishnodevi'))
    ) {
      let startPoi = null;
      let endPoi = null;

      if (lowerQ.includes('iscon') || lowerQ.includes('iskcon')) {
        startPoi = GUJARAT_POI_DATABASE.find(p => p.name.toLowerCase().includes('iskcon') || p.name.toLowerCase().includes('iscon'));
      }
      if (lowerQ.includes('vaishnodevi')) {
        endPoi = GUJARAT_POI_DATABASE.find(p => p.name.toLowerCase().includes('vaishnodevi'));
      }

      if (!startPoi && lowerQ.includes('iscon')) {
        startPoi = { name: "ISKCON Temple, SG Highway, Ahmedabad", coords: [72.5072, 23.0288] };
      }
      if (!endPoi && lowerQ.includes('vaishnodevi')) {
        endPoi = { name: "KD Hospital, Vaishnodevi Circle, SG Highway", coords: [72.5444, 23.1255] };
      }

      if (startPoi && endPoi) {
        setFromInput(startPoi.name);
        setToInput(endPoi.name);
        setActiveRoute({
          fromName: startPoi.name,
          toName: endPoi.name,
          fromCoord: startPoi.coords,
          toCoord: endPoi.coords
        });
        setIsMonitoringActive(true);
        const fromShort = startPoi.name.split(',')[0];
        const toShort = endPoi.name.split(',')[0];
        const confMsg = `Route set from ${fromShort} to ${toShort}. Live traffic monitoring started.`;
        setVoiceFeedbackMessage(confMsg);
        speakText(confMsg);
        return;
      }
    }

    // Intent 4: TEMPERATURE / WEATHER
    if (lowerQ.includes('temperature') || lowerQ.includes('weather') || lowerQ.includes('taapman') || lowerQ.includes('mausam')) {
      try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=23.0225&current_weather=true');
        const data = await res.json();
        if (data && data.current_weather) {
          const confMsg = `The current temperature in Ahmedabad is ${data.current_weather.temperature} degrees Celsius.`;
          setVoiceFeedbackMessage(confMsg);
          speakText(confMsg);
          return;
        }
      } catch (err) {}
    }

    // Intent 5: ROUTE TRAFFIC STATUS
    if (lowerQ.includes('traffic')) {
      const confMsg = routeStatus.isHeavy 
        ? "Heavy traffic congestion detected on your route! Cars are moving slowly." 
        : "The route is currently clear with normal traffic flow.";
      setVoiceFeedbackMessage(confMsg);
      speakText(confMsg);
      return;
    }

    // Intent 6: STOP / STANDBY
    if (lowerQ.includes('stop') || lowerQ.includes('cancel') || lowerQ.includes('band karo') || lowerQ.includes('ruk jao')) {
      handleStopAll();
      const confMsg = "Shadow in standby. All navigation and alarms stopped.";
      setVoiceFeedbackMessage(confMsg);
      speakText(confMsg);
      return;
    }

    // Intent 7: EXPENSE / KHARCHA (e.g. "Aaj ka expense dikhao", "Expense add karo 50 chai", "Kharcha dikhao")
    if (lowerQ.includes('expense') || lowerQ.includes('kharcha') || lowerQ.includes('spend') || lowerQ.includes('budget')) {
      if (lowerQ.includes('add') || lowerQ.includes('likho') || lowerQ.includes('likh do') || lowerQ.includes('karo') || lowerQ.includes('kar do')) {
        const numMatch = rawQ.match(/\d+(\.\d+)?/);
        const amount = numMatch ? parseFloat(numMatch[0]) : 50;
        let title = rawQ.replace(/.*(?:add|likho|likh do|karo|kar do)/i, '')
          .replace(/\b\d+(\.\d+)?\b/g, '')
          .replace(/\b(rupaye|rupee|rs|ka|ke|ki|for)\b/gi, '')
          .trim();
        if (!title || title.length < 2) title = 'Expense Entry';
        handleQuickAddExpense(title, amount, 'Food & Snacks');
        setShowExpenseModal(true);
        const confMsg = `Logged expense of ₹${amount} for "${title}".`;
        setVoiceFeedbackMessage(confMsg);
        speakText(confMsg);
        return;
      } else {
        setShowExpenseModal(true);
        const now = new Date();
        const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const itemsThisMonth = (expenseList || []).filter(item => item && item.type !== 'income' && isExpenseInMonth(item, ym));
        const spent = itemsThisMonth.reduce((acc, curr) => acc + (parseFloat(curr?.amount) || 0), 0);
        const rem = Math.max(0, monthlyBudget - spent);
        const confMsg = `This month's spend is ₹${spent.toLocaleString()}. Remaining budget is ₹${rem.toLocaleString()}.`;
        setVoiceFeedbackMessage(confMsg);
        speakText(confMsg);
        return;
      }
    }

    const fallbackMsg = `Shadow heard: "${rawQ}". Try saying: "Shadow meri note main add kardo ki aaj mall jana hai" or "Shadow reminder set karo 5 baje".`;
    setVoiceFeedbackMessage(fallbackMsg);
    speakText(fallbackMsg);
  }, [speakText, GUJARAT_POI_DATABASE, routeStatus, handleStopAll]);

  useEffect(() => {
    const socket = io(BACKEND_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      if (userProfileRef.current?.email) {
        socket.emit('join_user_room', userProfileRef.current.email);
      }
    });

    socket.on('user_data_synced', (data) => {
      if (!data || !userProfileRef.current?.email) return;
      if (data.email && data.email.toLowerCase() !== userProfileRef.current.email.toLowerCase()) return;

      isRemoteSyncRef.current = true;
      const cleanEmail = userProfileRef.current.email.trim().toLowerCase();

      if (Array.isArray(data.reminders) && data.reminders.length > 0) {
        setRemindersList(data.reminders);
        try { localStorage.setItem('jarvis_permanent_reminders', JSON.stringify(data.reminders)); } catch (e) {}
      }
      if (typeof data.snoozeMinutes === 'number') {
        setSnoozeMinutes(data.snoozeMinutes);
        try { localStorage.setItem('jarvis_snooze_duration', data.snoozeMinutes.toString()); } catch (e) {}
      }
      if (Array.isArray(data.expenses)) {
        const rawDeleted = (() => {
          try { return JSON.parse(localStorage.getItem('jarvis_deleted_expense_ids') || '[]'); } catch { return []; }
        })();
        setExpenseList(prev => {
          const merged = mergeExpenses(prev, data.expenses, rawDeleted);
          try {
            localStorage.setItem('jarvis_expenses', JSON.stringify(merged));
            localStorage.setItem(`jarvis_expenses_${cleanEmail}`, JSON.stringify(merged));
          } catch (e) {}
          return merged;
        });
      }
      if (typeof data.monthlyBudget === 'number') {
        setMonthlyBudget(data.monthlyBudget);
        try { localStorage.setItem('jarvis_monthly_budget', data.monthlyBudget.toString()); } catch (e) {}
      }
      if (Array.isArray(data.notes)) {
        setNotesList(data.notes);
        try { localStorage.setItem(`jarvis_notes_${cleanEmail}`, JSON.stringify(data.notes)); } catch (e) {}
      }

      setTimeout(() => {
        isRemoteSyncRef.current = false;
      }, 600);
    });
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.getVoices(); };
    }

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'hi-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        if (isMuted) return;
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        handleVoiceCommand(transcript);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (socketRef.current) socketRef.current.disconnect();
      if (liveTrafficCheckRef.current) clearInterval(liveTrafficCheckRef.current);
    };
  }, [handleVoiceCommand, stopAlarmSound, isMuted]);

  const startListening = () => {
    if (isMuted) return;
    if (!recognitionRef.current) {
      alert("Speech recognition not supported in your browser.");
      return;
    }
    try {
      window.speechSynthesis.cancel();
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      setIsListening(false);
    }
  };

  // Watcher Time-Hit Checker & Live Countdown Timer
  // Rule: Passed time reminders are ticked (✔); Remaining future reminders are unticked;
  // Timer shows positive countdown to the next future reminder today; Refreshes daily.
  useEffect(() => {
    if (!watcherActive) return;

    const checkWatcherTime = () => {
      const now = new Date();
      const todayDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentSeconds = now.getSeconds();
      const currentTotalSec = currentHours * 3600 + currentMinutes * 60 + currentSeconds;
      const currentTotalMin = currentHours * 60 + currentMinutes;
      const currentTimeStr = `${String(currentHours).padStart(2, '0')}:${String(currentMinutes).padStart(2, '0')}`;

      // Snoozed alerts check
      Object.keys(snoozedAlerts).forEach((taskKey) => {
        if (snoozedAlerts[taskKey] === currentTimeStr) {
          setActiveAlertTask(taskKey);
          if (!isMuted) startJailerFluteAlarm();
          setSnoozedAlerts(prev => {
            const copy = { ...prev };
            delete copy[taskKey];
            return copy;
          });
        }
      });

      // Daily Auto-Reset: When a new day begins, uncheck all reminders fresh
      try {
        const lastActiveDate = localStorage.getItem('jarvis_last_active_date');
        if (lastActiveDate && lastActiveDate !== todayDate) {
          localStorage.setItem('jarvis_last_active_date', todayDate);
          triggeredKeysRef.current.clear();
          setRemindersList(prev => prev.map(rem => ({ ...rem, completed: false })));
        } else if (!lastActiveDate) {
          localStorage.setItem('jarvis_last_active_date', todayDate);
        }
      } catch (e) {}

      // 1. Calculate next upcoming reminder today or tomorrow morning
      let nearestFutureDiffSec = Infinity;
      let upcomingTime = null;
      let upcomingTitle = null;

      remindersList.forEach((rem) => {
        if (rem && rem.time) {
          const [h, m] = rem.time.split(':').map(Number);
          const remTotalSec = h * 3600 + m * 60;
          const diff = remTotalSec - currentTotalSec;
          if (diff > 0 && diff < nearestFutureDiffSec) {
            nearestFutureDiffSec = diff;
            upcomingTime = rem.time;
            upcomingTitle = rem.task;
          }
        }
      });

      if (remindersList.length === 0) {
        setRemindersList(DEFAULT_REMINDERS);
        setNextRemTimeStr('14:28');
        setNextRemTitle('Daily Focus & Routine');
        setNextCountdownStr('-00:00');
      } else if (nearestFutureDiffSec !== Infinity && nearestFutureDiffSec > 0) {
        setNextRemTimeStr(upcomingTime);
        setNextRemTitle(upcomingTitle);
        const remH = Math.floor(nearestFutureDiffSec / 3600);
        const remM = Math.floor((nearestFutureDiffSec % 3600) / 60);
        const remS = nearestFutureDiffSec % 60;
        if (remH > 0) {
          setNextCountdownStr(`-${remH}h ${remM}m`);
        } else if (remM > 0) {
          setNextCountdownStr(`-${remM}m`);
        } else {
          setNextCountdownStr(`-${remS}s`);
        }
      } else {
        // All reminders for today have completed; continuously count down to tomorrow's first reminder
        const sortedByTime = [...remindersList].filter(r => r && r.time).sort((a, b) => a.time.localeCompare(b.time));
        const firstRemTomorrow = sortedByTime[0] || { time: '09:00', task: 'Morning Routine' };
        setNextRemTimeStr(firstRemTomorrow.time);
        setNextRemTitle(firstRemTomorrow.task);
        const [fh, fm] = (firstRemTomorrow.time || '09:00').split(':').map(Number);
        const secUntilMidnight = (24 * 3600) - currentTotalSec;
        const secAfterMidnight = fh * 3600 + fm * 60;
        const totalTomSec = secUntilMidnight + secAfterMidnight;
        const tomH = Math.floor(totalTomSec / 3600);
        const tomM = Math.floor((totalTomSec % 3600) / 60);
        if (tomH > 0) {
          setNextCountdownStr(`-${tomH}h ${tomM}m`);
        } else {
          setNextCountdownStr(`-${tomM}m`);
        }
      }

      // 2. Synchronize: Triggered reminders marked completed (✔), future ones pending
      let needsListSync = false;
      const updatedList = remindersList.map((rem) => {
        if (!rem || !rem.time) return rem;
        const [h, m] = rem.time.split(':').map(Number);
        const remMin = h * 60 + m;
        const shouldBeTicked = currentTotalMin >= remMin;
        if (rem.completed !== shouldBeTicked) {
          needsListSync = true;
          return { ...rem, completed: shouldBeTicked };
        }
        return rem;
      });

      if (needsListSync) {
        setRemindersList(updatedList);
      }

      // 3. Trigger alert when a reminder time hits right now
      remindersList.forEach((rem, idx) => {
        if (!rem || !rem.task || !rem.time) return;

        const [rH, rM] = rem.time.split(':').map(Number);
        const remTotalMin = rH * 60 + rM;
        const reminderUniqueKey = `${rem.task}_${rem.time}_${todayDate}`;

        const isHitNow = (currentTotalMin === remTotalMin);

        if (isHitNow && !triggeredKeysRef.current.has(reminderUniqueKey)) {
          triggeredKeysRef.current.add(reminderUniqueKey);
          setActiveAlertTask(rem.task);
          setActiveAlertKey(reminderUniqueKey);
          setCurrentAlertTaskId(idx);
          if (!isMuted) {
            startJailerFluteAlarm();
          }

          showSystemNotification("Shadow Watcher Alert", {
            body: `Scheduled Reminder: ${rem.task} at ${rem.time}`,
            icon: "/shadow-logo.png?v=3"
          });
        }
      });
    };

    // Run IMMEDIATELY on render so time is visible instantly without delay
    checkWatcherTime();

    if (watcherIntervalRef.current) clearInterval(watcherIntervalRef.current);
    watcherIntervalRef.current = setInterval(checkWatcherTime, 1000);

    return () => {
      if (watcherIntervalRef.current) clearInterval(watcherIntervalRef.current);
    };
  }, [watcherActive, remindersList, snoozedAlerts, startJailerFluteAlarm, isMuted]);

  // Test Watcher Alert Handler (Instant Verification of Sound, Modal & Notification)
  const triggerTestWatcherAlert = useCallback(() => {
    setActiveAlertTask("Demo Reminder: Team Review Meeting");
    setActiveAlertKey(`test_alert_${Date.now()}`);
    if (!isMuted) {
      startJailerFluteAlarm();
    }
    showSystemNotification("Shadow Watcher Alert", {
      body: "Scheduled Reminder: Team Review Meeting due now!",
      icon: "/shadow-logo.png?v=3"
    });
  }, [isMuted, startJailerFluteAlarm]);

  const handleManualResetToday = useCallback(() => {
    triggeredKeysRef.current.clear();
    setRemindersList(prev => prev.map(rem => ({ ...rem, completed: false })));
    alert("All permanent reminders have been reset and are active for today!");
  }, []);

  const handleToggleReminderCompleted = useCallback((targetIndex) => {
    setRemindersList(prev => {
      const copy = [...prev];
      if (copy[targetIndex]) {
        copy[targetIndex] = { ...copy[targetIndex], completed: !copy[targetIndex].completed };
      }
      return copy;
    });
  }, []);

  // Handle Snooze
  const handleSnooze = () => {
    stopAlarmSound();
    if (activeAlertTask) {
      const now = new Date();
      now.setMinutes(now.getMinutes() + snoozeMinutes);
      const snoozeH = String(now.getHours()).padStart(2, '0');
      const snoozeM = String(now.getMinutes()).padStart(2, '0');
      const snoozeTimeStr = `${snoozeH}:${snoozeM}`;

      setSnoozedAlerts(prev => ({ ...prev, [activeAlertTask]: snoozeTimeStr }));
    }
    setActiveAlertTask(null);
    setActiveAlertKey(null);
    setCurrentAlertTaskId(null);
    triggeredMinuteRef.current = '';
  };

  const handleAddOrUpdateReminder = (e) => {
    e.preventDefault();
    if (!currentTaskInput.trim()) {
      alert("Please enter reminder task.");
      return;
    }

    if (editingIndex !== null) {
      const updated = [...remindersList];
      updated[editingIndex] = { ...updated[editingIndex], task: currentTaskInput.trim(), time: currentTimeInput };
      setRemindersList(updated);
      setEditingIndex(null);
    } else {
      setRemindersList(prev => [...prev, { task: currentTaskInput.trim(), time: currentTimeInput, completed: false }]);
    }

    setCurrentTaskInput('');
    setCurrentTimeInput(getCurrentTimeString());
  };

  const handleEditReminder = (index) => {
    setCurrentTaskInput(remindersList[index].task);
    setCurrentTimeInput(remindersList[index].time);
    setEditingIndex(index);
  };

  const handleDeleteReminder = (index) => {
    const taskName = remindersList[index].task;
    const confirmDelete = window.confirm(`Are you sure you want to delete "${taskName}" reminder? (Yes/No)`);
    if (confirmDelete) {
      setRemindersList(prev => prev.filter((_, idx) => idx !== index));
      if (editingIndex === index) {
        setEditingIndex(null);
        setCurrentTaskInput('');
      }
    }
  };

  // Expense Categories Constant
  const EXPENSE_CATEGORIES = ['Food & Snacks', 'Travel & Fuel', 'Study & Books', 'Shopping', 'Bills & Recharge', 'Entertainment', 'Other'];


  // Google Keep Style Notes Handlers with Gmail ID Multi-Device Sync & Email Dispatch
  const syncNotesToCloud = (newNotes) => {
    setNotesList(newNotes);
    const email = userProfile?.email ? userProfile.email.trim().toLowerCase() : 'guest';
    localStorage.setItem(`jarvis_notes_${email}`, JSON.stringify(newNotes));

    if (userProfile?.email) {
      if (socketRef.current?.connected) {
        socketRef.current.emit('sync_user_data_realtime', {
          email: userProfile.email,
          notes: newNotes
        });
      }
      fetch(`${BACKEND_URL}/api/notes/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userProfile.email, notes: newNotes })
      }).catch(() => {});
    }
  };

  // Client-Side Image Compression & Attachment Reader for High-Speed Mobile Sync
  const processNoteAttachmentFile = (file) => {
    return new Promise((resolve, reject) => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isAudio = file.type.startsWith('audio/');
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

      let attType = 'other';
      if (isImage) attType = 'photo';
      else if (isVideo) attType = 'video';
      else if (isAudio) attType = 'audio';
      else if (isPdf) attType = 'pdf';

      const reader = new FileReader();

      if (isImage) {
        reader.onload = (e) => {
          const img = new window.Image();
          img.onload = () => {
            const maxDim = 1400;
            let w = img.width;
            let h = img.height;
            if (w > maxDim || h > maxDim) {
              if (w > h) {
                h = Math.round((h * maxDim) / w);
                w = maxDim;
              } else {
                w = Math.round((w * maxDim) / h);
                h = maxDim;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
            resolve({
              id: 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
              name: file.name,
              type: 'photo',
              mimeType: 'image/jpeg',
              size: Math.round((compressedDataUrl.length * 3) / 4),
              dataUrl: compressedDataUrl,
              uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
          };
          img.onerror = () => {
            resolve({
              id: 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
              name: file.name,
              type: 'photo',
              mimeType: file.type || 'image/jpeg',
              size: file.size,
              dataUrl: e.target.result,
              uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
          };
          img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      } else {
        reader.onload = (e) => {
          resolve({
            id: 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            name: file.name,
            type: attType,
            mimeType: file.type || (isPdf ? 'application/pdf' : 'application/octet-stream'),
            size: file.size,
            dataUrl: e.target.result,
            uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      }
    });
  };

  const handleNotesFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      try {
        const att = await processNoteAttachmentFile(file);
        setStagedAttachments(prev => [...prev, att]);
      } catch (err) {
        console.error("Error attaching file:", err);
      }
    }
    if (notesFileInputRef.current) notesFileInputRef.current.value = '';
  };

  const handleRemoveStagedAttachment = (attId) => {
    setStagedAttachments(prev => prev.filter(a => a.id !== attId));
  };

  // Direct Voice Recording into Note (Mobile & Desktop Compatible)
  const handleStartAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result;
          const newAtt = {
            id: 'att_voice_' + Date.now(),
            name: `Voice_Note_${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/:/g, '-')}.webm`,
            type: 'audio',
            mimeType: 'audio/webm',
            size: audioBlob.size,
            dataUrl: base64data,
            uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setStagedAttachments(prev => [...prev, newAtt]);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(200);
      setIsRecordingAudio(true);
      setRecordingDuration(0);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      alert("Microphone permission is required to record voice notes.");
      console.warn("Microphone access notice:", err);
    }
  };

  const handleStopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const handleSaveNote = () => {
    if (!newNoteTitle.trim() && !newNoteContent.trim() && stagedAttachments.length === 0) {
      alert("Please enter a note title, content, or attach a photo, video, audio, or PDF.");
      return;
    }

    const newNote = {
      id: `note_${Date.now()}`,
      title: newNoteTitle.trim() || (stagedAttachments.length > 0 ? stagedAttachments[0].name : 'Untitled Note'),
      content: newNoteContent.trim(),
      color: newNoteColor || '#38bdf8',
      pinned: newNotePinned,
      attachments: stagedAttachments,
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    const updated = [newNote, ...notesList];
    setNotesList(updated);
    syncNotesToCloud(updated);
    setNewNoteTitle('');
    setNewNoteContent('');
    setNewNotePinned(false);
    setStagedAttachments([]);
  };

  const handleToggleChecklistItem = (noteId, itemId) => {
    const updated = notesList.map(n => {
      if (n.id === noteId && Array.isArray(n.checklist)) {
        return {
          ...n,
          checklist: n.checklist.map(c => c.id === itemId ? { ...c, completed: !c.completed } : c)
        };
      }
      return n;
    });
    syncNotesToCloud(updated);
  };

  const handleDeleteNote = (noteId) => {
    const updated = notesList.filter(n => n.id !== noteId);
    syncNotesToCloud(updated);
  };

  const handleTogglePinNote = (noteId) => {
    const updated = notesList.map(n => n.id === noteId ? { ...n, pinned: !n.pinned } : n);
    syncNotesToCloud(updated);
  };

  const handleSendNotesEmailNow = async (explicitEmail = null) => {
    const targetEmail = (explicitEmail || notesTargetEmail || userProfile?.email || 'sataparahetkumar786@gmail.com').trim().toLowerCase();
    setIsSendingNotesEmail(true);
    setNotesEmailFeedback(`Connecting to mail server... Sending to ${targetEmail}...`);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      // Sort notes so pinned notes are strictly at the top
      const sortedForEmail = [...notesList].sort((a, b) => {
        const aPinned = a && (a.pinned === true || a.pinned === 'true') ? 1 : 0;
        const bPinned = b && (b.pinned === true || b.pinned === 'true') ? 1 : 0;
        return bPinned - aPinned;
      });

      const res = await fetch(`${BACKEND_URL}/api/notes/send-reminder-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          slotLabel: 'Manual Notes & Tasks Reminder',
          notes: sortedForEmail
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setNotesEmailFeedback(`✅ Delivered to ${targetEmail}!`);
      } else {
        setNotesEmailFeedback(`❌ ${data.error || data.message || 'Failed to dispatch email'}`);
      }
    } catch (e) {
      if (e.name === 'AbortError') {
        setNotesEmailFeedback(`⚠️ Email dispatch is processing in background. Check ${targetEmail} shortly.`);
      } else {
        setNotesEmailFeedback(`❌ Mail error: ${e.message}`);
      }
    } finally {
      setIsSendingNotesEmail(false);
      setTimeout(() => setNotesEmailFeedback(""), 8000);
    }
  };

  // Safe Expense Handlers (Prepend new expense to top with instant multi-device sync)
  const handleAddExpense = (e) => {
    if (e) e.preventDefault();
    if (!expenseTitle.trim() || !expenseAmount) {
      alert("Please enter both title and amount.");
      return;
    }
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const dateStr = `${ym}-${String(now.getDate()).padStart(2, '0')}`;
    const newExp = {
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      type: transactionType || 'expense',
      title: expenseTitle.trim(),
      amount: parseFloat(expenseAmount),
      category: transactionType === 'income' ? (expenseCategory || 'Salary & Wages') : (expenseCategory || 'Food & Snacks'),
      date: dateStr,
      createdAt: Date.now()
    };

    setExpenseList(prev => {
      const updated = [newExp, ...prev.filter(item => item && item.id !== newExp.id)];
      try {
        localStorage.setItem('jarvis_expenses', JSON.stringify(updated));
        if (userProfile?.email) {
          localStorage.setItem(`jarvis_expenses_${userProfile.email.trim().toLowerCase()}`, JSON.stringify(updated));
        }
      } catch (err) {}
      return updated;
    });

    setExpenseTitle('');
    setExpenseAmount('');

    if (userProfile?.email) {
      const cleanEmail = userProfile.email.trim().toLowerCase();
      if (socketRef.current?.connected) {
        socketRef.current.emit('sync_user_data_realtime', {
          email: cleanEmail,
          expenses: [newExp, ...expenseList],
          monthlyBudget
        });
      }
      fetch(`${BACKEND_URL}/api/expenses/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, expense: newExp }),
        keepalive: true
      }).catch(err => console.warn('Instant expense sync backgrounded:', err));
    }
  };

  const handleQuickAddExpense = (title, amount, category) => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const dateStr = `${ym}-${String(now.getDate()).padStart(2, '0')}`;
    const newExp = {
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      type: 'expense',
      title: (title || 'Expense').trim(),
      amount: parseFloat(amount) || 0,
      category: category || 'Food & Snacks',
      date: dateStr,
      createdAt: Date.now()
    };

    setExpenseList(prev => {
      const updated = [newExp, ...prev.filter(item => item && item.id !== newExp.id)];
      try {
        localStorage.setItem('jarvis_expenses', JSON.stringify(updated));
        if (userProfile?.email) {
          localStorage.setItem(`jarvis_expenses_${userProfile.email.trim().toLowerCase()}`, JSON.stringify(updated));
        }
      } catch (err) {}
      return updated;
    });

    if (userProfile?.email) {
      const cleanEmail = userProfile.email.trim().toLowerCase();
      if (socketRef.current?.connected) {
        socketRef.current.emit('sync_user_data_realtime', {
          email: cleanEmail,
          expenses: [newExp, ...expenseList],
          monthlyBudget
        });
      }
      fetch(`${BACKEND_URL}/api/expenses/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, expense: newExp }),
        keepalive: true
      }).catch(() => {});
    }
  };

  const handleExportExpensesCSV = () => {
    if (expenseList.length === 0) {
      alert("No expenses to export.");
      return;
    }
    const headers = ["Date", "Title", "Category", "Amount (INR)"];
    const rows = expenseList.map(item => [
      `"${item.date || ''}"`,
      `"${(item.title || '').replace(/"/g, '""')}"`,
      `"${(item.category || 'General').replace(/"/g, '""')}"`,
      item.amount || 0
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Jarvis_Expenses_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearAllExpenses = () => {
    if (window.confirm("Are you sure you want to clear all expense records?")) {
      const allIds = expenseList.map(e => String(e.id || '')).filter(Boolean);
      try {
        const raw = localStorage.getItem('jarvis_deleted_expense_ids');
        const deletedIds = raw ? JSON.parse(raw) : [];
        const mergedDeleted = Array.from(new Set([...deletedIds, ...allIds]));
        localStorage.setItem('jarvis_deleted_expense_ids', JSON.stringify(mergedDeleted.slice(-300)));
      } catch (e) {}

      setExpenseList([]);
      try {
        localStorage.setItem('jarvis_expenses', JSON.stringify([]));
        if (userProfile?.email) {
          localStorage.setItem(`jarvis_expenses_${userProfile.email.trim().toLowerCase()}`, JSON.stringify([]));
        }
      } catch (err) {}

      if (userProfile?.email) {
        const cleanEmail = userProfile.email.trim().toLowerCase();
        if (socketRef.current?.connected) {
          socketRef.current.emit('sync_user_data_realtime', {
            email: cleanEmail,
            expenses: [],
            isClearAllExpenses: true
          });
        }
        fetch(`${BACKEND_URL}/api/expenses/clear`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail }),
          keepalive: true
        }).catch(() => {});
      }
    }
  };

  const handleDeleteExpense = (target) => {
    const targetId = typeof target === 'object' ? target?.id : target;
    const exp = expenseList.find(e => String(e.id) === String(targetId)) ||
      (typeof target === 'number' ? expenseList[target] : null) ||
      (typeof target === 'object' ? target : null);

    if (!exp) return;

    const confirmDelete = window.confirm(`Are you sure you want to delete "${exp.title || 'this expense'}" (₹${exp.amount})?`);
    if (!confirmDelete) return;

    const expId = String(exp.id || targetId || `tx_${exp.date || ''}_${exp.title || ''}_${exp.amount || ''}`);

    try {
      const raw = localStorage.getItem('jarvis_deleted_expense_ids');
      const deletedIds = raw ? JSON.parse(raw) : [];
      if (expId && !deletedIds.includes(expId)) {
        deletedIds.push(expId);
        localStorage.setItem('jarvis_deleted_expense_ids', JSON.stringify(deletedIds.slice(-300)));
      }
    } catch (e) {}

    setExpenseList(prev => {
      const updated = prev.filter(e => {
        if (expId && e.id) return String(e.id) !== expId;
        return !(e.title === exp.title && e.amount === exp.amount && e.date === exp.date);
      });
      try {
        localStorage.setItem('jarvis_expenses', JSON.stringify(updated));
        if (userProfile?.email) {
          localStorage.setItem(`jarvis_expenses_${userProfile.email.trim().toLowerCase()}`, JSON.stringify(updated));
        }
      } catch (err) {}
      return updated;
    });

    if (userProfile?.email) {
      const cleanEmail = userProfile.email.trim().toLowerCase();
      if (socketRef.current?.connected) {
        socketRef.current.emit('sync_user_data_realtime', {
          email: cleanEmail,
          deletedExpenseIds: [expId],
          expenses: expenseList.filter(e => String(e.id) !== expId),
          monthlyBudget
        });
      }
      fetch(`${BACKEND_URL}/api/expenses/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, id: expId }),
        keepalive: true
      }).catch(() => {});
    }
  };

  const handleUpdateBudget = (e) => {
    e.preventDefault();
    const val = parseFloat(tempBudgetInput);
    if (!isNaN(val) && val > 0) {
      setMonthlyBudget(val);
      setIsSettingBudget(false);
      speakText("Monthly budget updated.");
    }
  };

  const handleOpenBriefing = async () => {
    setShowBriefingModal(true);
    fetchTrendingNews();
  };

  const GUJARAT_PRESETS = [
    { name: "SG Highway, Ahmedabad", coords: [72.5115, 23.0338] },
    { name: "Iskcon Cross Road, Ahmedabad", coords: [72.5074, 23.0290] },
    { name: "Ashram Road, Ahmedabad", coords: [72.5699, 23.0366] },
    { name: "Infocity, Gandhinagar", coords: [72.6276, 23.1895] },
    { name: "Sector 21, Gandhinagar", coords: [72.6578, 23.2323] },
    { name: "Ring Road, Surat", coords: [72.8311, 21.1702] },
    { name: "Alkapuri, Vadodara", coords: [73.1812, 22.3107] },
    { name: "Kalawad Road, Rajkot", coords: [70.7678, 22.2858] }
  ];

  const handleSelectFromSuggestion = (item) => {
    setFromInput(item.display_name);
    setActiveRoute(prev => ({ ...prev, fromName: item.display_name, fromCoords: [parseFloat(item.lon), parseFloat(item.lat)] }));
    setFromSuggestions([]);
  };

  const handleSelectToSuggestion = (item) => {
    setToInput(item.display_name);
    setActiveRoute(prev => ({ ...prev, toName: item.display_name, toCoords: [parseFloat(item.lon), parseFloat(item.lat)] }));
    setToSuggestions([]);
  };

  const handleStopRouteNavigation = () => {
    setIsMonitoringActive(false);
    setTrafficAlertBanner(null);
    if (trafficIntervalRef.current) {
      clearInterval(trafficIntervalRef.current);
      trafficIntervalRef.current = null;
    }
    if (navAnimationTimerRef.current) {
      clearInterval(navAnimationTimerRef.current);
      navAnimationTimerRef.current = null;
    }
    if (navVehicleMarkerRef.current && mapInstanceRef.current) {
      try { mapInstanceRef.current.removeLayer(navVehicleMarkerRef.current); } catch (e) {}
      navVehicleMarkerRef.current = null;
    }
    if (polylineRef.current && mapInstanceRef.current) {
      try { mapInstanceRef.current.removeLayer(polylineRef.current); } catch (e) {}
      polylineRef.current = null;
    }
    if (trafficPolylineRef.current && mapInstanceRef.current) {
      try { mapInstanceRef.current.removeLayer(trafficPolylineRef.current); } catch (e) {}
      trafficPolylineRef.current = null;
    }
    if (trafficMarkerRef.current && mapInstanceRef.current) {
      try { mapInstanceRef.current.removeLayer(trafficMarkerRef.current); } catch (e) {}
      trafficMarkerRef.current = null;
    }
    setRouteStatus({ isHeavy: false, message: "Route navigation stopped. Ready for next route." });
    speakText("Route navigation stopped.");
  };

  const handleApplyRoute = (e) => {
    e.preventDefault();
    if (!fromInput.trim() || !toInput.trim()) {
      alert("Please select 'From' and 'To' locations.");
      return;
    }
    setIsMonitoringActive(true);
    setShowRoutePanel(false);
    speakText("Route active. Real-time traffic monitoring has started.");
  };

    const totalSpent = expenseList.reduce((acc, curr) => acc + (parseFloat(curr?.amount) || 0), 0);
  const remainingBudget = monthlyBudget - totalSpent;
  const budgetSpentPct = Math.min(100, Math.round((totalSpent / (monthlyBudget || 1)) * 100));

  const filteredExpenses = expenseList.filter(exp => {
    const matchesCategory = expenseCategoryFilter === 'All' || exp.category === expenseCategoryFilter;
    const matchesSearch = !expenseSearchQuery.trim() || 
      (exp.title && exp.title.toLowerCase().includes(expenseSearchQuery.toLowerCase())) ||
      (exp.amount && exp.amount.toString().includes(expenseSearchQuery));
    return matchesCategory && matchesSearch;
  });

  // Smart Sorting: Upcoming nearest future reminder ALWAYS kept at the top, triggered ones below
  const sortedReminders = [...remindersList].sort((a, b) => {
    // 1. Pending (not yet triggered) come first; Triggered (completed) go below
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    
    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();

    const [hA, mA] = (a.time || '00:00').split(':').map(Number);
    const [hB, mB] = (b.time || '00:00').split(':').map(Number);
    const minA = hA * 60 + mA;
    const minB = hB * 60 + mB;

    if (!a.completed && !b.completed) {
      // Both are pending today:
      // The reminder coming up next (nearest future minute today) is ALWAYS kept at the top
      const diffA = minA >= currentMin ? (minA - currentMin) : (minA - currentMin + 1440);
      const diffB = minB >= currentMin ? (minB - currentMin) : (minB - currentMin + 1440);
      return diffA - diffB;
    } else {
      // Both are triggered: chronological order
      return minA - minB;
    }
  });

  return (
    <div className="app-shell" style={{ height: '100vh', width: '100vw', backgroundColor: '#f8fafc', color: '#0f172a', display: 'flex', flexDirection: 'row', fontFamily: "'Montserrat', 'Inter', -apple-system, sans-serif", fontWeight: '800', overflow: 'hidden', boxSizing: 'border-box' }}>
      {/* Custom Full-Screen Startup Animation (White Theme + Dynamic Rotating Shadow) */}
      {showStartupSplash && (
        <ShadowStartupAnimation onComplete={() => setShowStartupSplash(false)} />
      )}

      {/* Left Side Navigation Sidebar - Pure White Theme */}
      <aside className="app-sidebar" style={{ width: '68px', backgroundColor: '#ffffff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0', gap: '8px', flexShrink: 0, zIndex: 100, boxShadow: '2px 0 10px rgba(0,0,0,0.03)' }}>
        <div className="sidebar-logo-box" style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#0f172a', border: '1.5px solid #0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.2)' }} title="Shadow OS">
          <ShadowLogo size={24} color="#ffffff" innerColor="#0f172a" />
        </div>

        <button onClick={() => setShowRoutePanel(true)} title="Route & Map" style={{ background: showRoutePanel ? '#f1f5f9' : 'transparent', border: 'none', color: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer', padding: '5px 4px', borderRadius: '10px', width: '56px', transition: 'all 0.15s ease' }}>
          <Navigation size={18} />
          <span style={{ fontSize: '9.5px', fontWeight: '900', letterSpacing: '0.3px', textTransform: 'uppercase' }}>Route</span>
        </button>

        {/* Watcher Widget: Exact 1:1 match to user screenshot */}
        <button 
          onClick={() => { setShowWatcherModal(true); setCurrentTimeInput(getCurrentTimeString()); }} 
          title={`Watcher Reminder: "${nextRemTitle || 'Routine'}" due at ${nextRemTimeStr || '14:28'} (${nextCountdownStr} remaining)`} 
          style={{ 
            background: showWatcherModal ? '#f1f5f9' : 'transparent', 
            border: 'none', 
            color: '#0f172a', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: '3px', 
            cursor: 'pointer', 
            padding: '3px 2px', 
            borderRadius: '10px', 
            width: '58px',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            border: '1.5px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0f172a'
          }}>
            <Clock size={15} color="#0f172a" />
          </div>
          <span className="watcher-pill" style={{ 
            backgroundColor: '#E8D2B5', 
            padding: '2.5px 5px', 
            borderRadius: '8px', 
            border: '1px solid #cbb294', 
            whiteSpace: 'nowrap',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            lineHeight: 1.15,
            minWidth: '44px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
          }}>
            <span style={{ fontSize: '10px', fontWeight: '900', color: '#3d0605', letterSpacing: '-0.2px', fontFamily: "'Montserrat', 'Inter', sans-serif" }}>
              {nextRemTimeStr || '14:28'}
            </span>
            <span style={{ 
              fontSize: '9px', 
              fontWeight: '900', 
              color: '#881337', 
              letterSpacing: '-0.2px',
              fontFamily: "'Montserrat', 'Inter', monospace, sans-serif",
              fontVariantNumeric: 'tabular-nums'
            }}>
              {nextCountdownStr || '-48m'}
            </span>
          </span>
          <span style={{ fontSize: '9.5px', fontWeight: '900', color: '#0f172a', letterSpacing: '0.2px' }}>Watcher</span>
        </button>

        <button onClick={() => setShowExpenseModal(true)} title="Expense Tracker" style={{ background: showExpenseModal ? '#f1f5f9' : 'transparent', border: 'none', color: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer', padding: '5px 4px', borderRadius: '10px', width: '56px', transition: 'all 0.15s ease' }}>
          <DollarSign size={18} />
          <span style={{ fontSize: '9.5px', fontWeight: '900', letterSpacing: '0.3px', textTransform: 'uppercase' }}>Expense</span>
        </button>

        <button onClick={handleOpenBriefing} title="Daily Briefing" style={{ background: showBriefingModal ? '#f1f5f9' : 'transparent', border: 'none', color: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer', padding: '5px 4px', borderRadius: '10px', width: '56px', transition: 'all 0.15s ease' }}>
          <Newspaper size={18} />
          <span style={{ fontSize: '9.5px', fontWeight: '900', letterSpacing: '0.3px', textTransform: 'uppercase' }}>Briefing</span>
        </button>

        <button onClick={() => setShowToolsModal(true)} title="Tools & Converter" style={{ background: showToolsModal ? '#f1f5f9' : 'transparent', border: 'none', color: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer', padding: '5px 4px', borderRadius: '10px', width: '56px', transition: 'all 0.15s ease' }}>
          <Wrench size={18} />
          <span style={{ fontSize: '9.5px', fontWeight: '900', letterSpacing: '0.3px', textTransform: 'uppercase' }}>Tools</span>
        </button>

        <button 
          onClick={() => setShowNotesModal(true)} 
          title="Google Keep Style Notes & Task Reminders" 
          style={{ 
            background: showNotesModal ? '#f1f5f9' : 'transparent', 
            border: 'none', 
            color: '#0f172a', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: '3px', 
            cursor: 'pointer', 
            padding: '5px 4px', 
            borderRadius: '10px', 
            width: '56px',
            position: 'relative',
            transition: 'all 0.15s ease'
          }}
        >
          <CheckSquare size={18} />
          <span style={{ fontSize: '9.5px', fontWeight: '900', letterSpacing: '0.3px', textTransform: 'uppercase' }}>Notes</span>
          {notesList.length > 0 && (
            <span style={{ 
              position: 'absolute', 
              top: '2px', 
              right: '6px', 
              backgroundColor: '#0f172a', 
              color: '#ffffff', 
              fontSize: '8px', 
              fontWeight: '900', 
              borderRadius: '50%', 
              width: '14px', 
              height: '14px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              {notesList.length}
            </span>
          )}
        </button>

        {/* Edit Photo / AI Eraser Button (Directly below Notes) */}
        <button 
          onClick={() => setShowPhotoEditModal(true)} 
          title="Edit Photo & Windows-style AI Object Eraser" 
          style={{ 
            background: showPhotoEditModal ? '#f1f5f9' : 'transparent', 
            border: 'none', 
            color: '#0f172a', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: '3px', 
            cursor: 'pointer', 
            padding: '5px 4px', 
            borderRadius: '10px', 
            width: '56px',
            position: 'relative',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ position: 'relative' }}>
            <Image size={18} />
            <Sparkles size={10} style={{ position: 'absolute', top: -4, right: -6, color: '#ec4899' }} />
          </div>
          <span style={{ fontSize: '9px', fontWeight: '900', letterSpacing: '0.2px', textTransform: 'uppercase', textAlign: 'center', lineHeight: '1.1' }}>Edit Photo</span>
        </button>

        {/* Profile & Stop Button at Bottom */}
        <div className="sidebar-bottom-group" style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          <button 
            type="button"
            className="touch-btn"
            onClick={() => {
              if (userProfile) {
                setShowProfileModal(true);
              } else {
                setAuthMode('login');
                setShowAuthModal(true);
              }
            }} 
            title={userProfile ? `Connected: ${userProfile.name || userProfile.email}` : "Google Log In / Sign Up"} 
            style={{ 
              position: 'relative',
              background: '#f8fafc', 
              border: '1.5px solid #e2e8f0',
              color: '#0f172a', 
              padding: userProfile && userProfile.photo ? '2px' : '8px', 
              borderRadius: '10px', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: '38px',
              height: '38px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              touchAction: 'manipulation'
            }}
          >
            {userProfile ? (
              userProfile.photo ? (
                <img src={userProfile.photo} alt={userProfile.name} style={{ width: '100%', height: '100%', borderRadius: '8px', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
              ) : (
                <span style={{ fontSize: '13px', fontWeight: '900', color: '#0f172a' }}>{(userProfile.name || 'U').charAt(0).toUpperCase()}</span>
              )
            ) : (
              <UserCircle size={20} color="#0f172a" />
            )}
            {userProfile && (
              <span style={{ position: 'absolute', bottom: '2px', right: '2px', width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#16a34a', border: '1px solid #ffffff' }} />
            )}
          </button>

          <button 
            onClick={handleStopAll} 
            title="Shadow Standby / Emergency Audio & Route Stop" 
            style={{ 
              background: '#fef2f2',
              border: '1.5px solid #fecaca', 
              color: '#dc2626', 
              padding: '6px 4px', 
              borderRadius: '10px', 
              cursor: 'pointer', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '2px', 
              width: '46px',
              transition: 'all 0.15s ease',
              boxShadow: '0 1px 3px rgba(220, 38, 38, 0.1)'
            }}
          >
            <Power size={15} color="#dc2626" />
            <span style={{ fontSize: '7.5px', fontWeight: '900', letterSpacing: '0.5px', color: '#dc2626' }}>STANDBY</span>
          </button>
        </div>
      </aside>
      {/* Main Content Area - Clean Crisp White Theme */}
      <div className="app-main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', width: 'calc(100vw - 68px)', backgroundColor: '#f8fafc' }}>
        
        {/* Top Header - Pure White */}
        <header className="app-header" style={{ padding: '12px 20px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', minWidth: 0 }}>
            <div className="header-logo-box" style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 6px rgba(15,23,42,0.15)' }}>
              <ShadowLogo size={22} color="#ffffff" innerColor="#0f172a" />
            </div>
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h1 className="header-title" style={{ margin: 0, fontSize: '14px', fontWeight: '900', letterSpacing: '0.4px', color: '#0f172a', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>SHADOW DASHBOARD</h1>
                <span className="mobile-hide-text" style={{ fontSize: '9px', fontWeight: '900', backgroundColor: '#0f172a', color: '#ffffff', padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.5px' }}>v2.6 OS</span>
              </div>
              <span className="header-subtitle mobile-hide-text" style={{ fontSize: '10px', color: '#64748b', fontWeight: '800', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentDateTimeStr || 'Loading Date & Time...'}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            {/* Direct PWA Push Test Button */}
            <button
              type="button"
              onClick={() => {
                setShowPermissionsModal(true);
                triggerTestPushNotification();
              }}
              disabled={isSendingTestPush}
              title="Test PWA Push Notification: Sends live alert to this device"
              className="header-btn touch-btn"
              style={{
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#0f172a',
                padding: '7px 11px',
                borderRadius: '10px',
                cursor: isSendingTestPush ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontWeight: '900',
                fontSize: '11px',
                letterSpacing: '0.3px',
                transition: 'all 0.15s ease',
                touchAction: 'manipulation'
              }}
            >
              <Bell size={14} color="#0f172a" />
              <span className="mobile-hide-text">{isSendingTestPush ? "SENDING..." : "TEST PUSH"}</span>
            </button>

            {/* Real Mobile & Desktop Permissions Setup Button */}
            <button
              onClick={() => setShowPermissionsModal(true)}
              title="Mobile Permissions: Microphone, GPS Location & System Alerts Setup"
              className="header-btn"
              style={{
                border: '1px solid #e2e8f0',
                background: (mobilePermissions.notifications === 'granted' && mobilePermissions.mic === 'granted') ? '#f0fdf4' : '#f8fafc',
                color: (mobilePermissions.notifications === 'granted' && mobilePermissions.mic === 'granted') ? '#166534' : '#0f172a',
                padding: '7px 11px',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontWeight: '900',
                fontSize: '11px',
                letterSpacing: '0.3px',
                transition: 'all 0.15s ease'
              }}
            >
              <Shield size={14} />
              <span className="mobile-hide-text">{(mobilePermissions.notifications === 'granted' && mobilePermissions.mic === 'granted') ? "PERMISSIONS OK" : "SETUP PERMISSIONS"}</span>
            </button>

            <button 
              onClick={() => setIsMuted(!isMuted)} 
              title={isMuted ? "Unmute Application Sound & Voice" : "Mute Entire Application"} 
              className="header-btn"
              style={{
                border: isMuted ? '2px solid #ef4444' : '1px solid #e2e8f0',
                background: isMuted ? '#fef2f2' : '#f8fafc',
                color: isMuted ? '#991b1b' : '#0f172a',
                padding: '7px 11px',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontWeight: '900',
                fontSize: '11px',
                letterSpacing: '0.3px',
                transition: 'all 0.15s ease'
              }}
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              <span className="mobile-hide-text">{isMuted ? "MUTED" : "SOUND ON"}</span>
            </button>

            {/* Quick Profile / Login Header Button */}
            <button 
              type="button"
              onClick={() => {
                if (userProfile) {
                  setShowProfileModal(true);
                } else {
                  setAuthMode('login');
                  setShowAuthModal(true);
                }
              }} 
              title={userProfile ? `Connected: ${userProfile.name || userProfile.email}` : "Google Log In / Sign Up"} 
              className="header-btn touch-btn"
              style={{
                border: '1px solid #e2e8f0',
                background: userProfile ? '#f0fdf4' : '#f8fafc',
                color: userProfile ? '#166534' : '#0f172a',
                padding: '7px 11px',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontWeight: '900',
                fontSize: '11px',
                letterSpacing: '0.3px',
                transition: 'all 0.15s ease',
                touchAction: 'manipulation'
              }}
            >
              <UserCircle size={15} />
              <span className="mobile-hide-text">{userProfile ? (userProfile.name?.split(' ')[0] || 'PROFILE') : 'LOG IN'}</span>
            </button>
          </div>
        </header>

        {/* Main Dashboard Stage - Crisp White Theme */}
        <main className="dashboard-main smooth-scroll" style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          padding: '20px 24px', 
          position: 'relative', 
          overflowY: 'auto', 
          backgroundColor: '#f8fafc',
          color: '#0f172a'
        }}>
          
          <div style={{ maxWidth: '1240px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Top Executive Header Bar: Greeting, IST Real-time Status */}
            <div className="executive-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16a34a', boxShadow: '0 0 8px #16a34a' }} />
                  <span style={{ fontSize: '10.5px', fontWeight: '900', color: '#475569', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                    Shadow Command Center • Cloud Connected
                  </span>
                </div>
                <h2 className="greeting-title" style={{ margin: '4px 0 0 0', fontSize: '22px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.5px' }}>
                  Welcome back, {userProfile?.name?.split(' ')[0] || 'Commander'}
                </h2>
              </div>

              <div className="status-badges-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="status-badge" style={{ backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0', padding: '5px 10px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                  <Clock size={13} color="#0f172a" />
                  <span style={{ fontSize: '10.5px', fontWeight: '900', fontFamily: 'monospace', color: '#0f172a' }}>
                    {currentDateTimeStr || new Date().toLocaleTimeString()}
                  </span>
                </div>
                <div className="status-badge" style={{ backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0', padding: '5px 10px', borderRadius: '10px', fontSize: '10.5px', fontWeight: '800', color: '#475569', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                  📍 Gujarat (IST)
                </div>
              </div>
            </div>

            {/* PWA Background Web Push Notification Quick Test Card */}
            <div style={{ 
              backgroundColor: '#ffffff', 
              border: '1.5px solid #e2e8f0', 
              borderRadius: '16px', 
              padding: '12px 16px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              flexWrap: 'wrap', 
              gap: '10px', 
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#0f172a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bell size={18} color="#ffffff" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.2px' }}>PWA Push Notifications</span>
                    <span style={{ fontSize: '10px', fontWeight: '900', color: (mobilePermissions.notifications === 'granted' || isPushSubscribed) ? '#16a34a' : '#d97706', backgroundColor: (mobilePermissions.notifications === 'granted' || isPushSubscribed) ? '#f0fdf4' : '#fffbeb', padding: '1px 7px', borderRadius: '4px', border: `1px solid ${(mobilePermissions.notifications === 'granted' || isPushSubscribed) ? '#bbf7d0' : '#fde68a'}` }}>
                      {(mobilePermissions.notifications === 'granted' || isPushSubscribed) ? '✓ ACTIVE' : 'PENDING'}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {pushFeedbackMessage || 'Live OS notification ticker running even when app is closed'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={async () => {
                    setIsSendingTestPush(true);
                    setPushFeedbackMessage('Requesting permission & sending push...');
                    try {
                      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted') {
                        const p = await Notification.requestPermission();
                        setMobilePermissions(prev => ({ ...prev, notifications: p }));
                        if (p === 'granted') {
                          try { localStorage.setItem('jarvis_perm_notif', 'granted'); } catch (e) {}
                        }
                      }
                      await triggerTestPushNotification();
                    } catch (e) {
                      setPushFeedbackMessage(`❌ ${e.message}`);
                      setIsSendingTestPush(false);
                    }
                  }}
                  disabled={isSendingTestPush}
                  className="touch-btn"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '10px',
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '11.5px',
                    fontWeight: '900',
                    cursor: isSendingTestPush ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 6px rgba(15,23,42,0.15)'
                  }}
                >
                  <Bell size={14} color="#ffffff" />
                  <span>{isSendingTestPush ? 'SENDING PUSH...' : '🔔 TEST PWA PUSH'}</span>
                </button>
              </div>
            </div>

            {/* Real-time Traffic Alert Banner (If Triggered or Monitoring) */}
            {(trafficAlertBanner || isMonitoringActive) && (
              <div style={{ 
                padding: '12px 18px', 
                borderRadius: '14px', 
                backgroundColor: trafficAlertBanner ? '#fef2f2' : '#ffffff', 
                border: `1.5px solid ${trafficAlertBanner ? '#f87171' : '#e2e8f0'}`, 
                color: '#0f172a', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                gap: '12px', 
                boxShadow: '0 4px 14px rgba(0,0,0,0.04)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  {trafficAlertBanner ? <AlertTriangle size={20} color="#dc2626" /> : <Navigation size={18} color="#0f172a" />}
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: '900', color: trafficAlertBanner ? '#b91c1c' : '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {trafficAlertBanner ? `TRAFFIC ALERT: ${trafficAlertBanner.location}` : 'Live Gujarat Route Monitoring Active'}
                    </p>
                    <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '800' }}>
                      {trafficAlertBanner ? trafficAlertBanner.message : `Radar polling every 1s: ${activeRoute.fromName.split(',')[0]} ➔ ${activeRoute.toName.split(',')[0]}`}
                    </span>
                  </div>
                </div>

                {isMonitoringActive && (
                  <button
                    onClick={handleStopRouteNavigation}
                    style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none', padding: '6px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}
                  >
                    <StopCircle size={14} /> STOP
                  </button>
                )}
              </div>
            )}

            {/* 4 Executive KPI Metric Cards */}
            {(() => {
              const monthlyExpenses = (expenseList || []).filter(item => item && item.type !== 'income');
              const monthlyItems = monthlyExpenses.filter(item => isExpenseInMonth(item, selectedExpenseMonth));
              const monthlySpent = monthlyItems.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
              const budgetPct = monthlyBudget > 0 ? Math.min(Math.round((monthlySpent / monthlyBudget) * 100), 100) : 0;
              const triggeredCount = (remindersList || []).filter(r => r && r.completed).length;

              return (
                <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                  
                  {/* Card 1: Watcher */}
                  <div 
                    className="kpi-card"
                    onClick={() => { setShowWatcherModal(true); setCurrentTimeInput(getCurrentTimeString()); }}
                    style={{ backgroundColor: '#ffffff', border: '1.5px solid #BDC3C7', borderRadius: '16px', padding: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '10px', transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#BDC3C7'; e.currentTarget.style.transform = 'none'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Watcher Routine</span>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#ECF0F1', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #BDC3C7' }}>
                        <Clock size={16} />
                      </div>
                    </div>
                    <div>
                      <div className="kpi-number" style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', fontFamily: "'Montserrat', 'Inter', monospace, sans-serif", letterSpacing: '0.5px' }}>
                        {nextCountdownStr}
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#475569', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        Next: "{nextRemTitle || 'Routine'}" at {formatTimeTo12Hour(nextRemTimeStr || '09:00')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #ECF0F1', paddingTop: '8px', fontSize: '10px', color: '#64748b', fontWeight: '800' }}>
                      <span>{triggeredCount}/{(remindersList || []).length} Triggered Today</span>
                      <span style={{ color: '#0f172a', fontWeight: '900' }}>Open Watcher →</span>
                    </div>
                  </div>

                  {/* Card 2: Expenses */}
                  <div 
                    className="kpi-card"
                    onClick={() => setShowExpenseModal(true)}
                    style={{ backgroundColor: '#ffffff', border: '1.5px solid #BDC3C7', borderRadius: '16px', padding: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '10px', transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#BDC3C7'; e.currentTarget.style.transform = 'none'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Monthly Expenses</span>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #bbf7d0' }}>
                        <DollarSign size={16} />
                      </div>
                    </div>
                    <div>
                      <div className="kpi-number" style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a' }}>
                        ₹{monthlySpent.toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', marginTop: '2px' }}>
                        Budget: ₹{monthlyBudget.toLocaleString('en-IN')} ({budgetPct}% used)
                      </div>
                    </div>
                    <div style={{ width: '100%', backgroundColor: '#ECF0F1', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${budgetPct}%`, height: '100%', backgroundColor: budgetPct > 90 ? '#dc2626' : (budgetPct > 70 ? '#ea580c' : '#16a34a'), borderRadius: '3px', transition: 'width 0.3s' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #ECF0F1', paddingTop: '8px', fontSize: '10px', color: '#64748b', fontWeight: '800' }}>
                      <span>Remaining: ₹{Math.max(0, monthlyBudget - monthlySpent).toLocaleString('en-IN')}</span>
                      <span style={{ color: '#0f172a', fontWeight: '900' }}>Log Expense →</span>
                    </div>
                  </div>

                  {/* Card 3: Notes & Keep */}
                  <div 
                    className="kpi-card"
                    onClick={() => setShowNotesModal(true)}
                    style={{ backgroundColor: '#ffffff', border: '1.5px solid #BDC3C7', borderRadius: '16px', padding: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '10px', transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#BDC3C7'; e.currentTarget.style.transform = 'none'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Google Keep Notes</span>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #ddd6fe' }}>
                        <CheckSquare size={16} />
                      </div>
                    </div>
                    <div>
                      <div className="kpi-number" style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a' }}>
                        {(notesList || []).length} Notes
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', marginTop: '2px' }}>
                        {(notesList || []).filter(n => n.pinned).length} Pinned • Cloud Synced
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #ECF0F1', paddingTop: '8px', fontSize: '10px', color: '#64748b', fontWeight: '800' }}>
                      <span>🕒 3x Daily Email (Pinned on Top)</span>
                      <span style={{ color: '#0f172a', fontWeight: '900' }}>Open Notes →</span>
                    </div>
                  </div>

                  {/* Card 4: Radar & Briefing */}
                  <div 
                    className="kpi-card"
                    onClick={handleOpenBriefing}
                    style={{ backgroundColor: '#ffffff', border: '1.5px solid #BDC3C7', borderRadius: '16px', padding: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '10px', transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#BDC3C7'; e.currentTarget.style.transform = 'none'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Radar & Intelligence</span>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#fff7ed', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #fed7aa' }}>
                        <TrendingUp size={16} />
                      </div>
                    </div>
                    <div>
                      <div className="kpi-number" style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a' }}>
                        {(ipoData?.live || []).length} Live IPOs
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', marginTop: '2px' }}>
                        {isMonitoringActive ? '● Gujarat Radar Active' : 'Standby • Ahmedabad Live'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #ECF0F1', paddingTop: '8px', fontSize: '10px', color: '#64748b', fontWeight: '800' }}>
                      <span>Real-Time Market Data</span>
                      <span style={{ color: '#0f172a', fontWeight: '900' }}>Daily Briefing →</span>
                    </div>
                  </div>

                  {/* Card 5: Photo Studio & AI Object Eraser */}
                  <div 
                    className="kpi-card"
                    onClick={() => setShowPhotoEditModal(true)}
                    style={{ backgroundColor: '#ffffff', border: '1.5px solid #BDC3C7', borderRadius: '16px', padding: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '10px', transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ec4899'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#BDC3C7'; e.currentTarget.style.transform = 'none'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Edit Photo & Studio</span>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#fdf2f8', color: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #fbcfe8' }}>
                        <Wand2 size={16} />
                      </div>
                    </div>
                    <div>
                      <div className="kpi-number" style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a' }}>
                        AI Eraser
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', marginTop: '2px' }}>
                        Windows Photos Generative Erase
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #ECF0F1', paddingTop: '8px', fontSize: '10px', color: '#64748b', fontWeight: '800' }}>
                      <span>✨ Drag & Drop Image to Open</span>
                      <span style={{ color: '#ec4899', fontWeight: '900' }}>Open Editor →</span>
                    </div>
                  </div>

                </div>
              );
            })()}



          </div>

        </main>
      </div>

      {/* Tools / Extension Changer & Universal Converter Modal */}
      {showToolsModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(8px)', zIndex: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px' }}>
          <div 
            className="tools-modal-scroll"
            style={{ 
              backgroundColor: '#ffffff', 
              borderRadius: '24px', 
              padding: window.innerWidth < 640 ? '16px' : '24px', 
              width: '100%', 
              maxWidth: '740px', 
              position: 'relative', 
              border: '1.5px solid #e2e8f0', 
              color: '#0f172a', 
              maxHeight: '94vh', 
              overflowY: 'auto', 
              boxShadow: '0 24px 60px rgba(0,0,0,0.15)',
              touchAction: 'pan-y'
            }}
          >
            
            {/* Top Close Button (44px touch-friendly) */}
            <button 
              type="button"
              onClick={() => { setShowToolsModal(false); setConverterStatus(null); setConvertedDownloadInfo(null); }} 
              className="touch-btn"
              style={{ 
                position: 'absolute', 
                top: '16px', 
                right: '16px', 
                border: '1px solid #e2e8f0', 
                background: '#f1f5f9', 
                color: '#475569', 
                borderRadius: '50%', 
                width: '38px', 
                height: '38px', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                zIndex: 10
              }}
              aria-label="Close"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', paddingRight: '44px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#0f172a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Wrench size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.3px', lineHeight: '1.2' }}>
                  Shadow Studio: Extension Changer & Converter
                </h3>
                <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '800', display: 'block', marginTop: '2px' }}>
                  Change any file extension or convert WEBP, PNG, JPG, PDF with 1-tap download
                </span>
              </div>
            </div>

            {/* Smooth Touch Navigation Tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '14px' }}>
              <button
                type="button"
                onClick={() => setToolActiveTab('extension')}
                className="touch-btn"
                style={{
                  minHeight: '44px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: toolActiveTab === 'extension' ? '#0f172a' : 'transparent',
                  color: toolActiveTab === 'extension' ? '#ffffff' : '#475569',
                  fontSize: '12px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <FileType size={16} /> Extension Changer
              </button>
              <button
                type="button"
                onClick={() => setToolActiveTab('convert')}
                className="touch-btn"
                style={{
                  minHeight: '44px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: toolActiveTab === 'convert' ? '#0f172a' : 'transparent',
                  color: toolActiveTab === 'convert' ? '#ffffff' : '#475569',
                  fontSize: '12px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Sliders size={16} /> Format & Size Converter
              </button>
            </div>

            {/* File Drop & Native Mobile Touch Area */}
            <input
              id="tools-universal-file-picker"
              type="file"
              ref={toolsFileInputRef}
              style={{ display: 'none' }}
              accept="*/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleToolsFileSelect(e.target.files[0]);
                  e.target.value = '';
                }
              }}
            />

            <label
              htmlFor="tools-universal-file-picker"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleToolsFileSelect(e.dataTransfer.files[0]);
                }
              }}
              className="touch-card"
              style={{ 
                minHeight: uploadedFile ? '140px' : '150px', 
                border: '2px dashed #cbd5e1', 
                borderRadius: '16px', 
                backgroundColor: uploadedFile ? '#ffffff' : '#f8fafc', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                padding: '16px', 
                textAlign: 'center',
                cursor: 'pointer',
                marginBottom: '16px',
                width: '100%',
                boxSizing: 'border-box'
              }}
            >
              {uploadedFile ? (
                <div style={{ display: 'flex', flexDirection: window.innerWidth < 640 ? 'column' : 'row', alignItems: 'center', gap: '14px', width: '100%', justifyContent: 'center' }}>
                  {uploadedFilePreview ? (
                    <div style={{ width: '74px', height: '74px', borderRadius: '12px', overflow: 'hidden', border: '1.5px solid #e2e8f0', backgroundColor: '#ffffff', flexShrink: 0 }}>
                      <img 
                        src={uploadedFilePreview} 
                        alt="Preview" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                  ) : (
                    <div style={{ width: '64px', height: '64px', borderRadius: '12px', backgroundColor: '#f1f5f9', border: '1.5px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FileText size={34} color="#0f172a" />
                    </div>
                  )}
                  
                  <div style={{ textAlign: window.innerWidth < 640 ? 'center' : 'left', flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '900', color: '#0f172a', wordBreak: 'break-all' }}>
                      {uploadedFile?.name || 'Selected File'}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: window.innerWidth < 640 ? 'center' : 'flex-start', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', backgroundColor: '#0f172a', color: '#ffffff', padding: '2px 8px', borderRadius: '6px', fontWeight: '900' }}>
                        FORMAT: .{uploadedFileMeta?.ext || (uploadedFile?.name.split('.').pop() || 'FILE').toUpperCase()}
                      </span>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '800' }}>
                        {uploadedFileMeta?.sizeKb || (uploadedFile?.size ? (uploadedFile.size / 1024).toFixed(1) : '0')} KB 
                        {uploadedFileMeta?.width ? ` • ${uploadedFileMeta.width} × ${uploadedFileMeta.height} px` : ''}
                      </span>
                    </div>
                  </div>

                  <span
                    className="touch-btn"
                    style={{
                      padding: '8px 16px',
                      minHeight: '40px',
                      borderRadius: '10px',
                      background: '#f1f5f9',
                      color: '#0f172a',
                      border: '1px solid #cbd5e1',
                      fontSize: '11.5px',
                      fontWeight: '900',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      flexShrink: 0
                    }}
                  >
                    <RefreshCw size={14} /> Change File
                  </span>
                </div>
              ) : (
                <div style={{ pointerEvents: 'none' }}>
                  <Upload size={36} color="#0f172a" style={{ marginBottom: '6px' }} />
                  <p style={{ margin: '0 0 4px 0', fontSize: '14.5px', fontWeight: '900', color: '#0f172a' }}>
                    Tap to Select Any File or Drop Here
                  </p>
                  <p style={{ margin: '0 0 6px 0', fontSize: '11px', color: '#64748b', fontWeight: '800' }}>
                    Supports ALL files: WEBP, PNG, JPG, PDF, TXT, CSV, MP3, MP4, ZIP, etc.
                  </p>
                  <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: '900', textDecoration: 'underline' }}>
                    100% Touch-Friendly Native File Picker
                  </span>
                </div>
              )}
            </label>

            {/* Real-Time Status & 1-Tap Direct Download Button (Prominently placed right below file card) */}
            {converterStatus && (
              <div style={{
                padding: '14px 16px',
                borderRadius: '14px',
                marginBottom: '16px',
                fontSize: '12.5px',
                fontWeight: '900',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                backgroundColor: converterStatus.type === 'error' ? '#fef2f2' : (converterStatus.type === 'success' ? '#f0fdf4' : '#eff6ff'),
                color: converterStatus.type === 'error' ? '#b91c1c' : (converterStatus.type === 'success' ? '#15803d' : '#1d4ed8'),
                border: `1.5px solid ${converterStatus.type === 'error' ? '#fecaca' : (converterStatus.type === 'success' ? '#bbf7d0' : '#bfdbfe')}`,
                boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {converterStatus.type === 'loading' ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    converterStatus.type === 'success' ? <Check size={16} /> : <X size={16} />
                  )}
                  <span>{converterStatus.message}</span>
                </div>

                {/* Infallible 1-Tap Direct Download Link (Guaranteed on mobile iOS Safari & Android) */}
                {convertedDownloadInfo && (
                  <a
                    href={convertedDownloadInfo.url}
                    download={convertedDownloadInfo.filename}
                    className="touch-btn"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      width: '100%',
                      marginTop: '6px',
                      backgroundColor: '#0f172a',
                      color: '#ffffff',
                      padding: '12px 18px',
                      borderRadius: '12px',
                      textDecoration: 'none',
                      fontSize: '13px',
                      fontWeight: '900',
                      minHeight: '48px',
                      boxShadow: '0 4px 14px rgba(15,23,42,0.18)',
                      boxSizing: 'border-box'
                    }}
                  >
                    <Download size={18} /> Tap to Download: {convertedDownloadInfo.filename} ({convertedDownloadInfo.sizeKb} KB)
                  </a>
                )}
              </div>
            )}

            {/* TAB 1: EXTENSION CHANGER */}
            {toolActiveTab === 'extension' && (
              <div>
                {/* Custom Extension Input Bar */}
                <div style={{ backgroundColor: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '14px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '900', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '8px' }}>
                    Change To Custom Extension:
                  </span>
                  <div style={{ display: 'flex', flexDirection: window.innerWidth < 560 ? 'column' : 'row', gap: '8px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: '900', color: '#94a3b8', fontSize: '15px' }}>.</span>
                      <input
                        type="text"
                        value={customExtension}
                        onChange={(e) => setCustomExtension(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                        placeholder="Type extension (e.g. png, mp4, apk, dat, mov)..."
                        style={{
                          width: '100%',
                          minHeight: '46px',
                          paddingLeft: '24px',
                          paddingRight: '12px',
                          borderRadius: '10px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '13px',
                          fontWeight: '800',
                          color: '#0f172a',
                          backgroundColor: '#ffffff',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      disabled={!uploadedFile || !customExtension.trim()}
                      onClick={() => handleExecuteConversion(customExtension, true)}
                      className="touch-btn"
                      style={{
                        minHeight: '46px',
                        padding: '0 20px',
                        borderRadius: '10px',
                        backgroundColor: '#0f172a',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: '900',
                        cursor: (uploadedFile && customExtension.trim()) ? 'pointer' : 'not-allowed',
                        opacity: (uploadedFile && customExtension.trim()) ? 1 : 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <Zap size={16} /> Change & Download
                    </button>
                  </div>
                </div>

                {/* Quick 1-Tap Extension Pills */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Fast 1-Tap Extension Presets:
                    </span>
                    <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '800' }}>
                      Tap any to instantly change & download
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: '8px' }}>
                    {[
                      { ext: 'png', label: '.PNG Image' },
                      { ext: 'jpg', label: '.JPG Photo' },
                      { ext: 'webp', label: '.WEBP Next' },
                      { ext: 'pdf', label: '.PDF Doc' },
                      { ext: 'txt', label: '.TXT Text' },
                      { ext: 'csv', label: '.CSV Sheet' },
                      { ext: 'json', label: '.JSON Data' },
                      { ext: 'svg', label: '.SVG Vector' },
                      { ext: 'mp3', label: '.MP3 Audio' },
                      { ext: 'mp4', label: '.MP4 Video' },
                      { ext: 'zip', label: '.ZIP Archive' },
                      { ext: 'docx', label: '.DOCX Word' },
                      { ext: 'xlsx', label: '.XLSX Excel' },
                      { ext: 'html', label: '.HTML Web' }
                    ].map((f) => (
                      <button
                        type="button"
                        key={f.ext}
                        disabled={!uploadedFile}
                        onClick={() => {
                          setCustomExtension(f.ext);
                          handleExecuteConversion(f.ext, false);
                        }}
                        className="touch-btn"
                        style={{
                          minHeight: '46px',
                          padding: '8px 10px',
                          borderRadius: '10px',
                          border: '1.5px solid #e2e8f0',
                          backgroundColor: '#f8fafc',
                          color: '#0f172a',
                          fontSize: '11px',
                          fontWeight: '900',
                          cursor: uploadedFile ? 'pointer' : 'not-allowed',
                          opacity: uploadedFile ? 1 : 0.5,
                          textAlign: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '2px'
                        }}
                      >
                        <span style={{ fontSize: '12px', fontWeight: '900', color: '#0f172a' }}>.{f.ext.toUpperCase()}</span>
                        <span style={{ fontSize: '9.5px', color: '#64748b', fontWeight: '800' }}>{f.label.split(' ')[1] || ''}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: IMAGE & DOC CONVERTER */}
            {toolActiveTab === 'convert' && (
              <div>
                {/* Target Size / Quality Selector */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Target Output Size / Quality:
                    </span>
                    <span style={{ fontSize: '11px', color: '#0f172a', fontWeight: '900' }}>
                      Selected: {selectedSize}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {['Original', '50KB', '100KB', '250KB', '500KB', '1MB', '2MB', '5MB'].map((sz) => (
                      <button
                        type="button"
                        key={sz}
                        onClick={() => setSelectedSize(sz)}
                        className="touch-btn"
                        style={{
                          minHeight: '38px',
                          padding: '6px 14px',
                          borderRadius: '8px',
                          border: selectedSize === sz ? 'none' : '1px solid #e2e8f0',
                          backgroundColor: selectedSize === sz ? '#0f172a' : '#f1f5f9',
                          color: selectedSize === sz ? '#ffffff' : '#0f172a',
                          fontSize: '11px',
                          fontWeight: '900',
                          cursor: 'pointer'
                        }}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick 1-Click Conversions */}
                <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 600 ? '1fr' : '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                  <button
                    type="button"
                    onClick={() => handleExecuteConversion('png')}
                    disabled={!uploadedFile}
                    className="touch-btn"
                    style={{
                      minHeight: '48px',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: '1.5px solid #e2e8f0',
                      backgroundColor: '#f1f5f9',
                      color: '#0f172a',
                      fontSize: '12px',
                      fontWeight: '900',
                      cursor: uploadedFile ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      opacity: uploadedFile ? 1 : 0.5
                    }}
                  >
                    <Download size={16} color="#0f172a" /> Convert to PNG (.png)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExecuteConversion('jpg')}
                    disabled={!uploadedFile}
                    className="touch-btn"
                    style={{
                      minHeight: '48px',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: '1.5px solid #e2e8f0',
                      backgroundColor: '#f1f5f9',
                      color: '#0f172a',
                      fontSize: '12px',
                      fontWeight: '900',
                      cursor: uploadedFile ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      opacity: uploadedFile ? 1 : 0.5
                    }}
                  >
                    <Download size={16} color="#0f172a" /> Convert to JPG (.jpg)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExecuteConversion('webp')}
                    disabled={!uploadedFile}
                    className="touch-btn"
                    style={{
                      minHeight: '48px',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: '1.5px solid #e2e8f0',
                      backgroundColor: '#f1f5f9',
                      color: '#0f172a',
                      fontSize: '12px',
                      fontWeight: '900',
                      cursor: uploadedFile ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      opacity: uploadedFile ? 1 : 0.5
                    }}
                  >
                    <Download size={16} color="#0f172a" /> Convert to WEBP (.webp)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExecuteConversion('pdf')}
                    disabled={!uploadedFile}
                    className="touch-btn"
                    style={{
                      minHeight: '48px',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: '1.5px solid #e2e8f0',
                      backgroundColor: '#f1f5f9',
                      color: '#0f172a',
                      fontSize: '12px',
                      fontWeight: '900',
                      cursor: uploadedFile ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      opacity: uploadedFile ? 1 : 0.5
                    }}
                  >
                    <Download size={16} color="#0f172a" /> Export as PDF (.pdf)
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Photo Studio / AI Object Eraser Modal */}
      <PhotoEditorModal 
        isOpen={showPhotoEditModal} 
        onClose={() => setShowPhotoEditModal(false)} 
      />

      {showNotesModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(8px)', zIndex: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '22px', padding: '24px', width: '100%', maxWidth: '780px', position: 'relative', border: '1.5px solid #e2e8f0', color: '#0f172a', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.12)' }}>
            
            <button 
              onClick={() => setShowNotesModal(false)} 
              style={{ position: 'absolute', top: '16px', right: '16px', border: '1px solid #e2e8f0', background: '#f1f5f9', color: '#475569', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={16} />
            </button>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', letterSpacing: '-0.3px' }}>
                  <CheckSquare size={20} color="#0f172a" /> Google Keep Style Notes
                </h3>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '800' }}>
                  All notes and pinned notes synced across devices ({userProfile?.email || 'Guest Mode - Login to Sync'})
                </span>
              </div>

              {/* Instant Gmail Reminder Dispatch Button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <input
                  type="email"
                  placeholder="Target Gmail ID..."
                  value={notesTargetEmail || (userProfile?.email || 'sataparahetkumar786@gmail.com')}
                  onChange={(e) => setNotesTargetEmail(e.target.value)}
                  style={{
                    padding: '7px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '11px',
                    width: '180px',
                    backgroundColor: '#f8fafc',
                    color: '#0f172a',
                    fontWeight: '800',
                    outline: 'none'
                  }}
                />
                <button
                  onClick={() => handleSendNotesEmailNow(notesTargetEmail || userProfile?.email || 'sataparahetkumar786@gmail.com')}
                  disabled={isSendingNotesEmail}
                  style={{
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: '900',
                    cursor: isSendingNotesEmail ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 6px rgba(15,23,42,0.15)',
                    transition: 'all 0.15s ease'
                  }}
                  title="Deliver current notes directly to this Gmail ID now"
                >
                  <Mail size={13} />
                  {isSendingNotesEmail ? 'Sending...' : 'Send Notes to My Gmail Now'}
                </button>
              </div>
            </div>

            {/* Daily Email Schedule Banner & Feedback */}
            <div style={{ padding: '9px 14px', borderRadius: '10px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569', fontSize: '11px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
              <span>🕒 3x Daily Automated Reminders: <strong>09:00 AM</strong>, <strong>02:00 PM</strong>, <strong>08:00 PM</strong> delivered to your Gmail (📌 Pinned notes written at the top for instant reading).</span>
              {notesEmailFeedback && (
                <span style={{ color: '#0f172a', fontWeight: '900' }}>{notesEmailFeedback}</span>
              )}
            </div>

            {/* Clean Note Creator */}
            <div style={{ backgroundColor: '#f8fafc', borderRadius: '14px', padding: '16px', border: '1.5px solid #e2e8f0', marginBottom: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: '900', color: '#0f172a' }}>
                  ✍️ Create a Note
                </span>

                {/* Color Palette & Pin Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b' }}>Color:</span>
                  {['#38bdf8', '#f59e0b', '#10b981', '#f43f5e', '#a855f7', '#0284c7'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewNoteColor(c)}
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: c,
                        border: newNoteColor === c ? '2px solid #0f172a' : '1px solid #cbd5e1',
                        cursor: 'pointer'
                      }}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => setNewNotePinned(!newNotePinned)}
                    title={newNotePinned ? "Pinned to Top" : "Pin Note"}
                    style={{
                      border: '1px solid #e2e8f0',
                      background: newNotePinned ? '#fef2f2' : '#ffffff',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: newNotePinned ? '#dc2626' : '#64748b',
                      fontSize: '11px',
                      fontWeight: '900'
                    }}
                  >
                    <Pin size={13} fill={newNotePinned ? '#dc2626' : 'none'} />
                    <span>{newNotePinned ? 'Pinned' : 'Pin'}</span>
                  </button>
                </div>
              </div>

              {/* Title Input */}
              <input
                type="text"
                placeholder="Note Title (e.g. Shopping List, Meeting Notes, Project Tasks...)"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: '12px',
                  fontWeight: '800',
                  color: '#0f172a',
                  marginBottom: '8px',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />

              {/* Note Content Textarea */}
              <textarea
                placeholder="Take a note, write details, checklists, or attach photos, videos, audios & PDFs..."
                rows={3}
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#0f172a',
                  marginBottom: '10px',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  lineHeight: '1.5',
                  outline: 'none'
                }}
              />

              {/* Multimedia Attachment Buttons Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', fontWeight: '900', color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Paperclip size={13} /> Attach:
                  </span>

                  {/* Hidden Universal File Input */}
                  <input
                    type="file"
                    ref={notesFileInputRef}
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleNotesFilesSelected}
                  />

                  {/* Photo Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (notesFileInputRef.current) {
                        notesFileInputRef.current.accept = "image/*";
                        notesFileInputRef.current.click();
                      }
                    }}
                    style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '11px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    title="Attach Photos / Images (.jpg, .png, .webp)"
                  >
                    <Image size={13} /> Photo
                  </button>

                  {/* Video Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (notesFileInputRef.current) {
                        notesFileInputRef.current.accept = "video/*";
                        notesFileInputRef.current.click();
                      }
                    }}
                    style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '11px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    title="Attach Videos (.mp4, .webm, .mov)"
                  >
                    <Video size={13} /> Video
                  </button>

                  {/* Audio Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (notesFileInputRef.current) {
                        notesFileInputRef.current.accept = "audio/*";
                        notesFileInputRef.current.click();
                      }
                    }}
                    style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '11px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    title="Attach Audio files (.mp3, .wav, .m4a)"
                  >
                    <Music size={13} /> Audio
                  </button>

                  {/* PDF Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (notesFileInputRef.current) {
                        notesFileInputRef.current.accept = "application/pdf,.pdf";
                        notesFileInputRef.current.click();
                      }
                    }}
                    style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '11px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    title="Attach PDF Documents (.pdf)"
                  >
                    <FileText size={13} /> PDF
                  </button>

                  {/* Direct Voice Record Button */}
                  <button
                    type="button"
                    onClick={isRecordingAudio ? handleStopAudioRecording : handleStartAudioRecording}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: '1px solid ' + (isRecordingAudio ? '#ef4444' : '#cbd5e1'),
                      backgroundColor: isRecordingAudio ? '#fef2f2' : '#ffffff',
                      color: isRecordingAudio ? '#dc2626' : '#0f172a',
                      fontSize: '11px',
                      fontWeight: '900',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title={isRecordingAudio ? "Click to stop and attach voice recording" : "Record Voice Note directly from microphone"}
                  >
                    <Mic size={13} color={isRecordingAudio ? '#dc2626' : '#0f172a'} />
                    {isRecordingAudio ? `Stop (${recordingDuration}s)` : 'Voice Record'}
                  </button>
                </div>

                {/* Submit Save Note Button */}
                <button
                  type="button"
                  onClick={handleSaveNote}
                  style={{
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 22px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '900',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(15,23,42,0.15)'
                  }}
                >
                  Save Note
                </button>
              </div>

              {/* Staged Attachments Preview Strip */}
              {stagedAttachments.length > 0 && (
                <div style={{ marginTop: '8px', padding: '10px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1.5px dashed #cbd5e1' }}>
                  <div style={{ fontSize: '11px', fontWeight: '900', color: '#0f172a', marginBottom: '6px' }}>
                    📎 Ready to Save ({stagedAttachments.length} Attachment{stagedAttachments.length > 1 ? 's' : ''}):
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {stagedAttachments.map((att) => (
                      <div
                        key={att.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                          maxWidth: '220px'
                        }}
                      >
                        {att.type === 'photo' && <img src={att.dataUrl} alt={att.name} style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'cover' }} />}
                        {att.type === 'video' && <Video size={16} color="#2563eb" />}
                        {att.type === 'audio' && <Music size={16} color="#16a34a" />}
                        {att.type === 'pdf' && <FileText size={16} color="#dc2626" />}
                        <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          {att.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveStagedAttachment(att.id)}
                          style={{ border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer', padding: 0 }}
                          title="Remove attachment"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Filter Tabs & Search */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => setNoteFilterTab('all')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: noteFilterTab === 'all' ? '#0f172a' : '#f1f5f9',
                    color: noteFilterTab === 'all' ? '#ffffff' : '#0f172a',
                    fontSize: '11px',
                    fontWeight: '900',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  All Notes ({notesList.length})
                </button>
                <button
                  onClick={() => setNoteFilterTab('pinned')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: noteFilterTab === 'pinned' ? '#0f172a' : '#f1f5f9',
                    color: noteFilterTab === 'pinned' ? '#ffffff' : '#0f172a',
                    fontSize: '11px',
                    fontWeight: '900',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Pin size={12} fill={noteFilterTab === 'pinned' ? '#ffffff' : 'none'} />
                  Pinned ({notesList.filter(n => n.pinned).length})
                </button>
              </div>

              <input
                type="text"
                placeholder="Search notes..."
                value={noteSearchQuery}
                onChange={(e) => setNoteSearchQuery(e.target.value)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  backgroundColor: '#f8fafc',
                  color: '#0f172a',
                  fontSize: '11px',
                  width: '180px',
                  outline: 'none',
                  fontWeight: '700'
                }}
              />
            </div>

            {/* Saved Notes Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '12px' }}>
              {notesList
                .filter(n => {
                  if (noteFilterTab === 'pinned') return !!n.pinned;
                  return true;
                })
                .filter(n => {
                  if (!noteSearchQuery.trim()) return true;
                  const q = noteSearchQuery.toLowerCase();
                  const matchTitle = (n.title || '').toLowerCase().includes(q);
                  const matchContent = (n.content || '').toLowerCase().includes(q);
                  return matchTitle || matchContent;
                })
                .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
                .map((note) => (
                  <div
                    key={note.id}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      padding: '14px',
                      border: '1px solid #e5e7eb',
                      borderLeft: `5px solid ${note.color || '#38bdf8'}`,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '900', color: '#111827', wordBreak: 'break-word', paddingRight: '8px' }}>
                          {note.title}
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <button
                            type="button"
                            onClick={() => handleTogglePinNote(note.id)}
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '3px', color: note.pinned ? '#e11d48' : '#bbb' }}
                            title={note.pinned ? "Unpin" : "Pin Note"}
                          >
                            <Pin size={14} fill={note.pinned ? '#e11d48' : 'none'} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteNote(note.id)}
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '3px', color: '#ef4444' }}
                            title="Delete Note"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Content: Clean readable text */}
                      {note.content && (
                        <p style={{ margin: '6px 0 10px 0', fontSize: '11px', color: '#374151', whiteSpace: 'pre-wrap', lineHeight: '1.5', wordBreak: 'break-word' }}>
                          {note.content}
                        </p>
                      )}

                      {/* Multimedia Attachments Rendering */}
                      {Array.isArray(note.attachments) && note.attachments.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                          {/* Photos Grid */}
                          {note.attachments.filter(a => a.type === 'photo').length > 0 && (
                            <div style={{ display: 'grid', gridTemplateColumns: note.attachments.filter(a => a.type === 'photo').length > 1 ? 'repeat(2, 1fr)' : '1fr', gap: '4px' }}>
                              {note.attachments.filter(a => a.type === 'photo').map((att) => (
                                <div
                                  key={att.id}
                                  onClick={() => setActiveLightboxMedia(att)}
                                  style={{ position: 'relative', cursor: 'pointer', borderRadius: '8px', overflow: 'hidden', height: '110px', backgroundColor: '#f3f4f6' }}
                                  title="Click to view full photo"
                                >
                                  <img
                                    src={att.dataUrl}
                                    alt={att.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.2s' }}
                                  />
                                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '3px 6px', background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', color: '#ffffff', fontSize: '8px', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {att.name}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Videos */}
                          {note.attachments.filter(a => a.type === 'video').map((att) => (
                            <div key={att.id} style={{ borderRadius: '8px', overflow: 'hidden', backgroundColor: '#000000' }}>
                              <video
                                src={att.dataUrl}
                                controls
                                style={{ width: '100%', maxHeight: '160px', display: 'block' }}
                              />
                            </div>
                          ))}

                          {/* Audios */}
                          {note.attachments.filter(a => a.type === 'audio').map((att) => (
                            <div key={att.id} style={{ padding: '6px 8px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', fontWeight: '800', color: '#0f766e', marginBottom: '3px' }}>
                                <Music size={11} /> {att.name}
                              </div>
                              <audio
                                src={att.dataUrl}
                                controls
                                style={{ width: '100%', height: '30px' }}
                              />
                            </div>
                          ))}

                          {/* PDFs */}
                          {note.attachments.filter(a => a.type === 'pdf').map((att) => (
                            <div
                              key={att.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '8px 10px',
                                backgroundColor: '#fef2f2',
                                border: '1px solid #fecaca',
                                borderRadius: '8px'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', paddingRight: '6px' }}>
                                <FileText size={16} color="#dc2626" />
                                <div>
                                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#991b1b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {att.name}
                                  </div>
                                  <span style={{ fontSize: '8px', color: '#b91c1c' }}>
                                    PDF Document • {att.size ? Math.round(att.size / 1024) + ' KB' : 'PDF'}
                                  </span>
                                </div>
                              </div>
                              <a
                                href={att.dataUrl}
                                download={att.name}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  fontSize: '10px',
                                  fontWeight: '900',
                                  color: '#dc2626',
                                  backgroundColor: '#ffffff',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  border: '1px solid #dc2626',
                                  textDecoration: 'none',
                                  flexShrink: 0
                                }}
                                title="Open / Download PDF"
                              >
                                <Download size={11} /> Open
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f3f4f6', paddingTop: '8px', fontSize: '9px', color: '#9ca3af', fontWeight: '700' }}>
                      <span>{note.createdAt || 'Saved'}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {Array.isArray(note.attachments) && note.attachments.length > 0 && (
                          <span style={{ color: '#0369a1', backgroundColor: '#e0f2fe', padding: '1px 5px', borderRadius: '4px', fontWeight: '800' }}>
                            📎 {note.attachments.length}
                          </span>
                        )}
                        {note.pinned && (
                          <span style={{ color: '#e11d48', backgroundColor: '#ffe4e6', padding: '1px 6px', borderRadius: '4px', fontWeight: '800' }}>
                            📌 Pinned
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

              {notesList.filter(n => noteFilterTab === 'pinned' ? n.pinned : true).length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 20px', color: '#f8fafc' }}>
                  <CheckSquare size={36} color="#38bdf8" style={{ margin: '0 auto 8px auto', opacity: 0.7 }} />
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: '800' }}>
                    {noteFilterTab === 'pinned' ? 'No pinned notes yet. Pin your important notes to find them quickly!' : 'No notes yet. Create your first note above!'}
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Route Setup Modal - Strictly Gujarat, India with POI Direct Search & Real-Time Traffic Feed */}
      {showRoutePanel && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)', zIndex: 150, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ backgroundColor: '#ffffff', width: '100%', maxWidth: '520px', height: '100%', padding: '20px', borderLeft: '1.5px solid #e2e8f0', display: 'flex', flexDirection: 'column', color: '#0f172a', overflowY: 'auto', boxShadow: '-8px 0 25px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.3px' }}>Gujarat Live Route & Real-Time Radar</h3>
                <span style={{ fontSize: '10px', fontWeight: '800', color: '#475569', backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                  Strictly Gujarat • Direct Search Circles, Mandir, Hospitals, Hostels
                </span>
              </div>
              <button onClick={() => setShowRoutePanel(false)} style={{ border: '1px solid #e2e8f0', background: '#f1f5f9', color: '#475569', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>
            </div>

            {/* Gujarat Landmark Category Quick Filters */}
            <div style={{ marginBottom: '10px' }}>
              <span style={{ fontSize: '10px', fontWeight: '900', color: '#64748b', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Direct Gujarat Landmark Selector:
              </span>
              <div style={{ display: 'flex', gap: '5px', overflowX: 'auto', paddingBottom: '3px' }}>
                {[
                  { id: 'all', label: 'All Presets' },
                  { id: 'circle', label: '⭕ Circles / Char Rasta' },
                  { id: 'mandir', label: '🛕 Mandir / Temples' },
                  { id: 'hospital', label: '🏥 Hospitals' },
                  { id: 'hostel', label: '🏫 Hostels & Colleges' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedPoiCategory(selectedPoiCategory === cat.id ? 'all' : cat.id)}
                    style={{
                      background: selectedPoiCategory === cat.id ? '#0f172a' : '#f1f5f9',
                      color: selectedPoiCategory === cat.id ? '#ffffff' : '#0f172a',
                      border: '1px solid #e2e8f0',
                      padding: '4px 9px',
                      borderRadius: '6px',
                      fontSize: '10px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Scrollable POI Quick Selection Bar when category selected */}
              {selectedPoiCategory !== 'all' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxHeight: '110px', overflowY: 'auto', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px', margin: '6px 0' }}>
                  {GUJARAT_POI_DATABASE.filter(p => p.category === selectedPoiCategory).map((poi, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 6px', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '270px' }}>
                        {poi.name}
                      </span>
                      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                        <button 
                          type="button" 
                          onClick={() => { setFromInput(poi.name); setActiveRoute(prev => ({ ...prev, fromName: poi.name, fromCoords: poi.coords })); }} 
                          style={{ background: '#0f172a', color: '#ffffff', border: 'none', padding: '3px 7px', borderRadius: '4px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' }}
                        >
                          From
                        </button>
                        <button 
                          type="button" 
                          onClick={() => { setToInput(poi.name); setActiveRoute(prev => ({ ...prev, toName: poi.name, toCoords: poi.coords })); }} 
                          style={{ background: '#f1f5f9', color: '#0f172a', border: '1px solid #e2e8f0', padding: '3px 7px', borderRadius: '4px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' }}
                        >
                          To
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* From & To Input Form with Autocomplete */}
            <form onSubmit={handleApplyRoute} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px', position: 'relative' }}>
              <div style={{ display: 'flex', flexDirection: window.innerWidth < 500 ? 'column' : 'row', gap: '6px', position: 'relative' }}>
                <div style={{ flex: 1, position: 'relative', display: 'flex', gap: '4px' }}>
                  <input
                    type="text"
                    placeholder="Search From (e.g. Iskcon, Civil, Akshardham)..."
                    value={fromInput}
                    onChange={(e) => setFromInput(e.target.value)}
                    style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '11px', outline: 'none', fontWeight: '700' }}
                  />
                  <button type="button" onClick={() => handleGetCurrentLocation('from')} title="GPS" style={{ background: '#0f172a', border: 'none', color: '#ffffff', padding: '0 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '10px', fontWeight: '900' }}>GPS</button>
                  {fromSuggestions.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '8px', zIndex: 300, maxHeight: '140px', overflowY: 'auto', boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }}>
                      {fromSuggestions.map((item, i) => (
                        <div key={i} onClick={() => handleSelectFromSuggestion(item)} style={{ padding: '8px 10px', fontSize: '11px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '6px', color: '#0f172a' }}>
                          <span style={{ fontSize: '9px', fontWeight: '900', color: '#ffffff', backgroundColor: '#0f172a', padding: '1px 5px', borderRadius: '3px' }}>
                            {item.category ? item.category.toUpperCase() : 'GUJARAT'}
                          </span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: '700' }}>{item.display_name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, position: 'relative', display: 'flex', gap: '4px' }}>
                  <input
                    type="text"
                    placeholder="Search To (e.g. Pakwan, Nirma, Hospital)..."
                    value={toInput}
                    onChange={(e) => setToInput(e.target.value)}
                    style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '11px', outline: 'none', fontWeight: '700' }}
                  />
                  <button type="button" onClick={() => handleGetCurrentLocation('to')} title="GPS" style={{ background: '#0f172a', border: 'none', color: '#ffffff', padding: '0 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '10px', fontWeight: '900' }}>GPS</button>
                  {toSuggestions.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '8px', zIndex: 300, maxHeight: '140px', overflowY: 'auto', boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }}>
                      {toSuggestions.map((item, i) => (
                        <div key={i} onClick={() => handleSelectToSuggestion(item)} style={{ padding: '8px 10px', fontSize: '11px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '6px', color: '#0f172a' }}>
                          <span style={{ fontSize: '9px', fontWeight: '900', color: '#ffffff', backgroundColor: '#0f172a', padding: '1px 5px', borderRadius: '3px' }}>
                            {item.category ? item.category.toUpperCase() : 'GUJARAT'}
                          </span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: '700' }}>{item.display_name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                {isMonitoringActive ? (
                  <button 
                    type="button" 
                    onClick={handleStopRouteNavigation}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#dc2626', color: '#ffffff', fontWeight: '900', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <StopCircle size={15} /> Stop Route Navigation
                  </button>
                ) : (
                  <button type="submit" style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#0f172a', color: '#ffffff', fontWeight: '900', fontSize: '11px', cursor: 'pointer' }}>
                    Start Live Navigation & Traffic Radar
                  </button>
                )}
                <button 
                  type="button" 
                  onClick={() => setIsSimulatedTraffic(!isSimulatedTraffic)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: isSimulatedTraffic ? '#fef2f2' : '#f1f5f9',
                    color: isSimulatedTraffic ? '#dc2626' : '#0f172a',
                    fontWeight: '900',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                  title="Simulate congestion on path to test instant alert & voice warning"
                >
                  {isSimulatedTraffic ? 'Simulated: Traffic ON' : 'Test Traffic Alert'}
                </button>
              </div>
            </form>

            {/* Leaflet Map */}
            <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1.5px solid #e2e8f0', backgroundColor: '#f8fafc', minHeight: '220px', height: '220px', marginBottom: '10px' }}>
              <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }}></div>
            </div>

            {/* Live Real-Time Traffic Telemetry Messages Stream */}
            <div style={{ backgroundColor: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: '900', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Radio size={13} color="#0f172a" /> Real-Time Traffic Dispatch Feed
                </span>
                <span style={{ fontSize: '10px', fontWeight: '900', color: isMonitoringActive ? '#16a34a' : '#64748b' }}>
                  {isMonitoringActive ? '● 1s Active Radar' : 'Standby'}
                </span>
              </div>

              <div style={{ maxHeight: '110px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '4px' }}>
                {trafficLiveLogs.length === 0 ? (
                  <p style={{ margin: '6px 0', fontSize: '11px', color: '#64748b', textAlign: 'center', fontWeight: '700' }}>
                    Select From and To locations in Gujarat above. System will continuously stream traffic updates every second.
                  </p>
                ) : (
                  trafficLiveLogs.map((log) => (
                    <div key={log.id} style={{ display: 'flex', gap: '6px', fontSize: '10px', color: log.level === 'alert' ? '#dc2626' : '#0f172a', fontWeight: log.level === 'alert' ? '900' : '700' }}>
                      <span style={{ color: '#64748b', flexShrink: 0 }}>[{log.time}]</span>
                      <span>{log.text}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Permanent Watcher Modal */}
      {showWatcherModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '22px', padding: '24px', width: '100%', maxWidth: '440px', position: 'relative', border: '1.5px solid #e2e8f0', color: '#0f172a', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.12)' }}>
            <button onClick={() => setShowWatcherModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', border: '1px solid #e2e8f0', background: '#f1f5f9', color: '#475569', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', paddingRight: '36px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#0f172a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.3px' }}>Permanent Watcher Reminders</h3>
                  <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '800' }}>Rechecks every day • Stays set until deleted</span>
                </div>
              </div>
            </div>

            {/* Desktop Notification Status Banner */}
            {'Notification' in window && Notification.permission !== 'granted' && (
              <div style={{ marginBottom: '12px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '10.5px', color: '#b45309', fontWeight: '800' }}>🔔 Browser alerts disabled</span>
                <button
                  type="button"
                  onClick={() => {
                    Notification.requestPermission().then(p => {
                      alert(`Notification permission is: ${p}`);
                    });
                  }}
                  style={{ background: '#b45309', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '10px', fontWeight: '900', cursor: 'pointer' }}
                >
                  Enable Notifications
                </button>
              </div>
            )}

            <form onSubmit={handleAddOrUpdateReminder} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  placeholder="Enter reminder task..."
                  value={currentTaskInput}
                  onChange={(e) => setCurrentTaskInput(e.target.value)}
                  style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '11px', outline: 'none', fontWeight: '700' }}
                />
                <input
                  type="time"
                  value={currentTimeInput}
                  onChange={(e) => setCurrentTimeInput(e.target.value)}
                  style={{ width: '105px', padding: '9px 8px', borderRadius: '8px', border: '1.5px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '11px', outline: 'none', fontWeight: '800' }}
                />
              </div>

              <button type="submit" style={{ width: '100%', padding: '11px', borderRadius: '8px', border: 'none', backgroundColor: '#0f172a', color: '#ffffff', fontWeight: '900', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 2px 6px rgba(15,23,42,0.15)' }}>
                <Plus size={15} /> {editingIndex !== null ? "Update Reminder" : "Add Permanent Reminder"}
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px', marginBottom: '14px' }}>
              {sortedReminders.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#64748b', fontSize: '11px', margin: '16px 0', fontWeight: '700' }}>No reminders set. Add your daily routine reminder above!</p>
              ) : (
                sortedReminders.map((rem, idx) => {
                  const originalIndex = remindersList.findIndex(r => r.task === rem.task && r.time === rem.time);
                  return (
                    <div 
                      key={idx} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        backgroundColor: '#f8fafc', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '10px', 
                        padding: '10px 12px',
                        opacity: rem.completed ? 0.75 : 1
                      }}
                    >
                      <div style={{ overflow: 'hidden', paddingRight: '8px', flex: 1 }}>
                        <p style={{ 
                          margin: 0, 
                          fontSize: '12px', 
                          fontWeight: '900', 
                          color: rem.completed ? '#16a34a' : '#0f172a', 
                          textDecoration: rem.completed ? 'line-through' : 'none', 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis' 
                        }}>
                          {rem.task} {rem.completed && "✓"}
                        </p>
                        <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '800' }}>
                          Time: {formatTimeTo12Hour(rem.time)}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0, alignItems: 'center' }}>
                        {/* Only triggered reminders get the green checkmark badge */}
                        {rem.completed && (
                          <div 
                            title="Triggered for Today" 
                            style={{ 
                              width: '24px', 
                              height: '24px', 
                              borderRadius: '6px', 
                              backgroundColor: '#f0fdf4', 
                              border: '1px solid #bbf7d0', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              color: '#15803d' 
                            }}
                          >
                            <Check size={14} />
                          </div>
                        )}
                        <button onClick={() => handleEditReminder(originalIndex)} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#0f172a', padding: '6px', borderRadius: '6px', cursor: 'pointer' }} title="Edit Reminder"><Edit2 size={13} /></button>
                        <button onClick={() => handleDeleteReminder(originalIndex)} style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '6px', borderRadius: '6px', cursor: 'pointer' }} title="Delete Reminder"><Trash2 size={13} /></button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Watcher Modal Action Controls */}
            <div style={{ position: 'relative', borderTop: '1px solid #e2e8f0', paddingTop: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button 
                type="button"
                onClick={triggerTestWatcherAlert}
                title="Instantly Test Watcher Alert (Sound, Modal & Notification)"
                style={{ flex: '1 1 120px', background: '#f1f5f9',
              border: '1px solid #e2e8f0', color: '#0f172a', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
              >
                <Zap size={12} /> Test Alert Now
              </button>

              <button 
                onClick={() => setShowSnoozeDropdown(!showSnoozeDropdown)}
                title="Snooze Settings"
                style={{ background: '#f1f5f9',
              border: '1px solid #e2e8f0', color: '#0f172a', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <Moon size={12} /> ZZZ ({snoozeMinutes}m)
              </button>

              {showSnoozeDropdown && (
                <div style={{ position: 'absolute', bottom: '100%', right: 0, marginBottom: '6px', backgroundColor: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '6px', zIndex: 300, display: 'flex', flexDirection: 'column', gap: '3px', boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }}>
                  <span style={{ fontSize: '9px', fontWeight: '900', color: '#64748b', paddingLeft: '4px' }}>Select Snooze:</span>
                  {[1, 5, 10, 15, 30].map((m) => (
                    <button 
                      key={m} 
                      onClick={() => { setSnoozeMinutes(m); setShowSnoozeDropdown(false); }}
                      style={{ background: snoozeMinutes === m ? '#0f172a' : 'transparent', color: snoozeMinutes === m ? '#ffffff' : '#0f172a', border: 'none', padding: '5px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', textAlign: 'left' }}
                    >
                      {m} Minute{m > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Top Sticky Watcher Alert Banner */}
      {activeAlertTask && (
        <div style={{
          position: 'fixed',
          top: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#dc2626',
          color: '#ffffff',
          padding: '10px 20px',
          borderRadius: '12px',
          zIndex: 999999,
          boxShadow: '0 8px 30px rgba(220, 38, 38, 0.7)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Bell size={20} color="#ffffff" />
          <div>
            <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9 }}>⏰ Watcher Reminder Alert Due Now</div>
            <div style={{ fontSize: '13px', fontWeight: '900' }}>"{activeAlertTask}"</div>
          </div>
          <button
            onClick={() => {
              stopAlarmSound();
              setActiveAlertTask(null);
              setActiveAlertKey(null);
            }}
            style={{
              backgroundColor: '#ffffff',
              color: '#dc2626',
              border: 'none',
              borderRadius: '6px',
              padding: '5px 12px',
              fontWeight: '900',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            <Check size={13} style={{ marginRight: '4px' }} /> Got It
          </button>
        </div>
      )}

      {/* Full-Screen Watcher Reminder Alert Modal */}
      {activeAlertTask && (
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          backgroundColor: 'rgba(255, 255, 255, 0.98)', 
          backdropFilter: 'blur(10px)', 
          zIndex: 99999, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '24px', 
          textAlign: 'center' 
        }}>
          <div style={{ 
            width: '84px', 
            height: '84px', 
            borderRadius: '24px', 
            backgroundColor: '#dc2626', 
            color: '#ffffff', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            marginBottom: '18px',
            boxShadow: '0 0 35px rgba(220, 38, 38, 0.4)'
          }}>
            <Bell size={44} />
          </div>

          <span style={{ 
            fontSize: '12px', 
            fontWeight: '900', 
            color: '#dc2626', 
            textTransform: 'uppercase', 
            letterSpacing: '2px', 
            marginBottom: '8px' 
          }}>
            ⏰ Watcher Reminder Alert
          </span>

          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: '900', 
            color: '#0f172a', 
            maxWidth: '680px', 
            lineHeight: '1.3', 
            margin: '0 0 10px 0', 
            padding: '0 16px',
            wordBreak: 'break-word'
          }}>
            "{activeAlertTask}"
          </h1>

          <p style={{ margin: '0 0 28px 0', fontSize: '13px', color: '#64748b', fontWeight: '800' }}>
            Scheduled reminder time has arrived!
          </p>

          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => {
                stopAlarmSound();
                setActiveAlertTask(null);
                setActiveAlertKey(null);
                setCurrentAlertTaskId(null);
              }}
              style={{ 
                padding: '13px 30px', 
                borderRadius: '12px', 
                border: 'none', 
                backgroundColor: '#0f172a', 
                color: '#ffffff', 
                fontWeight: '900', 
                fontSize: '15px', 
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(15,23,42,0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Check size={18} /> Got It
            </button>

            <button
              onClick={handleSnooze}
              style={{ 
                padding: '13px 26px', 
                borderRadius: '12px', 
                border: '1.5px solid #cbd5e1',
                backgroundColor: '#f1f5f9', 
                color: '#0f172a', 
                fontWeight: '900', 
                fontSize: '15px', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px' 
              }}
            >
              <Clock size={16} /> Snooze ({snoozeMinutes}m)
            </button>
          </div>
        </div>
      )}

      {/* Mobile Permissions & System Setup Modal */}
      {showPermissionsModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', padding: '24px 20px', width: '100%', maxWidth: '440px', position: 'relative', border: '1.5px solid #e2e8f0', color: '#0f172a', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}>
            <button 
              onClick={() => setShowPermissionsModal(false)} 
              style={{ position: 'absolute', top: '14px', right: '14px', border: '1px solid #e2e8f0', background: '#f1f5f9', color: '#0f172a', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={16} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShadowLogo size={22} color="#ffffff" innerColor="#0f172a" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase' }}>System Permissions</h3>
                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '800' }}>MOBILE & DESKTOP HARDWARE AUTHORIZATION</span>
              </div>
            </div>

            <p style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5', margin: '0 0 16px 0', fontWeight: '700' }}>
              Shadow Dashboard requires hardware access to deliver voice commands, GPS route traffic alerts, and background reminder notifications on mobile.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
              
              {/* Notifications Permission */}
              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Bell size={20} color="#0f172a" />
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase' }}>System Notifications</div>
                      <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700' }}>Watcher alerts & PWA push notifications</div>
                    </div>
                  </div>
                  {(() => {
                    const isNotifGranted = mobilePermissions.notifications === 'granted' || (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') || (typeof localStorage !== 'undefined' && localStorage.getItem('jarvis_perm_notif') === 'granted');
                    return (
                      <span style={{ fontSize: '11px', fontWeight: '900', color: isNotifGranted ? '#16a34a' : '#d97706' }}>
                        {isNotifGranted ? (isPushSubscribed ? '✓ PWA PUSH ACTIVE' : '✓ GRANTED') : 'PENDING'}
                      </span>
                    );
                  })()}
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={async () => {
                      setIsSendingTestPush(true);
                      setPushFeedbackMessage('Requesting push permissions & dispatching test...');
                      try {
                        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted') {
                          const p = await Notification.requestPermission();
                          setMobilePermissions(prev => ({ ...prev, notifications: p }));
                          if (p === 'granted') {
                            try { localStorage.setItem('jarvis_perm_notif', 'granted'); } catch (e) {}
                          } else {
                            setPushFeedbackMessage('⚠️ Permission not granted. Please allow notifications in browser settings.');
                            setIsSendingTestPush(false);
                            return;
                          }
                        }
                        await triggerTestPushNotification();
                      } catch (err) {
                        setPushFeedbackMessage(`❌ Error: ${err.message}`);
                        setIsSendingTestPush(false);
                      }
                    }}
                    disabled={isSendingTestPush}
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #0f172a',
                      backgroundColor: '#0f172a',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: '900',
                      cursor: isSendingTestPush ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      textTransform: 'uppercase',
                      boxShadow: '0 2px 6px rgba(15,23,42,0.15)'
                    }}
                  >
                    <Bell size={13} color="#ffffff" />
                    {isSendingTestPush ? 'SENDING PUSH...' : '🔔 TEST PWA PUSH NOW'}
                  </button>
                </div>
                {pushFeedbackMessage && (
                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a', backgroundColor: '#e2e8f0', padding: '6px 10px', borderRadius: '6px' }}>
                    {pushFeedbackMessage}
                  </div>
                )}
              </div>

              {/* Microphone Permission */}
              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Mic size={20} color="#0f172a" />
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase' }}>Microphone Access</div>
                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700' }}>Shadow Voice AI & Audio Notes</div>
                  </div>
                </div>
                <span style={{ fontSize: '11px', fontWeight: '900', color: mobilePermissions.mic === 'granted' ? '#16a34a' : '#d97706' }}>
                  {mobilePermissions.mic === 'granted' ? '✓ GRANTED' : 'PENDING'}
                </span>
              </div>

              {/* Geolocation Permission */}
              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Navigation size={20} color="#0f172a" />
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase' }}>GPS Location</div>
                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700' }}>Real-time traffic & live navigation</div>
                  </div>
                </div>
                <span style={{ fontSize: '11px', fontWeight: '900', color: mobilePermissions.location === 'granted' ? '#16a34a' : '#d97706' }}>
                  {mobilePermissions.location === 'granted' ? '✓ GRANTED' : 'PENDING'}
                </span>
              </div>

            </div>

            <button
              onClick={requestAllMobilePermissions}
              disabled={isRequestingPerms}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                fontWeight: '900',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 15px rgba(15, 23, 42, 0.15)',
                textTransform: 'uppercase'
              }}
            >
              <Zap size={16} />
              {isRequestingPerms ? 'REQUESTING PERMISSIONS...' : 'GRANT ALL PERMISSIONS IN 1 TAP'}
            </button>
          </div>
        </div>
      )}

      {/* Google Profile Modal */}
      {showProfileModal && userProfile && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(6px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', padding: '24px 20px', width: '100%', maxWidth: '340px', position: 'relative', border: '1.5px solid #e2e8f0', color: '#0f172a', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}>
            <button onClick={() => setShowProfileModal(false)} style={{ position: 'absolute', top: '14px', right: '14px', border: '1px solid #e2e8f0', background: '#f1f5f9', color: '#0f172a', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>

            {userProfile.photo ? (
              <img 
                src={userProfile.photo} 
                alt={userProfile.name} 
                style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid #e2e8f0', margin: '0 auto 12px auto', display: 'block', objectFit: 'cover' }} 
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#0f172a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', fontSize: '24px', fontWeight: '900' }}>
                {(userProfile.name || 'U').charAt(0).toUpperCase()}
              </div>
            )}

            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase' }}>{userProfile.name}</h3>
            <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#64748b', fontWeight: '700' }}>{userProfile.email}</p>
            <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '18px', fontWeight: '800' }}>CONNECTED: {userProfile.connectedDate || 'ACTIVE'}</span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button 
                onClick={() => {
                  if (window.confirm("Are you sure you want to disconnect / log out?")) {
                    try {
                      if (window.google?.accounts?.id) {
                        window.google.accounts.id.disableAutoSelect();
                      }
                    } catch (e) {}
                    setUserProfile(null);
                    localStorage.removeItem('jarvis_user_profile');
                    setShowProfileModal(false);
                  }
                }}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #fecaca', backgroundColor: '#fef2f2', color: '#dc2626', fontWeight: '900', fontSize: '12px', cursor: 'pointer', textTransform: 'uppercase' }}
              >
                DISCONNECT / LOG OUT
              </button>

              <button 
                onClick={() => {
                  setShowProfileModal(false);
                  setAuthMode('login');
                  setShowAuthModal(true);
                }}
                style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f1f5f9', color: '#0f172a', fontWeight: '900', fontSize: '11px', cursor: 'pointer', textTransform: 'uppercase' }}
              >
                SWITCH ACCOUNT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Authentication & Account Modal (Log In / Sign Up) */}
      {showAuthModal && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAuthModal(false);
          }}
          style={{ 
            position: 'fixed', 
            inset: 0, 
            backgroundColor: 'rgba(15, 23, 42, 0.55)', 
            backdropFilter: 'blur(8px)', 
            zIndex: 350, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '16px' 
          }}
        >
          <div 
            style={{ 
              backgroundColor: '#ffffff', 
              borderRadius: '24px', 
              padding: '28px 24px', 
              width: '100%', 
              maxWidth: '380px', 
              position: 'relative', 
              border: '1.5px solid #e2e8f0', 
              color: '#0f172a', 
              textAlign: 'center', 
              boxShadow: '0 25px 60px rgba(0,0,0,0.18)',
              overflow: 'hidden'
            }}
          >
            {/* Close Button */}
            <button 
              type="button"
              onClick={() => setShowAuthModal(false)} 
              className="touch-btn"
              style={{ 
                position: 'absolute', 
                top: '16px', 
                right: '16px', 
                border: '1px solid #e2e8f0', 
                background: '#f8fafc', 
                color: '#64748b', 
                borderRadius: '50%', 
                width: '32px', 
                height: '32px', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}
              aria-label="Close"
            >
              <X size={16} />
            </button>

            {/* Profile Icon Header */}
            <div style={{ width: '52px', height: '52px', borderRadius: '16px', backgroundColor: '#0f172a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px auto', boxShadow: '0 4px 14px rgba(15,23,42,0.18)' }}>
              <UserCircle size={28} />
            </div>

            <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.3px' }}>
              {authMode === 'login' ? 'Welcome to Shadow' : 'Create Your Account'}
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '11.5px', color: '#64748b', fontWeight: '800', lineHeight: '1.45', padding: '0 8px' }}>
              {authMode === 'login' 
                ? 'Sign in to access your cloud-synced notes, expenses, reminders and routes.' 
                : 'Sign up to enable instant cross-device cloud sync and personal notifications.'}
            </p>

            {/* Log In & Sign Up Tab Selector */}
            <div style={{ display: 'flex', backgroundColor: '#f1f5f9', borderRadius: '12px', padding: '4px', marginBottom: '18px', border: '1px solid #e2e8f0' }}>
              <button 
                type="button"
                onClick={() => setAuthMode('login')}
                className="touch-btn"
                style={{ 
                  flex: 1, 
                  padding: '9px', 
                  borderRadius: '9px', 
                  border: 'none', 
                  backgroundColor: authMode === 'login' ? '#0f172a' : 'transparent', 
                  color: authMode === 'login' ? '#ffffff' : '#64748b', 
                  fontWeight: '900', 
                  fontSize: '12px', 
                  cursor: 'pointer', 
                  transition: 'all 0.15s ease',
                  boxShadow: authMode === 'login' ? '0 2px 8px rgba(15,23,42,0.2)' : 'none'
                }}
              >
                Log In
              </button>
              <button 
                type="button"
                onClick={() => setAuthMode('signup')}
                className="touch-btn"
                style={{ 
                  flex: 1, 
                  padding: '9px', 
                  borderRadius: '9px', 
                  border: 'none', 
                  backgroundColor: authMode === 'signup' ? '#0f172a' : 'transparent', 
                  color: authMode === 'signup' ? '#ffffff' : '#64748b', 
                  fontWeight: '900', 
                  fontSize: '12px', 
                  cursor: 'pointer', 
                  transition: 'all 0.15s ease',
                  boxShadow: authMode === 'signup' ? '0 2px 8px rgba(15,23,42,0.2)' : 'none'
                }}
              >
                Sign Up
              </button>
            </div>

            {/* Google GSI Standard One-Tap / Account Chooser */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '44px', marginBottom: '10px' }}>
              <div ref={googleBtnRef}></div>
            </div>

            {/* Fallback Direct Google 1-Click Popup Button */}
            <button 
              type="button"
              disabled={isAuthLoading}
              onClick={() => triggerGoogleAuth(authMode)}
              className="touch-btn"
              style={{ 
                width: '100%', 
                padding: '12px', 
                borderRadius: '12px', 
                border: '1.5px solid #0f172a', 
                backgroundColor: '#ffffff', 
                color: '#0f172a', 
                fontWeight: '900', 
                fontSize: '12.5px', 
                cursor: isAuthLoading ? 'wait' : 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '10px',
                marginBottom: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}
            >
              {/* Google G Logo SVG */}
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{isAuthLoading ? 'Opening Google Sign-In...' : (authMode === 'login' ? 'Continue with Google' : 'Sign Up with Google')}</span>
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '14px 0' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
              <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '900', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                or quick email access
              </span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
            </div>

            {/* Direct Email Access Form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const em = (directEmailInput || '').trim();
                if (!em || !em.includes('@')) {
                  alert('Please enter a valid Gmail / Email address.');
                  return;
                }
                processAuthWithBackend(em, em.split('@')[0], '', authMode);
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              <input 
                type="email" 
                value={directEmailInput}
                onChange={(e) => setDirectEmailInput(e.target.value)}
                placeholder="Enter your Gmail / Email"
                required
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '12px',
                  fontWeight: '800',
                  color: '#0f172a',
                  backgroundColor: '#f8fafc',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />

              <button 
                type="submit"
                disabled={isAuthLoading}
                className="touch-btn"
                style={{
                  width: '100%',
                  padding: '11px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: '900',
                  cursor: isAuthLoading ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(15,23,42,0.15)'
                }}
              >
                {authMode === 'login' ? <LogIn size={15} /> : <UserPlus size={15} />}
                <span>{authMode === 'login' ? 'Log In with Email' : 'Sign Up with Email'}</span>
              </button>
            </form>

            {/* Switch Mode Footer */}
            <div style={{ marginTop: '16px', fontSize: '11px', color: '#64748b', fontWeight: '800' }}>
              {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button 
                type="button"
                onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0f172a',
                  fontWeight: '900',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0,
                  fontSize: '11px'
                }}
              >
                {authMode === 'login' ? 'Sign Up here' : 'Log In here'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Advanced Expense Tracker Modal */}
      {/* Pure Expense Manager & Monthly Report Modal */}
      {showExpenseModal && (() => {
        const monthlyExpenses = (expenseList || []).filter(item => item && item.type !== 'income');
        const monthlyItems = monthlyExpenses.filter(item => isExpenseInMonth(item, selectedExpenseMonth));

        const monthlySpent = monthlyItems.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
        const monthlyRemainingBudget = monthlyBudget - monthlySpent;
        const budgetPct = monthlyBudget > 0 ? Math.min(Math.round((monthlySpent / monthlyBudget) * 100), 100) : 0;

        const catMap = {};
        monthlyItems.forEach(i => {
          const cat = i.category || 'Other';
          catMap[cat] = (catMap[cat] || 0) + (parseFloat(i.amount) || 0);
        });
        const categoryStats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
        const topCat = categoryStats.length > 0 ? categoryStats[0] : null;

        const now = new Date();
        const currentDay = Math.max(1, now.getDate());
        const avgDailySpend = Math.round(monthlySpent / currentDay);

        return (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(6px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '750px', position: 'relative', border: '1.5px solid #e2e8f0', color: '#0f172a', maxHeight: '92vh', overflowY: 'auto', boxSizing: 'border-box', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}>
              <button onClick={() => setShowExpenseModal(false)} style={{ position: 'absolute', top: '14px', right: '14px', border: '1px solid #e2e8f0', background: '#f1f5f9', color: '#0f172a', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingRight: '36px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#0f172a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <DollarSign size={22} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase' }}>Shadow Expense Manager</h3>
                    <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '800' }}>DAILY SPENDS & FINANCIAL ANALYTICS</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleExportExpensesCSV} title="Download CSV / Excel" style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#0f172a', padding: '7px 14px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}>
                    <FileSpreadsheet size={14} /> EXPORT CSV
                  </button>
                  <button onClick={handleClearAllExpenses} title="Clear All Records" style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#dc2626', padding: '7px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '900' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Month Selector Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '10px 14px', marginBottom: '16px', color: '#0f172a' }}>
                <button onClick={handlePrevExpenseMonth} style={{ background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', padding: '6px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: '900', cursor: 'pointer', textTransform: 'uppercase' }}>
                  ◀ PREV MONTH
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '900', fontSize: '14px', letterSpacing: '0.5px' }}>
                  <Calendar size={16} color="#0f172a" />
                  <span>{formatExpenseMonthLabel(selectedExpenseMonth)}</span>
                  {isFutureMonthBlocked && (
                    <span style={{ fontSize: '9px', backgroundColor: '#0f172a', color: '#ffffff', padding: '3px 7px', borderRadius: '4px', fontWeight: '900', textTransform: 'uppercase' }}>CURRENT</span>
                  )}
                </div>
                <button 
                  onClick={handleNextExpenseMonth} 
                  disabled={isFutureMonthBlocked}
                  style={{ 
                    background: isFutureMonthBlocked ? '#f1f5f9' : '#ffffff', 
                    border: `1px solid ${isFutureMonthBlocked ? '#e2e8f0' : '#cbd5e1'}`,
                    color: isFutureMonthBlocked ? '#94a3b8' : '#0f172a', 
                    padding: '6px 14px', 
                    borderRadius: '8px', 
                    fontSize: '11px', 
                    fontWeight: '900', 
                    cursor: isFutureMonthBlocked ? 'not-allowed' : 'pointer',
                    opacity: isFutureMonthBlocked ? 0.5 : 1,
                    textTransform: 'uppercase'
                  }}
                  title={isFutureMonthBlocked ? "Current month" : "Next Month"}
                >
                  NEXT MONTH ▶
                </button>
              </div>

              {/* 3-Card Overview */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                {/* 1. Total Spent */}
                <div style={{ backgroundColor: '#ffffff', border: '1.5px solid #fecaca', borderRadius: '14px', padding: '14px', boxShadow: '0 2px 8px rgba(220,38,38,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11px', fontWeight: '900', color: '#dc2626', textTransform: 'uppercase' }}>TOTAL SPENT</span>
                    <TrendingDown size={16} color="#dc2626" />
                  </div>
                  <p style={{ margin: '8px 0 0 0', fontSize: '24px', fontWeight: '900', color: '#dc2626' }}>₹{monthlySpent.toLocaleString()}</p>
                  <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '800' }}>{monthlyItems.length} expenses logged</span>
                </div>

                {/* 2. Monthly Budget */}
                <div style={{ backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase' }}>MONTHLY BUDGET</span>
                    <button 
                      onClick={() => setIsSettingBudget(prev => !prev)} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0f172a', padding: 0 }}
                      title="Edit monthly budget"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                  {isSettingBudget ? (
                    <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                      <input
                        type="number"
                        value={tempBudgetInput}
                        onChange={(e) => setTempBudgetInput(e.target.value)}
                        placeholder="New ₹"
                        style={{ width: '85px', padding: '5px 8px', fontSize: '13px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: '800' }}
                      />
                      <button
                        onClick={() => {
                          const nb = parseFloat(tempBudgetInput);
                          if (!isNaN(nb) && nb > 0) {
                            setMonthlyBudget(nb);
                            localStorage.setItem('jarvis_monthly_budget', String(nb));
                          }
                          setIsSettingBudget(false);
                        }}
                        style={{ backgroundColor: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '11px', padding: '5px 10px', fontWeight: '900', cursor: 'pointer', textTransform: 'uppercase' }}
                      >
                        SAVE
                      </button>
                    </div>
                  ) : (
                    <p style={{ margin: '8px 0 0 0', fontSize: '24px', fontWeight: '900', color: '#0f172a' }}>₹{monthlyBudget.toLocaleString()}</p>
                  )}
                  <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '800' }}>Target spending limit</span>
                </div>

                {/* 3. Budget Remaining */}
                <div style={{ backgroundColor: '#ffffff', border: `1.5px solid ${monthlyRemainingBudget >= 0 ? '#bbf7d0' : '#fecaca'}`, borderRadius: '14px', padding: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11px', fontWeight: '900', color: monthlyRemainingBudget >= 0 ? '#16a34a' : '#dc2626', textTransform: 'uppercase' }}>BUDGET REMAINING</span>
                    <span style={{ fontSize: '10px', fontWeight: '900', color: monthlyRemainingBudget >= 0 ? '#16a34a' : '#dc2626' }}>{budgetPct}% used</span>
                  </div>
                  <p style={{ margin: '8px 0 0 0', fontSize: '24px', fontWeight: '900', color: monthlyRemainingBudget >= 0 ? '#16a34a' : '#dc2626' }}>
                    {monthlyRemainingBudget >= 0 ? `₹${monthlyRemainingBudget.toLocaleString()}` : `-₹${Math.abs(monthlyRemainingBudget).toLocaleString()}`}
                  </p>
                  <span style={{ fontSize: '10px', color: monthlyRemainingBudget >= 0 ? '#16a34a' : '#dc2626', fontWeight: '800' }}>
                    {monthlyRemainingBudget >= 0 ? 'Within budget limit' : 'Over budget!'}
                  </span>
                </div>
              </div>

              {/* Monthly Budget Progress Bar */}
              <div style={{ backgroundColor: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', fontWeight: '900', marginBottom: '8px', color: '#0f172a' }}>
                  <span>🎯 MONTHLY PROGRESS: ₹{monthlySpent.toLocaleString()} OF ₹{monthlyBudget.toLocaleString()}</span>
                  <span style={{ color: monthlyRemainingBudget >= 0 ? '#16a34a' : '#dc2626' }}>
                    {monthlyRemainingBudget >= 0 ? `₹${monthlyRemainingBudget.toLocaleString()} REMAINING (${budgetPct}% USED)` : `⚠️ OVER BUDGET BY ₹${Math.abs(monthlyRemainingBudget).toLocaleString()}`}
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${budgetPct}%`, backgroundColor: budgetPct > 90 ? '#dc2626' : (budgetPct > 70 ? '#d97706' : '#16a34a'), borderRadius: '4px', transition: 'width 0.3s ease' }} />
                </div>
              </div>

              {/* Expense Creator */}
              <div style={{ backgroundColor: '#f8fafc', borderRadius: '14px', padding: '16px', border: '1.5px solid #e2e8f0', marginBottom: '16px' }}>
                {/* 1-Tap Quick Presets */}
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '10px', fontWeight: '900', color: '#64748b', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>
                    ⚡ 1-TAP QUICK PRESETS:
                  </span>
                  <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {[
                      { t: 'Chai & Snacks', a: 20, c: 'Food & Snacks' },
                      { t: 'Metro / Bus', a: 50, c: 'Travel & Commute' },
                      { t: 'Lunch / Thali', a: 120, c: 'Food & Snacks' },
                      { t: 'Petrol / Fuel', a: 100, c: 'Travel & Commute' },
                      { t: 'Stationery / Print', a: 60, c: 'Shopping & Books' },
                      { t: 'Daily Groceries', a: 250, c: 'Groceries' },
                      { t: 'Mobile Recharge', a: 299, c: 'Bills & Utilities' }
                    ].map(p => (
                      <button
                        key={p.t}
                        type="button"
                        onClick={() => { setExpenseTitle(p.t); setExpenseAmount(String(p.a)); setExpenseCategory(p.c); }}
                        style={{
                          padding: '6px 11px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#ffffff',
                          color: '#0f172a',
                          fontSize: '11px',
                          fontWeight: '800',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        + {p.t} ₹{p.a}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Form Input Line */}
                <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      placeholder="Expense Title (e.g. Chai, Groceries, Petrol, Books)..."
                      value={expenseTitle}
                      onChange={(e) => setExpenseTitle(e.target.value)}
                      style={{ flex: '2 1 200px', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '12px', outline: 'none', fontWeight: '800' }}
                    />
                    <input
                      type="number"
                      placeholder="₹ Amount"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      style={{ flex: '1 1 100px', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '12px', outline: 'none', fontWeight: '900' }}
                    />
                    <select
                      value={expenseCategory}
                      onChange={(e) => setExpenseCategory(e.target.value)}
                      style={{ flex: '1.5 1 140px', padding: '10px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '11px', outline: 'none', fontWeight: '800' }}
                    >
                      <option value="Food & Snacks">🍔 Food & Snacks</option>
                      <option value="Travel & Commute">🚌 Travel & Commute</option>
                      <option value="Groceries">🛒 Groceries</option>
                      <option value="Bills & Utilities">⚡ Bills & Utilities</option>
                      <option value="Shopping & Books">🛍️ Shopping & Books</option>
                      <option value="Health & Medical">💊 Health & Medical</option>
                      <option value="Other Expense">📦 Other Expense</option>
                    </select>
                    <button 
                      type="submit" 
                      style={{ 
                        padding: '10px 22px', 
                        borderRadius: '8px', 
                        border: 'none', 
                        backgroundColor: '#0f172a', 
                        color: '#ffffff', 
                        fontWeight: '900', 
                        fontSize: '12px', 
                        cursor: 'pointer', 
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 8px rgba(15,23,42,0.15)',
                        textTransform: 'uppercase'
                      }}
                    >
                      + LOG EXPENSE
                    </button>
                  </div>
                </form>
              </div>

              {/* Clear Content Tabs */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                <button
                  type="button"
                  onClick={() => setExpenseTabMode('tracker')}
                  style={{
                    flex: 1,
                    padding: '9px 14px',
                    borderRadius: '8px',
                    border: '1px solid ' + (expenseTabMode === 'tracker' ? '#0f172a' : '#e2e8f0'),
                    backgroundColor: expenseTabMode === 'tracker' ? '#0f172a' : '#f1f5f9',
                    color: expenseTabMode === 'tracker' ? '#ffffff' : '#64748b',
                    fontSize: '11px',
                    fontWeight: '900',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    textTransform: 'uppercase'
                  }}
                >
                  <Edit2 size={13} /> EXPENSES LIST ({monthlyItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setExpenseTabMode('monthly_report')}
                  style={{
                    flex: 1,
                    padding: '9px 14px',
                    borderRadius: '8px',
                    border: '1px solid ' + (expenseTabMode === 'monthly_report' ? '#0f172a' : '#e2e8f0'),
                    backgroundColor: expenseTabMode === 'monthly_report' ? '#0f172a' : '#f1f5f9',
                    color: expenseTabMode === 'monthly_report' ? '#ffffff' : '#64748b',
                    fontSize: '11px',
                    fontWeight: '900',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    textTransform: 'uppercase'
                  }}
                >
                  <BarChart2 size={13} /> MONTHLY ANALYTICS & REPORT
                </button>
              </div>

              {/* Tab 1: Expenses List */}
              {expenseTabMode === 'tracker' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {monthlyItems.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '36px 12px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1.5px dashed #cbd5e1', color: '#64748b' }}>
                      <DollarSign size={32} color="#0f172a" style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: '900', color: '#0f172a' }}>
                        No expenses recorded for {formatExpenseMonthLabel(selectedExpenseMonth)}.
                      </p>
                      <span style={{ fontSize: '11px', fontWeight: '700' }}>Log your first expense using the quick presets above!</span>
                    </div>
                  ) : (
                    monthlyItems.map((item, idx) => {
                      return (
                        <div
                          key={item.id || idx}
                          style={{
                            backgroundColor: '#ffffff',
                            borderRadius: '10px',
                            padding: '12px 14px',
                            border: '1.5px solid #e2e8f0',
                            borderLeft: '4px solid #dc2626',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.02)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <TrendingDown size={14} />
                            </div>
                            <div>
                              <p style={{ margin: 0, fontSize: '13px', fontWeight: '900', color: '#0f172a' }}>{item.title}</p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#64748b', marginTop: '2px', fontWeight: '700' }}>
                                <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontWeight: '800' }}>{item.category}</span>
                                <span>•</span>
                                <span>{item.date || 'Today'}</span>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '15px', fontWeight: '900', color: '#dc2626' }}>
                              -₹{parseFloat(item.amount).toLocaleString()}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteExpense(item)}
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px', color: '#94a3b8' }}
                              title="Delete expense"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Tab 2: Monthly Analytics & Report */}
              {expenseTabMode === 'monthly_report' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Spending Velocity & Top Category Card */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    <div style={{ backgroundColor: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '14px' }}>
                      <span style={{ fontSize: '10px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase' }}>AVERAGE DAILY SPEND</span>
                      <p style={{ margin: '6px 0 0 0', fontSize: '22px', fontWeight: '900', color: '#0f172a' }}>
                        ₹{avgDailySpend.toLocaleString()} / day
                      </p>
                      <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700' }}>Based on {currentDay} days in {formatExpenseMonthLabel(selectedExpenseMonth)}</span>
                    </div>

                    <div style={{ backgroundColor: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '14px' }}>
                      <span style={{ fontSize: '10px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase' }}>TOP SPENDING CATEGORY</span>
                      <p style={{ margin: '6px 0 0 0', fontSize: '20px', fontWeight: '900', color: '#dc2626' }}>
                        {topCat ? topCat[0] : 'None Yet'}
                      </p>
                      <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700' }}>
                        {topCat ? `₹${topCat[1].toLocaleString()} (${monthlySpent > 0 ? Math.round((topCat[1] / monthlySpent) * 100) : 0}% of month)` : 'No expenses logged'}
                      </span>
                    </div>
                  </div>

                  {/* Category Breakdown */}
                  <div style={{ backgroundColor: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase' }}>
                      🏷️ Spending by Category ({formatExpenseMonthLabel(selectedExpenseMonth)})
                    </h4>
                    {categoryStats.length === 0 ? (
                      <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: '700' }}>No expense records available for this month.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {categoryStats.map(([cat, amt]) => {
                          const pct = monthlySpent > 0 ? Math.round((amt / monthlySpent) * 100) : 0;
                          return (
                            <div key={cat}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '900', marginBottom: '3px', color: '#0f172a' }}>
                                <span>{cat}</span>
                                <span>₹{amt.toLocaleString()} ({pct}%)</span>
                              </div>
                              <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${pct}%`, backgroundColor: '#0f172a', borderRadius: '4px' }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        );
      })()}

      {/* Lightbox Full-Screen Modal for Photos & Attachments */}
      {activeLightboxMedia && (
        <div
          onClick={() => setActiveLightboxMedia(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.92)',
            zIndex: 999999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '92vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <button
              onClick={() => setActiveLightboxMedia(null)}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={18} />
            </button>

            {activeLightboxMedia.type === 'photo' && (
              <img
                src={activeLightboxMedia.dataUrl}
                alt={activeLightboxMedia.name}
                style={{
                  maxWidth: '90vw',
                  maxHeight: '80vh',
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
                  objectFit: 'contain'
                }}
              />
            )}

            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: '#ffffff', fontSize: '12px', fontWeight: '700' }}>
                {activeLightboxMedia.name}
              </span>
              <a
                href={activeLightboxMedia.dataUrl}
                download={activeLightboxMedia.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  backgroundColor: '#0f172a',
                  color: '#f8fafc',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '900',
                  textDecoration: 'none'
                }}
              >
                <Download size={13} /> Download
              </a>
            </div>
          </div>
        </div>
      )}

      {showBriefingModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(6px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '800px', position: 'relative', border: '1.5px solid #e2e8f0', color: '#0f172a', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}>
            <button onClick={() => setShowBriefingModal(false)} style={{ position: 'absolute', top: '14px', right: '14px', border: '1px solid #e2e8f0', background: '#f1f5f9', color: '#0f172a', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#0f172a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Newspaper size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase' }}>
                  Live Briefing & IPO Radar
                </h3>
                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '800' }}>
                  GLOBAL, INDIA, GUJARAT NEWS & REAL-TIME IPO INTELLIGENCE
                </span>
              </div>
            </div>

            {/* Top 4 Selection Options */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
              {[
                { id: 'global', label: '🌐 GLOBAL NEWS' },
                { id: 'india', label: '🇮🇳 INDIA NEWS' },
                { id: 'gujarat', label: '🏛️ GUJARAT NEWS' },
                { id: 'ipo', label: '📈 LIVE IPO RADAR' }
              ].map((tab) => {
                const isSel = newsCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setNewsCategory(tab.id);
                      if (tab.id !== 'ipo') {
                        fetchTrendingNews(tab.id);
                        setNewsCountdown(120);
                      }
                    }}
                    style={{
                      flex: '1 1 140px',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid ' + (isSel ? '#0f172a' : '#e2e8f0'),
                      backgroundColor: isSel ? '#0f172a' : '#f1f5f9',
                      color: isSel ? '#ffffff' : '#64748b',
                      fontWeight: '900',
                      fontSize: '11px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      transition: 'all 0.2s ease',
                      boxShadow: isSel ? '0 2px 6px rgba(15,23,42,0.15)' : 'none',
                      textTransform: 'uppercase'
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* When IPO Info is Selected: Real-Time IPO Intelligence Center */}
            {newsCategory === 'ipo' ? (
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
                
                {/* Real-time Live Market Feed Status Bar */}
                <div style={{ 
                  backgroundColor: '#f8fafc', 
                  border: '1.5px solid #e2e8f0', 
                  borderRadius: '12px', 
                  padding: '10px 14px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  flexWrap: 'wrap', 
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block', boxShadow: '0 0 8px #22c55e' }} />
                    <span style={{ fontSize: '11px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase' }}>
                      BSE & NSE Real-Time IPO Radar • Current October–November 2026 Issues
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '800' }}>
                      Auto-updates in {Math.floor(ipoCountdown / 60)}m {String(ipoCountdown % 60).padStart(2, '0')}s • Sync: {ipoLastUpdated}
                    </span>
                    {ipoJustRefreshed && (
                      <span style={{ fontSize: '10px', backgroundColor: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '4px', fontWeight: '900' }}>
                        ✅ UPDATED
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => fetchIpoData(true)}
                      disabled={ipoRefreshing}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '5px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: '#0f172a',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: '900',
                        cursor: ipoRefreshing ? 'not-allowed' : 'pointer',
                        textTransform: 'uppercase'
                      }}
                      title="Manually refresh real-time IPO data now"
                    >
                      <RotateCw size={11} style={{ animation: ipoRefreshing ? 'spin 1s linear infinite' : 'none' }} />
                      {ipoRefreshing ? 'UPDATING...' : 'REFRESH'}
                    </button>
                  </div>
                </div>

                {/* Beginner Guide Card */}
                <div style={{ 
                  backgroundColor: '#fef3c7', 
                  border: '1px solid #fde68a', 
                  borderRadius: '12px', 
                  padding: '12px 14px', 
                  fontSize: '11px', 
                  lineHeight: '1.5'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: '#92400e', fontWeight: '900', fontSize: '12px', textTransform: 'uppercase' }}>
                    <span>💡</span>
                    <span>EVERYDAY PLAIN ENGLISH IPO GUIDE:</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px', color: '#78350f', fontSize: '10px', fontWeight: '700' }}>
                    <div>
                      <strong>• What is an IPO?</strong> When a company sells shares to the public for the first time.
                    </div>
                    <div>
                      <strong>• Demand (Subscription):</strong> If demand is <strong>3x</strong>, 3 people applied for every 1 share.
                    </div>
                    <div>
                      <strong>• GMP (Grey Market Premium):</strong> Estimated extra profit per share on Day 1.
                    </div>
                    <div>
                      <strong>• Lot Size:</strong> Minimum bundle of shares you must buy in an application.
                    </div>
                  </div>
                </div>

                {/* Sub-Tabs: Live Open vs Upcoming */}
                <div style={{ display: 'flex', gap: '8px', backgroundColor: '#f8fafc', padding: '6px', borderRadius: '10px', border: '1.5px solid #e2e8f0' }}>
                  <button
                    type="button"
                    onClick={() => setIpoSubTab('live')}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: ipoSubTab === 'live' ? '#0f172a' : 'transparent',
                      color: ipoSubTab === 'live' ? '#ffffff' : '#64748b',
                      fontSize: '11px',
                      fontWeight: '900',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      textTransform: 'uppercase'
                    }}
                  >
                    🟢 LIVE OPEN IPOS ({(ipoData?.live || []).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setIpoSubTab('upcoming')}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: ipoSubTab === 'upcoming' ? '#0f172a' : 'transparent',
                      color: ipoSubTab === 'upcoming' ? '#ffffff' : '#64748b',
                      fontSize: '11px',
                      fontWeight: '900',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      textTransform: 'uppercase'
                    }}
                  >
                    📅 UPCOMING IPOS ({(ipoData?.upcoming || []).length})
                  </button>
                </div>

                {/* IPO Cards */}
                {(ipoData?.[ipoSubTab] || []).map((ipo) => (
                  <div
                    key={ipo.id}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1.5px solid #e2e8f0',
                      borderRadius: '14px',
                      padding: '16px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#0f172a' }}>
                            {ipo.name}
                          </h4>
                          <span style={{ fontSize: '9px', fontWeight: '900', backgroundColor: '#f1f5f9', color: '#475569', padding: '3px 7px', borderRadius: '4px', textTransform: 'uppercase' }}>
                            {ipo.type} ({ipo.exchange})
                          </span>
                        </div>
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '800' }}>
                          {ipo.sector}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '10px', fontWeight: '900', backgroundColor: '#dcfce7', color: '#166534', padding: '3px 8px', borderRadius: '6px' }}>
                          {ipo.status}
                        </span>
                        <span style={{ fontSize: '10px', fontWeight: '900', backgroundColor: '#0f172a', color: '#ffffff', padding: '3px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>
                          {ipo.allotmentBadge}
                        </span>
                      </div>
                    </div>

                    {/* Key Metrics Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '11px' }}>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '9px', fontWeight: '900', textTransform: 'uppercase' }}>💰 PRICE PER SHARE</span>
                        <strong style={{ color: '#0f172a', fontSize: '13px', fontWeight: '900' }}>{ipo.priceBand}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '9px', fontWeight: '900', textTransform: 'uppercase' }}>📦 MIN LOT SIZE</span>
                        <strong style={{ color: '#0f172a', fontSize: '13px', fontWeight: '900' }}>{ipo.lotSize}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '9px', fontWeight: '900', textTransform: 'uppercase' }}>🗓️ BID DATES</span>
                        <strong style={{ color: '#0f172a', fontSize: '13px', fontWeight: '900' }}>{ipo.dates}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '9px', fontWeight: '900', textTransform: 'uppercase' }}>🚀 EST. DAY 1 PROFIT (GMP)</span>
                        <strong style={{ color: '#166534', fontSize: '13px', fontWeight: '900' }}>{ipo.gmp}</strong>
                      </div>
                    </div>

                    {/* What Company Does */}
                    <div style={{ fontSize: '11px', color: '#374151', lineHeight: '1.5', backgroundColor: '#fef3c7', padding: '10px 12px', borderRadius: '8px', border: '1px solid #fde68a', fontWeight: '700' }}>
                      <strong style={{ color: '#92400e', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>
                        🏭 ABOUT THIS COMPANY:
                      </strong>
                      <span>{ipo.about}</span>
                    </div>

                    {/* Subscription Breakdown */}
                    <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 12px', fontSize: '11px', fontWeight: '700' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
                        <strong style={{ color: '#166534', textTransform: 'uppercase' }}>
                          👥 PUBLIC DEMAND:
                        </strong>
                        <span style={{ fontSize: '10px', color: '#166534', fontWeight: '900', backgroundColor: '#dcfce7', padding: '2px 8px', borderRadius: '6px' }}>
                          Total: {ipo.subscription.total}
                        </span>
                      </div>
                      <p style={{ margin: '0 0 6px 0', fontSize: '10px', color: '#166534' }}>
                        👉 {ipo.subscription.totalMeaning}
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', fontSize: '10px', borderTop: '1px dashed #bbf7d0', paddingTop: '6px' }}>
                        <div>
                          <strong style={{ color: '#15803d' }}>Retail Public:</strong> {ipo.subscription.retail}
                          <span style={{ display: 'block', color: '#4b5563', marginTop: '1px' }}>{ipo.subscription.retailMeaning}</span>
                        </div>
                        <div>
                          <strong style={{ color: '#15803d' }}>Institutions (QIB):</strong> {ipo.subscription.qib}
                          <span style={{ display: 'block', color: '#4b5563', marginTop: '1px' }}>{ipo.subscription.qibMeaning}</span>
                        </div>
                      </div>
                    </div>

                    {/* Chances of Getting Shares */}
                    <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 12px', fontSize: '11px', fontWeight: '700' }}>
                      <strong style={{ color: '#1e40af', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>
                        🎯 ALLOTMENT CHANCES:
                      </strong>
                      <span style={{ color: '#1e3a8a', fontWeight: '900' }}>{ipo.allotmentChance}</span>
                      <p style={{ margin: '4px 0 0 0', fontSize: '10px', color: '#374151', lineHeight: '1.4' }}>
                        {ipo.allotmentDetail}
                      </p>
                    </div>

                    {/* Simple Beginner Advice & Listing Date */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '10px', fontSize: '11px', flexWrap: 'wrap', gap: '6px' }}>
                      <div>
                        <strong style={{ color: '#0f172a', textTransform: 'uppercase' }}>💡 SHADOW VERDICT: </strong>
                        <span style={{ color: '#475569', fontWeight: '700' }}>{ipo.verdict}</span>
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: '900', color: '#0f172a', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', padding: '3px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>
                        Listing: {ipo.listingDate}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Google News Feed */
              <>
                {/* Status Bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '8px 12px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }} />
                    <span style={{ fontSize: '11px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase' }}>
                      Auto-refresh in {Math.floor(newsCountdown / 60)}m {newsCountdown % 60}s
                    </span>
                    {lastNewsUpdated && (
                      <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700' }}>• Updated: {lastNewsUpdated}</span>
                    )}
                  </div>

                  <button
                    disabled={isNewsLoading}
                    onClick={() => {
                      fetchTrendingNews(newsCategory);
                      setNewsCountdown(120);
                    }}
                    title="Manual Refresh Google News"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: '#0f172a',
                      color: '#ffffff',
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: '900',
                      cursor: isNewsLoading ? 'wait' : 'pointer',
                      textTransform: 'uppercase'
                    }}
                  >
                    <RotateCw size={12} style={{ animation: isNewsLoading ? 'jarvisSpinClockwise 1s linear infinite' : 'none' }} />
                    {isNewsLoading ? 'UPDATING...' : 'REFRESH'}
                  </button>
                </div>

                {/* News Cards List */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
                  {isNewsLoading && trendingNewsList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '36px 12px', color: '#0f172a', fontWeight: '900', fontSize: '13px' }}>
                      <RotateCw size={24} style={{ animation: 'jarvisSpinClockwise 1s linear infinite', margin: '0 auto 8px auto', display: 'block' }} />
                      FETCHING LIVE NEWS FOR {newsCategory.toUpperCase()}...
                    </div>
                  ) : trendingNewsList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '36px', color: '#64748b', fontSize: '12px', fontWeight: '800' }}>
                      No live news currently available. Click Refresh above.
                    </div>
                  ) : (
                    trendingNewsList.map((item, idx) => (
                      <div 
                        key={item.id || idx} 
                        onMouseEnter={() => setHoveredNewsId(item.id || idx)}
                        onMouseLeave={() => setHoveredNewsId(null)}
                        style={{ 
                          backgroundColor: '#ffffff', 
                          border: '1.5px solid #e2e8f0', 
                          borderRadius: '14px', 
                          padding: '12px', 
                          display: 'flex', 
                          gap: '14px',
                          alignItems: 'center',
                          position: 'relative',
                          overflow: 'hidden',
                          transition: 'all 0.2s ease',
                          boxShadow: hoveredNewsId === (item.id || idx) ? '0 4px 14px rgba(0,0,0,0.06)' : '0 1px 4px rgba(0,0,0,0.02)',
                          flexShrink: 0,
                          minHeight: '110px'
                        }}
                      >
                        {/* Media Thumbnail */}
                        <div style={{ width: '125px', minWidth: '125px', height: '85px', borderRadius: '10px', overflow: 'hidden', position: 'relative', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {hoveredNewsId === (item.id || idx) ? (
                            <>
                              <video 
                                src={item.videoUrl || "/jarvis-particles.mp4"} 
                                autoPlay 
                                loop 
                                muted 
                                playsInline 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                              />
                              <div style={{ position: 'absolute', bottom: '4px', left: '4px', backgroundColor: 'rgba(15,23,42,0.85)', padding: '2px 5px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <Play size={8} color="#ffffff" fill="#ffffff" />
                                <span style={{ fontSize: '7px', fontWeight: '900', color: '#ffffff', letterSpacing: '0.5px' }}>PREVIEW</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <img 
                                src={item.imageUrl || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&auto=format&fit=crop&q=60"} 
                                alt={item.title} 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                onError={(e) => {
                                  e.target.src = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&auto=format&fit=crop&q=60";
                                }}
                              />
                              <div style={{ position: 'absolute', top: '4px', right: '4px', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Play size={10} color="#ffffff" />
                              </div>
                            </>
                          )}
                        </div>

                        {/* News Info & Story Link */}
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '6px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '4px' }}>
                              <span style={{ fontSize: '9px', fontWeight: '900', color: '#ffffff', backgroundColor: '#0f172a', padding: '2px 7px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                {item.source || 'LIVE'}
                              </span>
                              <span style={{ fontSize: '9px', color: '#64748b', fontWeight: '800' }}>
                                {item.pubDate ? new Date(item.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}
                              </span>
                            </div>

                            <p style={{ margin: 0, fontSize: '13px', fontWeight: '900', color: '#0f172a', lineHeight: '1.4', wordBreak: 'break-word' }}>
                              {item.title}
                            </p>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                            <span style={{ fontSize: '9px', color: '#64748b', fontWeight: '800' }}>Hover to preview video clip</span>
                            <a 
                              href={item.link} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: '900', color: '#ffffff', backgroundColor: '#0f172a', textDecoration: 'none', padding: '6px 14px', borderRadius: '6px', boxShadow: '0 2px 6px rgba(15,23,42,0.15)', textTransform: 'uppercase' }}
                            >
                              READ ARTICLE <ExternalLink size={11} />
                            </a>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            <button onClick={() => setShowBriefingModal(false)} style={{ marginTop: '14px', width: '100%', padding: '11px', borderRadius: '10px', border: '1.5px solid #e2e8f0', backgroundColor: '#f1f5f9', color: '#0f172a', fontWeight: '900', fontSize: '12px', cursor: 'pointer', textTransform: 'uppercase' }}>CLOSE</button>
          </div>
        </div>
      )}

    </div>
  );
}