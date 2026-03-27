import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import "./Concierge.css";
import { useAuth } from "@/contexts/AuthContext";
import { Pencil, Check, X, Menu } from "lucide-react";

// --- Types ---
interface UserProfile {
  name: string;
  type: string;
  goals: string;
  investments: string;
  sectors: string;
  risk: string;
  concern: string;
  summary: string;
  persona: string;
  recommendations: string[];
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface MarketItem {
  name: string;
  symbol?: string;
  price: string;
  change: string;
  percentChange: string;
  up: boolean;
  type?: string;
  mock?: boolean;
  open?: string;
  high?: string;
  low?: string;
  volume?: string;
  prevClose?: string;
  marketCap?: string;
  low52?: string;
  high52?: string;
  currency?: string;
}

interface NewsItem {
  title: string;
  source: string;
  time: string;
  url: string;
}

interface ServiceItem {
  id: string;
  title: string;
  best: string;
  matchGoals: string[];
}

interface EventItem {
  title: string;
  desc: string;
  date: string;
  matchSectors: string[];
}

const parseMarkdown = (text: string) => {
  const lines = text.split('\n');
  const elements: any[] = [];
  let listItems: any[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} style={{ paddingLeft: '20px', margin: '8px 0', listStyleType: 'disc' }}>
          {listItems.map((item, i) => (
            <li key={i} style={{ marginBottom: '4px' }}>{item}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  const processInline = (line: string) => {
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ color: 'inherit', fontWeight: 'bold' }}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={index} style={{ 
          fontSize: '18px', 
          fontWeight: 'bold', 
          marginTop: '16px', 
          marginBottom: '8px', 
          color: 'var(--et-accent)' 
        }}>
          {processInline(trimmedLine.substring(4))}
        </h3>
      );
    } else if (trimmedLine.startsWith('* ')) {
      listItems.push(processInline(trimmedLine.substring(2)));
    } else if (trimmedLine === '') {
      flushList();
    } else {
      flushList();
      elements.push(
        <p key={index} style={{ margin: '8px 0', lineHeight: '1.6' }}>
          {processInline(line)}
        </p>
      );
    }
  });

  flushList();
  return elements;
};

const FinancialHealthRings = ({ scores }: { scores: Record<string, number> }) => {
  const categories = [
    { label: 'Savings', key: 'savings', color: '#10B981' },
    { label: 'Investments', key: 'investment', color: '#3B82F6' },
    { label: 'Risk', key: 'risk', color: '#F59E0B' },
    { label: 'Goals', key: 'goals', color: '#8B5CF6' },
    { label: 'Overall', key: 'overall', color: '#F97316' }
  ];

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', 
      gap: '16px', 
      justifyContent: 'center', 
      margin: '20px 0' 
    }}>
      {categories.map((cat, i) => {
        const radius = 35;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (scores[cat.key] / 100) * circumference;
        
        return (
          <div key={cat.key} style={{ textAlign: 'center' }}>
            <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto' }}>
              <svg width="80" height="80" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                <circle
                  cx="50" cy="50" r={radius}
                  fill="transparent"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="8"
                />
                <circle
                  cx="50" cy="50" r={radius}
                  fill="transparent"
                  stroke={cat.color}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  style={{ 
                    strokeDashoffset: offset, 
                    transition: `stroke-dashoffset 1.5s ease-out ${i * 0.2}s`,
                    strokeLinecap: 'round'
                  }}
                />
              </svg>
              <div style={{ 
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                fontSize: '12px', fontWeight: 'bold'
              }}>
                {Math.round(scores[cat.key])}%
              </div>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--et-text-secondary)', marginTop: '4px' }}>{cat.label}</div>
          </div>
        );
      })}
    </div>
  );
};

// --- Constants ---
const SERVICES: ServiceItem[] = [];
const EVENTS: EventItem[] = [];
const ONBOARD_QUESTIONS = [
  { q: "Hi! I'm your ET Concierge 👋 What's your name?", options: null },
  { q: "Nice to meet you, {name}! What best describes you?", options: ["Student", "Salaried Professional", "Business Owner", "Investor", "Retiree"] },
  { q: "Great! What are your top financial goals right now?", options: ["Save Taxes", "Grow Wealth", "Buy a Home", "Plan Retirement", "Build Emergency Fund"] },
  { q: "Which describes your current investments?", options: ["Only FD/Savings", "Some Mutual Funds", "Active Stock Investor", "Just Starting Out"] },
  { q: "What sectors interest you most?", options: ["Banking & Finance", "Tech & Startups", "Real Estate", "Markets & Trading", "Economy & Policy"] },
  { q: "Your risk appetite?", options: ["Conservative", "Moderate", "Aggressive"] },
  { q: "Any specific financial concern right now? (Type your answer)", options: null }
];

interface OnboardAnswer {
  text: string;
  type: 'user' | 'bot';
  options?: string[] | null;
}

interface IndexProps {
  defaultSection?: string;
}

const SYMBOL_MAP: Record<string, { yahoo: string, twelve: string, name: string, currency: string, id: string }> = {
  "NIFTY 50": { id: "nifty", yahoo: "%5ENSEI", twelve: "NIFTY:NSE", name: "Nifty 50", currency: "INR" },
  "RELIANCE": { id: "reliance", yahoo: "RELIANCE.NS", twelve: "RELIANCE:NSE", name: "Reliance Industries", currency: "INR" },
  "TCS": { id: "tcs", yahoo: "TCS.NS", twelve: "TCS:NSE", name: "Tata Consultancy Services", currency: "INR" },
  "INFY": { id: "infy", yahoo: "INFY.NS", twelve: "INFY:NSE", name: "Infosys", currency: "INR" },
  "HDFCBANK": { id: "hdfc", yahoo: "HDFCBANK.NS", twelve: "HDFCBANK:NSE", name: "HDFC Bank", currency: "INR" },
  "USD/INR": { id: "usdinr", yahoo: "USDINR=X", twelve: "USD/INR", name: "USD to INR", currency: "INR" },
  "BTC/USD": { id: "btc", yahoo: "BTC-USD", twelve: "BTC/USD", name: "Bitcoin", currency: "USD" },
};

const RANGE_OPTIONS = [
  { label: "1D", range: "1d", interval: "2m" },
  { label: "8D", range: "8d", interval: "1m" },
  { label: "1M", range: "1mo", interval: "1d" },
];

