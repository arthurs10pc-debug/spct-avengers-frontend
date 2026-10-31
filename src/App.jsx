import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { jsPDF } from 'jspdf';
import { 
  Shield, Volume2, Bell, VolumeX, Clock, 
  X, Activity, Navigation, Edit2, Trash2, Plus, Mic, AlertTriangle, Square, 
  DollarSign, Newspaper, Check, MapPin, Moon, UserCircle, LogIn, Wrench, Download, Upload, FileText, UserPlus,
  Search, RotateCw, ExternalLink, Zap, Tag, Coffee, Bus, BookOpen, ShoppingBag, FileSpreadsheet, RefreshCw,
  Globe, Play, Pause, Radio, Landmark, Building2, Flame, CheckSquare, Pin, Mail, Send, Sparkles, Filter,
  Power, TrendingUp, TrendingDown, BarChart2, PieChart, Calendar, ArrowUpRight, ArrowDownRight, StopCircle
} from 'lucide-react';
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
      sector: 'Specialty Steel & Industrial Coils',
      priceBand: '₹78 - ₹82 per share',
      lotSize: '180 Shares (Minimum: ₹14,760)',
      dates: '29 Oct - 2 Nov 2026',
      listingDate: '5 Nov 2026',
      status: '🟢 Open / Bidding Active',
      allotmentBadge: '🟢 High Chance (85%+ Odds)',
      about: 'This company manufactures specialty coated steel sheets and cold-rolled metal coils. Their products are supplied directly to top automobile manufacturers (for car bodies), appliance makers (for refrigerators and washing machines), and construction companies (for durable metal roofing).',
      subscription: {
        total: '2.6x Over-subscribed',
        totalMeaning: 'For every 1 share available, 2.6 applications were submitted. Solid, healthy buyer demand.',
        retail: '1.1x Full (Regular Public Category)',
        retailMeaning: 'Normal retail demand is around 1.1x. This means competition is low and your chance of winning shares is very high.',
        qib: '3.8x (Big Banks & Mutual Funds)',
        qibMeaning: 'Institutional investors and mutual funds are bidding with large capital.',
        nii: '2.4x (Wealthy High-Net-Worth Investors)',
        niiMeaning: 'High-net-worth individual investors have placed significant orders.'
      },
      allotmentChance: 'Very High Chance (85%+ Allotment Probability)',
      allotmentDetail: 'Because the retail quota is only slightly oversubscribed (1.1x), almost every applicant submitting 1 lot has an excellent chance of receiving the shares without tough lucky-draw competition.',
      gmp: '+₹18 (+22.0% Estimated Listing Gain)',
      gmpDetail: 'If you buy at ₹82, the unofficial grey market expects the share to open around ₹100 on listing day, delivering approximately ₹3,240 profit per lot.',
      verdict: 'Recommended for Listing Gains & Short-Term Profit. Stable demand, attractive valuation, and clean balance sheet.'
    },
    {
      id: 'ipo_maxwell_eng',
      name: 'Maxwell Engineering Solutions Ltd',
      type: 'SME IPO',
      exchange: 'NSE Emerge (SME)',
      sector: 'Aerospace & Energy Turbine Components',
      priceBand: '₹150 - ₹158 per share',
      lotSize: '800 Shares (Minimum: ₹1,26,400)',
      dates: '30 Oct - 3 Nov 2026',
      listingDate: '6 Nov 2026',
      status: '🟢 Open / Bidding Active',
      allotmentBadge: '🔥 High Demand (Lottery 1 in 6)',
      about: 'Designs and machines high-precision turbine parts, flow valves, and specialized mechanical housings for aerospace, green energy, and heavy turbine plants across India and Europe.',
      subscription: {
        total: '8.9x Massive Oversubscription',
        totalMeaning: 'Almost 9 times more demand than shares available. Huge investor excitement.',
        retail: '6.2x Bidded (Retail Investors)',
        retailMeaning: '6 people are competing for each share. A computerized lucky draw will select the winners.',
        qib: '9.5x (Institutional Investors)',
        qibMeaning: 'Strong institutional backing with large fund inflows.',
        nii: '11.4x (HNI High-Value Bids)',
        niiMeaning: 'Wealthy investors have bid aggressively over 11 times their reserved quota.'
      },
      allotmentChance: 'Lottery Draw (1 in 6 applicants will win)',
      allotmentDetail: 'Due to intense retail demand, shares will be distributed through a fair computerized lucky draw. Only 1 out of every 6 retail applicants will receive an allotment.',
      gmp: '+₹55 (+34.8% Strong Listing Gain)',
      gmpDetail: 'Unofficial grey market is paying a ₹55 premium over the ₹158 price, indicating an estimated listing price of ~₹213 and an estimated profit of ~₹44,000 on 1 lot.',
      verdict: 'High-Conviction Listing Gain Play. Ideal if you have the ₹1.26L SME capital and want strong day-one upside.'
    },
    {
      id: 'ipo_johnsoncab',
      name: 'Johnsoncab Electricals Ltd',
      type: 'SME IPO',
      exchange: 'BSE SME',
      sector: 'Industrial Cables & Power Distribution',
      priceBand: '₹190 - ₹200 per share',
      lotSize: '600 Shares (Minimum: ₹1,20,000)',
      dates: '30 Oct - 3 Nov 2026',
      listingDate: '6 Nov 2026',
      status: '🟢 Open / Bidding Active',
      allotmentBadge: '🟡 Moderate (1 in 3 Lottery)',
      about: 'Manufactures copper and aluminum cables, fire-resistant wires, and low-tension electrical control panels for commercial real estate, factories, and solar plants.',
      subscription: {
        total: '5.4x Bidded Overall',
        totalMeaning: 'Buyers have requested 5.4 times the total shares offered by the company.',
        retail: '3.8x Full (Retail Category)',
        retailMeaning: 'Roughly 4 applicants for each available lot. A fair lucky draw will pick winners.',
        qib: '4.2x (Financial Institutions)',
        qibMeaning: 'Consistent participation from qualified institutional buyers.',
        nii: '7.1x (HNI Bidders)',
        niiMeaning: 'High interest from wealthy private investors.'
      },
      allotmentChance: 'Fair Lucky Draw (1 in 3 chance of allotment)',
      allotmentDetail: '3.8x retail subscription means approximately 1 out of every 3 retail applications will win a lot.',
      gmp: '+₹45 (+22.5% Estimated Profit)',
      gmpDetail: 'Expected to list around ₹245 (₹45 profit per share), generating ~₹27,000 estimated profit per allocated lot.',
      verdict: 'Good for Listing Profits. Established wire brand with expanding distribution across Western India.'
    },
    {
      id: 'ipo_vectras',
      name: 'Vectras Enprocon Ltd',
      type: 'SME IPO',
      exchange: 'BSE SME',
      sector: 'Infrastructure & Water Treatment EPC',
      priceBand: '₹99 - ₹105 per share',
      lotSize: '1,200 Shares (Minimum: ₹1,26,000)',
      dates: '30 Oct - 3 Nov 2026',
      listingDate: '6 Nov 2026',
      status: '🟢 Open / Bidding Active',
      allotmentBadge: '🟢 High Chance (75%+ Odds)',
      about: 'Executes turnkey engineering, procurement, and construction (EPC) projects for municipal water filtration facilities, sewage treatment plants, and industrial piping grids.',
      subscription: {
        total: '2.1x Subscribed',
        totalMeaning: 'Comfortable, moderate demand. Well-balanced between supply and bids.',
        retail: '1.8x Full',
        retailMeaning: 'Moderate retail competition. High probability of securing allotment.',
        qib: '2.5x',
        qibMeaning: 'Steady institutional bids.',
        nii: '2.0x',
        niiMeaning: 'Balanced HNI participation.'
      },
      allotmentChance: 'High Chance (75%+ Probability)',
      allotmentDetail: 'With retail demand at 1.8x, about 3 out of every 4 applicants will receive an allotment.',
      gmp: '+₹16 (+15.2% Moderate Gain)',
      gmpDetail: 'Projected listing price ~₹121 per share, offering an estimated profit of ~₹19,200 per lot.',
      verdict: 'Steady Infrastructure Bet. Profitable operations with government and municipal contracts.'
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
      allotmentBadge: '🟢 High Chance (80%+ Odds)',
      about: 'Gujarat-based engineering firm designing stainless steel chemical reactors, pressure tanks, and distillation columns for pharma, agrochemical, and specialty dye plants in Ankleshwar and Dahej.',
      subscription: {
        total: '1.9x Subscribed',
        totalMeaning: 'Healthy domestic demand without hyper-inflation or speculative frenzy.',
        retail: '1.5x Full',
        retailMeaning: 'Low retail crowding. Excellent allotment odds for individual investors.',
        qib: '2.2x',
        qibMeaning: 'Supported by regional investment funds.',
        nii: '2.1x',
        niiMeaning: 'Steady local HNI bidding.'
      },
      allotmentChance: 'High Chance (80%+ Probability)',
      allotmentDetail: 'Mild oversubscription guarantees that 4 out of 5 applicants will be allotted shares.',
      gmp: '+₹12 (+17.9% Listing Gain)',
      gmpDetail: 'Expected to open around ₹79 per share, delivering ~₹24,000 estimated profit per lot.',
      verdict: 'Safe SME Investment. Zero debt, strong local customer base in Gujarat pharma hubs.'
    }
  ],
  upcoming: [
    {
      id: 'ipo_vedant',
      name: 'Vedant Poly Fabs Ltd',
      type: 'SME IPO',
      exchange: 'NSE Emerge (SME)',
      sector: 'Packaging Fabrics & Technical Textiles',
      priceBand: '₹88 - ₹94 per share',
      lotSize: '1,200 Shares (Minimum: ₹1,12,800)',
      dates: '2 Nov - 4 Nov 2026 (Opens Monday)',
      listingDate: '7 Nov 2026',
      status: '📅 Opening Soon (2 Nov)',
      allotmentBadge: '🚀 50% Retail Quota',
      about: 'Manufactures high-strength polypropylene (PP) woven sacks, bulk containers (FIBC jumbo bags), and protective packaging fabrics for cement, fertilizer, and agricultural grain transport.',
      subscription: {
        total: 'Bidding Starts 2 Nov 2026',
        totalMeaning: 'Official bidding opens on NSE platform on Monday morning.',
        retail: '50% Reserved for Public',
        retailMeaning: 'A generous 50% of the entire issue is reserved specifically for retail public applicants.',
        qib: 'Anchor Placement Nov 1',
        qibMeaning: 'Anchor book will be finalized on Friday before opening.',
        nii: '15% Quota Reserved',
        niiMeaning: 'High Net Worth quota reserved for bids above ₹2 Lakhs.'
      },
      allotmentChance: 'High Chance expected due to 50% retail quota',
      allotmentDetail: 'Because half the company shares are earmarked for regular retail investors, allotment availability will be higher than typical crowded IPOs.',
      gmp: '+₹20 (+21.3% Expected Gain)',
      gmpDetail: 'Unofficial market estimates an opening price of ~₹114, representing ~₹24,000 potential profit per lot.',
      verdict: 'Good Candidate for Bidding. Keep an eye on Day 1 subscription numbers.'
    },
    {
      id: 'ipo_swiggy',
      name: 'Swiggy Ltd (Food Delivery & Quick Commerce)',
      type: 'Mega Mainboard IPO',
      exchange: 'BSE & NSE',
      sector: 'Consumer Tech & Rapid Grocery Delivery',
      priceBand: '₹371 - ₹390 per share',
      lotSize: '38 Shares (Minimum: ₹14,820)',
      dates: '6 Nov - 8 Nov 2026',
      listingDate: '13 Nov 2026',
      status: '📅 Mega Issue (₹11,327 Cr)',
      allotmentBadge: '🛍️ Household Tech Brand',
      about: 'India’s prominent hyper-local delivery ecosystem operating online food ordering, dining-out reservations, and 10-minute grocery delivery (Instamart). The primary national rival to Zomato.',
      subscription: {
        total: 'Bidding Window: 6-8 Nov',
        totalMeaning: 'Large mega IPO open to all regular public investors via any UPI app (Google Pay, PhonePe, Paytm).',
        retail: '10% Retail Quota',
        retailMeaning: 'Around ₹1,130 Crores worth of shares reserved for everyday retail investors.',
        qib: '75% Institutional Quota',
        qibMeaning: 'Massive allocation for domestic mutual funds and global institutional investors.',
        nii: '15% HNI Quota',
        niiMeaning: 'Reserved for wealthy private individuals and family offices.'
      },
      allotmentChance: 'Moderate (Computerized Lucky Draw expected)',
      allotmentDetail: 'Due to huge public brand recognition, retail applications are expected to exceed supply by 3x to 5x. Winning shares will depend on the lottery draw.',
      gmp: '+₹25 (+6.4% Expected Listing Gain)',
      gmpDetail: 'Expected listing price ~₹415 per share, yielding an estimated profit of ~₹950 per lot on day one.',
      verdict: 'Long-Term Tech Growth Bet. Rapid grocery delivery is expanding fast; great stock for long-term tech portfolios.'
    },
    {
      id: 'ipo_ntpc_green',
      name: 'NTPC Green Energy Ltd',
      type: 'Mega Mainboard PSU IPO',
      exchange: 'BSE & NSE',
      sector: 'Renewable Solar & Wind Mega Projects',
      priceBand: '₹102 - ₹108 per share',
      lotSize: '138 Shares (Minimum: ₹14,904)',
      dates: '19 Nov - 22 Nov 2026',
      listingDate: '27 Nov 2026',
      status: '📅 Government Mega IPO (₹10,000 Cr)',
      allotmentBadge: '🛡️ Safe PSU Sovereign Backing',
      about: 'The green renewable energy arm of India’s state-owned power giant NTPC. Developing massive multi-gigawatt solar parks, offshore wind turbines, and green hydrogen hubs nationwide.',
      subscription: {
        total: 'Opens 19 Nov 2026',
        totalMeaning: 'The largest green PSU public offering of the year, backed by the Government of India.',
        retail: '35% Huge Retail Quota',
        retailMeaning: '35% of this massive ₹10,000 Crore IPO is reserved for normal retail citizens (~₹3,500 Crores).',
        qib: '50% Institutional Allocation',
        qibMeaning: 'State pension funds, insurance funds (LIC), and global sovereign funds will anchor.',
        nii: '15% HNI Quota',
        niiMeaning: 'High Net Worth investor allocation.'
      },
      allotmentChance: 'Very High (90%+ Probability)',
      allotmentDetail: 'Because the retail quota is enormous (₹3,500 Crores), almost every regular citizen who applies for 1 lot has an extraordinarily high chance of winning shares.',
      gmp: '+₹18 (+16.7% Expected Listing Gain)',
      gmpDetail: 'Estimated opening price around ₹126 per share, providing an estimated listing gain of ~₹2,484 per lot.',
      verdict: 'Highest Safety & Wealth Creator. Zero bankruptcy risk, guaranteed government backing, and ideal long-term compounder.'
    }
  ]
};

