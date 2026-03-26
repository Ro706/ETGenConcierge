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
  ReferenceLine
} from 'recharts';
import "./Concierge.css";
import { useAuth } from "@/contexts/AuthContext";
import { Pencil, Check, X } from "lucide-react";

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
  price: string;
  change: string;
  up: boolean;
  type?: string;
  mock?: boolean;
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
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center', margin: '20px 0' }}>
      {categories.map((cat, i) => {
        const radius = 35;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (scores[cat.key] / 100) * circumference;
        
        return (
          <div key={cat.key} style={{ textAlign: 'center' }}>
            <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto' }}>
              <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
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
                fontSize: '14px', fontWeight: 'bold'
              }}>
                {Math.round(scores[cat.key])}%
              </div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--et-text-secondary)', marginTop: '4px' }}>{cat.label}</div>
          </div>
        );
      })}
    </div>
  );
};

// --- Mocks ---
const MOCK_GRAPH_DATA = [
  { name: 'Mar 15', value: 21800, gain: 0, percentage: 0 },
  { name: 'Mar 16', value: 22100, gain: 300, percentage: 1.38 },
  { name: 'Mar 17', value: 21950, gain: 150, percentage: 0.69 },
  { name: 'Mar 18', value: 22300, gain: 500, percentage: 2.29 },
  { name: 'Mar 19', value: 22500, gain: 700, percentage: 3.21 },
  { name: 'Mar 20', value: 22400, gain: 600, percentage: 2.75 },
  { name: 'Mar 21', value: 22800, gain: 1000, percentage: 4.59 },
  { name: 'Mar 22', value: 22912.4, gain: 1112.4, percentage: 5.10 },
  { name: 'Mar 23', value: 22950, gain: 1150, percentage: 5.28 },
  { name: 'Mar 24', value: 23400, gain: 1600, percentage: 7.34 },
  { name: 'Mar 25', value: 23306.45, gain: 1506.45, percentage: 6.91 },
];

const MOCK_NEWS: NewsItem[] = [
  { title: "RBI holds repo rate steady at 6.5% amid global uncertainty", source: "ET Markets", time: "2h ago", url: "#" },
  { title: "Nifty 50 crosses 23,000 mark as IT stocks rally", source: "ET Markets", time: "3h ago", url: "#" },
  { title: "HDFC Bank Q4 results: Net profit up 18% year-on-year", source: "ET Finance", time: "4h ago", url: "#" },
  { title: "Sebi tightens F&O regulations for retail investors", source: "ET Markets", time: "5h ago", url: "#" },
  { title: "SIP inflows hit record ₹25,000 crore in March 2026", source: "ET Wealth", time: "6h ago", url: "#" },
  { title: "Budget 2026: Key changes to new tax regime explained", source: "ET Money", time: "7h ago", url: "#" }
];

const MOCK_MARKET: MarketItem[] = [
  { name: "RELIANCE", type: "Stock", price: "₹2,847", change: "+1.2%", up: true, mock: true },
  { name: "TCS", type: "Stock", price: "₹3,912", change: "+0.8%", up: true, mock: true },
  { name: "INFY", type: "Stock", price: "₹1,623", change: "+0.5%", up: true, mock: true },
  { name: "HDFCBANK", type: "Stock", price: "₹1,745", change: "+1.1%", up: true, mock: true },
  { name: "USD/INR", type: "Forex", price: "₹83.52", change: "-0.1%", up: false, mock: true },
  { name: "BTC/USD", type: "Crypto", price: "$64,250", change: "+2.4%", up: true, mock: true }
];

const MOCK_WEB_NEWS: NewsItem[] = [
  { title: "Nifty 50 closes at 23,306, up 1.72%; Shriram Finance & Trent lead gainers", source: "Business Standard", time: "Live", url: "https://www.business-standard.com" },
  { title: "Geopolitical de-escalation: US-Iran ceasefire hopes boost global markets", source: "Financial Express", time: "1h ago", url: "https://www.financialexpress.com" },
  { title: "Crude oil slump: Brent falls below $98, easing India's inflation concerns", source: "Economic Times", time: "2h ago", url: "https://economictimes.indiatimes.com" },
  { title: "Sectoral Watch: Consumer Durables and Realty indices rally over 3%", source: "Upstox", time: "3h ago", url: "https://upstox.com" },
  { title: "Market Holiday: NSE/BSE to remain closed on March 26 for Ram Navami", source: "EquityMaster", time: "4h ago", url: "https://www.equitymaster.com" },
  { title: "IT Stocks lag behind: Demand concerns weigh on TCS and Tech Mahindra", source: "Angel One", time: "5h ago", url: "https://www.angelone.in" }
];