const DashboardIndex = ({ defaultSection }: IndexProps) => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] = useState(defaultSection || 'landing');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [apiKeys, setApiKeys] = useState({
    gemini: import.meta.env.VITE_GEMINI_KEY || '',
    news: import.meta.env.VITE_NEWS_KEY || '',
    twelveData: import.meta.env.VITE_TWELVE_DATA_KEY || '',
    marketaux: import.meta.env.VITE_Marketaux_API_KEY || ''
  });
  const [marketData, setMarketData] = useState<MarketItem[]>([]);
  const [marketSparklines, setMarketSparklines] = useState<Record<string, any[]>>({});
  const [marketGraphData, setMarketGraphData] = useState<any[]>([]);
  const [activeGraphSymbol, setActiveGraphSymbol] = useState("NIFTY 50");
  const [activeGraphRange, setActiveGraphRange] = useState(RANGE_OPTIONS[1]);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 8);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [marketRange, setMarketRange] = useState<{start: number, end: number, high: number, low: number} | null>(null);
  const [newsData, setNewsData] = useState<NewsItem[]>([]);
  const [webNews, setWebNews] = useState<NewsItem[]>([]);
  const [onboardStep, setOnboardStep] = useState(0);
  const [onboardAnswers, setOnboardAnswers] = useState<Record<string, string>>({});
  const [onboardMessages, setOnboardMessages] = useState<OnboardAnswer[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isMarketLoading, setIsMarketLoading] = useState(true);
  const [isNewsLoading, setIsNewsLoading] = useState(true);
  const [previousClose, setPreviousClose] = useState<number | null>(22912.4);
  const [toasts, setToasts] = useState<string[]>([]);
  const [heroWord, setHeroWord] = useState("News");
  const [aiInput, setAiInput] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [relevanceNotes, setRelevanceNotes] = useState<Record<number, string>>({});
  const [dailyAction, setDailyAction] = useState<string>("");
  const [healthScores, setHealthScores] = useState<Record<string, number>>({ savings: 0, investment: 0, risk: 0, goals: 0, overall: 0 });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [briefingScript, setBriefingScript] = useState("");

  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const onboardMessagesEndRef = useRef<HTMLDivElement>(null);
  const aiMessagesEndRef = useRef<HTMLDivElement>(null);
  
  const hasCheckedInitialRedirect = useRef(false);

  const Skeleton = ({ width, height, className }: { width?: string, height?: string, className?: string }) => (
    <div className={`animate-pulse rounded bg-white/10 ${className}`} style={{ width: width || '100%', height: height || '20px' }}></div>
  );

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMenuOpen]);

  const Navbar = () => (
    <>
      <nav className="sticky top-0 z-40 flex h-[70px] w-full items-center justify-between border-b border-white/5 bg-background/80 px-4 backdrop-blur-md md:px-8">
        <div className="text-xl font-extrabold text-white">
          <span className="text-orange-500">ET</span> Concierge
        </div>
        
        {/* Desktop Links */}
        <div className="hidden items-center gap-1 md:flex lg:gap-2">
          <button 
            onClick={() => setCurrentSection('dashboard')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              currentSection === 'dashboard' ? 'bg-orange-500/10 text-orange-500' : 'text-slate-400 hover:text-white'
            }`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setCurrentSection('markets')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              currentSection === 'markets' ? 'bg-orange-500/10 text-orange-500' : 'text-slate-400 hover:text-white'
            }`}
          >
            Markets
          </button>
          <button 
            onClick={() => setCurrentSection('services')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              currentSection === 'services' ? 'bg-orange-500/10 text-orange-500' : 'text-slate-400 hover:text-white'
            }`}
          >
            Services
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button className="hidden text-sm text-slate-400 transition-colors hover:text-white md:block" onClick={() => setIsSettingsOpen(true)}>
            ⚙ Settings
          </button>
          
          {/* Hamburger Menu Button */}
          <button 
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white md:hidden"
            onClick={() => setIsMenuOpen(true)}
          >
            <Menu size={24} />
          </button>
        </div>
      </nav>

      {/* Mobile Drawer UI */}
      <div className={`fixed inset-0 z-50 md:hidden ${isMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        {/* Overlay */}
        <div 
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
            isMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsMenuOpen(false)}
        />
        
        {/* Sidebar Drawer */}
        <div className={`absolute left-0 top-0 h-full w-64 transform bg-[#0f172a] shadow-2xl transition-transform duration-300 ease-in-out ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex h-[70px] items-center justify-between border-b border-white/5 px-6">
            <div className="text-lg font-bold text-white">
              <span className="text-orange-500">ET</span> Menu
            </div>
            <button 
              onClick={() => setIsMenuOpen(false)}
              className="rounded-full p-2 text-slate-400 hover:bg-white/5 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex flex-col p-4">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
              { id: 'markets', label: 'Markets', icon: '📈' },
              { id: 'services', label: 'Services', icon: '🛠️' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentSection(item.id);
                  setIsMenuOpen(false);
                }}
                className={`mb-2 flex items-center gap-4 rounded-xl p-4 text-left transition-all active:scale-95 ${
                  currentSection === item.id 
                    ? 'bg-orange-500/10 text-orange-500' 
                    : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm font-bold">{item.label}</span>
              </button>
            ))}
            
            <div className="mt-8 border-t border-white/5 pt-6">
              <button 
                onClick={() => {
                  setIsSettingsOpen(true);
                  setIsMenuOpen(false);
                }}
                className="flex w-full items-center gap-4 rounded-xl p-4 text-left text-slate-400 hover:bg-white/5"
              >
                <span>⚙</span>
                <span className="text-sm font-bold">Account Settings</span>
              </button>
            </div>
          </div>

          <div className="absolute bottom-8 left-0 w-full px-6">
             <div className="rounded-xl bg-orange-500/5 p-4 text-center">
                <div className="text-[10px] font-bold uppercase tracking-widest text-orange-500">Professional</div>
                <div className="text-xs text-slate-400">AI Financial Companion</div>
             </div>
          </div>
        </div>
      </div>
    </>
  );

  useEffect(() => {
    if (!defaultSection && user && !authLoading && !hasCheckedInitialRedirect.current) {
      hasCheckedInitialRedirect.current = true;
      const p = localStorage.getItem('et_profile');
      if (p) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    }
  }, [user, authLoading, defaultSection, navigate]);

  useEffect(() => {
    const p = localStorage.getItem('et_profile');
    if (p) {
      const parsedProfile = JSON.parse(p);
      setUserProfile(parsedProfile);
      setEditNameValue(parsedProfile.name);
      if (defaultSection === 'dashboard') setCurrentSection('dashboard');
    } else if (defaultSection === 'onboarding') {
      startOnboarding();
    }

    const c = localStorage.getItem('et_chat');
    if (c) setChatHistory(JSON.parse(c));

    const words = ["News", "Markets", "Finance", "Events", "Investments", "Tax Planning"];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % words.length;
      setHeroWord(words[i]);
    }, 2000);

    return () => clearInterval(interval);
  }, [defaultSection]);

  const [isBriefingLoading, setIsBriefingLoading] = useState(false);

  const isFetchingRef = useRef(false);

  const checkLockout = () => {
    const lockout = localStorage.getItem('et_yahoo_lockout');
    if (lockout) {
      try {
        const { expiry } = JSON.parse(lockout);
        if (Date.now() < expiry) {
          console.info("Yahoo API currently in lockout (429). Using cache.");
          return true;
        }
        localStorage.removeItem('et_yahoo_lockout');
      } catch (e) { localStorage.removeItem('et_yahoo_lockout'); }
    }
    return false;
  };

  const setLockout = (min = 5) => {
    localStorage.setItem('et_yahoo_lockout', JSON.stringify({ expiry: Date.now() + (min * 60 * 1000) }));
  };

  useEffect(() => {
    if (currentSection === 'dashboard' && userProfile) {
      const load = async () => {
        await fetchMarketData();
        await new Promise(r => setTimeout(r, 500));
        await fetchMarketGraph();
        fetchNews();
        calculateHealthScores(userProfile);
        generateDailyAction(userProfile);
        pregenerateBriefing(userProfile);
      };
      load();
    }
  }, [currentSection, userProfile]);

  useEffect(() => {
    if (currentSection === 'markets' && userProfile) {
      fetchMarketData();
      fetchMarketGraph();
    }
  }, [currentSection, activeGraphSymbol, activeGraphRange, userProfile]);

  useEffect(() => {
    onboardMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [onboardMessages]);

  const hasInitialChatScroll = useRef(false);
  useEffect(() => {
    if (chatHistory.length > 0 && hasInitialChatScroll.current) {
      aiMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    if (chatHistory.length > 0) {
      hasInitialChatScroll.current = true;
    }
  }, [chatHistory, isAiTyping]);

  const calculateHealthScores = (profile: UserProfile) => {
    const scores = { savings: 0, investment: 0, risk: 0, goals: 0, overall: 0 };
    
    // Simple logic based on profile strings
    if (profile.investments.includes("Active")) scores.investment = 90;
    else if (profile.investments.includes("Mutual")) scores.investment = 70;
    else scores.investment = 40;

    if (profile.risk === "Conservative") scores.risk = 40;
    else if (profile.risk === "Moderate") scores.risk = 70;
    else scores.risk = 90;

    const goalCount = (profile.goals || "").split(",").length;
    scores.goals = Math.min(goalCount * 25, 100);

    scores.savings = profile.type === "Student" ? 50 : 80;
    
    scores.overall = Math.round((scores.savings + scores.investment + scores.risk + scores.goals) / 4);
    
    setHealthScores(scores);
  };

  const generateDailyAction = async (profile: UserProfile) => {
    const today = new Date().toDateString();
    const cacheKey = `et_nudge_${today}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      setDailyAction(cached);
      return;
    }

    if (!apiKeys.gemini) return;
    
    const prompt = `Today is ${today}. User Profile: ${JSON.stringify(profile)}. 
    Give ONE specific, actionable financial nudge for today in under 25 words. Be direct and personal.`;
    
    const action = await callGemini(prompt, "You are a concise financial coach.");
    if (action) {
      const trimmed = action.trim();
      setDailyAction(trimmed);
      localStorage.setItem(cacheKey, trimmed);
    }
  };

  const pregenerateBriefing = async (profile: UserProfile) => {
    const today = new Date().toDateString();
    const cacheKey = `et_briefing_${today}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      setBriefingScript(cached);
      return;
    }

    if (!apiKeys.gemini) return;
    const prompt = `Generate a concise 45-second personalized morning financial briefing for ${profile.name}. 
    Include a warm greeting, a quick market sentiment summary, and one personal recommendation based on their goal: ${profile.goals}.`;
    
    const script = await callGemini(prompt, "You are a professional ET Markets news anchor. Be concise.");
    if (script) {
      setBriefingScript(script);
      localStorage.setItem(cacheKey, script);
    }
  };

  const toggleBriefing = async () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!briefingScript) {
      setIsBriefingLoading(true);
      const today = new Date().toDateString();
      const prompt = `Generate a 60-second personalized morning financial briefing for ${userProfile?.name}. 
      Include a greeting, a quick market summary, and a personal recommendation based on their goal of ${userProfile?.goals}.`;
      
      const script = await callGemini(prompt, "You are an ET Markets news anchor.");
      setIsBriefingLoading(false);
      if (script) {
        setBriefingScript(script);
        localStorage.setItem(`et_briefing_${today}`, script);
        speak(script);
      }
    } else {
      speak(briefingScript);
    }
  };

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onstart = () => setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const fetchMarketData = async () => {
    if (isFetchingRef.current) return;

    // Check cache first
    const today = new Date().toDateString();
    const cacheKey = `et_market_data_${today}`;
    const cachedSpark = localStorage.getItem(`et_market_sparklines_${today}`);
    const cached = localStorage.getItem(cacheKey);
    
    if (cached && cachedSpark) {
      setMarketData(JSON.parse(cached));
      setMarketSparklines(JSON.parse(cachedSpark));
      setIsMarketLoading(false);
      return;
    }

    if (checkLockout()) {
      setIsMarketLoading(false);
      return;
    }

    isFetchingRef.current = true;
    setIsMarketLoading(true);
    
    try {
      const symbolsList = Object.keys(SYMBOL_MAP);
      const updated: MarketItem[] = [];
      const sparklines: Record<string, any[]> = {};

      for (const key of symbolsList) {
        if (checkLockout()) break;
        const symInfo = SYMBOL_MAP[key];
        
        try {
          // Use the chart API for EVERYTHING (Price + Sparkline)
          const url = `/api-yahoo/v8/finance/chart/${symInfo.yahoo}?interval=1h&range=8d`;
          const r = await fetch(url);
          
          if (r.status === 429) {
            setLockout(10);
            break;
          }

          if (r.ok) {
            const data = await r.json();
            if (data.chart?.result?.[0]) {
              const result = data.chart.result[0];
              const meta = result.meta;
              const quotes = result.indicators.quote[0];
              const timestamps = result.timestamp || [];

              const price = meta.regularMarketPrice;
              const prevClose = meta.previousClose || (quotes.close ? quotes.close[0] : price);
              const change = price - prevClose;
              const percentChange = (change / prevClose) * 100;
              const isUp = change >= 0;

              const formatter = new Intl.NumberFormat(symInfo.currency === 'INR' ? 'en-IN' : 'en-US', {
                style: 'currency',
                currency: symInfo.currency,
                maximumFractionDigits: 2
              });

              // Add to market data
              updated.push({
                name: symInfo.id,
                symbol: symInfo.yahoo,
                type: key.includes("/") ? (key.includes("BTC") ? "Crypto" : "Forex") : "Stock",
                price: formatter.format(price),
                change: `${isUp ? '+' : ''}${change.toFixed(2)}`,
                percentChange: `${isUp ? '+' : ''}${percentChange.toFixed(2)}%`,
                up: isUp,
                open: formatter.format(meta.regularMarketOpen || 0),
                high: formatter.format(meta.regularMarketDayHigh || 0),
                low: formatter.format(meta.regularMarketDayLow || 0),
                volume: (meta.regularMarketVolume || 0).toLocaleString(),
                prevClose: formatter.format(prevClose),
                marketCap: meta.marketCap ? meta.marketCap.toLocaleString() : 'N/A',
                currency: symInfo.currency
              });

              // Process sparkline data
              const sparklineData = timestamps.map((ts: number, i: number) => {
                const val = quotes.close?.[i] ?? quotes.open?.[i] ?? price;
                return { value: val };
              }).filter((v: any) => v.value !== null && v.value !== undefined);
              
              sparklines[symInfo.id] = sparklineData.length > 0 ? sparklineData : [{ value: price }, { value: price }];
            }
          }
          
          // Wait 600ms between each symbol to be very gentle with Yahoo
          await new Promise(res => setTimeout(res, 600));
        } catch (err) {
          console.error(`Error fetching ${key}:`, err);
        }
      }

      if (updated.length > 0) {
        setMarketData(updated);
        setMarketSparklines(sparklines);
        localStorage.setItem(cacheKey, JSON.stringify(updated));
        localStorage.setItem(`et_market_sparklines_${today}`, JSON.stringify(sparklines));
      }
    } catch (error) {
      console.error("Error fetching market data:", error);
    } finally {
      setIsMarketLoading(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    if ((currentSection === 'dashboard' || currentSection === 'markets') && userProfile) {
      fetchMarketGraph();
    }
  }, [currentSection, activeGraphSymbol, startDate, endDate, userProfile]);

  const fetchMarketGraph = async (symbolStr = activeGraphSymbol) => {
    const today = new Date().toDateString();
    const cacheKey = `et_market_graph_${symbolStr}_${activeGraphRange.range}_${today}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      setMarketGraphData(parsed.data);
      setPreviousClose(parsed.prev);
      setMarketRange(parsed.range);
      return;
    }

    if (checkLockout()) return;
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    try {
      const symInfo = SYMBOL_MAP[symbolStr] || SYMBOL_MAP["NIFTY 50"];
      const symbol = symInfo.yahoo;
      
      const url = `/api-yahoo/v8/finance/chart/${symbol}?range=${activeGraphRange.range}&interval=${activeGraphRange.interval}`;
      
      const response = await fetch(url);
      if (response.status === 429) {
        setLockout(10);
        isFetchingRef.current = false;
        return;
      }
      if (!response.ok) {
        isFetchingRef.current = false;
        return;
      }

      const data = await response.json();
      
      if (data.chart && data.chart.result && data.chart.result[0]) {
        const result = data.chart.result[0];
        const timestamps = result.timestamp;
        const quotes = result.indicators.quote[0];
        const meta = result.meta;
        const baselineVal = meta.previousClose || (quotes.close ? quotes.close[0] : 0);

        const graph = timestamps.map((ts: number, i: number) => {
          const close = quotes.close[i];
          if (close === null || close === undefined) return null;
          
          const date = new Date(ts * 1000);
          let name = date.toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
          if (activeGraphRange.range === '1d' || activeGraphRange.range === '5d' || activeGraphRange.range === '8d') {
             name = date.toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
          } else {
             name = date.toLocaleString('en-IN', { month: 'short', day: 'numeric' });
          }

          return {
            name,
            timestamp: ts,
            value: close,
            open: (quotes.open && quotes.open[i]) ?? close,
            high: (quotes.high && quotes.high[i]) ?? close,
            low: (quotes.low && quotes.low[i]) ?? close,
            gain: close - baselineVal,
            percentage: ((close - baselineVal) / baselineVal) * 100
          };
        }).filter(Boolean);

        setMarketGraphData(graph);
        setPreviousClose(baselineVal);
        
        const values = graph.map((v: any) => v.value);
        const range = {
          start: graph[0].value,
          end: graph[graph.length - 1].value,
          high: meta.regularMarketDayHigh || Math.max(...values),
          low: meta.regularMarketDayLow || Math.min(...values)
        };
        setMarketRange(range);
        
        localStorage.setItem(cacheKey, JSON.stringify({ data: graph, prev: baselineVal, range }));
        return;
      }
      
      setMarketGraphData([]);
      setPreviousClose(null);
    } catch (error) {
      console.error("Error fetching graph data:", error);
      setMarketGraphData([]);
      setPreviousClose(null);
    }
  };

  const fetchNews = async () => {
    // Check cache to avoid 429 - updated key to v3 to force refresh
    const today = new Date().toDateString();
    const cacheKey = `et_news_v3_${today}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      setNewsData(parsed.news || []);
      setWebNews(parsed.webNews || []);
      setRelevanceNotes(parsed.notes || {});
      setIsNewsLoading(false);
      return;
    }

    setIsNewsLoading(true);
    let articles: NewsItem[] = [];
    let webArticles: NewsItem[] = [];
    let aiNotes: Record<number, string> = {};

    if (apiKeys.marketaux) {
      try {
        const url = `https://api.marketaux.com/v1/news/all?symbols=TSLA,AMZN,MSFT&filter_entities=true&language=en&api_token=${apiKeys.marketaux}`;
        const r = await fetch(url);
        const data = await r.json();
        if (data.data && Array.isArray(data.data)) {
          webArticles = data.data.map((a: any) => ({
            title: a.title, 
            source: a.source || 'Marketaux', 
            time: new Date(a.published_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }), 
            url: a.url || '#'
          }));
        }
      } catch (error) { console.error("Error fetching Marketaux news:", error); }
    }
    
    // Fetch personalized news from thenewsapi as well for "Today's picks"
    if (apiKeys.news) {
      try {
        const sectors = userProfile?.sectors?.toLowerCase().replace(/ & /g, '+') || 'finance';
        const r = await fetch(`https://api.thenewsapi.com/v1/news/all?api_token=${apiKeys.news}&categories=business&search=india+${sectors}&language=en&limit=6`);
        const data = await r.json();
        if (data.data && data.data.length) {
          articles = data.data.map((a: any) => ({
            title: a.title, source: a.source || 'ET', time: new Date(a.published_at).toLocaleDateString(), url: a.url || '#'
          }));
        }
      } catch (error) { console.error("Error fetching personalized news:", error); }
    }

    setNewsData(articles);
    setWebNews(webArticles);
    setIsNewsLoading(false);

    if (apiKeys.gemini && userProfile && articles.length > 0) {
      try {
        const headlines = articles.map((a, i) => `${i+1}. ${a.title}`).join('\n');
        const prompt = `Given this user profile: ${JSON.stringify(userProfile)}\n\nFor each headline, write a short "Why this matters to you" note (under 15 words):\n${headlines}\n\nReturn ONLY a JSON array of strings, no markdown.`;
        const resp = await callGemini(prompt, 'Return ONLY a JSON array of strings. No markdown.');
        if (resp) {
          const clean = resp.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const parsed = JSON.parse(clean);
          if (Array.isArray(parsed)) {
            parsed.forEach((n, i) => aiNotes[i] = n);
            setRelevanceNotes(aiNotes);
          }
        }
      } catch (error) { console.error("Error getting AI relevance:", error); }
    }

    // Cache the full news data with notes
    localStorage.setItem(cacheKey, JSON.stringify({ news: articles, webNews: webArticles, notes: aiNotes }));
  };

  const navigateTo = (section: string) => {
    setCurrentSection(section);
    window.scrollTo(0, 0);
  };

  const showToast = (msg: string) => {
    setToasts(prev => [...prev, msg]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t !== msg));
    }, 3000);
  };

  const callGemini = async (prompt: string, systemPrompt?: string, history?: ChatMessage[]) => {
    const key = apiKeys.gemini.trim().replace(/^["']|["']$/g, '');
    if (!key) return null;

    const contents: any[] = [];
    if (history && history.length > 0) {
      let nextRole = 'user';
      history.forEach(m => {
        const role = m.role === 'assistant' ? 'model' : 'user';
        if (role === nextRole) {
          contents.push({ role, parts: [{ text: m.content || "..." }] });
          nextRole = role === 'user' ? 'model' : 'user';
        }
      });
    }

    const finalPrompt = systemPrompt ? `Instructions: ${systemPrompt}\n\nUser Question: ${prompt}` : prompt;
    if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
      contents[contents.length - 1].parts[0].text += "\n\n" + finalPrompt;
    } else {
      contents.push({ role: 'user', parts: [{ text: finalPrompt }] });
    }

    try {
      // Updated model list based on your console output for 2026/latest availability
      const preferredModels = [
        'gemini-2.0-flash', 
        'gemini-2.0-flash-lite', 
        'gemini-flash-latest', 
        'gemini-1.5-flash-latest',
        'gemini-1.5-flash'
      ];
      
      for (const modelId of preferredModels) {
        const fullModelName = modelId.startsWith('models/') ? modelId : `models/${modelId}`;
        const url = `https://generativelanguage.googleapis.com/v1beta/${fullModelName}:generateContent?key=${key}`;
        
        console.log(`Trying Gemini model: ${fullModelName}...`);
        const r = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents })
        });

        if (r.ok) {
          const data = await r.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            console.log(`Success with model: ${fullModelName}`);
            return text;
          }
        }
        
        const errData = await r.json().catch(() => ({}));
        console.warn(`Model ${fullModelName} failed:`, r.status, errData);
      }

      // If all preferred failed, fall back to dynamic discovery
      const listR = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
      if (listR.ok) {
        const listData = await listR.json();
        const availableModels = listData.models || [];
        console.log("Available models:", availableModels.map((m: any) => m.name));

        const fallbackModel = availableModels.find((m: any) => m.supportedGenerationMethods?.includes('generateContent'));
        if (fallbackModel) {
          const r2 = await fetch(`https://generativelanguage.googleapis.com/v1beta/${fallbackModel.name}:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents })
          });
          if (r2.ok) {
            const data2 = await r2.json();
            return data2.candidates?.[0]?.content?.parts?.[0]?.text || null;
          }
        }
      } else {
        console.error("Diagnostic failed. Please ensure 'Generative Language API' is enabled in Google Cloud Console.");
      }
      return null;
    } catch (err) {
      console.error("Gemini API Exception:", err);
      return null;
    }
  };

  const startOnboarding = () => {
    if (!user) { navigate('/auth'); return; }
    setOnboardStep(0);
    setOnboardAnswers({});
    setOnboardMessages([{ text: ONBOARD_QUESTIONS[0].q, type: 'bot' }]);
    setCurrentSection('onboarding');
  };

  const handleOnboardAnswer = async (answer: string) => {
    const newMessages: OnboardAnswer[] = [...onboardMessages, { text: answer, type: 'user' }];
    setOnboardMessages(newMessages);
    const step = onboardStep;
    const newAnswers = { ...onboardAnswers };
    if (step === 0) newAnswers.name = answer;
    else if (step === 1) newAnswers.type = answer;
    else if (step === 2) newAnswers.goals = answer;
    else if (step === 3) newAnswers.investments = answer;
    else if (step === 4) newAnswers.sectors = answer;
    else if (step === 5) newAnswers.risk = answer;
    else if (step === 6) newAnswers.concern = answer;
    setOnboardAnswers(newAnswers);
    const nextStep = step + 1;
    setOnboardStep(nextStep);
    if (nextStep < ONBOARD_QUESTIONS.length) {
      const q = ONBOARD_QUESTIONS[nextStep];
      const qText = q.q.replace('{name}', newAnswers.name || '');
      setTimeout(() => { setOnboardMessages(prev => [...prev, { text: qText, type: 'bot', options: q.options }]); }, 400);
    } else { finishOnboarding(newAnswers); }
  };

  const handleOnboardBack = () => {
    if (onboardStep === 0) return;
    const prevStep = onboardStep - 1;
    setOnboardStep(prevStep);
    const newMessages = [...onboardMessages];
    newMessages.pop(); // Remove bot response
    newMessages.pop(); // Remove user answer
    setOnboardMessages(newMessages);
  };

  const finishOnboarding = async (answers: Record<string, string>) => {
    setIsLoadingProfile(true);
    
    let profile: UserProfile = {
      name: answers.name || 'User',
      type: answers.type,
      goals: answers.goals,
      investments: answers.investments,
      sectors: answers.sectors,
      risk: answers.risk,
      concern: answers.concern || '',
      summary: `You're a ${answers.risk?.toLowerCase() || 'moderate'} ${answers.type?.toLowerCase() || 'investor'} focused on ${answers.goals?.toLowerCase() || 'wealth building'}.`,
      persona: answers.risk === 'Aggressive' ? 'Growth Investor' : 'Balanced Investor',
      recommendations: ['ET Prime for detailed analysis', 'ET Markets for live tracking']
    };

    if (apiKeys.gemini) {
      try {
        const prompt = `Based on these onboarding answers: ${JSON.stringify(answers)}, 
        generate a personalized financial profile in JSON format:
        {
          "summary": "A 2-sentence professional summary",
          "persona": "A 2-word creative persona label (e.g. Maverick Investor, Prudent Saver)",
          "recommendations": ["3 specific ET products or actions"]
        }
        Return ONLY the raw JSON.`;
        
        const resp = await callGemini(prompt, "You are an expert financial advisor. Return ONLY raw JSON.");
        if (resp) {
          const clean = resp.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const aiProfile = JSON.parse(clean);
          profile.summary = aiProfile.summary;
          profile.persona = aiProfile.persona;
          profile.recommendations = aiProfile.recommendations;
        }
      } catch (error) {
        console.error("AI Profile Gen failed, using local fallback:", error);
      }
    }

    setUserProfile(profile);
    localStorage.setItem('et_profile', JSON.stringify(profile));
    setTimeout(() => { setIsLoadingProfile(false); navigate('/dashboard'); }, 1000);
  };

  const sendAiMessage = async (text: string) => {
    if (!text.trim()) return;
    
    const userMsg: ChatMessage = { role: 'user', content: text };
    setChatHistory(prev => [...prev, userMsg]);
    setAiInput("");
    setIsAiTyping(true);

    const system = `You are ET Concierge, a helpful and professional financial assistant from The Economic Times. 
    Use the following user profile to personalize your advice: ${JSON.stringify(userProfile)}. 
    
    Structure your responses for high readability:
    - Use Markdown headers (e.g., ### Section) for clear organization.
    - Use bolding for emphasis on key terms.
    - Use bullet points or numbered lists for features or steps.
    - Keep a professional yet conversational tone.
    - Always end with a relevant follow-up question or call to action.`;

    try {
      const resp = await callGemini(text, system, chatHistory);
      setIsAiTyping(false);
      
      const answer = resp || "I'm temporarily having trouble connecting. Please ensure your API key is valid and the Generative Language API is enabled.";
      const assistantMsg: ChatMessage = { role: 'assistant', content: answer };
      
      setChatHistory(prev => {
        const updated = [...prev, assistantMsg];
        localStorage.setItem('et_chat', JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      console.error("Error in sendAiMessage:", error);
      setIsAiTyping(false);
      setChatHistory(prev => [...prev, { role: 'assistant', content: "Something went wrong. Please try again." }]);
    }
  };

  const clearChat = () => {
    setChatHistory([]);
    localStorage.removeItem('et_chat');
    showToast("Chat history cleared");
  };

  const clearProfile = () => {
    localStorage.removeItem('et_profile');
    localStorage.removeItem('et_chat');
    setUserProfile(null);
    setChatHistory([]);
    navigate('/');
  };

  const saveUsername = () => {
    if (!editNameValue.trim() || !userProfile) return;
    const newProfile = { ...userProfile, name: editNameValue.trim() };
    setUserProfile(newProfile);
    localStorage.setItem('et_profile', JSON.stringify(newProfile));
    setIsEditingName(false);
  };

  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [isServiceChatOpen, setIsServiceChatOpen] = useState(false);
  const [serviceChatHistory, setServiceChatHistory] = useState<ChatMessage[]>([]);
  const [isServiceAiTyping, setIsServiceAiTyping] = useState(false);

  const openServiceAdvisor = (service: ServiceItem) => {
    setSelectedService(service);
    setIsServiceChatOpen(true);
    setServiceChatHistory([{ 
      role: 'assistant', 
      content: `Hello! I'm your expert advisor for **${service.title}**. Based on your profile as a ${userProfile?.persona}, I can help you understand how this service fits your goals. What would you like to know?` 
    }]);
  };

  const sendServiceAiMessage = async (text: string) => {
    if (!text.trim() || !selectedService) return;
    const userMsg: ChatMessage = { role: 'user', content: text };
    setServiceChatHistory(prev => [...prev, userMsg]);
    setIsServiceAiTyping(true);

    const system = `You are an expert financial advisor specializing in ${selectedService.title}. 
    User Profile: ${JSON.stringify(userProfile)}. 
    Be professional, data-driven, and focus on how this specific service benefits the user's unique situation.`;

    const resp = await callGemini(text, system, serviceChatHistory);
    setIsServiceAiTyping(false);
    setServiceChatHistory(prev => [...prev, { role: 'assistant', content: resp || "I'm having trouble connecting. Please try again." }]);
  };

  return (
    <div className={`concierge-body dark`}>
      {/* Service AI Advisor Modal */}
      <div className={`modal-overlay ${isServiceChatOpen ? 'open' : ''}`}>
        <div className="modal modal-wrapper" style={{ maxWidth: '600px', height: '80vh', display: 'flex', flexDirection: 'column', padding: 0 }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--et-border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>{selectedService?.title} Advisor</h3>
            <button className="modal-close" onClick={() => setIsServiceChatOpen(false)} style={{ position: 'static' }}>✕</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column' }}>
            {serviceChatHistory.map((m, i) => (
              <div 
                key={i} 
                className={`chat-msg ${m.role === 'user' ? 'user' : 'bot'}`} 
                style={{
                  padding: '10px 14px', 
                  borderRadius: '12px', 
                  marginBottom: '8px', 
                  maxWidth: '85%', 
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', 
                  background: m.role === 'user' ? 'var(--et-accent)' : '#233554', 
                  color: m.role === 'user' ? 'white' : '#CCD6F6'
                }}
              >
                {m.role === 'assistant' ? parseMarkdown(m.content) : m.content}
              </div>
            ))}
            {isServiceAiTyping && <p style={{ fontSize: '12px', color: 'var(--et-text-secondary)' }}>Advisor is thinking...</p>}
          </div>
          <div style={{ padding: '20px', borderTop: '1px solid var(--et-border-color)', display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              placeholder="Ask the advisor..." 
              style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--et-border-color)', borderRadius: '8px', padding: '10px 16px', color: 'white' }}
              onKeyDown={e => { if(e.key === 'Enter') { sendServiceAiMessage((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ''; } }}
            />
            <button 
              onClick={(e) => { const input = e.currentTarget.previousElementSibling as HTMLInputElement; sendServiceAiMessage(input.value); input.value = ''; }}
              style={{ background: 'var(--et-accent)', color: 'white', border: 'none', borderRadius: '8px', padding: '0 20px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <div className={`modal-overlay ${isSettingsOpen ? 'open' : ''}`}>
        <div className="modal modal-wrapper">
          <button className="modal-close" onClick={() => setIsSettingsOpen(false)}>✕</button>
          <h2>Settings</h2>
          <div className="settings-field">
            <label>Username</label>
            {isEditingName ? (
              <div className="edit-name-input-wrapper">
                <input type="text" value={editNameValue} onChange={e => setEditNameValue(e.target.value)} autoFocus />
                <button onClick={saveUsername}><Check size={18} /></button>
                <button onClick={() => setIsEditingName(false)}><X size={18} /></button>
              </div>
            ) : (
              <div className="display-name-wrapper">
                <span className="display-name">{userProfile?.name}</span>
                <button onClick={() => setIsEditingName(true)}><Pencil size={16} /></button>
              </div>
            )}
          </div>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={clearProfile}>Clear Profile</button>
            <button className="btn-secondary" onClick={async () => {
              await signOut();
              setIsSettingsOpen(false);
              navigate('/');
            }}>Logout</button>
          </div>
        </div>
      </div>

      {/* Toast Container */}
      <div className="toast-container">
        {toasts.map((t, i) => <div key={i} className="toast">{t}</div>)}
      </div>

      {isLoadingProfile && (
        <div className="profile-loading">
          <div className="spinner"></div>
          <p>Building your profile...</p>
        </div>
      )}

      {/* ═══ SECTION: ONBOARDING ═══ */}
      {currentSection === 'onboarding' && (
        <div className="section active" id="onboarding">
          <div className="container" style={{paddingTop: '60px'}}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: '32px'}}>
              {onboardStep > 0 && (
                <button 
                  onClick={handleOnboardBack}
                  style={{position: 'absolute', left: '0', background: 'none', color: 'var(--et-text-secondary)', cursor: 'pointer', fontSize: '14px', fontWeight: '600', border: 'none'}}
                >
                  ← Back
                </button>
              )}
              <h2 className="onboard-header" style={{margin: '0', textAlign: 'center'}}>Personalize your <span style={{color: 'var(--et-accent)'}}>ET</span> Experience</h2>
            </div>
            <div className="chat-container">
              <div className="chat-messages">
                {onboardMessages.map((m, i) => (
                  <div key={i} style={{display: 'flex', flexDirection: 'column'}}>
                    <div className={`chat-msg ${m.type}`}>
                      {m.type === 'bot' ? parseMarkdown(m.text) : m.text}
                    </div>
                    {m.options && (
                      <div className="quick-replies">
                        {m.options.map((opt: string) => (
                          <button key={opt} className="quick-reply" onClick={() => handleOnboardAnswer(opt)}>{opt}</button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={onboardMessagesEndRef} />
              </div>
              
              {!onboardMessages[onboardMessages.length - 1]?.options && (
                <div style={{padding: '16px', borderTop: '1px solid var(--et-border-color)', display: 'flex', gap: '8px'}}>
                  <input 
                    type="text" 
                    placeholder="Type your answer..." 
                    style={{flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--et-border-color)', borderRadius: '8px', padding: '10px 16px', color: 'white'}}
                    onKeyDown={e => { if(e.key === 'Enter') { handleOnboardAnswer((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ''; } }} 
                  />
                  <button 
                    onClick={(e) => { 
                      const input = (e.currentTarget.previousElementSibling as HTMLInputElement); 
                      handleOnboardAnswer(input.value); 
                      input.value = ''; 
                    }}
                    style={{background: 'var(--et-accent)', color: 'white', border: 'none', borderRadius: '8px', padding: '0 20px', cursor: 'pointer', fontWeight: 'bold'}}
                  >
                    Send
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ SECTION: DASHBOARD ═══ */}
      {currentSection === 'dashboard' && (
        <div className="section active" id="dashboard">
          <Navbar />

          <div className="container mx-auto px-4 py-6 md:py-8 lg:px-8">
            {/* Daily Action Nudge */}
            <div className="mb-6 flex flex-col items-center justify-between gap-4 rounded-xl border border-orange-500/30 bg-gradient-to-br from-[#112240] to-[#1a365d] p-5 shadow-2xl md:flex-row lg:mb-8">
              <div className="w-full flex-1 text-center md:text-left">
                <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-orange-500">
                  What should I do today?
                </div>
                <h2 className="text-lg font-bold text-white md:text-xl lg:text-2xl">
                  {dailyAction || "Analyzing the markets for your personal nudge..."}
                </h2>
              </div>
              <button 
                onClick={toggleBriefing}
                disabled={isBriefingLoading}
                className={`flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-full px-6 py-3 text-sm font-bold text-white transition-all md:w-auto ${
                  isSpeaking ? 'bg-red-500' : 'bg-orange-500 hover:scale-105'
                } ${isBriefingLoading ? 'cursor-not-allowed opacity-70' : ''}`}
              >
                {isBriefingLoading ? '⌛ Preparing...' : (isSpeaking ? '⏹ Stop' : '🔊 Daily Brief')}
              </button>
            </div>

            {/* Financial Health Score Section */}
            <div className="mb-6 rounded-xl border border-white/5 bg-[#112240] p-6 text-center lg:mb-8">
              <h3 className="mb-2 text-lg font-bold">Your Financial Health Score</h3>
              <p className="mb-6 text-sm text-slate-400">Based on your personal profile and goals</p>
              <FinancialHealthRings scores={healthScores} />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
              {/* Profile Card */}
              <div className="h-fit rounded-xl border border-white/5 bg-[#112240] p-6 lg:col-span-4">
                <h3 className="mb-3 text-xl font-bold">{userProfile?.name}</h3>
                <div className="mb-4 inline-block rounded-full bg-orange-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  {userProfile?.persona}
                </div>
                <div className="mb-4 flex items-center gap-2 text-sm text-slate-300">
                  <span className={`h-2 w-2 rounded-full ${
                    userProfile?.risk === 'Aggressive' ? 'bg-red-500' : 
                    userProfile?.risk === 'Conservative' ? 'bg-emerald-500' : 'bg-blue-500'
                  }`}></span>
                  Risk: {userProfile?.risk}
                </div>
                <div className="mb-4 flex flex-wrap gap-2">
                  {(userProfile?.goals || '').split(',').map(g => g.trim()).filter(Boolean).map(g => (
                    <span key={g} className="rounded-lg bg-orange-500/10 px-3 py-1 text-[11px] font-medium text-orange-500">
                      {g}
                    </span>
                  ))}
                </div>
                <p className="mb-6 text-sm leading-relaxed text-slate-400">{userProfile?.summary}</p>
                
                {userProfile?.recommendations && userProfile.recommendations.length > 0 && (
                  <div className="mt-6 border-t border-white/5 pt-6">
                    <div className="mb-3 text-[10px] font-bold uppercase tracking-wider text-orange-500">Top Recommendations</div>
                    <ul className="space-y-3">
                      {userProfile.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-3 text-[13px] text-white">
                          <span className="text-emerald-500 mt-1">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button onClick={clearProfile} className="mt-6 text-sm font-medium text-blue-400 transition-colors hover:text-blue-300">↻ Reset Profile</button>
              </div>

              {/* Analysis Graph */}
              <div className="flex h-fit flex-col rounded-xl border border-white/5 bg-[#112240] p-4 md:p-6 lg:col-span-8">
                <div className="mb-6 flex flex-col gap-4">
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                    <div>
                      <h3 className="text-lg font-bold">Market Performance</h3>
                      <div className="mt-1 text-xs text-slate-400">
                        {SYMBOL_MAP[activeGraphSymbol]?.name} · {activeGraphRange.label} View
                      </div>
                    </div>
                  </div>

                  <div className="no-scrollbar flex gap-2 overflow-x-auto pb-2">
                    {Object.keys(SYMBOL_MAP).map(sym => (
                      <button 
                        key={sym}
                        onClick={() => setActiveGraphSymbol(sym)}
                        className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-xs font-bold transition-all ${
                          activeGraphSymbol === sym 
                            ? 'border-orange-500 bg-orange-500/10 text-orange-500' 
                            : 'border-white/5 bg-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        {sym}
                      </button>
                    ))}
                  </div>
                </div>

                {marketRange && (
                  <div className="mb-6 grid grid-cols-2 gap-3 rounded-xl border border-white/5 bg-white/5 p-4 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
                    <div className="flex flex-col">
                      <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Baseline</div>
                      <div className="text-sm font-bold text-slate-400">
                        {SYMBOL_MAP[activeGraphSymbol]?.currency === 'INR' ? '₹' : '$'}{previousClose?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Current</div>
                      <div className="text-sm font-bold text-white">
                        {SYMBOL_MAP[activeGraphSymbol]?.currency === 'INR' ? '₹' : '$'}{marketRange.end.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Change</div>
                      <div className={`text-sm font-bold ${
                        (marketRange.end >= (previousClose || 0)) ? 'text-emerald-500' : 'text-red-500'
                      }`}>
                        {((marketRange.end - (previousClose || 0)) >= 0 ? '+' : '')}
                        {((marketRange.end - (previousClose || 0)) / (previousClose || 1) * 100).toFixed(2)}%
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">High</div>
                      <div className="text-sm font-bold text-emerald-500">
                        {SYMBOL_MAP[activeGraphSymbol]?.currency === 'INR' ? '₹' : '$'}{marketRange.high.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Low</div>
                      <div className="text-sm font-bold text-red-500">
                        {SYMBOL_MAP[activeGraphSymbol]?.currency === 'INR' ? '₹' : '$'}{marketRange.low.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                )}

                <div className="h-[250px] w-full md:h-[300px] lg:h-[350px]">
                  <ChartContainer
                    config={{
                      value: {
                        label: "Price",
                        color: marketRange && marketRange.end >= (previousClose || 0) ? "var(--et-success)" : "var(--et-danger)",
                      },
                    }}
                    className="h-full w-full"
                  >
                    <AreaChart
                      data={marketGraphData}
                      margin={{ left: 0, right: 0, top: 10, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="fillPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={12}
                        minTickGap={60}
                        tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                      />
                      <YAxis hide domain={['auto', 'auto']} />
                      <ChartTooltip
                        cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1 }}
                        content={
                          <ChartTooltipContent
                            indicator="line"
                            labelFormatter={(value) => <span className="font-bold">{value}</span>}
                            formatter={(value, name, item) => {
                              const p = item?.payload;
                              if (!p) return null;
                              const symbol = SYMBOL_MAP[activeGraphSymbol] || { currency: 'INR' };
                              const curr = symbol.currency === 'INR' ? '₹' : '$';
                              const isPositive = (p.gain || 0) >= 0;
                              
                              return (
                                <div className="flex min-w-[150px] flex-col gap-2 p-1 text-white">
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="text-[10px] font-bold uppercase text-gray-400">Live Price</span>
                                    <span className="font-mono text-sm font-bold">
                                      {curr}{Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-1 gap-y-1.5 border-t border-white/10 pt-2.5 text-[11px]">
                                    <div className="flex justify-between gap-3 font-mono">
                                      <span className="text-gray-400 uppercase">Change</span>
                                      <span style={{ color: isPositive ? '#10B981' : '#EF4444' }} className="font-bold">
                                        {isPositive ? '+' : ''}{(p.percentage || 0).toFixed(2)}%
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            }}
                          />
                        }
                      />
                      <Area
                        dataKey="value"
                        name="value"
                        type="linear"
                        fill="url(#fillPrice)"
                        fillOpacity={0.4}
                        stroke="var(--color-value)"
                        strokeWidth={2}
                        animationDuration={1000}
                      />
                    </AreaChart>
                  </ChartContainer>
                </div>
              </div>

              {/* Markets Snapshot */}
              <div className="lg:col-span-12">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-lg font-bold">Live Market Snapshot</h3>
                  <button 
                    onClick={() => { fetchMarketData(); fetchMarketGraph(); showToast("Market data updated"); }}
                    className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-xs font-bold text-orange-500 transition-colors hover:bg-orange-500/20"
                  >
                    Refresh
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                  {isMarketLoading 
                    ? Array(6).fill(0).map((_, i) => (
                        <div key={i} className="flex flex-col items-center gap-3 rounded-xl border border-white/5 bg-[#112240] p-4">
                          <Skeleton width="60px" height="14px" />
                          <Skeleton width="80px" height="24px" />
                          <Skeleton width="100%" height="30px" />
                        </div>
                      ))
                    : marketData.map((d, i) => (
                        <div 
                          key={i} 
                          onClick={() => {
                            const found = Object.keys(SYMBOL_MAP).find(k => SYMBOL_MAP[k].yahoo === d.symbol || k === d.name);
                            if (found) setActiveGraphSymbol(found);
                          }}
                          className="group relative flex cursor-pointer flex-col gap-2 rounded-xl border border-white/5 bg-[#112240] p-4 transition-all hover:border-orange-500/50"
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-bold text-slate-300 group-hover:text-white">{d.name}</div>
                            <div className={`text-[10px] font-bold ${d.up ? 'text-emerald-500' : 'text-red-500'}`}>{d.percentChange}</div>
                          </div>
                          <div className="text-lg font-bold text-white">{d.price}</div>
                          <div className="mt-auto h-[35px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={marketSparklines[d.name] || []}>
                                <defs>
                                  <linearGradient id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={d.up ? '#10B981' : '#EF4444'} stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor={d.up ? '#10B981' : '#EF4444'} stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <Area 
                                  type="monotone" 
                                  dataKey="value" 
                                  stroke={d.up ? '#10B981' : '#EF4444'} 
                                  fill={`url(#grad-${i})`} 
                                  strokeWidth={1.5} 
                                  isAnimationActive={false}
                                  dot={false}
                                />
                                <YAxis hide domain={['auto', 'auto']} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      ))
                  }
                </div>
              </div>

              {/* News */}
              <div className="lg:col-span-12">
                <h3 className="mb-6 text-lg font-bold">Today's picks for you</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {isNewsLoading
                    ? Array(6).fill(0).map((_, i) => (
                        <div key={i} className="rounded-xl border border-white/5 bg-[#112240] p-5">
                          <Skeleton width="100%" height="20px" className="mb-3" />
                          <Skeleton width="60%" height="14px" className="mb-4" />
                          <Skeleton width="100%" height="40px" />
                        </div>
                      ))
                    : newsData.map((a, i) => (
                        <div key={i} className="flex flex-col rounded-xl border border-white/5 bg-[#112240] p-5 transition-all hover:border-orange-500/30">
                          <h4 className="mb-2 text-sm font-bold leading-snug text-white md:text-base">{a.title}</h4>
                          <div className="mb-4 text-[10px] font-medium text-slate-500">{a.source} · {a.time}</div>
                          
                          {relevanceNotes[i] && (
                            <div className="mb-4 rounded-lg bg-orange-500/10 p-3 text-xs leading-relaxed text-slate-300">
                              <strong className="text-orange-500">Why this matters:</strong> {relevanceNotes[i]}
                            </div>
                          )}

                          <a href={a.url} target="_blank" className="mt-auto text-xs font-bold text-orange-500 transition-colors hover:text-orange-400">Read More →</a>
                        </div>
                      ))
                  }
                </div>
              </div>

              {/* Web Scraped News */}
              <div className="lg:col-span-12">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">Latest Market Pulse</h3>
                  <div className="rounded-full bg-orange-500/10 px-3 py-1 text-[10px] font-bold text-orange-500">Live</div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {webNews.map((a, i) => (
                    <div key={i} className="flex flex-col border-l-2 border-orange-500 bg-[#112240]/50 p-4 transition-all hover:bg-[#112240]">
                      <h4 className="mb-3 text-xs font-bold leading-normal text-white">{a.title}</h4>
                      <div className="mt-auto flex items-center justify-between gap-2">
                        <div className="text-[10px] text-slate-500">{a.source} · {a.time}</div>
                        <a href={a.url} target="_blank" className="text-[10px] font-bold text-orange-500">Source ↗</a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Chat Section */}
              <div className="lg:col-span-12">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">🤖 Your AI Financial Guide</h3>
                  <button 
                    onClick={clearChat} 
                    className="text-xs font-medium text-slate-500 hover:text-white"
                  >
                    Clear History
                  </button>
                </div>
                <div className="flex h-[500px] flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#112240]">
                  <div className="no-scrollbar flex-1 overflow-y-auto p-4 md:p-6">
                    {chatHistory.length === 0 && (
                      <div className="flex h-full flex-col items-center justify-center text-center">
                        <div className="mb-4 text-slate-400">How can I help you today, {userProfile?.name}?</div>
                        <div className="flex flex-wrap justify-center gap-2">
                          {["What ET products suit me?", "Review my strategy", "Tax planning tips"].map(chip => (
                            <button 
                              key={chip} 
                              onClick={() => sendAiMessage(chip)}
                              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300 transition-all hover:border-orange-500 hover:text-white"
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex flex-col gap-4">
                      {chatHistory.map((m, i) => (
                        <div 
                          key={i} 
                          className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                            m.role === 'user' 
                              ? 'self-end bg-orange-500 text-white font-bold' 
                              : 'self-start bg-[#233554] text-slate-200 border border-white/5'
                          }`}
                        >
                          {m.role === 'assistant' ? parseMarkdown(m.content) : m.content}
                        </div>
                      ))}
                      {isAiTyping && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="flex h-2 w-2 animate-bounce rounded-full bg-slate-500"></span>
                          AI is thinking...
                        </div>
                      )}
                      <div ref={aiMessagesEndRef} />
                    </div>
                  </div>
                  <div className="border-t border-white/5 bg-black/20 p-4">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={aiInput} 
                        onChange={e => setAiInput(e.target.value)} 
                        placeholder="Ask anything about markets or your goals..." 
                        className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-orange-500 focus:outline-none"
                        onKeyDown={e => e.key === 'Enter' && sendAiMessage(aiInput)} 
                      />
                      <button 
                        onClick={() => sendAiMessage(aiInput)} 
                        className="rounded-xl bg-orange-500 px-6 font-bold text-white transition-all hover:bg-orange-600 active:scale-95"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ═══ SECTION: MARKETS ═══ */}
      {currentSection === 'markets' && (
        <div className="section active">
          <Navbar />
          <div className="container mx-auto px-4 py-6 md:py-8 lg:px-8">
             <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white md:text-3xl">Market Intelligence</h2>
                  <p className="mt-1 text-sm text-slate-400">Real-time analysis across Stocks, Forex and Crypto</p>
                </div>
                <button 
                  onClick={() => { fetchMarketData(); fetchMarketGraph(); showToast("Market data refreshed"); }}
                  className="rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-orange-600 active:scale-95 sm:w-auto"
                >
                  Refresh All
                </button>
             </div>

             {/* Graph Section in Markets */}
             <div className="mb-8 grid grid-cols-1 gap-6">
                <div className="rounded-2xl border border-white/5 bg-[#112240] p-4 md:p-6">
                   <div className="mb-6 flex flex-col gap-4">
                      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                        <div>
                          <h3 className="text-lg font-bold">Technical Analysis</h3>
                          <div className="mt-1 text-xs text-slate-400">
                            {SYMBOL_MAP[activeGraphSymbol]?.name} · {activeGraphRange.label} View
                          </div>
                        </div>
                      </div>
                      
                      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-2">
                        {Object.keys(SYMBOL_MAP).map(sym => (
                          <button 
                            key={sym}
                            onClick={() => setActiveGraphSymbol(sym)}
                            className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-xs font-bold transition-all ${
                              activeGraphSymbol === sym 
                                ? 'border-orange-500 bg-orange-500/10 text-orange-500' 
                                : 'border-white/5 bg-white/5 text-slate-400 hover:text-white'
                            }`}
                          >
                            {sym}
                          </button>
                        ))}
                      </div>
                   </div>

                   {marketRange && (
                     <div className="mb-8 grid grid-cols-2 gap-4 rounded-xl bg-white/5 p-4 sm:grid-cols-4 md:p-6">
                       <div>
                         <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Current</div>
                         <div className="text-xl font-bold text-white">
                           {SYMBOL_MAP[activeGraphSymbol]?.currency === 'INR' ? '₹' : '$'}{marketRange.end.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                         </div>
                       </div>
                       <div>
                         <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Change</div>
                         <div className={`text-xl font-bold ${
                           (marketRange.end >= (previousClose || 0)) ? 'text-emerald-500' : 'text-red-500'
                         }`}>
                           {((marketRange.end - (previousClose || 0)) >= 0 ? '+' : '')}
                           {((marketRange.end - (previousClose || 0)) / (previousClose || 1) * 100).toFixed(2)}%
                         </div>
                       </div>
                       <div className="hidden sm:block">
                         <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">24h High</div>
                         <div className="text-xl font-bold text-emerald-500">
                           {SYMBOL_MAP[activeGraphSymbol]?.currency === 'INR' ? '₹' : '$'}{marketRange.high.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                         </div>
                       </div>
                       <div className="hidden sm:block">
                         <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">24h Low</div>
                         <div className="text-xl font-bold text-red-500">
                           {SYMBOL_MAP[activeGraphSymbol]?.currency === 'INR' ? '₹' : '$'}{marketRange.low.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                         </div>
                       </div>
                     </div>
                   )}

                   <div className="h-[300px] w-full md:h-[400px]">
                     <ChartContainer
                       config={{ value: { label: "Price", color: marketRange && marketRange.end >= (previousClose || 0) ? "var(--et-success)" : "var(--et-danger)" } }}
                       className="h-full w-full"
                     >
                       <AreaChart data={marketGraphData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                         <defs>
                           <linearGradient id="fillPriceMarkets" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.3} />
                             <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0} />
                           </linearGradient>
                         </defs>
                         <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                         <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={12} minTickGap={60} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
                         <YAxis hide domain={['auto', 'auto']} />
                         <ChartTooltip content={<ChartTooltipContent />} />
                         <Area dataKey="value" name="value" type="linear" fill="url(#fillPriceMarkets)" stroke="var(--color-value)" strokeWidth={2} />
                       </AreaChart>
                     </ChartContainer>
                   </div>
                </div>
             </div>

             {/* Detailed Market Table */}
             <div className="mb-12 overflow-hidden rounded-2xl border border-white/5 bg-[#112240]">
                <div className="border-b border-white/5 p-6">
                  <h3 className="text-lg font-bold text-white">Market Overview</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        <th className="px-6 py-4">Asset</th>
                        <th className="px-6 py-4">Price</th>
                        <th className="px-6 py-4">Change</th>
                        <th className="px-6 py-4 hidden md:table-cell">Volume</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {marketData.map((d, i) => (
                        <tr 
                          key={i} 
                          onClick={() => {
                            const found = Object.keys(SYMBOL_MAP).find(k => SYMBOL_MAP[k].yahoo === d.symbol || SYMBOL_MAP[k].name === d.name);
                            if (found) setActiveGraphSymbol(found);
                            showToast(`Loading chart for ${d.name}`);
                          }}
                          className="group cursor-pointer transition-colors hover:bg-white/5"
                        >
                          <td className="px-6 py-4">
                            <div className="font-bold text-white group-hover:text-orange-500">{d.name}</div>
                            <div className="text-[10px] text-slate-500">{d.type}</div>
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-white">{d.price}</td>
                          <td className="px-6 py-4">
                            <div className={`font-bold ${d.up ? 'text-emerald-500' : 'text-red-500'}`}>
                              {d.percentChange}
                            </div>
                            <div className="text-[10px] text-slate-500">{d.change}</div>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-400 hidden md:table-cell">{d.volume}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>

             <div>
                <h3 className="mb-6 text-xl font-bold text-white">Latest Market Pulse</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {webNews.map((a, i) => (
                    <div key={i} className="flex flex-col rounded-xl border-l-4 border-orange-500 bg-[#112240] p-5 transition-all hover:bg-[#1a365d]">
                      <h4 className="mb-4 text-sm font-bold leading-relaxed text-white">{a.title}</h4>
                      <div className="mt-auto flex items-center justify-between">
                        <div className="text-[10px] text-slate-500">{a.source} · {a.time}</div>
                        <a href={a.url} target="_blank" className="text-[10px] font-bold text-orange-500">Source ↗</a>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        </div>
      )}

      {/* ═══ SECTION: SERVICES ═══ */}
      {currentSection === 'services' && (
        <div className="section active">
          <Navbar />
          <div className="container mx-auto px-4 py-6 md:py-8 lg:px-8">
             <div className="mb-8">
               <h2 className="text-2xl font-bold text-white md:text-3xl">Professional Services</h2>
               <p className="mt-1 text-sm text-slate-400">Expert guidance tailored to your {userProfile?.persona} profile</p>
             </div>
             
             <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
               {SERVICES.length === 0 ? (
                 <div className="col-span-full rounded-2xl border border-dashed border-white/10 p-12 text-center">
                   <div className="mb-4 text-4xl">🛠️</div>
                   <h3 className="text-lg font-bold text-white">Services are being personalized</h3>
                   <p className="mx-auto mt-2 max-w-xs text-sm text-slate-500">Our team is hand-picking the best ET products for your goals.</p>
                 </div>
               ) : (
                 SERVICES.map(s => {
                   const isRecommended = s.matchGoals.some(g => userProfile?.goals?.includes(g));
                   return (
                     <div key={s.id} className={`flex flex-col rounded-2xl border p-6 transition-all hover:scale-[1.02] ${
                       isRecommended ? 'border-orange-500/50 bg-orange-500/5' : 'border-white/5 bg-[#112240]'
                     }`}>
                       <div className="mb-4 flex items-start justify-between">
                         <h4 className="text-lg font-bold text-white">{s.title}</h4>
                         {isRecommended && (
                           <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">RECO</span>
                         )}
                       </div>
                       <p className="mb-8 text-sm leading-relaxed text-slate-400">{s.best}</p>
                       <button 
                          onClick={() => openServiceAdvisor(s)}
                          className="mt-auto w-full rounded-xl bg-white/5 py-3 text-sm font-bold text-white transition-all hover:bg-orange-500"
                       >
                         Chat with Expert Advisor
                       </button>
                     </div>
                   );
                 })
               )}
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardIndex;