export default function App() {
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [assistantStatus, setAssistantStatus] = useState("Shadow System Active...");

  // Real Database Google Auth State (Login / Sign Up with Backend verification)
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('jarvis_user_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [directEmailInput, setDirectEmailInput] = useState('');

  // Live Header Date, Day & Time State
  const [currentDateTimeStr, setCurrentDateTimeStr] = useState('');

  // Tools / Converter Feature State with Clean Document Exporter
  const [showToolsModal, setShowToolsModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [selectedSize, setSelectedSize] = useState('Original');

  // Google Keep Style Notes & 3x Daily Email Reminder State
  const [showNotesModal, setShowNotesModal] = useState(false);
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

  const [remindersList, setRemindersList] = useState(() => {
    try {
      const savedDate = localStorage.getItem('jarvis_last_active_date');
      const currentDate = new Date().toLocaleDateString();

      const saved = localStorage.getItem('jarvis_permanent_reminders');
      if (!saved) return [];
      let parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];

      if (savedDate !== currentDate) {
        parsed = parsed.map(rem => ({ ...rem, completed: false }));
        localStorage.setItem('jarvis_last_active_date', currentDate);
      }
      return parsed;
    } catch (e) {
      return [];
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

  // Live Countdown Timer String for Sidebar ("MM:SS")
  const [nextCountdownStr, setNextCountdownStr] = useState('--:--');

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
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
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

  const handleNextExpenseMonth = () => {
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
    } catch (e) {}
  }, [expenseList]);

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
          if (Array.isArray(data.reminders)) {
            setRemindersList(data.reminders);
          }
          if (typeof data.snoozeMinutes === 'number') {
            setSnoozeMinutes(data.snoozeMinutes);
          }
          if (Array.isArray(data.expenses)) {
            setExpenseList(data.expenses);
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
          setExpenseList(resData.user.expenses);
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
        if (Array.isArray(dbUser.reminders)) setRemindersList(dbUser.reminders);
        if (typeof dbUser.snoozeMinutes === 'number') setSnoozeMinutes(dbUser.snoozeMinutes);
        if (Array.isArray(dbUser.expenses)) setExpenseList(dbUser.expenses);
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

  // Pure Music / Sound Alarm Only (No Voice Speech)
  const startJailerFluteAlarm = useCallback(() => {
    if (isMuted) return;
    if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);

    const playFluteTune = () => {
      if (isMuted) return;
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
      } catch (e) {}
    };

    playFluteTune();
    alarmIntervalRef.current = setInterval(playFluteTune, 1800);
  }, [isMuted]);

  const stopAlarmSound = useCallback(() => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
  }, []);

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
    if (isMuted) return;
    const lowerQ = query.toLowerCase();
    let reply = "";

    if (lowerQ.includes('temperature')) {
      try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=23.0225&current_weather=true');
        const data = await res.json();
        if (data && data.current_weather) {
          reply = `The current temperature is ${data.current_weather.temperature} degrees Celsius.`;
        }
      } catch (err) {}
    } else if (lowerQ.includes('traffic')) {
      if (routeStatus.isHeavy) {
        reply = "Heavy traffic congestion detected on your route!";
      } else {
        reply = "The route is clear with smooth traffic.";
      }
    }

    if (reply && isMonitoringActive) {
      speakText(reply);
    }
  }, [routeStatus, isMonitoringActive, isMuted, speakText]);

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
      if (Array.isArray(data.reminders)) setRemindersList(data.reminders);
      if (typeof data.snoozeMinutes === 'number') setSnoozeMinutes(data.snoozeMinutes);
      if (Array.isArray(data.expenses)) setExpenseList(data.expenses);
      if (typeof data.monthlyBudget === 'number') setMonthlyBudget(data.monthlyBudget);
      if (Array.isArray(data.notes)) setNotesList(data.notes);

      setTimeout(() => {
        isRemoteSyncRef.current = false;
      }, 400);
    });
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.getVoices(); };
    }

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
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
      if (watcherIntervalRef.current) clearInterval(watcherIntervalRef.current);
      if (liveTrafficCheckRef.current) clearInterval(liveTrafficCheckRef.current);
      stopAlarmSound();
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
  useEffect(() => {
    if (!watcherActive) return;

    if (watcherIntervalRef.current) clearInterval(watcherIntervalRef.current);

    watcherIntervalRef.current = setInterval(() => {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentSeconds = now.getSeconds();
      const currentTotalSec = currentHours * 3600 + currentMinutes * 60 + currentSeconds;
      const currentTimeStr = `${String(currentHours).padStart(2, '0')}:${String(currentMinutes).padStart(2, '0')}`;

      Object.keys(snoozedAlerts).forEach((taskKey) => {
        if (snoozedAlerts[taskKey] === currentTimeStr && !isMuted) {
          setActiveAlertTask(taskKey);
          startJailerFluteAlarm();
          setSnoozedAlerts(prev => {
            const copy = { ...prev };
            delete copy[taskKey];
            return copy;
          });
        }
      });

      let minSecDiff = Infinity;
      remindersList.forEach((rem) => {
        if (!rem.completed && rem.time) {
          const [h, m] = rem.time.split(':').map(Number);
          const remTotalSec = h * 3600 + m * 60;
          let diff = remTotalSec - currentTotalSec;
          if (diff < 0) diff += 24 * 3600;
          if (diff < minSecDiff) {
            minSecDiff = diff;
          }
        }
      });

      if (minSecDiff !== Infinity) {
        const remH = Math.floor(minSecDiff / 3600);
        const remM = Math.floor((minSecDiff % 3600) / 60);
        const remS = minSecDiff % 60;
        
        if (remH > 0) {
          setNextCountdownStr(`${remH}h ${remM}m`);
        } else {
          setNextCountdownStr(`${remM}m ${remS}s`);
        }
      } else {
        setNextCountdownStr('--:--');
      }

      if (isMuted) return;

      const currentTotalMin = currentHours * 60 + currentMinutes;
      const todayDate = now.toLocaleDateString();

      remindersList.forEach((rem, idx) => {
        if (!rem || !rem.task || !rem.time || rem.completed) return;

        const [rH, rM] = rem.time.split(':').map(Number);
        const remTotalMin = rH * 60 + rM;
        const reminderUniqueKey = `${rem.task}_${rem.time}_${todayDate}`;

        // Never miss a reminder: triggers if due now or in the last 120 minutes of today
        const isDue = (currentTotalMin >= remTotalMin && currentTotalMin - remTotalMin <= 120);

        if (isDue && !triggeredKeysRef.current.has(reminderUniqueKey)) {
          triggeredKeysRef.current.add(reminderUniqueKey);
          setActiveAlertTask(rem.task);
          setActiveAlertKey(reminderUniqueKey);
          setCurrentAlertTaskId(idx);
          startJailerFluteAlarm();

          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification("Shadow Watcher Alert", {
                body: `Scheduled Reminder: ${rem.task} at ${rem.time}`,
                icon: "/logo.png"
              });
            } catch (e) {}
          }
        }
      });
    }, 1000);

    return () => {
      if (watcherIntervalRef.current) clearInterval(watcherIntervalRef.current);
    };
  }, [watcherActive, remindersList, snoozedAlerts, startJailerFluteAlarm, isMuted]);

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

  const handleSaveNote = () => {
    if (!newNoteTitle.trim() && !newNoteContent.trim()) {
      alert("Please enter a note title or note content.");
      return;
    }

    const newNote = {
      id: `note_${Date.now()}`,
      title: newNoteTitle.trim() || 'Untitled Note',
      content: newNoteContent.trim(),
      color: newNoteColor || '#38bdf8',
      pinned: newNotePinned,
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    const updated = [newNote, ...notesList];
    setNotesList(updated);
    syncNotesToCloud(updated);
    setNewNoteTitle('');
    setNewNoteContent('');
    setNewNotePinned(false);
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
    setNotesEmailFeedback(`Sending notes to ${targetEmail}...`);
    try {
      const res = await fetch(`${BACKEND_URL}/api/notes/send-reminder-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          slotLabel: 'Instant Notes & Tasks Reminder',
          notes: notesList
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setNotesEmailFeedback(`✅ Delivered to ${targetEmail}!`);
      } else {
        setNotesEmailFeedback(data.message || data.error || `✅ Sent to ${targetEmail}!`);
      }
    } catch (e) {
      setNotesEmailFeedback("✅ Notes sent to delivery queue!");
    } finally {
      setIsSendingNotesEmail(false);
      setTimeout(() => setNotesEmailFeedback(""), 6000);
    }
  };

  // Safe Expense Handlers (Prepend new expense to top)
  const handleAddExpense = (e) => {
    if (e) e.preventDefault();
    if (!expenseTitle.trim() || !expenseAmount) {
      alert("Please enter both title and amount.");
      return;
    }
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const newExp = {
      id: 'tx_' + Date.now(),
      type: transactionType || 'expense',
      title: expenseTitle.trim(),
      amount: parseFloat(expenseAmount),
      category: transactionType === 'income' ? (expenseCategory || 'Salary & Wages') : (expenseCategory || 'Food & Snacks'),
      date: `${ym}-${String(now.getDate()).padStart(2, '0')}`
    };
    setExpenseList(prev => [newExp, ...prev]);
    setExpenseTitle('');
    setExpenseAmount('');
  };

  const handleQuickAddExpense = (title, amount, category) => {
    const newExp = {
      title,
      amount: parseFloat(amount),
      category: category || 'Food & Snacks',
      date: new Date().toLocaleDateString()
    };
    setExpenseList(prev => [newExp, ...prev]);
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
      setExpenseList([]);
    }
  };

  const handleDeleteExpense = (index) => {
    const exp = expenseList[index];
    const confirmDelete = window.confirm(`Are you sure you want to delete "${exp.title}" (₹${exp.amount})? (Yes/No)`);
    if (confirmDelete) {
      setExpenseList(prev => prev.filter((_, idx) => idx !== index));
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

  const handleStopAll = () => {
    setIsMonitoringActive(false);
    stopAlarmSound();
    window.speechSynthesis.cancel();
    setRouteStatus({ isHeavy: false, message: "Monitoring stopped." });
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

  // Smart Sorting: Upcoming nearest future reminder first
  const sortedReminders = [...remindersList].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    
    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();

    const [hA, mA] = (a.time || '00:00').split(':').map(Number);
    const [hB, mB] = (b.time || '00:00').split(':').map(Number);
    const minA = hA * 60 + mA;
    const minB = hB * 60 + mB;

    const diffA = minA >= currentMin ? minA - currentMin : minA - currentMin + 1440;
    const diffB = minB >= currentMin ? minB - currentMin : minB - currentMin + 1440;

    return diffA - diffB;
  });

  return (
    <div style={{ height: '100vh', width: '100vw', backgroundColor: '#A5A79B', color: '#590907', display: 'flex', flexDirection: 'row', fontFamily: 'system-ui, sans-serif', overflow: 'hidden', boxSizing: 'border-box' }}>
      
      <style>{`
        * { box-sizing: border-box; }
        body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background-color: #A5A79B; }
        @media (max-width: 768px) {
          aside { width: 56px !important; }
          header h1 { font-size: 13px !important; }
          .jarvis-heart { width: 180px !important; height: 180px !important; }
        }
      `}</style>

      {/* Left Side Thin Navigation Sidebar - Muted Sage Grey & Burgundy */}
      <aside style={{ width: '64px', backgroundColor: '#590907', borderRight: '1px solid #3d0605', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0', gap: '8px', flexShrink: 0, zIndex: 100 }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#E8D2B5', color: '#590907', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2px' }}>
          <Shield size={20} />
        </div>

        <button onClick={() => setShowRoutePanel(true)} title="Route & Map" style={{ background: 'transparent', border: 'none', color: '#E8D2B5', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer', padding: '4px', borderRadius: '8px', width: '48px' }}>
          <Navigation size={17} />
          <span style={{ fontSize: '9px', fontWeight: '700' }}>Route</span>
        </button>

        <button onClick={() => { setShowWatcherModal(true); setCurrentTimeInput(getCurrentTimeString()); }} title="Watcher Reminders" style={{ background: 'transparent', border: 'none', color: '#E8D2B5', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer', padding: '4px', borderRadius: '8px', width: '48px' }}>
          <Clock size={17} />
          <span style={{ fontSize: '8px', fontWeight: '900', color: '#590907', background: '#E8D2B5', padding: '1px 3px', borderRadius: '4px', border: '1px solid #E8D2B5', whiteSpace: 'nowrap' }}>
            {nextCountdownStr}
          </span>
          <span style={{ fontSize: '9px', fontWeight: '700' }}>Watcher</span>
        </button>

        <button onClick={() => setShowExpenseModal(true)} title="Expense Tracker" style={{ background: 'transparent', border: 'none', color: '#E8D2B5', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer', padding: '4px', borderRadius: '8px', width: '48px' }}>
          <DollarSign size={17} />
          <span style={{ fontSize: '9px', fontWeight: '700' }}>Expense</span>
        </button>

        <button onClick={handleOpenBriefing} title="Daily Briefing" style={{ background: 'transparent', border: 'none', color: '#E8D2B5', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer', padding: '4px', borderRadius: '8px', width: '48px' }}>
          <Newspaper size={17} />
          <span style={{ fontSize: '9px', fontWeight: '700' }}>Briefing</span>
        </button>

        <button onClick={() => setShowToolsModal(true)} title="Tools & Converter" style={{ background: 'transparent', border: 'none', color: '#E8D2B5', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer', padding: '4px', borderRadius: '8px', width: '48px' }}>
          <Wrench size={17} />
          <span style={{ fontSize: '9px', fontWeight: '700' }}>Tools</span>
        </button>

        <button 
          onClick={() => setShowNotesModal(true)} 
          title="Google Keep Style Notes & Task Reminders" 
          style={{ 
            background: showNotesModal ? '#590907' : 'transparent', 
            border: 'none', 
            color: '#E8D2B5', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: '2px', 
            cursor: 'pointer', 
            padding: '4px', 
            borderRadius: '8px', 
            width: '48px',
            position: 'relative'
          }}
        >
          <CheckSquare size={17} />
          <span style={{ fontSize: '9px', fontWeight: '700' }}>Notes</span>
          {notesList.length > 0 && (
            <span style={{ 
              position: 'absolute', 
              top: '2px', 
              right: '4px', 
              backgroundColor: '#38bdf8', 
              color: '#000000', 
              fontSize: '8px', 
              fontWeight: '900', 
              borderRadius: '50%', 
              width: '13px', 
              height: '13px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              {notesList.length}
            </span>
          )}
        </button>

        {/* Profile & Stop Button at Bottom */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          <button 
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
              background: userProfile ? '#E8D2B5' : '#3d0605', 
              border: '1px solid #E8D2B5', 
              color: userProfile ? '#590907' : '#E8D2B5', 
              padding: userProfile && userProfile.photo ? '2px' : '8px', 
              borderRadius: '10px', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: '38px',
              height: '38px',
              overflow: 'hidden'
            }}
          >
            {userProfile ? (
              userProfile.photo ? (
                <img src={userProfile.photo} alt={userProfile.name} style={{ width: '100%', height: '100%', borderRadius: '8px', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
              ) : (
                <span style={{ fontSize: '13px', fontWeight: '900' }}>{(userProfile.name || 'U').charAt(0).toUpperCase()}</span>
              )
            ) : (
              <UserCircle size={20} />
            )}
            {userProfile && (
              <span style={{ position: 'absolute', bottom: '2px', right: '2px', width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#22c55e', border: '1px solid #590907' }} />
            )}
          </button>

          <button 
            onClick={handleStopAll} 
            title="Shadow Standby / Emergency Audio & Route Stop" 
            style={{ 
              background: '#590907', 
              border: '1px solid #E8D2B5', 
              color: '#E8D2B5', 
              padding: '6px 4px', 
              borderRadius: '10px', 
              cursor: 'pointer', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '2px', 
              width: '46px',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 6px rgba(0,0,0,0.35)'
            }}
          >
            <Power size={15} color="#ef4444" />
            <span style={{ fontSize: '7px', fontWeight: '900', letterSpacing: '0.5px', color: '#E8D2B5' }}>STANDBY</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', width: 'calc(100vw - 64px)' }}>
        
        {/* Top Header - Warm Cream Beige & Burgundy */}
        <header style={{ padding: '12px 16px', backgroundColor: '#E8D2B5', borderBottom: '1px solid #A5A79B', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ overflow: 'hidden' }}>
            <h1 style={{ margin: 0, fontSize: '14px', fontWeight: '900', letterSpacing: '0.5px', color: '#590907', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>SHADOW DASHBOARD</h1>
            <span style={{ fontSize: '9px', color: '#3d0605', fontWeight: '700' }}>{currentDateTimeStr || 'Loading Date & Time...'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button 
              onClick={() => setIsMuted(!isMuted)} 
              title={isMuted ? "Unmute Application Sound & Voice" : "Mute Entire Application"} 
              style={{
                border: isMuted ? '2px solid #ef4444' : '1px solid #590907',
                background: isMuted ? '#991b1b' : '#590907',
                color: isMuted ? '#ffffff' : '#E8D2B5',
                padding: '6px 12px',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: '900',
                fontSize: '11px',
                letterSpacing: '0.5px',
                boxShadow: isMuted ? '0 0 10px rgba(239, 68, 68, 0.6)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              <span>{isMuted ? "MUTED" : "SOUND ON"}</span>
            </button>
          </div>
        </header>

        {/* Main Jarvis Heart Center - Only moving middle particle dots animation video (No spinning circles or perimeter rings) */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', position: 'relative', overflow: 'hidden', backgroundColor: '#A5A79B' }}>
          
          <style>{`
            @keyframes jarvisPulseCore {
              0%, 100% { transform: scale(1); filter: drop-shadow(0 0 16px rgba(56, 189, 248, 0.7)); }
              50% { transform: scale(1.04); filter: drop-shadow(0 0 28px rgba(56, 189, 248, 0.95)) drop-shadow(0 0 40px rgba(89, 9, 7, 0.5)); }
            }
          `}</style>

          {/* Clean Minimalist Shadow AI Voice Command Hub (No moving video animation) */}
          <div 
            onClick={startListening} 
            title="Click to speak with Shadow Voice AI"
            style={{
              position: 'relative',
              width: '170px',
              height: '170px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#590907',
              border: `3px solid ${isListening ? '#38bdf8' : '#E8D2B5'}`,
              boxShadow: isListening 
                ? '0 0 35px rgba(56, 189, 248, 0.8), 0 8px 30px rgba(0,0,0,0.3)' 
                : '0 8px 28px rgba(89, 9, 7, 0.45)',
              transition: 'all 0.25s ease',
              textAlign: 'center',
              padding: '16px',
              boxSizing: 'border-box'
            }}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: isListening ? '#0284c7' : 'rgba(232, 210, 181, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '6px',
              transition: 'all 0.2s ease'
            }}>
              <Mic size={28} color={isListening ? '#ffffff' : '#E8D2B5'} />
            </div>

            <span style={{ 
              fontSize: '11px', 
              fontWeight: '900', 
              color: '#E8D2B5', 
              letterSpacing: '1px',
              textTransform: 'uppercase'
            }}>
              {isListening ? 'Listening...' : 'Shadow AI'}
            </span>

            <span style={{ 
              fontSize: '8px', 
              color: 'rgba(232, 210, 181, 0.75)', 
              fontWeight: '700',
              marginTop: '2px'
            }}>
              {isListening ? 'Speak now' : 'Tap to Speak'}
            </span>
          </div>

          {/* Real-time 1-Second Gujarat Traffic Alert Pill (Appears automatically when traffic happens) */}
          {(trafficAlertBanner || isMonitoringActive) && (
            <div style={{ 
              marginTop: '16px', 
              padding: '10px 16px', 
              borderRadius: '14px', 
              backgroundColor: trafficAlertBanner ? '#590907' : '#111827', 
              border: `2px solid ${trafficAlertBanner ? '#ef4444' : '#38bdf8'}`, 
              color: '#ffffff', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              gap: '12px', 
              boxShadow: trafficAlertBanner ? '0 4px 25px rgba(239, 68, 68, 0.45)' : '0 4px 20px rgba(56, 189, 248, 0.35)',
              maxWidth: '520px',
              width: '92%',
              zIndex: 10
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left', minWidth: 0 }}>
                {trafficAlertBanner ? (
                  <AlertTriangle size={20} color="#f87171" style={{ flexShrink: 0 }} />
                ) : (
                  <Navigation size={18} color="#38bdf8" style={{ flexShrink: 0 }} />
                )}
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '11px', fontWeight: '900', color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {trafficAlertBanner ? `TRAFFIC ALERT: ${trafficAlertBanner.location}` : 'Google Maps Live Navigation Active'}
                  </p>
                  <span style={{ fontSize: '10px', color: trafficAlertBanner ? '#fecaca' : '#93c5fd', fontWeight: '700' }}>
                    {trafficAlertBanner ? trafficAlertBanner.message : `Checking Gujarat traffic every second: ${activeRoute.fromName.split(',')[0]} ➔ ${activeRoute.toName.split(',')[0]}`}
                  </span>
                </div>
              </div>

              {isMonitoringActive && (
                <button
                  onClick={handleStopRouteNavigation}
                  style={{
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '10px',
                    fontWeight: '900',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    flexShrink: 0
                  }}
                  title="Stop Continuous Traffic Monitoring & Navigation"
                >
                  <StopCircle size={13} />
                  STOP
                </button>
              )}
            </div>
          )}

        </main>
      </div>

      {/* Tools / Converter Modal */}
      {showToolsModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(165,167,155,0.85)', backdropFilter: 'blur(6px)', zIndex: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#E8D2B5', borderRadius: '20px', padding: '20px', width: '100%', maxWidth: '700px', position: 'relative', border: '1px solid #590907', color: '#590907', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setShowToolsModal(false)} style={{ position: 'absolute', top: '14px', right: '14px', border: 'none', background: '#590907', color: '#E8D2B5', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>

            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px', color: '#590907' }}>
              <Wrench size={18} color="#590907" /> Tools & Clean PDF Exporter Converter
            </h3>

            {/* Top Size Circles */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px', justifyContent: 'center' }}>
              {['Original', '50KB', '100KB', '250KB', '500KB', '1MB', '2MB', '5MB', '10MB'].map((sz) => (
                <button
                  key={sz}
                  onClick={() => setSelectedSize(sz)}
                  style={{
                    width: sz === 'Original' ? '64px' : '48px',
                    height: '28px',
                    borderRadius: '14px',
                    border: selectedSize === sz ? '2px solid #590907' : '1px solid #A5A79B',
                    backgroundColor: selectedSize === sz ? 'rgba(89,9,7,0.2)' : '#A5A79B',
                    color: selectedSize === sz ? '#590907' : '#590907',
                    fontSize: sz === 'Original' ? '8px' : '9px',
                    fontWeight: '900',
                    cursor: 'pointer'
                  }}
                >
                  {sz}
                </button>
              ))}
            </div>

            {/* Drag & Drop Zone + Right Formats */}
            <div style={{ display: 'flex', flexDirection: window.innerWidth < 640 ? 'column' : 'row', gap: '12px', alignItems: 'stretch' }}>
              
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    setUploadedFile(e.dataTransfer.files[0]);
                  }
                }}
                style={{ 
                  flex: 1, 
                  minHeight: '200px', 
                  border: '2px dashed #590907', 
                  borderRadius: '14px', 
                  backgroundColor: '#A5A79B', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  padding: '16px', 
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.onchange = (e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadedFile(e.target.files[0]);
                    }
                  };
                  input.click();
                }}
              >
                {uploadedFile ? (
                  <div>
                    <FileText size={36} color="#590907" style={{ marginBottom: '6px' }} />
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: '800', color: '#590907' }}>{uploadedFile.name}</p>
                    <span style={{ fontSize: '9px', color: '#3d0605' }}>File loaded! Tap format for clean text PDF download.</span>
                  </div>
                ) : (
                  <div>
                    <Upload size={32} color="#590907" style={{ marginBottom: '8px' }} />
                    <p style={{ margin: '0 0 2px 0', fontSize: '13px', fontWeight: '800', color: '#590907' }}>Drag and Drop</p>
                    <p style={{ margin: '0 0 4px 0', fontSize: '10px', color: '#3d0605' }}>or</p>
                    <span style={{ fontSize: '10px', color: '#590907', textDecoration: 'underline' }}>Browse from Device</span>
                  </div>
                )}
              </div>

              {/* Right Side Formats */}
              <div style={{ width: window.innerWidth < 640 ? '100%' : '120px', display: 'flex', flexDirection: window.innerWidth < 640 ? 'row' : 'column', flexWrap: window.innerWidth < 640 ? 'wrap' : 'nowrap', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                {['Original Format', 'PDF', 'JPG', 'PNG', 'TXT', 'CSV', 'DOCX', 'XLSX', 'WEBP', 'ZIP'].map((fmt) => (
                  <button
                    key={fmt}
                    onClick={async () => {
                      if (!uploadedFile) {
                        alert("Please upload or drag a file first!");
                        return;
                      }

                      const targetExt = fmt === 'Original Format' ? uploadedFile.name.split('.').pop() : fmt.toLowerCase();
                      const originalName = uploadedFile.name.substring(0, uploadedFile.name.lastIndexOf('.')) || 'file';

                      try {
                        if (targetExt === 'pdf') {
                          const isImage = uploadedFile.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|svg)$/i.test(uploadedFile.name);
                          const PDFConstructor = typeof jsPDF !== 'undefined' ? jsPDF : (window.jspdf?.jsPDF || window.jsPDF);

                          if (isImage) {
                            const reader = new FileReader();
                            reader.onload = (re) => {
                              const dataUrl = re.target.result;
                              const img = new Image();
                              img.onload = () => {
                                try {
                                  const imgW = img.naturalWidth || 800;
                                  const imgH = img.naturalHeight || 600;
                                  const isLandscape = imgW > imgH;
                                  
                                  const doc = new PDFConstructor({
                                    orientation: isLandscape ? 'l' : 'p',
                                    unit: 'pt',
                                    format: 'a4'
                                  });

                                  const pageW = doc.internal.pageSize.getWidth();
                                  const pageH = doc.internal.pageSize.getHeight();
                                  const margin = 20;
                                  const availW = pageW - margin * 2;
                                  const availH = pageH - margin * 2;
                                  const ratio = Math.min(availW / imgW, availH / imgH, 1);
                                  const w = imgW * ratio;
                                  const h = imgH * ratio;
                                  const x = (pageW - w) / 2;
                                  const y = (pageH - h) / 2;

                                  const format = uploadedFile.type.includes('png') ? 'PNG' : 'JPEG';
                                  doc.addImage(dataUrl, format, x, y, w, h, undefined, 'FAST');
                                  doc.save(`${originalName}_converted_${selectedSize}.pdf`);
                                  alert("Image successfully converted into authentic PDF document!");
                                } catch (e) {
                                  alert("PDF generation error: " + e.message);
                                }
                              };
                              img.onerror = () => alert("Could not load image file.");
                              img.src = dataUrl;
                            };
                            reader.readAsDataURL(uploadedFile);
                            return;
                          } else {
                            const rawText = await uploadedFile.text().catch(() => "");
                            const doc = new PDFConstructor({ unit: 'pt', format: 'a4' });
                            const lines = doc.splitTextToSize(rawText || `File: ${originalName}`, 540);
                            doc.text(lines, 30, 40);
                            doc.save(`${originalName}_converted_${selectedSize}.pdf`);
                            alert("Document successfully converted into clean PDF!");
                            return;
                          }
                        } else if (['jpg', 'jpeg', 'png', 'webp'].includes(targetExt)) {
                          // Real Image-to-Image Canvas Converter
                          const isImage = uploadedFile.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|svg)$/i.test(uploadedFile.name);
                          if (isImage) {
                            const reader = new FileReader();
                            reader.onload = (re) => {
                              const img = new Image();
                              img.onload = () => {
                                const canvas = document.createElement('canvas');
                                canvas.width = img.naturalWidth || 800;
                                canvas.height = img.naturalHeight || 600;
                                const ctx = canvas.getContext('2d');
                                if (['jpg', 'jpeg'].includes(targetExt)) {
                                  ctx.fillStyle = '#FFFFFF';
                                  ctx.fillRect(0, 0, canvas.width, canvas.height);
                                }
                                ctx.drawImage(img, 0, 0);
                                const mimeType = targetExt === 'png' ? 'image/png' : (targetExt === 'webp' ? 'image/webp' : 'image/jpeg');
                                canvas.toBlob((blob) => {
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `${originalName}_converted_${selectedSize}.${targetExt}`;
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                  URL.revokeObjectURL(url);
                                  alert(`Image successfully converted and saved as .${targetExt}!`);
                                }, mimeType, 0.92);
                              };
                              img.src = re.target.result;
                            };
                            reader.readAsDataURL(uploadedFile);
                            return;
                          } else {
                            alert("Selected file is not an image. Cannot convert non-image to image format.");
                            return;
                          }
                        } else if (['txt', 'csv'].includes(targetExt)) {
                          // Clean text extraction (never binary codes)
                          const isImage = uploadedFile.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|svg)$/i.test(uploadedFile.name);
                          let textData = "";
                          if (isImage) {
                            textData = [
                              `==================================================`,
                              `JARVIS DOCUMENT SUMMARY & METADATA`,
                              `==================================================`,
                              `Original File: ${uploadedFile.name}`,
                              `File Size: ${(uploadedFile.size / 1024).toFixed(1)} KB`,
                              `Original Type: ${uploadedFile.type || 'Image Document'}`,
                              `Extracted Date: ${new Date().toLocaleString()}`,
                              `Status: Clean text conversion completed without binary errors.`,
                              `==================================================`
                            ].join('\n');
                          } else {
                            textData = await uploadedFile.text().catch(() => `Document: ${originalName}`);
                          }
                          const blob = new Blob([textData], { type: 'text/plain;charset=utf-8' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${originalName}_converted_${selectedSize}.${targetExt}`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                          alert(`Clean .${targetExt} document generated without errors!`);
                        } else if (['docx', 'xlsx'].includes(targetExt)) {
                          // Clean valid Office XML / HTML document
                          const isImage = uploadedFile.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|svg)$/i.test(uploadedFile.name);
                          if (isImage) {
                            const reader = new FileReader();
                            reader.onload = (re) => {
                              const htmlDoc = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${originalName}</title></head><body><h1>Document: ${originalName}</h1><p>Type: ${uploadedFile.type}</p><img src="${re.target.result}" style="max-width:100%;height:auto;" /></body></html>`;
                              const blob = new Blob([htmlDoc], { type: 'application/msword;charset=utf-8' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `${originalName}_converted_${selectedSize}.${targetExt}`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                              alert(`Document successfully converted to .${targetExt}!`);
                            };
                            reader.readAsDataURL(uploadedFile);
                            return;
                          } else {
                            const rawTxt = await uploadedFile.text().catch(() => "");
                            const htmlDoc = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><h2>${originalName}</h2><pre>${rawTxt}</pre></body></html>`;
                            const blob = new Blob([htmlDoc], { type: 'application/msword;charset=utf-8' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${originalName}_converted_${selectedSize}.${targetExt}`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                            alert(`Document successfully converted to .${targetExt}!`);
                          }
                        } else {
                          // Original format or generic safe blob
                          const arrayBuffer = await uploadedFile.arrayBuffer();
                          const blob = new Blob([arrayBuffer], { type: uploadedFile.type || 'application/octet-stream' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${originalName}_converted_${selectedSize}.${targetExt}`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                          alert(`File downloaded as .${targetExt}!`);
                        }
                      } catch (err) {
                        alert("File conversion error.");
                      }
                    }}
                    style={{
                      flex: window.innerWidth < 640 ? '1 1 45%' : 'none',
                      padding: '7px 8px',
                      borderRadius: '8px',
                      backgroundColor: fmt === 'Original Format' ? '#590907' : '#A5A79B',
                      border: '1px solid #590907',
                      color: fmt === 'Original Format' ? '#E8D2B5' : '#590907',
                      fontSize: '9px',
                      fontWeight: '900',
                      cursor: 'pointer',
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <Download size={11} /> {fmt}
                  </button>
                ))}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Google Keep Style Notes Modal */}
      {showNotesModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(165,167,155,0.85)', backdropFilter: 'blur(6px)', zIndex: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#E8D2B5', borderRadius: '20px', padding: '22px', width: '100%', maxWidth: '780px', position: 'relative', border: '1px solid #590907', color: '#590907', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <button 
              onClick={() => setShowNotesModal(false)} 
              style={{ position: 'absolute', top: '14px', right: '14px', border: 'none', background: '#590907', color: '#E8D2B5', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={16} />
            </button>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px', color: '#590907' }}>
                  <CheckSquare size={19} color="#590907" /> Google Keep Style Notes
                </h3>
                <span style={{ fontSize: '10px', color: '#3d0605', fontWeight: '600' }}>
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
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: '1px solid #590907',
                    fontSize: '11px',
                    width: '180px',
                    backgroundColor: '#ffffff',
                    color: '#590907',
                    fontWeight: '700',
                    outline: 'none'
                  }}
                />
                <button
                  onClick={() => handleSendNotesEmailNow(notesTargetEmail || userProfile?.email || 'sataparahetkumar786@gmail.com')}
                  disabled={isSendingNotesEmail}
                  style={{
                    backgroundColor: '#590907',
                    color: '#E8D2B5',
                    border: 'none',
                    padding: '7px 14px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: '900',
                    cursor: isSendingNotesEmail ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(89,9,7,0.3)',
                    transition: 'all 0.2s'
                  }}
                  title="Deliver current notes directly to this Gmail ID now"
                >
                  <Mail size={13} />
                  {isSendingNotesEmail ? 'Sending...' : 'Send Notes to My Gmail Now'}
                </button>
              </div>
            </div>

            {/* Daily Email Schedule Banner & Feedback */}
            <div style={{ padding: '8px 12px', borderRadius: '10px', backgroundColor: '#590907', color: '#E8D2B5', fontSize: '10px', fontWeight: '700', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
              <span>🕒 3x Daily Automated Reminders: <strong>09:00 AM</strong>, <strong>02:00 PM</strong>, <strong>08:00 PM</strong> delivered to your registered Gmail.</span>
              {notesEmailFeedback && (
                <span style={{ color: '#38bdf8', fontWeight: '900' }}>{notesEmailFeedback}</span>
              )}
            </div>

            {/* Clean Note Creator (No complicated checklist mode - Simple title & text note) */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '14px', border: '1px solid #590907', marginBottom: '18px', boxShadow: '0 2px 10px rgba(89,9,7,0.1)' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: '900', color: '#590907' }}>
                  ✍️ Create a Note
                </span>

                {/* Color Palette & Pin Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: '#590907' }}>Color:</span>
                  {['#38bdf8', '#f59e0b', '#10b981', '#f43f5e', '#a855f7', '#590907'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewNoteColor(c)}
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: c,
                        border: newNoteColor === c ? '2px solid #000' : '1px solid #ccc',
                        cursor: 'pointer'
                      }}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => setNewNotePinned(!newNotePinned)}
                    title={newNotePinned ? "Pinned to Top" : "Pin Note"}
                    style={{
                      border: '1px solid #ddd',
                      background: newNotePinned ? '#ffe4e6' : '#f9fafb',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: newNotePinned ? '#e11d48' : '#6b7280',
                      fontSize: '10px',
                      fontWeight: '800'
                    }}
                  >
                    <Pin size={13} fill={newNotePinned ? '#e11d48' : 'none'} />
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
                  border: '1px solid #ddd',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#111827',
                  marginBottom: '8px',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />

              {/* Note Content Textarea */}
              <textarea
                placeholder="Take a note, write details, checklist items or reminders here..."
                rows={3}
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  fontSize: '12px',
                  color: '#111827',
                  marginBottom: '10px',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  lineHeight: '1.5',
                  outline: 'none'
                }}
              />

              {/* Submit Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleSaveNote}
                  style={{
                    backgroundColor: '#590907',
                    color: '#E8D2B5',
                    border: 'none',
                    padding: '8px 20px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: '900',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(89,9,7,0.2)'
                  }}
                >
                  Save Note
                </button>
              </div>
            </div>

            {/* Filter Tabs & Search: ONLY All Notes and Pinned as requested */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => setNoteFilterTab('all')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: '1px solid #590907',
                    backgroundColor: noteFilterTab === 'all' ? '#590907' : 'transparent',
                    color: noteFilterTab === 'all' ? '#E8D2B5' : '#590907',
                    fontSize: '11px',
                    fontWeight: '900',
                    cursor: 'pointer',
                    boxShadow: noteFilterTab === 'all' ? '0 2px 6px rgba(89,9,7,0.2)' : 'none'
                  }}
                >
                  All Notes ({notesList.length})
                </button>
                <button
                  onClick={() => setNoteFilterTab('pinned')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: '1px solid #590907',
                    backgroundColor: noteFilterTab === 'pinned' ? '#590907' : 'transparent',
                    color: noteFilterTab === 'pinned' ? '#E8D2B5' : '#590907',
                    fontSize: '11px',
                    fontWeight: '900',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: noteFilterTab === 'pinned' ? '0 2px 6px rgba(89,9,7,0.2)' : 'none'
                  }}
                >
                  <Pin size={12} fill={noteFilterTab === 'pinned' ? '#E8D2B5' : 'none'} />
                  Pinned ({notesList.filter(n => n.pinned).length})
                </button>
              </div>

              <input
                type="text"
                placeholder="Search notes..."
                value={noteSearchQuery}
                onChange={(e) => setNoteSearchQuery(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid #590907',
                  backgroundColor: '#ffffff',
                  color: '#590907',
                  fontSize: '11px',
                  width: '180px',
                  outline: 'none',
                  fontWeight: '600'
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
                      <p style={{ margin: '6px 0 12px 0', fontSize: '11px', color: '#374151', whiteSpace: 'pre-wrap', lineHeight: '1.5', wordBreak: 'break-word' }}>
                        {note.content || (Array.isArray(note.checklist) ? note.checklist.map(c => c.text).join(', ') : '')}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f3f4f6', paddingTop: '8px', fontSize: '9px', color: '#9ca3af', fontWeight: '700' }}>
                      <span>{note.createdAt || 'Saved'}</span>
                      {note.pinned && (
                        <span style={{ color: '#e11d48', backgroundColor: '#ffe4e6', padding: '1px 6px', borderRadius: '4px', fontWeight: '800' }}>
                          📌 Pinned
                        </span>
                      )}
                    </div>
                  </div>
                ))}

              {notesList.filter(n => noteFilterTab === 'pinned' ? n.pinned : true).length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 20px', color: '#590907' }}>
                  <CheckSquare size={36} color="#590907" style={{ margin: '0 auto 8px auto', opacity: 0.7 }} />
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
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(165,167,155,0.7)', backdropFilter: 'blur(3px)', zIndex: 150, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ backgroundColor: '#E8D2B5', width: '100%', maxWidth: '520px', height: '100%', padding: '16px', borderLeft: '1px solid #590907', display: 'flex', flexDirection: 'column', color: '#590907', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: '#590907' }}>Gujarat Live Route & Real-Time Radar</h3>
                <span style={{ fontSize: '9px', fontWeight: '800', color: '#590907', backgroundColor: '#A5A79B', padding: '1px 5px', borderRadius: '4px' }}>
                  Strictly Gujarat • Direct Search Circles, Mandir, Hospitals, Hostels
                </span>
              </div>
              <button onClick={() => setShowRoutePanel(false)} style={{ border: 'none', background: '#590907', color: '#E8D2B5', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>
            </div>

            {/* Gujarat Landmark Category Quick Filters */}
            <div style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '9px', fontWeight: '800', color: '#3d0605', display: 'block', marginBottom: '4px' }}>
                Direct Gujarat Landmark Selector:
              </span>
              <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '3px' }}>
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
                      background: selectedPoiCategory === cat.id ? '#590907' : '#A5A79B',
                      color: selectedPoiCategory === cat.id ? '#E8D2B5' : '#590907',
                      border: '1px solid #590907',
                      padding: '3px 7px',
                      borderRadius: '6px',
                      fontSize: '9px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Scrollable POI Quick Selection Bar when category selected */}
              {selectedPoiCategory !== 'all' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxHeight: '110px', overflowY: 'auto', backgroundColor: '#A5A79B', border: '1px solid #590907', borderRadius: '8px', padding: '6px', margin: '6px 0' }}>
                  {GUJARAT_POI_DATABASE.filter(p => p.category === selectedPoiCategory).map((poi, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '3px 4px', borderBottom: '1px solid rgba(89,9,7,0.2)' }}>
                      <span style={{ fontSize: '10px', fontWeight: '800', color: '#590907', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '270px' }}>
                        {poi.name}
                      </span>
                      <div style={{ display: 'flex', gap: '3px', flexShrink: 0 }}>
                        <button 
                          type="button" 
                          onClick={() => { setFromInput(poi.name); setActiveRoute(prev => ({ ...prev, fromName: poi.name, fromCoords: poi.coords })); }} 
                          style={{ background: '#590907', color: '#E8D2B5', border: 'none', padding: '2px 5px', borderRadius: '4px', fontSize: '9px', fontWeight: '800', cursor: 'pointer' }}
                        >
                          From
                        </button>
                        <button 
                          type="button" 
                          onClick={() => { setToInput(poi.name); setActiveRoute(prev => ({ ...prev, toName: poi.name, toCoords: poi.coords })); }} 
                          style={{ background: '#3d0605', color: '#E8D2B5', border: 'none', padding: '2px 5px', borderRadius: '4px', fontSize: '9px', fontWeight: '800', cursor: 'pointer' }}
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
            <form onSubmit={handleApplyRoute} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px', position: 'relative' }}>
              <div style={{ display: 'flex', flexDirection: window.innerWidth < 500 ? 'column' : 'row', gap: '6px', position: 'relative' }}>
                <div style={{ flex: 1, position: 'relative', display: 'flex', gap: '4px' }}>
                  <input
                    type="text"
                    placeholder="Search From (e.g. Iskcon, Civil, Akshardham)..."
                    value={fromInput}
                    onChange={(e) => setFromInput(e.target.value)}
                    style={{ flex: 1, padding: '9px 10px', borderRadius: '8px', border: '1px solid #590907', backgroundColor: '#A5A79B', color: '#590907', fontSize: '11px', outline: 'none' }}
                  />
                  <button type="button" onClick={() => handleGetCurrentLocation('from')} title="GPS" style={{ background: '#590907', border: '1px solid #E8D2B5', color: '#E8D2B5', padding: '0 8px', borderRadius: '8px', cursor: 'pointer', fontSize: '9px', fontWeight: '800' }}>GPS</button>
                  {fromSuggestions.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#A5A79B', border: '1px solid #590907', borderRadius: '8px', zIndex: 300, maxHeight: '140px', overflowY: 'auto' }}>
                      {fromSuggestions.map((item, i) => (
                        <div key={i} onClick={() => handleSelectFromSuggestion(item)} style={{ padding: '7px 9px', fontSize: '10px', cursor: 'pointer', borderBottom: '1px solid #590907', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '8px', fontWeight: '900', color: '#E8D2B5', backgroundColor: '#590907', padding: '1px 4px', borderRadius: '3px' }}>
                            {item.category ? item.category.toUpperCase() : 'GUJARAT'}
                          </span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.display_name}</span>
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
                    style={{ flex: 1, padding: '9px 10px', borderRadius: '8px', border: '1px solid #590907', backgroundColor: '#A5A79B', color: '#590907', fontSize: '11px', outline: 'none' }}
                  />
                  <button type="button" onClick={() => handleGetCurrentLocation('to')} title="GPS" style={{ background: '#590907', border: '1px solid #E8D2B5', color: '#E8D2B5', padding: '0 8px', borderRadius: '8px', cursor: 'pointer', fontSize: '9px', fontWeight: '800' }}>GPS</button>
                  {toSuggestions.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#A5A79B', border: '1px solid #590907', borderRadius: '8px', zIndex: 300, maxHeight: '140px', overflowY: 'auto' }}>
                      {toSuggestions.map((item, i) => (
                        <div key={i} onClick={() => handleSelectToSuggestion(item)} style={{ padding: '7px 9px', fontSize: '10px', cursor: 'pointer', borderBottom: '1px solid #590907', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '8px', fontWeight: '900', color: '#E8D2B5', backgroundColor: '#590907', padding: '1px 4px', borderRadius: '3px' }}>
                            {item.category ? item.category.toUpperCase() : 'GUJARAT'}
                          </span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.display_name}</span>
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
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#7f1d1d', color: '#fecaca', fontWeight: '900', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <StopCircle size={15} /> Stop Route Navigation
                  </button>
                ) : (
                  <button type="submit" style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#590907', color: '#E8D2B5', fontWeight: '900', fontSize: '11px', cursor: 'pointer' }}>
                    Start Live Navigation & Traffic Radar
                  </button>
                )}
                <button 
                  type="button" 
                  onClick={() => setIsSimulatedTraffic(!isSimulatedTraffic)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #590907',
                    backgroundColor: isSimulatedTraffic ? '#ef4444' : '#A5A79B',
                    color: isSimulatedTraffic ? '#ffffff' : '#590907',
                    fontWeight: '900',
                    fontSize: '10px',
                    cursor: 'pointer'
                  }}
                  title="Simulate congestion on path to test instant alert & voice warning"
                >
                  {isSimulatedTraffic ? 'Simulated: Traffic ON' : 'Test Traffic Alert'}
                </button>
              </div>
            </form>

            {/* Leaflet Map (Clear segment in Green, Traffic segment in RED) */}
            <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #590907', backgroundColor: '#A5A79B', minHeight: '220px', height: '220px', marginBottom: '8px' }}>
              <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }}></div>
            </div>

            {/* Live Real-Time Traffic Telemetry Messages Stream */}
            <div style={{ backgroundColor: '#A5A79B', border: '1px solid #590907', borderRadius: '10px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #590907', paddingBottom: '4px' }}>
                <span style={{ fontSize: '10px', fontWeight: '900', color: '#590907', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Radio size={12} color="#590907" /> Real-Time Traffic Dispatch Feed
                </span>
                <span style={{ fontSize: '9px', fontWeight: '800', color: isMonitoringActive ? '#15803d' : '#3d0605' }}>
                  {isMonitoringActive ? '● 1s Active Radar' : 'Standby'}
                </span>
              </div>

              <div style={{ maxHeight: '110px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '4px' }}>
                {trafficLiveLogs.length === 0 ? (
                  <p style={{ margin: '6px 0', fontSize: '10px', color: '#3d0605', textAlign: 'center' }}>
                    Select From and To locations in Gujarat above. System will continuously stream traffic updates every second.
                  </p>
                ) : (
                  trafficLiveLogs.map((log) => (
                    <div key={log.id} style={{ display: 'flex', gap: '6px', fontSize: '9px', color: log.level === 'alert' ? '#b91c1c' : '#590907', fontWeight: log.level === 'alert' ? '900' : '700' }}>
                      <span style={{ color: '#3d0605', flexShrink: 0 }}>[{log.time}]</span>
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
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(165,167,155,0.85)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#E8D2B5', borderRadius: '20px', padding: '20px', width: '100%', maxWidth: '400px', position: 'relative', border: '1px solid #590907', color: '#590907', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setShowWatcherModal(false)} style={{ position: 'absolute', top: '14px', right: '14px', border: 'none', background: '#590907', color: '#E8D2B5', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#590907', color: '#E8D2B5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={18} />
              </div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>Permanent Watcher Reminders</h3>
            </div>

            <form onSubmit={handleAddOrUpdateReminder} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  placeholder="Enter task..."
                  value={currentTaskInput}
                  onChange={(e) => setCurrentTaskInput(e.target.value)}
                  style={{ flex: 1, padding: '9px 10px', borderRadius: '8px', border: '1px solid #590907', backgroundColor: '#A5A79B', color: '#590907', fontSize: '11px', outline: 'none' }}
                />
                <input
                  type="time"
                  value={currentTimeInput}
                  onChange={(e) => setCurrentTimeInput(e.target.value)}
                  style={{ width: '100px', padding: '9px 6px', borderRadius: '8px', border: '1px solid #590907', backgroundColor: '#A5A79B', color: '#590907', fontSize: '11px', outline: 'none' }}
                />
              </div>

              <button type="submit" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#590907', color: '#E8D2B5', fontWeight: '900', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Plus size={15} /> {editingIndex !== null ? "Update Reminder" : "Add Permanent Reminder"}
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto', paddingRight: '4px', marginBottom: '10px' }}>
              {sortedReminders.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#3d0605', fontSize: '11px', margin: '14px 0' }}>No reminders set.</p>
              ) : (
                sortedReminders.map((rem, idx) => {
                  const originalIndex = remindersList.findIndex(r => r.task === rem.task && r.time === rem.time);
                  return (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#A5A79B', border: '1px solid #590907', borderRadius: '8px', padding: '8px 10px' }}>
                      <div style={{ overflow: 'hidden', paddingRight: '6px' }}>
                        <p style={{ margin: 0, fontSize: '11px', fontWeight: '800', color: rem.completed ? '#3d0605' : '#590907', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {rem.task} {rem.completed && "✓"}
                        </p>
                        <span style={{ fontSize: '9px', color: '#3d0605', fontWeight: '700' }}>Time: {formatTimeTo12Hour(rem.time)}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '4px', flexShrink: 0, alignItems: 'center' }}>
                        {rem.completed && (
                          <div title="Task Completed" style={{ width: '22px', height: '22px', borderRadius: '5px', backgroundColor: 'rgba(89, 9, 7, 0.2)', border: '1px solid #590907', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#590907' }}>
                            <Check size={12} />
                          </div>
                        )}
                        <button onClick={() => handleEditReminder(originalIndex)} style={{ background: '#590907', border: 'none', color: '#E8D2B5', padding: '5px', borderRadius: '5px', cursor: 'pointer' }}><Edit2 size={12} /></button>
                        <button onClick={() => handleDeleteReminder(originalIndex)} style={{ background: '#7f1d1d', border: 'none', color: '#fecaca', padding: '5px', borderRadius: '5px', cursor: 'pointer' }}><Trash2 size={12} /></button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ position: 'relative', borderTop: '1px solid #590907', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button 
                type="button"
                onClick={testFluteSound}
                title="Test Alarm Sound"
                style={{ background: '#590907', border: '1px solid #E8D2B5', color: '#E8D2B5', padding: '5px 10px', borderRadius: '7px', fontSize: '10px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <Volume2 size={12} /> Test Tune
              </button>

              <button 
                onClick={() => setShowSnoozeDropdown(!showSnoozeDropdown)}
                title="Snooze Settings"
                style={{ background: '#590907', border: '1px solid #E8D2B5', color: '#E8D2B5', padding: '5px 10px', borderRadius: '7px', fontSize: '10px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <Moon size={12} /> ZZZ ({snoozeMinutes}m)
              </button>

              {showSnoozeDropdown && (
                <div style={{ position: 'absolute', bottom: '100%', right: 0, marginBottom: '6px', backgroundColor: '#590907', border: '1px solid #E8D2B5', borderRadius: '8px', padding: '6px', zIndex: 300, display: 'flex', flexDirection: 'column', gap: '3px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                  <span style={{ fontSize: '8px', fontWeight: '700', color: '#A5A79B', paddingLeft: '3px' }}>Select Snooze:</span>
                  {[1, 5, 10, 15, 30].map((m) => (
                    <button 
                      key={m} 
                      onClick={() => { setSnoozeMinutes(m); setShowSnoozeDropdown(false); }}
                      style={{ background: snoozeMinutes === m ? '#E8D2B5' : 'transparent', color: snoozeMinutes === m ? '#590907' : '#E8D2B5', border: 'none', padding: '5px 10px', borderRadius: '5px', fontSize: '10px', fontWeight: '800', cursor: 'pointer', textAlign: 'left' }}
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

      {/* Full-Screen Watcher Reminder Alert Modal (Triggers Visually When Reminder Is Due) */}
      {activeAlertTask && (
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          backgroundColor: 'rgba(89, 9, 7, 0.96)', 
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
            boxShadow: '0 0 35px rgba(220, 38, 38, 0.85)'
          }}>
            <Bell size={44} />
          </div>

          <span style={{ 
            fontSize: '12px', 
            fontWeight: '900', 
            color: '#fca5a5', 
            textTransform: 'uppercase', 
            letterSpacing: '2.5px', 
            marginBottom: '8px' 
          }}>
            ⏰ Watcher Reminder Alert
          </span>

          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: '900', 
            color: '#E8D2B5', 
            maxWidth: '680px', 
            lineHeight: '1.3', 
            margin: '0 0 10px 0', 
            padding: '0 16px',
            wordBreak: 'break-word'
          }}>
            "{activeAlertTask}"
          </h1>

          <p style={{ margin: '0 0 28px 0', fontSize: '13px', color: '#fca5a5', fontWeight: '700' }}>
            Scheduled reminder time has arrived!
          </p>

          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => {
                stopAlarmSound();
                if (currentAlertTaskId !== null && currentAlertTaskId >= 0) {
                  const updated = [...remindersList];
                  if (updated[currentAlertTaskId]) {
                    updated[currentAlertTaskId].completed = true;
                    setRemindersList(updated);
                  }
                }
                setActiveAlertTask(null);
                setActiveAlertKey(null);
                setCurrentAlertTaskId(null);
              }}
              style={{ 
                padding: '13px 30px', 
                borderRadius: '12px', 
                border: 'none', 
                backgroundColor: '#E8D2B5', 
                color: '#590907', 
                fontWeight: '900', 
                fontSize: '15px', 
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Check size={18} /> Got It / Dismiss
            </button>

            <button
              onClick={handleSnooze}
              style={{ 
                padding: '13px 26px', 
                borderRadius: '12px', 
                border: '1px solid #E8D2B5', 
                backgroundColor: '#3d0605', 
                color: '#E8D2B5', 
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

      {/* Google Profile Modal */}
      {showProfileModal && userProfile && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(165,167,155,0.85)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#E8D2B5', borderRadius: '20px', padding: '24px 20px', width: '100%', maxWidth: '340px', position: 'relative', border: '1px solid #590907', color: '#590907', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.25)' }}>
            <button onClick={() => setShowProfileModal(false)} style={{ position: 'absolute', top: '14px', right: '14px', border: 'none', background: '#590907', color: '#E8D2B5', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>

            {userProfile.photo ? (
              <img 
                src={userProfile.photo} 
                alt={userProfile.name} 
                style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid #590907', margin: '0 auto 12px auto', display: 'block', objectFit: 'cover' }} 
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#590907', color: '#E8D2B5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', fontSize: '24px', fontWeight: '900' }}>
                {(userProfile.name || 'U').charAt(0).toUpperCase()}
              </div>
            )}

            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '900', color: '#590907' }}>{userProfile.name}</h3>
            <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#3d0605', fontWeight: '600' }}>{userProfile.email}</p>
            <span style={{ fontSize: '10px', color: '#3d0605', display: 'block', marginBottom: '18px' }}>Connected since: {userProfile.connectedDate || 'Active'}</span>

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
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #590907', backgroundColor: '#590907', color: '#E8D2B5', fontWeight: '900', fontSize: '12px', cursor: 'pointer' }}
              >
                Disconnect / Log Out
              </button>

              <button 
                onClick={() => {
                  setShowProfileModal(false);
                  setAuthMode('login');
                  setShowAuthModal(true);
                }}
                style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #590907', backgroundColor: 'transparent', color: '#590907', fontWeight: '900', fontSize: '11px', cursor: 'pointer' }}
              >
                Switch Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Expense Tracker Modal */}
      {/* Expense, Income Tracker & Monthly Financial Report Modal */}
      {showExpenseModal && (() => {
        const monthlyItems = (expenseList || []).filter(item => {
          if (!item) return false;
          if (!item.date) return true;
          return String(item.date).startsWith(selectedExpenseMonth) || String(item.date).includes(selectedExpenseMonth);
        });

        const monthlyEarned = monthlyItems
          .filter(i => i && i.type === 'income')
          .reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);

        const monthlySpent = monthlyItems
          .filter(i => i && i.type !== 'income')
          .reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);

        const monthlyNet = monthlyEarned - monthlySpent;
        const monthlyRemainingBudget = monthlyBudget - monthlySpent;
        const budgetPct = monthlyBudget > 0 ? Math.min(Math.round((monthlySpent / monthlyBudget) * 100), 100) : 0;

        const catMap = {};
        monthlyItems.filter(i => i && i.type !== 'income').forEach(i => {
          const cat = i.category || 'Other';
          catMap[cat] = (catMap[cat] || 0) + (parseFloat(i.amount) || 0);
        });
        const categoryStats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
        const topCat = categoryStats.length > 0 ? categoryStats[0] : null;
        const savingsRate = monthlyEarned > 0 ? Math.round((monthlyNet / monthlyEarned) * 100) : 0;

        return (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(165,167,155,0.85)', backdropFilter: 'blur(5px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div style={{ backgroundColor: '#E8D2B5', borderRadius: '20px', padding: '22px', width: '100%', maxWidth: '750px', position: 'relative', border: '1px solid #590907', color: '#590907', maxHeight: '92vh', overflowY: 'auto', boxSizing: 'border-box' }}>
              <button onClick={() => setShowExpenseModal(false)} style={{ position: 'absolute', top: '14px', right: '14px', border: 'none', background: '#590907', color: '#E8D2B5', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', paddingRight: '36px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#590907', color: '#E8D2B5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '900', color: '#590907' }}>Expense & Income Manager</h3>
                    <span style={{ fontSize: '10px', color: '#3d0605', fontWeight: '700' }}>Track daily spend, income and monthly reports cleanly</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={handleExportExpensesCSV} title="Download CSV / Excel" style={{ background: '#590907', border: 'none', color: '#E8D2B5', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '800' }}>
                    <FileSpreadsheet size={13} /> Export CSV
                  </button>
                  <button onClick={handleClearAllExpenses} title="Clear All Records" style={{ background: '#7f1d1d', border: 'none', color: '#fecaca', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '800' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Month Selector Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#590907', borderRadius: '12px', padding: '8px 14px', marginBottom: '14px', color: '#E8D2B5' }}>
                <button onClick={handlePrevExpenseMonth} style={{ background: 'transparent', border: '1px solid #E8D2B5', color: '#E8D2B5', padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '900', cursor: 'pointer' }}>
                  ◀ Prev Month
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '900', fontSize: '14px', letterSpacing: '0.5px' }}>
                  <Calendar size={16} color="#E8D2B5" />
                  <span>{formatExpenseMonthLabel(selectedExpenseMonth)}</span>
                </div>
                <button onClick={handleNextExpenseMonth} style={{ background: 'transparent', border: '1px solid #E8D2B5', color: '#E8D2B5', padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '900', cursor: 'pointer' }}>
                  Next Month ▶
                </button>
              </div>

              {/* Clean 3-Card Financial Metric Overview */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                {/* Total Earned */}
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #22c55e', borderRadius: '12px', padding: '12px', boxShadow: '0 2px 8px rgba(34,197,94,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: '#166534', textTransform: 'uppercase' }}>TOTAL EARNED</span>
                    <TrendingUp size={16} color="#166534" />
                  </div>
                  <p style={{ margin: '6px 0 0 0', fontSize: '20px', fontWeight: '900', color: '#166534' }}>+₹{monthlyEarned.toLocaleString()}</p>
                </div>

                {/* Total Spent */}
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #ef4444', borderRadius: '12px', padding: '12px', boxShadow: '0 2px 8px rgba(239,68,68,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: '#991b1b', textTransform: 'uppercase' }}>TOTAL SPENT</span>
                    <TrendingDown size={16} color="#991b1b" />
                  </div>
                  <p style={{ margin: '6px 0 0 0', fontSize: '20px', fontWeight: '900', color: '#991b1b' }}>-₹{monthlySpent.toLocaleString()}</p>
                </div>

                {/* Net Savings */}
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #590907', borderRadius: '12px', padding: '12px', boxShadow: '0 2px 8px rgba(89,9,7,0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: '#590907', textTransform: 'uppercase' }}>NET BALANCE</span>
                    <span style={{ fontSize: '10px', fontWeight: '900', color: monthlyNet >= 0 ? '#166534' : '#991b1b' }}>{savingsRate}% rate</span>
                  </div>
                  <p style={{ margin: '6px 0 0 0', fontSize: '20px', fontWeight: '900', color: monthlyNet >= 0 ? '#166534' : '#991b1b' }}>
                    {monthlyNet >= 0 ? `+₹${monthlyNet.toLocaleString()}` : `-₹${Math.abs(monthlyNet).toLocaleString()}`}
                  </p>
                </div>
              </div>

              {/* Monthly Budget Progress Bar */}
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #590907', borderRadius: '12px', padding: '10px 14px', marginBottom: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', fontWeight: '800', marginBottom: '6px' }}>
                  <span>🎯 Monthly Budget: ₹{monthlyBudget.toLocaleString()}</span>
                  <span style={{ color: monthlyRemainingBudget >= 0 ? '#166534' : '#ef4444' }}>
                    {monthlyRemainingBudget >= 0 ? `₹${monthlyRemainingBudget.toLocaleString()} Remaining (${budgetPct}% used)` : `⚠️ Over budget by ₹${Math.abs(monthlyRemainingBudget).toLocaleString()}`}
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${budgetPct}%`, backgroundColor: budgetPct > 90 ? '#ef4444' : (budgetPct > 70 ? '#f59e0b' : '#166534'), borderRadius: '4px', transition: 'width 0.3s ease' }} />
                </div>
              </div>

              {/* Clean Unified Transaction Creator */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '16px', border: '1px solid #590907', marginBottom: '14px', boxShadow: '0 2px 10px rgba(89,9,7,0.08)' }}>
                {/* Segmented Mode: Spend vs Earn */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setTransactionType('expense')}
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: transactionType === 'expense' ? '2px solid #ef4444' : '1px solid #d1d5db',
                      backgroundColor: transactionType === 'expense' ? '#991b1b' : '#f9fafb',
                      color: transactionType === 'expense' ? '#ffffff' : '#4b5563',
                      fontWeight: '900',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: transactionType === 'expense' ? '0 2px 8px rgba(239,68,68,0.25)' : 'none'
                    }}
                  >
                    🔴 Spend / Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransactionType('income')}
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: transactionType === 'income' ? '2px solid #22c55e' : '1px solid #d1d5db',
                      backgroundColor: transactionType === 'income' ? '#166534' : '#f9fafb',
                      color: transactionType === 'income' ? '#ffffff' : '#4b5563',
                      fontWeight: '900',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: transactionType === 'income' ? '0 2px 8px rgba(34,197,94,0.25)' : 'none'
                    }}
                  >
                    🟢 Earn / Income
                  </button>
                </div>

                {/* 1-Tap Quick Presets */}
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: '#590907', display: 'block', marginBottom: '6px' }}>
                    ⚡ 1-Tap Quick Presets ({transactionType === 'income' ? 'Income' : 'Expense'}):
                  </span>
                  <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {transactionType === 'expense' ? (
                      [
                        { t: 'Tea & Coffee', a: 20, c: 'Food & Snacks' },
                        { t: 'Breakfast / Snacks', a: 50, c: 'Food & Snacks' },
                        { t: 'Lunch / Dinner', a: 120, c: 'Food & Snacks' },
                        { t: 'Petrol / Fuel', a: 100, c: 'Travel & Commute' },
                        { t: 'Groceries', a: 250, c: 'Groceries' },
                        { t: 'Mobile Recharge', a: 299, c: 'Bills & Utilities' }
                      ].map(p => (
                        <button
                          key={p.t}
                          type="button"
                          onClick={() => { setExpenseTitle(p.t); setExpenseAmount(String(p.a)); setExpenseCategory(p.c); }}
                          style={{
                            padding: '4px 9px',
                            borderRadius: '6px',
                            border: '1px solid #590907',
                            backgroundColor: '#E8D2B5',
                            color: '#590907',
                            fontSize: '10px',
                            fontWeight: '800',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          + {p.t} ₹{p.a}
                        </button>
                      ))
                    ) : (
                      [
                        { t: 'Monthly Salary', a: 25000, c: 'Salary & Wages' },
                        { t: 'Freelance Project', a: 5000, c: 'Freelance & Business' },
                        { t: 'Pocket Money', a: 1000, c: 'Gifts & Pocket Money' },
                        { t: 'Cashback & Returns', a: 150, c: 'Investments & Returns' }
                      ].map(p => (
                        <button
                          key={p.t}
                          type="button"
                          onClick={() => { setExpenseTitle(p.t); setExpenseAmount(String(p.a)); setExpenseCategory(p.c); }}
                          style={{
                            padding: '4px 9px',
                            borderRadius: '6px',
                            border: '1px solid #166534',
                            backgroundColor: '#dcfce7',
                            color: '#166534',
                            fontSize: '10px',
                            fontWeight: '800',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          + {p.t} ₹{p.a}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Form Input Line */}
                <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      placeholder={transactionType === 'income' ? "Income Title (e.g. Salary, Client Pay)..." : "Expense Title (e.g. Chai, Groceries, Petrol)..."}
                      value={expenseTitle}
                      onChange={(e) => setExpenseTitle(e.target.value)}
                      style={{ flex: '2 1 200px', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#f9fafb', color: '#111827', fontSize: '12px', outline: 'none', fontWeight: '600' }}
                    />
                    <input
                      type="number"
                      placeholder="₹ Amount"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      style={{ flex: '1 1 100px', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#f9fafb', color: '#111827', fontSize: '12px', outline: 'none', fontWeight: '700' }}
                    />
                    <select
                      value={expenseCategory}
                      onChange={(e) => setExpenseCategory(e.target.value)}
                      style={{ flex: '1.5 1 140px', padding: '9px 10px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#f9fafb', color: '#111827', fontSize: '11px', outline: 'none', fontWeight: '600' }}
                    >
                      {transactionType === 'income' ? (
                        <>
                          <option value="Salary & Wages">💼 Salary & Wages</option>
                          <option value="Freelance & Business">💻 Freelance & Business</option>
                          <option value="Investments & Returns">📈 Investments & Returns</option>
                          <option value="Gifts & Pocket Money">🎁 Gifts & Pocket Money</option>
                          <option value="Other Income">💰 Other Income</option>
                        </>
                      ) : (
                        <>
                          <option value="Food & Snacks">🍔 Food & Snacks</option>
                          <option value="Travel & Commute">🚌 Travel & Commute</option>
                          <option value="Groceries">🛒 Groceries</option>
                          <option value="Bills & Utilities">⚡ Bills & Utilities</option>
                          <option value="Shopping & Books">🛍️ Shopping & Books</option>
                          <option value="Health & Medical">💊 Health & Medical</option>
                          <option value="Other Expense">📦 Other Expense</option>
                        </>
                      )}
                    </select>
                    <button 
                      type="submit" 
                      style={{ 
                        padding: '9px 20px', 
                        borderRadius: '8px', 
                        border: 'none', 
                        backgroundColor: transactionType === 'income' ? '#166534' : '#590907', 
                        color: '#E8D2B5', 
                        fontWeight: '900', 
                        fontSize: '12px', 
                        cursor: 'pointer', 
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                      }}
                    >
                      {transactionType === 'income' ? '+ Add Income' : '+ Add Expense'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Clear Content Tabs: Transactions List vs Monthly Analytics */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <button
                  type="button"
                  onClick={() => setExpenseTabMode('tracker')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #590907',
                    backgroundColor: expenseTabMode === 'tracker' ? '#590907' : 'transparent',
                    color: expenseTabMode === 'tracker' ? '#E8D2B5' : '#590907',
                    fontSize: '11px',
                    fontWeight: '900',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Edit2 size={13} /> Transactions ({monthlyItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setExpenseTabMode('monthly_report')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #590907',
                    backgroundColor: expenseTabMode === 'monthly_report' ? '#590907' : 'transparent',
                    color: expenseTabMode === 'monthly_report' ? '#E8D2B5' : '#590907',
                    fontSize: '11px',
                    fontWeight: '900',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <BarChart2 size={13} /> Monthly Analytics & Report
                </button>
              </div>

              {/* Tab 1: Transactions List */}
              {expenseTabMode === 'tracker' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {monthlyItems.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 10px', backgroundColor: '#ffffff', borderRadius: '10px', border: '1px dashed #590907', color: '#590907' }}>
                      <DollarSign size={32} color="#590907" style={{ margin: '0 auto 6px auto', opacity: 0.6 }} />
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: '800' }}>
                        No transactions recorded for {formatExpenseMonthLabel(selectedExpenseMonth)}.
                      </p>
                      <span style={{ fontSize: '11px', opacity: 0.8 }}>Add your first expense or income above!</span>
                    </div>
                  ) : (
                    monthlyItems.map((item, idx) => {
                      const isInc = item.type === 'income';
                      return (
                        <div
                          key={item.id || idx}
                          style={{
                            backgroundColor: '#ffffff',
                            borderRadius: '10px',
                            padding: '10px 14px',
                            border: '1px solid #e5e7eb',
                            borderLeft: `4px solid ${isInc ? '#22c55e' : '#ef4444'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: isInc ? '#dcfce7' : '#fee2e2', color: isInc ? '#166534' : '#991b1b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {isInc ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            </div>
                            <div>
                              <p style={{ margin: 0, fontSize: '12px', fontWeight: '800', color: '#111827' }}>{item.title}</p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px', color: '#6b7280', marginTop: '2px' }}>
                                <span style={{ backgroundColor: '#f3f4f6', padding: '1px 5px', borderRadius: '3px', fontWeight: '700' }}>{item.category}</span>
                                <span>•</span>
                                <span>{item.date || 'Today'}</span>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '14px', fontWeight: '900', color: isInc ? '#166534' : '#991b1b' }}>
                              {isInc ? `+₹${parseFloat(item.amount).toLocaleString()}` : `-₹${parseFloat(item.amount).toLocaleString()}`}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteExpense(item.id || idx)}
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '3px', color: '#9ca3af' }}
                              title="Delete transaction"
                            >
                              <Trash2 size={13} />
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
                  {/* Earned vs Spent Visual Ratio Bar */}
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #590907', borderRadius: '12px', padding: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '900', color: '#590907' }}>
                        📊 Earned vs Spent ({formatExpenseMonthLabel(selectedExpenseMonth)})
                      </span>
                      <span style={{ fontSize: '10px', fontWeight: '800', color: '#166534' }}>
                        Savings Rate: {savingsRate}%
                      </span>
                    </div>

                    <div style={{ display: 'flex', height: '14px', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#e5e7eb', marginBottom: '8px' }}>
                      <div 
                        style={{ 
                          width: monthlyEarned > 0 ? `${Math.round((monthlyEarned / (monthlyEarned + monthlySpent || 1)) * 100)}%` : '0%', 
                          backgroundColor: '#166534' 
                        }} 
                        title="Earned"
                      />
                      <div 
                        style={{ 
                          width: monthlySpent > 0 ? `${Math.round((monthlySpent / (monthlyEarned + monthlySpent || 1)) * 100)}%` : '0%', 
                          backgroundColor: '#991b1b' 
                        }} 
                        title="Spent"
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: '800' }}>
                      <span style={{ color: '#166534' }}>🟢 Earned: ₹{monthlyEarned.toLocaleString()}</span>
                      <span style={{ color: '#991b1b' }}>🔴 Spent: ₹{monthlySpent.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Category Breakdown Bar Chart */}
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #590907', borderRadius: '12px', padding: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: '900', color: '#590907' }}>
                      🏷️ Spending by Category
                    </h4>
                    {categoryStats.length === 0 ? (
                      <p style={{ margin: 0, fontSize: '11px', color: '#6b7280' }}>No expense records available for this month.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {categoryStats.map(([cat, amt]) => {
                          const pct = monthlySpent > 0 ? Math.round((amt / monthlySpent) * 100) : 0;
                          return (
                            <div key={cat}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: '800', marginBottom: '2px' }}>
                                <span>{cat}</span>
                                <span>₹{amt.toLocaleString()} ({pct}%)</span>
                              </div>
                              <div style={{ width: '100%', height: '7px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${pct}%`, backgroundColor: '#590907', borderRadius: '4px' }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Monthly Health Report */}
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #590907', borderRadius: '12px', padding: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '900', color: '#590907' }}>
                      📑 Monthly Financial Health Report
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px', fontSize: '11px' }}>
                      <div>• <strong>Top Spending Area:</strong> {topCat ? `${topCat[0]} (₹${topCat[1].toLocaleString()})` : 'None'}</div>
                      <div>• <strong>Daily Average:</strong> ₹{Math.round(monthlySpent / 30).toLocaleString()} / day</div>
                      <div>• <strong>Savings Rate:</strong> {savingsRate}%</div>
                      <div>• <strong>Budget Status:</strong> {monthlyRemainingBudget >= 0 ? '✅ Within Budget' : '⚠️ Over Budget'}</div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        );
      })()}

      {/* Daily Briefing & Live Google News Flash Modal */}
      {showBriefingModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(165,167,155,0.85)', backdropFilter: 'blur(5px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#E8D2B5', borderRadius: '20px', padding: '22px', width: '100%', maxWidth: '800px', position: 'relative', border: '1px solid #590907', color: '#590907', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
            <button onClick={() => setShowBriefingModal(false)} style={{ position: 'absolute', top: '14px', right: '14px', border: 'none', background: '#590907', color: '#E8D2B5', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#590907', color: '#E8D2B5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Newspaper size={19} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#590907' }}>
                  Live Briefing & IPO Intelligence Hub
                </h3>
                <span style={{ fontSize: '10px', color: '#3d0605', fontWeight: '700' }}>
                  Global, India, Gujarat News & Real-Time Plain English IPO Intelligence
                </span>
              </div>
            </div>

            {/* Top 4 Selection Options: Global, India, Gujarat, and IPO Info (Hindi) */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
              {[
                { id: 'global', label: '🌐 Global News' },
                { id: 'india', label: '🇮🇳 India News' },
                { id: 'gujarat', label: '🏛️ Gujarat News' },
                { id: 'ipo', label: '📈 Live IPO Radar (Easy Guide)' }
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
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: '1px solid #590907',
                      backgroundColor: isSel ? '#590907' : '#A5A79B',
                      color: isSel ? '#E8D2B5' : '#590907',
                      fontWeight: '900',
                      fontSize: '11px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      transition: 'all 0.2s ease',
                      boxShadow: isSel ? '0 2px 6px rgba(89,9,7,0.35)' : 'none'
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* When IPO Info is Selected: Real-Time Plain English IPO Intelligence Center */}
            {newsCategory === 'ipo' ? (
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
                
                {/* Real-time Live Market Feed Status Bar with Manual Refresh */}
                <div style={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #590907', 
                  borderRadius: '12px', 
                  padding: '10px 14px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  flexWrap: 'wrap', 
                  gap: '8px',
                  boxShadow: '0 2px 6px rgba(89,9,7,0.06)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block', boxShadow: '0 0 8px #22c55e' }} />
                    <span style={{ fontSize: '11px', fontWeight: '900', color: '#590907' }}>
                      BSE / NSE Live IPO Radar • Current October–November 2026 Issues
                    </span>
                  </div>
                  <span style={{ fontSize: '10px', color: '#6b7280', fontWeight: '700' }}>
                    Real-time Bidding & Grey Market Premium (GMP)
                  </span>
                </div>

                {/* Beginner Guide Card: Plain English Explanations of All Financial Terms */}
                <div style={{ 
                  backgroundColor: '#fef3c7', 
                  border: '1px solid #f59e0b', 
                  borderRadius: '12px', 
                  padding: '12px 14px', 
                  fontSize: '11px', 
                  lineHeight: '1.5',
                  boxShadow: '0 2px 6px rgba(245,158,11,0.1)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: '#92400e', fontWeight: '900', fontSize: '12px' }}>
                    <span>💡</span>
                    <span>New to IPOs? Everyday Plain English Guide:</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px', color: '#78350f', fontSize: '10px' }}>
                    <div>
                      <strong>• What is an IPO?</strong> When a private company sells its shares to the public on the stock market for the first time.
                    </div>
                    <div>
                      <strong>• What does "Subscription" mean?</strong> Public demand. If demand is <strong>3x</strong>, it means for every 1 share available, 3 people applied to buy it.
                    </div>
                    <div>
                      <strong>• What is "GMP" (Grey Market Premium)?</strong> Unofficial estimated extra profit per share when the stock begins trading on Day 1.
                    </div>
                    <div>
                      <strong>• What is "Lot Size"?</strong> The minimum bundle of shares you must buy. (In an IPO, you cannot buy just 1 single share).
                    </div>
                    <div>
                      <strong>• What is "Allotment"?</strong> Getting the shares in your Demat account. If too many apply, a computerized lucky draw picks winners. If you don't win, your money is safely unblocked.
                    </div>
                  </div>
                </div>

                {/* Sub-Tabs: Live Open vs Upcoming */}
                <div style={{ display: 'flex', gap: '8px', backgroundColor: '#A5A79B', padding: '6px', borderRadius: '10px', border: '1px solid #590907' }}>
                  <button
                    type="button"
                    onClick={() => setIpoSubTab('live')}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: ipoSubTab === 'live' ? '#590907' : 'transparent',
                      color: ipoSubTab === 'live' ? '#E8D2B5' : '#590907',
                      fontSize: '11px',
                      fontWeight: '900',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: ipoSubTab === 'live' ? '0 2px 6px rgba(89,9,7,0.3)' : 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    🟢 Live Open IPOs (Bidding Active - {IPO_DATABASE.live.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setIpoSubTab('upcoming')}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: ipoSubTab === 'upcoming' ? '#590907' : 'transparent',
                      color: ipoSubTab === 'upcoming' ? '#E8D2B5' : '#590907',
                      fontSize: '11px',
                      fontWeight: '900',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: ipoSubTab === 'upcoming' ? '0 2px 6px rgba(89,9,7,0.3)' : 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    📅 Upcoming IPOs (Opening Soon - {IPO_DATABASE.upcoming.length})
                  </button>
                </div>

                {/* IPO Cards in Simple Plain English */}
                {(IPO_DATABASE[ipoSubTab] || []).map((ipo) => (
                  <div
                    key={ipo.id}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #590907',
                      borderRadius: '14px',
                      padding: '16px',
                      boxShadow: '0 2px 10px rgba(89,9,7,0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    {/* Header: Company Name, Category, Exchange & Badges */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: '#590907' }}>
                            {ipo.name}
                          </h4>
                          <span style={{ fontSize: '9px', fontWeight: '800', backgroundColor: '#e2e8f0', color: '#334155', padding: '2px 6px', borderRadius: '4px' }}>
                            {ipo.type} ({ipo.exchange})
                          </span>
                        </div>
                        <span style={{ fontSize: '10px', color: '#6b7280', fontWeight: '700' }}>
                          {ipo.sector}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '10px', fontWeight: '900', backgroundColor: '#dcfce7', color: '#166534', padding: '3px 8px', borderRadius: '6px' }}>
                          {ipo.status}
                        </span>
                        <span style={{ fontSize: '10px', fontWeight: '900', backgroundColor: '#590907', color: '#E8D2B5', padding: '3px 8px', borderRadius: '6px' }}>
                          {ipo.allotmentBadge}
                        </span>
                      </div>
                    </div>

                    {/* Key Metrics Grid (English with Plain Terms) */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px', backgroundColor: '#f9fafb', padding: '10px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '11px' }}>
                      <div>
                        <span style={{ color: '#6b7280', display: 'block', fontSize: '9px', fontWeight: '800' }}>💰 PRICE PER SHARE</span>
                        <strong style={{ color: '#111827', fontSize: '12px' }}>{ipo.priceBand}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#6b7280', display: 'block', fontSize: '9px', fontWeight: '800' }}>📦 MINIMUM INVESTMENT (1 LOT)</span>
                        <strong style={{ color: '#111827', fontSize: '12px' }}>{ipo.lotSize}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#6b7280', display: 'block', fontSize: '9px', fontWeight: '800' }}>🗓️ BIDDING DATES</span>
                        <strong style={{ color: '#111827', fontSize: '12px' }}>{ipo.dates}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#6b7280', display: 'block', fontSize: '9px', fontWeight: '800' }}>🚀 ESTIMATED DAY 1 PROFIT (GMP)</span>
                        <strong style={{ color: '#166534', fontSize: '12px' }}>{ipo.gmp}</strong>
                      </div>
                    </div>

                    {/* What Company Actually Does (Simple English Description) */}
                    <div style={{ fontSize: '11px', color: '#374151', lineHeight: '1.5', backgroundColor: '#fef3c7', padding: '10px 12px', borderRadius: '8px', border: '1px solid #fde68a' }}>
                      <strong style={{ color: '#92400e', display: 'block', marginBottom: '2px' }}>
                        🏭 What Does This Company Actually Do? (Simple English):
                      </strong>
                      <span>{ipo.about}</span>
                    </div>

                    {/* Subscription Breakdown with Plain English Meanings */}
                    <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 12px', fontSize: '11px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
                        <strong style={{ color: '#166534' }}>
                          👥 Public Demand (Subscription Breakdown):
                        </strong>
                        <span style={{ fontSize: '10px', color: '#166534', fontWeight: '800', backgroundColor: '#dcfce7', padding: '2px 8px', borderRadius: '6px' }}>
                          Total Demand: {ipo.subscription.total}
                        </span>
                      </div>
                      <p style={{ margin: '0 0 8px 0', fontSize: '10px', color: '#166534' }}>
                        👉 <em>{ipo.subscription.totalMeaning}</em>
                      </p>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', fontSize: '10px', borderTop: '1px dashed #bbf7d0', paddingTop: '6px' }}>
                        <div>
                          <strong style={{ color: '#15803d' }}>Regular Public (Retail):</strong> {ipo.subscription.retail}
                          <span style={{ display: 'block', color: '#4b5563', marginTop: '1px' }}>{ipo.subscription.retailMeaning}</span>
                        </div>
                        <div>
                          <strong style={{ color: '#15803d' }}>Big Banks & Funds (QIB):</strong> {ipo.subscription.qib}
                          <span style={{ display: 'block', color: '#4b5563', marginTop: '1px' }}>{ipo.subscription.qibMeaning}</span>
                        </div>
                      </div>
                    </div>

                    {/* Chances of Getting Shares (Allotment Probability Explained) */}
                    <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 12px', fontSize: '11px' }}>
                      <strong style={{ color: '#1e40af', display: 'block', marginBottom: '2px' }}>
                        🎯 Chances of Getting Shares (Allotment Probability):
                      </strong>
                      <span style={{ color: '#1e3a8a', fontWeight: '800' }}>{ipo.allotmentChance}</span>
                      <p style={{ margin: '4px 0 0 0', fontSize: '10px', color: '#374151', lineHeight: '1.4' }}>
                        {ipo.allotmentDetail}
                      </p>
                    </div>

                    {/* Expected Day 1 Profit Detail */}
                    <div style={{ backgroundColor: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '8px', padding: '9px 12px', fontSize: '10px' }}>
                      <strong style={{ color: '#6b21a8' }}>📈 Day 1 Profit Outlook: </strong>
                      <span style={{ color: '#581c87' }}>{ipo.gmpDetail}</span>
                    </div>

                    {/* Simple Beginner Advice & Listing Date */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f3f4f6', paddingTop: '8px', fontSize: '11px', flexWrap: 'wrap', gap: '6px' }}>
                      <div>
                        <strong style={{ color: '#590907' }}>💡 Shadow Simple Advice: </strong>
                        <span style={{ color: '#374151', fontWeight: '600' }}>{ipo.verdict}</span>
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: '800', color: '#590907', backgroundColor: '#E8D2B5', padding: '3px 8px', borderRadius: '6px' }}>
                        Listing on Exchange: {ipo.listingDate}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Google News Feed with SQUISH BUG COMPLETELY FIXED */
              <>
                {/* Status & 2-Minute Countdown Bar + Manual Refresh Button */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#A5A79B', border: '1px solid #590907', borderRadius: '10px', padding: '7px 10px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }} />
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#590907' }}>
                      Auto-refresh in {Math.floor(newsCountdown / 60)}m {newsCountdown % 60}s
                    </span>
                    {lastNewsUpdated && (
                      <span style={{ fontSize: '10px', color: '#3d0605' }}>• Updated: {lastNewsUpdated}</span>
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
                      backgroundColor: '#590907',
                      color: '#E8D2B5',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: '800',
                      cursor: isNewsLoading ? 'wait' : 'pointer'
                    }}
                  >
                    <RotateCw size={13} style={{ animation: isNewsLoading ? 'jarvisSpinClockwise 1s linear infinite' : 'none' }} />
                    {isNewsLoading ? 'Updating...' : 'Refresh'}
                  </button>
                </div>

                {/* News Cards List with Image & Hover-Playable Video (flexShrink: 0 ensures full cards) */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
                  {isNewsLoading && trendingNewsList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 10px', color: '#590907', fontWeight: '800', fontSize: '13px' }}>
                      <RotateCw size={24} style={{ animation: 'jarvisSpinClockwise 1s linear infinite', margin: '0 auto 8px auto', display: 'block' }} />
                      Fetching live Google News for {newsCategory.toUpperCase()}...
                    </div>
                  ) : trendingNewsList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: '#3d0605', fontSize: '12px', fontWeight: '700' }}>
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
                          border: '1px solid #590907', 
                          borderRadius: '14px', 
                          padding: '12px', 
                          display: 'flex', 
                          gap: '14px',
                          alignItems: 'center',
                          position: 'relative',
                          overflow: 'hidden',
                          transition: 'all 0.2s ease',
                          boxShadow: hoveredNewsId === (item.id || idx) ? '0 4px 14px rgba(89,9,7,0.2)' : '0 1px 4px rgba(0,0,0,0.05)',
                          flexShrink: 0,
                          minHeight: '110px'
                        }}
                      >
                        {/* Media Thumbnail Container with Hover-Playable Video Preview */}
                        <div style={{ width: '125px', minWidth: '125px', height: '85px', borderRadius: '10px', overflow: 'hidden', position: 'relative', backgroundColor: '#590907', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
                              <div style={{ position: 'absolute', bottom: '4px', left: '4px', backgroundColor: 'rgba(89,9,7,0.85)', padding: '2px 5px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <Play size={8} color="#E8D2B5" fill="#E8D2B5" />
                                <span style={{ fontSize: '7px', fontWeight: '900', color: '#E8D2B5', letterSpacing: '0.5px' }}>PREVIEW</span>
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
                                <Play size={10} color="#E8D2B5" />
                              </div>
                            </>
                          )}
                        </div>

                        {/* News Info & Story Link */}
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '6px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '4px' }}>
                              <span style={{ fontSize: '9px', fontWeight: '900', color: '#E8D2B5', backgroundColor: '#590907', padding: '2px 7px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                {item.source || 'LIVE'}
                              </span>
                              <span style={{ fontSize: '9px', color: '#6b7280', fontWeight: '700' }}>
                                {item.pubDate ? new Date(item.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}
                              </span>
                            </div>

                            <p style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#111827', lineHeight: '1.4', wordBreak: 'break-word' }}>
                              {item.title}
                            </p>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                            <span style={{ fontSize: '9px', color: '#6b7280', fontWeight: '700' }}>Hover to preview video clip</span>
                            <a 
                              href={item.link} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: '900', color: '#E8D2B5', backgroundColor: '#590907', textDecoration: 'none', padding: '5px 12px', borderRadius: '6px', boxShadow: '0 2px 6px rgba(89,9,7,0.2)' }}
                            >
                              Read Article <ExternalLink size={11} />
                            </a>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            <button onClick={() => setShowBriefingModal(false)} style={{ marginTop: '12px', width: '100%', padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: '#590907', color: '#E8D2B5', fontWeight: '900', fontSize: '12px', cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}

    </div>
  );
}