const SERVICES: ServiceItem[] = [
  { id: "home-loan", title: "🏠 Home Loan", best: "Best for: Home buyers & upgraders", matchGoals: ["Buy a Home"] },
  { id: "personal-loan", title: "💳 Personal Loan", best: "Best for: Emergency funds", matchGoals: ["Build Emergency Fund"] },
  { id: "term-insurance", title: "🛡️ Term Insurance", best: "Best for: Family protection", matchGoals: ["Plan Retirement"] },
  { id: "health-insurance", title: "🏥 Health Insurance", best: "Best for: Medical coverage", matchGoals: [] },
  { id: "credit-card", title: "💎 Credit Card", best: "Best for: Rewards & cashback", matchGoals: [] },
  { id: "mutual-fund-sip", title: "📈 Mutual Fund SIP", best: "Best for: Wealth builders", matchGoals: ["Grow Wealth", "Save Taxes"] }
];

const EVENTS: EventItem[] = [
  { title: "ET Markets Masterclass", desc: "Learn equity investing from experts", date: "April 2026", matchSectors: ["Markets & Trading", "Banking & Finance"] },
  { title: "ET Wealth Summit", desc: "India's biggest personal finance event", date: "May 2026", matchSectors: ["Economy & Policy", "Banking & Finance"] },
  { title: "ET Startup Awards", desc: "Celebrating India's best startups", date: "June 2026", matchSectors: ["Tech & Startups"] },
  { title: "ET CFO Conclave", desc: "Leadership in financial strategy", date: "July 2026", matchSectors: ["Economy & Policy", "Banking & Finance"] }
];

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

