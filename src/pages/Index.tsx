import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
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

// --- Mocks ---
const MOCK_GRAPH_DATA = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 5000 },
  { name: 'Apr', value: 4500 },
  { name: 'May', value: 6000 },
  { name: 'Jun', value: 5500 },
  { name: 'Jul', value: 7000 },
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
  { name: "RELIANCE", price: "₹2,847", change: "+1.2%", up: true, mock: true },
  { name: "TCS", price: "₹3,912", change: "+0.8%", up: true, mock: true },
  { name: "INFY", price: "₹1,623", change: "+0.5%", up: true, mock: true },
  { name: "HDFCBANK", price: "₹1,745", change: "+1.1%", up: true, mock: true },
  { name: "USD/INR", price: "₹83.52", change: "-0.1%", up: false, mock: true },
  { name: "BTC/INR", price: "₹68,42,500", change: "+2.4%", up: true, mock: true },
  { name: "ETH/INR", price: "₹2,95,600", change: "+1.8%", up: true, mock: true }
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
  const [newsData, setNewsData] = useState<NewsItem[]>(MOCK_NEWS);
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

  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");

  const onboardMessagesEndRef = useRef<HTMLDivElement>(null);
  const aiMessagesEndRef = useRef<HTMLDivElement>(null);
  
  const hasCheckedInitialRedirect = useRef(false);

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

  useEffect(() => {
    if (currentSection === 'dashboard') {
      fetchMarketData();
      fetchNews();
    }
  }, [currentSection, apiKeys]);

  useEffect(() => {
    onboardMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [onboardMessages]);

  useEffect(() => {
    aiMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isAiTyping]);

  const fetchMarketData = () => {
    const data = [...MOCK_MARKET];
    setMarketData(data);
  };

  const fetchNews = async () => {
    let articles = MOCK_NEWS;
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

    if (apiKeys.gemini && userProfile) {
      try {
        const headlines = articles.map((a, i) => `${i+1}. ${a.title}`).join('\n');
        const prompt = `Given this user profile: ${JSON.stringify(userProfile)}\n\nFor each headline, write a short "Why this matters to you" note (under 15 words):\n${headlines}\n\nReturn ONLY a JSON array of 6 strings, no markdown.`;
        const resp = await callGemini(prompt, 'Return ONLY a JSON array of strings. No markdown.');
        if (resp) {
          const clean = resp.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const parsed = JSON.parse(clean);
          if (Array.isArray(parsed)) {
            const notes: Record<number, string> = {};
            parsed.forEach((n, i) => notes[i] = n);
            setRelevanceNotes(notes);
          }
        }
      } catch (error) { console.error("Error getting AI relevance:", error); }
    }
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
      // Use models confirmed available in your diagnostic list
      const preferredModels = ['gemini-2.0-flash', 'gemini-flash-latest', 'gemini-1.5-flash'];
      
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
    const profile: UserProfile = {
      name: answers.name || 'User',
      type: answers.type,
      goals: answers.goals,
      investments: answers.investments,
      sectors: answers.sectors,
      risk: answers.risk,
      concern: answers.concern || '',
      summary: `You're a ${answers.risk?.toLowerCase() || 'moderate'} ${answers.type?.toLowerCase() || 'investor'} focused on ${answers.goals?.toLowerCase() || 'wealth building'}.`,
      persona: answers.risk === 'Aggressive' ? 'Growth Investor' : 'Balanced Investor',
      recommendations: ['ET Prime for analysis']
    };
    setUserProfile(profile);
    localStorage.setItem('et_profile', JSON.stringify(profile));
    setTimeout(() => { setIsLoadingProfile(false); navigate('/dashboard'); }, 1500);
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

  return (
    <div className={`concierge-body`}>
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
            <button className="btn-secondary" onClick={() => signOut()}>Logout</button>
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

      {/* ═══ SECTION: LANDING ═══ */}
      {currentSection === 'landing' && (
        <div className="section active" id="landing">
          <div className="hero-content">
            <h1 className="hero-logo"><span>ET</span> Concierge</h1>
            <p className="hero-tagline">Professional financial guidance</p>
            <div className="hero-cycle">{heroWord}</div>
            <button className="hero-cta" onClick={startOnboarding}>Get Started</button>
          </div>
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
                    <div className={`chat-msg ${m.type}`}>{m.text}</div>
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
                <p style={{fontSize: '14px', color: 'var(--et-text-secondary)'}}>{userProfile?.summary}</p>
                <button onClick={clearProfile} style={{color: 'var(--et-accent-secondary)', fontSize: '13px', marginTop: '12px', background: 'none'}}>↻ Reset</button>
              </div>

              {/* Analysis Graph */}
              <div className="chart-card card-common">
                <h3>Portfolio Analysis</h3>
                <div style={{ width: '100%', height: '100%' }}>
                  <ResponsiveContainer>
                    <AreaChart data={MOCK_GRAPH_DATA}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: 'var(--et-text-secondary)', fontSize: 12}} 
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: 'var(--et-text-secondary)', fontSize: 12}} 
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#112240',
                          borderRadius: '8px', 
                          border: '1px solid rgba(255,255,255,0.1)', 
                          boxShadow: 'var(--et-shadow)',
                          color: '#F0F4FF'
                        }}
                        itemStyle={{ color: '#10B981' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#10B981" 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#colorValue)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Markets */}
              <div style={{gridColumn: '1 / -1'}}>
                <h3 style={{marginBottom: '16px'}}>Live Market Snapshot</h3>
                <div className="market-grid">
                  {marketData.map((d, i) => (
                    <div key={i} className="market-card">
                      <div className="label">{d.name}</div>
                      <div className="price">{d.price}</div>
                      <div className="change" style={{color: d.up ? 'var(--et-success)' : 'var(--et-danger)', fontWeight: '600'}}>{d.change}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* News */}
              <div style={{gridColumn: '1 / -1'}}>
                <h3 style={{marginBottom: '16px'}}>Today's picks for you</h3>
                <div className="news-grid">
                  {newsData.map((a, i) => (
                    <div key={i} className="news-card">
                      <h4 style={{fontSize: '15px', marginBottom: '8px'}}>{a.title}</h4>
                      <div style={{fontSize: '12px', color: 'var(--et-text-secondary)'}}>{a.source} · {a.time}</div>
                      <a href={a.url} target="_blank" style={{marginTop: '12px', fontSize: '13px'}}>Read More →</a>
                    </div>
                  ))}
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
                        {m.content}
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
               {SERVICES.map(s => (
                 <div key={s.id} className="news-card">
                   <h4>{s.title}</h4>
                   <p style={{fontSize: '14px', color: 'var(--et-text-secondary)'}}>{s.best}</p>
                   <button onClick={() => sendAiMessage(`Tell me about ${s.title}`)} style={{marginTop: '12px', color: 'var(--et-accent)', background: 'none'}}>Get Advice →</button>
                 </div>
               ))}
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Index;