const Index = ({ defaultSection }: IndexProps) => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] = useState(defaultSection || 'landing');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [apiKeys, setApiKeys] = useState({
    gemini: import.meta.env.VITE_GEMINI_KEY || '',
    news: import.meta.env.VITE_NEWS_KEY || '',
    twelveData: import.meta.env.VITE_TWELVE_DATA_KEY || ''
  });
  const [marketData, setMarketData] = useState<MarketItem[]>(MOCK_MARKET);
  const [marketGraphData, setMarketGraphData] = useState<any[]>(MOCK_GRAPH_DATA);
  const [marketRange, setMarketRange] = useState<{start: number, end: number, high: number, low: number} | null>(null);
  const [newsData, setNewsData] = useState<NewsItem[]>(MOCK_NEWS);
  const [webNews, setWebNews] = useState<NewsItem[]>(MOCK_WEB_NEWS);
  const [onboardStep, setOnboardStep] = useState(0);
  const [onboardAnswers, setOnboardAnswers] = useState<Record<string, string>>({});
  const [onboardMessages, setOnboardMessages] = useState<OnboardAnswer[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
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

  const onboardMessagesEndRef = useRef<HTMLDivElement>(null);
  const aiMessagesEndRef = useRef<HTMLDivElement>(null);
  
  const hasCheckedInitialRedirect = useRef(false);

  const [isMarketLoading, setIsMarketLoading] = useState(true);
  const [isNewsLoading, setIsNewsLoading] = useState(true);

  const Skeleton = ({ width, height, style }: { width?: string, height?: string, style?: any }) => (
    <div className="skeleton" style={{ width: width || '100%', height: height || '20px', borderRadius: '4px', ...style }}></div>
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

  useEffect(() => {
    if (currentSection === 'dashboard' && userProfile) {
      fetchMarketData();
      fetchMarketGraph();
      fetchNews();
      calculateHealthScores(userProfile);
      generateDailyAction(userProfile);
      pregenerateBriefing(userProfile);
    }
  }, [currentSection, apiKeys, userProfile]);

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
    setIsMarketLoading(true);
    if (!apiKeys.twelveData) {
      setMarketData(MOCK_MARKET);
      setPreviousClose(22912.4);
      setMarketRange({
        start: MOCK_GRAPH_DATA[0].value,
        end: MOCK_GRAPH_DATA[MOCK_GRAPH_DATA.length - 1].value,
        high: Math.max(...MOCK_GRAPH_DATA.map(v => v.value)),
        low: Math.min(...MOCK_GRAPH_DATA.map(v => v.value))
      });
      setIsMarketLoading(false);
      return;
    }

    try {
      const symbols = "RELIANCE:NSE,TCS:NSE,INFY:NSE,HDFCBANK:NSE,USD/INR,BTC/USD,NIFTY:NSE";
      const r = await fetch(`https://api.twelvedata.com/quote?symbol=${symbols}&apikey=${apiKeys.twelveData}`);
      const data = await r.json();

      const updated: MarketItem[] = [];
      const quotes = data.status === 'error' ? null : data;
      
      if (quotes) {
        Object.keys(quotes).forEach(sym => {
          const q = quotes[sym];
          if (q && q.symbol) {
            const symUpper = q.symbol.toUpperCase();
            
            // Set previous close for graph if this is NIFTY
            if (symUpper.includes("NIFTY")) {
              setPreviousClose(parseFloat(q.previous_close));
            }

            let type = "Stock";
            if (symUpper.includes("USD/INR")) type = "Forex";
            else if (symUpper.includes("BTC/USD")) type = "Crypto";

            updated.push({
              name: q.symbol.split(':')[0],
              type,
              price: (q.currency === 'INR' || q.symbol.includes('INR')) ? `₹${parseFloat(q.close).toLocaleString('en-IN')}` : `$${parseFloat(q.close).toLocaleString()}`,
              change: `${parseFloat(q.percent_change) >= 0 ? '+' : ''}${parseFloat(q.percent_change).toFixed(2)}%`,
              up: parseFloat(q.percent_change) >= 0
            });
          }
        });
      }

      if (updated.length > 0) setMarketData(updated);
      else setMarketData(MOCK_MARKET);
    } catch (error) {
      console.error("Error fetching market data:", error);
      setMarketData(MOCK_MARKET);
    } finally {
      setIsMarketLoading(false);
    }
  };

  const [previousClose, setPreviousClose] = useState<number | null>(22912.4);

  const fetchMarketGraph = async () => {
    // Check cache first to avoid too many requests
    const today = new Date().toDateString();
    const cacheKey = `et_market_graph_${today}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      setMarketGraphData(parsed.data);
      setPreviousClose(parsed.prev);
      setMarketRange(parsed.range);
      return;
    }

    try {
      // Prioritize Twelve Data for browser-friendly calls (no CORS issues like Yahoo)
      if (apiKeys.twelveData) {
        const symbol = "NIFTY:NSE"; 
        const r2 = await fetch(`https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1h&outputsize=40&apikey=${apiKeys.twelveData}`);
        const data2 = await r2.json();

        if (data2.values && data2.values.length > 0) {
          const baselineVal = previousClose || parseFloat(data2.values[data2.values.length - 1].close);
          const graph = data2.values.reverse().map((v: any) => {
            const val = parseFloat(v.close);
            const diff = val - baselineVal;
            const pct = (diff / baselineVal) * 100;
            return {
              name: new Date(v.datetime).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit' }),
              value: val,
              gain: diff,
              percentage: pct
            };
          });
          setMarketGraphData(graph);
          
          const values = graph.map(v => v.value);
          const range = {
            start: graph[0].value,
            end: graph[graph.length - 1].value,
            high: Math.max(...values),
            low: Math.min(...values)
          };
          setMarketRange(range);
          
          // Cache results
          localStorage.setItem(cacheKey, JSON.stringify({ data: graph, prev: baselineVal, range }));
          return;
        }
      }
      
      // Fallback: If no Twelve Data key or it failed, try a proxy for Yahoo Finance or use Mock
      setMarketGraphData(MOCK_GRAPH_DATA);
      setPreviousClose(22912.4);
      setMarketRange({
        start: MOCK_GRAPH_DATA[0].value,
        end: MOCK_GRAPH_DATA[MOCK_GRAPH_DATA.length - 1].value,
        high: Math.max(...MOCK_GRAPH_DATA.map(v => v.value)),
        low: Math.min(...MOCK_GRAPH_DATA.map(v => v.value))
      });
    } catch (error) {
      console.error("Error fetching graph data:", error);
      setMarketGraphData(MOCK_GRAPH_DATA);
      setPreviousClose(22912.4);
    }
  };

  const fetchNews = async () => {
    // Check cache to avoid 429
    const today = new Date().toDateString();
    const cacheKey = `et_news_${today}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      setNewsData(parsed.news);
      setRelevanceNotes(parsed.notes);
      setIsNewsLoading(false);
      return;
    }

    setIsNewsLoading(true);
    let articles = MOCK_NEWS;
    let aiNotes: Record<number, string> = {};

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
      } catch (error) { console.error("Error fetching news:", error); }
    }
    setNewsData(articles);
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
    localStorage.setItem(cacheKey, JSON.stringify({ news: articles, notes: aiNotes }));
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
    <div className={`concierge-body`}>
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
          <nav className="top-nav">
            <div className="nav-logo"><span>ET</span> Concierge</div>
            <div className="nav-links">
              <button className="nav-link active">Dashboard</button>
              <button className="nav-link" onClick={() => setCurrentSection('markets')}>Markets</button>
              <button className="nav-link" onClick={() => setCurrentSection('services')}>Services</button>
            </div>
            <div className="nav-right">
              <button onClick={() => setIsSettingsOpen(true)}>⚙ Settings</button>
            </div>
          </nav>

          <div className="container">
            {/* Daily Action Nudge */}
            <div className="card-common" style={{ 
              gridColumn: '1 / -1', 
              marginBottom: '24px', 
              background: 'linear-gradient(135deg, #112240 0%, #1a365d 100%)',
              border: '1px solid var(--et-accent)',
              padding: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 10px 30px -15px rgba(2,12,27,0.7)'
            }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--et-accent)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>
                  What should I do today?
                </div>
                <h2 style={{ margin: 0, fontSize: '20px', color: 'white' }}>
                  {dailyAction || "Analyzing the markets for your personal nudge..."}
                </h2>
              </div>
              <button 
                onClick={toggleBriefing}
                disabled={isBriefingLoading}
                style={{
                  background: isSpeaking ? 'var(--et-danger)' : 'var(--et-accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: isBriefingLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'transform 0.2s',
                  opacity: isBriefingLoading ? 0.7 : 1,
                  whiteSpace: 'nowrap'
                }}
                onMouseDown={e => !isBriefingLoading && (e.currentTarget.style.transform = 'scale(0.95)')}
                onMouseUp={e => !isBriefingLoading && (e.currentTarget.style.transform = 'scale(1)')}
              >
                {isBriefingLoading ? '⌛ Preparing...' : (isSpeaking ? '⏹ Stop' : '🔊 Daily Brief')}
              </button>
            </div>

            {/* Financial Health Score Section */}
            <div className="card-common" style={{ gridColumn: '1 / -1', marginBottom: '24px', textAlign: 'center' }}>
              <h3 style={{ marginBottom: '8px' }}>Your Financial Health Score</h3>
              <p style={{ fontSize: '14px', color: 'var(--et-text-secondary)', marginBottom: '20px' }}>Based on your personal profile and goals</p>
              <FinancialHealthRings scores={healthScores} />
            </div>

            <div className="dash-grid">
              {/* Profile Card */}
              <div className="profile-card card-common">
                <h3>{userProfile?.name}</h3>
                <div className="persona-badge" style={{background: 'var(--et-accent)', color: 'white', display: 'inline-block', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', marginBottom: '12px'}}>
                  {userProfile?.persona}
                </div>
                <div className="risk-indicator">
                  <span className="risk-dot" style={{background: userProfile?.risk === 'Aggressive' ? 'var(--et-danger)' : userProfile?.risk === 'Conservative' ? 'var(--et-success)' : 'var(--et-accent-secondary)'}}></span>
                  Risk: {userProfile?.risk}
                </div>
                <div className="goals-tags" style={{display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px'}}>
                  {(userProfile?.goals || '').split(',').map(g => g.trim()).filter(Boolean).map(g => <span key={g} className="goal-tag" style={{background: 'rgba(37,99,235,0.1)', color: 'var(--et-accent)', padding: '4px 10px', borderRadius: '8px', fontSize: '11px'}}>{g}</span>)}
                </div>
                <p style={{fontSize: '14px', color: 'var(--et-text-secondary)', marginBottom: '16px'}}>{userProfile?.summary}</p>
                
                {userProfile?.recommendations && userProfile.recommendations.length > 0 && (
                  <div style={{marginTop: '16px', borderTop: '1px solid var(--et-border-color)', paddingTop: '16px'}}>
                    <div style={{fontSize: '12px', fontWeight: 'bold', color: 'var(--et-accent)', marginBottom: '8px', textTransform: 'uppercase'}}>Top Recommendations</div>
                    <ul style={{padding: 0, margin: 0, listStyle: 'none'}}>
                      {userProfile.recommendations.map((rec, i) => (
                        <li key={i} style={{fontSize: '13px', color: 'white', marginBottom: '8px', display: 'flex', gap: '8px', alignItems: 'flex-start'}}>
                          <span style={{color: 'var(--et-success)'}}>•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button onClick={clearProfile} style={{color: 'var(--et-accent-secondary)', fontSize: '13px', marginTop: '12px', background: 'none'}}>↻ Reset</button>
              </div>

              {/* Analysis Graph */}
              <div className="chart-card card-common">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
                  <h3 style={{margin: 0}}>Market Sentiment (Live)</h3>
                  <div style={{fontSize: '12px', color: 'var(--et-text-secondary)'}}>Symbol: NIFTY 50 (8D View)</div>
                </div>

                {marketRange && (
                  <div style={{display: 'flex', gap: '16px', marginBottom: '16px', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '8px', fontSize: '11px'}}>
                    <div style={{flex: 1}}>
                      <div style={{color: 'var(--et-text-secondary)', marginBottom: '2px'}}>PREV CLOSE</div>
                      <div style={{fontWeight: 'bold', color: 'rgba(255,255,255,0.6)'}}>₹{previousClose?.toLocaleString('en-IN') || 'N/A'}</div>
                    </div>
                    <div style={{flex: 1}}>
                      <div style={{color: 'var(--et-text-secondary)', marginBottom: '2px'}}>CURRENT</div>
                      <div style={{fontWeight: 'bold', color: 'white'}}>₹{marketRange.end.toLocaleString('en-IN')}</div>
                    </div>
                    <div style={{flex: 1}}>
                      <div style={{color: 'var(--et-text-secondary)', marginBottom: '2px'}}>CHANGE</div>
                      <div style={{
                        fontWeight: 'bold', 
                        color: (marketRange.end >= (previousClose || 0)) ? 'var(--et-success)' : 'var(--et-danger)'
                      }}>
                        {((marketRange.end - (previousClose || 0)) >= 0 ? '+' : '')}
                        {(marketRange.end - (previousClose || 0)).toFixed(2)} 
                        {` (${((marketRange.end - (previousClose || 0)) / (previousClose || 1) * 100).toFixed(2)}%)`}
                      </div>
                    </div>
                    <div style={{flex: 1}}>
                      <div style={{color: 'var(--et-text-secondary)', marginBottom: '2px'}}>DAY HIGH</div>
                      <div style={{fontWeight: 'bold', color: 'var(--et-success)'}}>₹{marketRange.high.toLocaleString('en-IN')}</div>
                    </div>
                    <div style={{flex: 1}}>
                      <div style={{color: 'var(--et-text-secondary)', marginBottom: '2px'}}>DAY LOW</div>
                      <div style={{fontWeight: 'bold', color: 'var(--et-danger)'}}>₹{marketRange.low.toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                )}

                <div style={{ width: '100%', height: marketRange ? 'calc(100% - 100px)' : 'calc(100% - 40px)' }}>
                  <ResponsiveContainer>
                    <AreaChart data={marketGraphData}>
                      <defs>
                        <linearGradient id="colorDynamic" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={marketRange && marketRange.end >= (previousClose || 0) ? "var(--et-success)" : "var(--et-danger)"} stopOpacity={0.4}/>
                          <stop offset="95%" stopColor={marketRange && marketRange.end >= (previousClose || 0) ? "var(--et-success)" : "var(--et-danger)"} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: 'var(--et-text-secondary)', fontSize: 9}} 
                        minTickGap={60}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        domain={['auto', 'auto']}
                        tick={{fill: 'var(--et-text-secondary)', fontSize: 10}}
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            const val = d.value;
                            const diff = d.gain ?? 0;
                            const pct = d.percentage ?? 0;
                            
                            return (
                              <div style={{ backgroundColor: '#0D1B2A', padding: '10px', borderRadius: '8px', border: `1px solid ${diff >= 0 ? 'var(--et-success)' : 'var(--et-danger)'}`, fontSize: '12px' }}>
                                <div style={{ color: 'var(--et-text-secondary)', marginBottom: '4px' }}>{d.name}</div>
                                <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '2px' }}>₹{val.toLocaleString('en-IN')}</div>
                                <div style={{ color: diff >= 0 ? 'var(--et-success)' : 'var(--et-danger)', fontWeight: 'bold' }}>
                                  {diff >= 0 ? '▲' : '▼'} {Math.abs(diff).toFixed(2)} ({pct.toFixed(2)}%)
                                </div>
                                {d.baseline && <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>Ref: ₹{d.baseline.toLocaleString('en-IN')}</div>}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      {previousClose && (
                        <ReferenceLine 
                          y={previousClose} 
                          stroke="rgba(255,255,255,0.3)" 
                          strokeDasharray="5 5"
                          label={{ position: 'left', value: 'Prev Close', fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} 
                        />
                      )}
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke={marketRange && marketRange.end >= (previousClose || 0) ? "var(--et-success)" : "var(--et-danger)"}
                        strokeWidth={2} 
                        fillOpacity={1} 
                        fill="url(#colorDynamic)" 
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Markets */}
              <div style={{gridColumn: '1 / -1'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
                  <h3 style={{margin: 0}}>Live Market Snapshot</h3>
                  <button 
                    onClick={() => { fetchMarketData(); fetchMarketGraph(); showToast("Market data updated"); }}
                    style={{fontSize: '12px', color: 'var(--et-accent)', background: 'rgba(249,115,22,0.1)', border: '1px solid var(--et-accent)', borderRadius: '4px', padding: '4px 12px', cursor: 'pointer'}}
                  >
                    Refresh Data
                  </button>
                </div>
                <div className="market-grid">
                  {isMarketLoading 
                    ? Array(6).fill(0).map((_, i) => (
                        <div key={i} className="market-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <Skeleton width="60px" height="14px" />
                          <Skeleton width="40px" height="10px" />
                          <Skeleton width="80px" height="24px" style={{ marginTop: '4px' }} />
                          <Skeleton width="40px" height="14px" />
                        </div>
                      ))
                    : marketData.map((d, i) => (
                        <div key={i} className="market-card" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', position: 'relative'}}>
                          {d.mock && <span style={{ position: 'absolute', top: '4px', right: '4px', fontSize: '8px', background: 'rgba(255,255,255,0.1)', color: 'var(--et-text-secondary)', padding: '2px 4px', borderRadius: '4px' }}>Sample</span>}
                          <div className="label" style={{fontWeight: 'bold', fontSize: '14px'}}>{d.name}</div>
                          {d.type && (
                            <div style={{
                              fontSize: '10px', 
                              background: 'rgba(255,255,255,0.1)', 
                              padding: '2px 8px', 
                              borderRadius: '10px', 
                              color: 'var(--et-text-secondary)',
                              marginBottom: '4px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              {d.type}
                            </div>
                          )}
                          <div className="price" style={{fontSize: '18px', fontWeight: 'bold'}}>{d.price}</div>
                          <div className="change" style={{color: d.up ? 'var(--et-success)' : 'var(--et-danger)', fontWeight: '600', fontSize: '13px'}}>{d.change}</div>
                        </div>
                      ))
                  }
                </div>
              </div>

              {/* News */}
              <div style={{gridColumn: '1 / -1'}}>
                <h3 style={{marginBottom: '16px'}}>Today's picks for you</h3>
                <div className="news-grid">
                  {isNewsLoading
                    ? Array(6).fill(0).map((_, i) => (
                        <div key={i} className="news-card">
                          <Skeleton width="100%" height="20px" style={{ marginBottom: '12px' }} />
                          <Skeleton width="60%" height="14px" style={{ marginBottom: '16px' }} />
                          <Skeleton width="100%" height="14px" />
                        </div>
                      ))
                    : newsData.map((a, i) => (
                        <div key={i} className="news-card">
                          <h4 style={{fontSize: '15px', marginBottom: '8px'}}>{a.title}</h4>
                          <div style={{fontSize: '12px', color: 'var(--et-text-secondary)', marginBottom: '12px'}}>{a.source} · {a.time}</div>
                          
                          {relevanceNotes[i] && (
                            <div style={{ background: 'rgba(249,115,22,0.1)', borderLeft: '2px solid var(--et-accent)', padding: '8px 12px', borderRadius: '4px', marginBottom: '12px', fontSize: '12px', fontStyle: 'italic', color: '#CCD6F6' }}>
                              <strong>Why this matters:</strong> {relevanceNotes[i]}
                            </div>
                          )}

                          <a href={a.url} target="_blank" style={{marginTop: 'auto', fontSize: '13px'}}>Read More →</a>
                        </div>
                      ))
                  }
                </div>
              </div>

              {/* Web Scraped News */}
              <div style={{gridColumn: '1 / -1'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
                  <h3 style={{margin: 0}}>Latest from the Web (Live)</h3>
                  <div style={{fontSize: '11px', color: 'var(--et-accent)', background: 'rgba(249,115,22,0.1)', padding: '2px 8px', borderRadius: '4px'}}>Market Pulse</div>
                </div>
                <div className="news-grid">
                  {webNews.map((a, i) => (
                    <div key={i} className="news-card" style={{borderLeft: '3px solid var(--et-accent)'}}>
                      <h4 style={{fontSize: '14px', marginBottom: '8px', lineHeight: '1.4'}}>{a.title}</h4>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto'}}>
                        <div style={{fontSize: '11px', color: 'var(--et-text-secondary)'}}>{a.source} · {a.time}</div>
                        <a href={a.url} target="_blank" style={{fontSize: '11px', color: 'var(--et-accent)', fontWeight: '600'}}>Source ↗</a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Events Section */}
              <div style={{gridColumn: '1 / -1'}}>
                <h3 style={{marginBottom: '16px'}}>Events & Conferences</h3>
                <div className="news-grid">
                  {EVENTS.map((e, i) => {
                    const isRecommended = e.matchSectors.some(s => userProfile?.sectors?.includes(s));
                    return (
                      <div key={i} className="news-card" style={{ border: isRecommended ? '1px solid var(--et-accent)' : '1px solid var(--et-border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <h4 style={{fontSize: '15px', margin: 0}}>{e.title}</h4>
                          {isRecommended && <span style={{ background: 'var(--et-accent)', color: 'white', fontSize: '10px', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>Recommended</span>}
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--et-text-secondary)', marginBottom: '12px' }}>{e.desc}</p>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--et-accent)', marginBottom: '16px' }}>{e.date}</div>
                        <button 
                          className="btn-primary" 
                          style={{ width: '100%', fontSize: '13px', padding: '8px' }}
                          onClick={() => showToast(`Registered interest for ${e.title}!`)}
                        >
                          Register Interest
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Chat */}
              <div style={{gridColumn: '1 / -1'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
                  <h3 style={{margin: 0, color: 'var(--et-text-primary)'}}>🤖 Your AI Financial Guide</h3>
                  <button 
                    onClick={clearChat} 
                    style={{fontSize: '12px', color: 'var(--et-text-secondary)', background: 'none', border: '1px solid var(--et-border-color)', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer'}}
                  >
                    Clear Chat
                  </button>
                </div>
                <div className="ai-chat-box card-common">
                  <div className="ai-chat-messages" style={{flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column'}}>
                    {chatHistory.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--et-text-secondary)' }}>
                        <p>How can I help you today, {userProfile?.name}?</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
                          {["What ET products suit me?", "Review my investment approach", "Find relevant ET events", "Suggest financial services"].map(chip => (
                            <button 
                              key={chip} 
                              onClick={() => sendAiMessage(chip)}
                              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--et-border-color)', borderRadius: '20px', padding: '6px 14px', fontSize: '12px', color: 'white', cursor: 'pointer' }}
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {chatHistory.map((m, i) => (
                      <div 
                        key={i} 
                        className={`chat-msg ${m.role === 'user' ? 'user' : 'bot'}`} 
                        style={{
                          padding: '10px 14px', 
                          borderRadius: '12px', 
                          marginBottom: '8px', 
                          maxWidth: '80%', 
                          alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', 
                          background: m.role === 'user' ? 'var(--et-accent)' : '#233554', 
                          color: m.role === 'user' ? 'white' : '#CCD6F6'
                        }}
                      >
                        {m.role === 'assistant' ? parseMarkdown(m.content) : m.content}
                      </div>
                    ))}
                    {isAiTyping && <p style={{fontSize: '12px', color: 'var(--et-text-secondary)'}}>AI is typing...</p>}
                    <div ref={aiMessagesEndRef} />
                  </div>
                  <div style={{padding: '16px', borderTop: '1px solid var(--et-border-color)', display: 'flex', gap: '8px'}}>
                    <input 
                      type="text" 
                      value={aiInput} 
                      onChange={e => setAiInput(e.target.value)} 
                      placeholder="Ask anything..." 
                      style={{
                        flex: 1,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--et-border-color)',
                        borderRadius: '8px',
                        padding: '10px 16px',
                        color: 'white'
                      }} 
                      onKeyDown={e => e.key === 'Enter' && sendAiMessage(aiInput)} 
                    />
                    <button onClick={() => sendAiMessage(aiInput)} style={{background: 'var(--et-accent)', color: 'white', padding: '8px 20px', borderRadius: '8px', fontWeight: 'bold'}}>Send</button>
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
          <nav className="top-nav">
             <div className="nav-logo"><span>ET</span> Concierge</div>
             <button onClick={() => setCurrentSection('dashboard')}>← Back to Dashboard</button>
          </nav>
          <div className="container" style={{padding: '40px 0'}}>
             <h2>Market Analysis</h2>
             <div className="market-grid" style={{marginTop: '24px'}}>
               {marketData.map((d, i) => (
                 <div key={i} className="market-card">
                   <h4>{d.name}</h4>
                   <div style={{fontSize: '24px', fontWeight: 'bold'}}>{d.price}</div>
                   <div style={{color: d.up ? 'var(--et-success)' : 'var(--et-danger)'}}>{d.change}</div>
                 </div>
               ))}
             </div>

             <div style={{marginTop: '48px'}}>
                <h3 style={{marginBottom: '16px'}}>Latest Market Pulse (Web)</h3>
                <div className="news-grid">
                  {webNews.map((a, i) => (
                    <div key={i} className="news-card" style={{borderLeft: '3px solid var(--et-accent)'}}>
                      <h4 style={{fontSize: '14px', marginBottom: '8px', lineHeight: '1.4'}}>{a.title}</h4>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto'}}>
                        <div style={{fontSize: '11px', color: 'var(--et-text-secondary)'}}>{a.source} · {a.time}</div>
                        <a href={a.url} target="_blank" style={{fontSize: '11px', color: 'var(--et-accent)', fontWeight: '600'}}>Source ↗</a>
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
          <nav className="top-nav">
             <div className="nav-logo"><span>ET</span> Concierge</div>
             <button onClick={() => setCurrentSection('dashboard')}>← Back to Dashboard</button>
          </nav>
          <div className="container" style={{padding: '40px 0'}}>
             <h2>Financial Services</h2>
             <div className="news-grid" style={{marginTop: '24px'}}>
               {SERVICES.map(s => {
                 const isRecommended = s.matchGoals.some(g => userProfile?.goals?.includes(g));
                 return (
                   <div key={s.id} className="news-card" style={{ border: isRecommended ? '1px solid var(--et-accent)' : '1px solid var(--et-border-color)' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                       <h4 style={{ margin: 0 }}>{s.title}</h4>
                       {isRecommended && <span style={{ background: 'var(--et-accent)', color: 'white', fontSize: '10px', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>Recommended</span>}
                     </div>
                     <p style={{fontSize: '14px', color: 'var(--et-text-secondary)', marginBottom: '16px'}}>{s.best}</p>
                     <button 
                        className="btn-primary" 
                        style={{ width: '100%', fontSize: '13px', padding: '10px' }}
                        onClick={() => openServiceAdvisor(s)}
                     >
                       Chat with Expert Advisor
                     </button>
                   </div>
                 );
               })}
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Index;
