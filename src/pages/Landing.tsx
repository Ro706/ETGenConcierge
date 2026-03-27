import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [heroWord, setHeroWord] = useState("News");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const words = ["News", "Markets", "Finance", "Events", "Investments", "Tax Planning"];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % words.length;
      setHeroWord(words[i]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const startOnboarding = () => {
    if (!user) {
      navigate('/auth');
    } else {
      const p = localStorage.getItem('et_profile');
      if (p) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    }
  };

  const features = [
    { title: "AI Portfolio Analysis", desc: "Get deep insights into your holdings with our advanced AI models.", icon: "📊" },
    { title: "Live Market Nudges", desc: "Receive real-time alerts tailored specifically to your financial profile.", icon: "🔔" },
    { title: "Personalized News", desc: "We filter the noise and show you only what matters to your goals.", icon: "🗞️" },
    { title: "Tax Planning Guide", desc: "Optimize your savings with personalized tax-saving recommendations.", icon: "⚖️" },
    { title: "Wealth Management", desc: "Professional tools to help you grow and preserve your capital.", icon: "💎" },
    { title: "24/7 AI Concierge", desc: "Your personal financial assistant is always ready to answer questions.", icon: "🤖" }
  ];

  const testimonials = [
    { name: "Arjun Mehta", role: "Active Investor", text: "ET Concierge has completely changed how I track the markets. The AI summaries are spot on." },
    { name: "Priya Sharma", role: "Salaried Professional", text: "Finally, a financial tool that understands my goals and doesn't just show me generic data." },
    { name: "Vikram Singh", role: "Business Owner", text: "The personalized news feed saves me hours every week. Highly recommended for busy people." }
  ];

  const faqs = [
    { q: "Is my data secure?", a: "Yes, we use industry-standard encryption and never share your personal financial data." },
    { q: "Do I need an ET subscription?", a: "The Concierge basic features are free. Premium insights may require an ET Prime subscription." },
    { q: "How accurate is the AI?", a: "Our AI is trained on decades of ET market data and updated in real-time for maximum accuracy." }
  ];

  return (
    <div className="concierge-body" style={{ position: 'relative', overflowX: 'hidden' }}>
      {/* Landing Nav */}
      <nav style={{ 
        position: 'fixed', top: 0, left: 0, right: 0, padding: '15px 5%', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100,
        background: 'rgba(10, 25, 47, 0.85)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div className="nav-logo" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
          <span style={{ color: '#F97316' }}>ET</span> Concierge
        </div>
        
        {/* Desktop Links */}
        <div className="hidden md:flex gap-6 items-center">
          <button onClick={startOnboarding} style={{ background: 'none', color: 'white', fontWeight: '600', cursor: 'pointer', border: 'none', fontSize: '0.9rem' }}>
            {user ? 'Dashboard' : 'Login'}
          </button>
          <button onClick={startOnboarding} style={{ background: '#F97316', color: 'white', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}>Get Started</button>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="flex md:hidden text-white hover:text-orange-500 transition-colors" 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile Menu Drawer */}
        {isMenuOpen && (
          <div 
            className="fixed inset-0 top-[60px] z-[99] md:hidden bg-background/98 backdrop-blur-xl animate-in fade-in slide-in-from-right-5 duration-300"
            style={{ height: 'calc(100vh - 60px)' }}
          >
            <div className="flex flex-col p-8 gap-6">
              <button 
                onClick={() => { startOnboarding(); setIsMenuOpen(false); }}
                className="w-full py-4 px-6 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-lg text-left flex justify-between items-center group active:scale-95 transition-all"
              >
                <span>{user ? 'Dashboard' : 'Login / Register'}</span>
                <span className="text-orange-500 group-hover:translate-x-1 transition-transform">→</span>
              </button>
              <button 
                onClick={() => { startOnboarding(); setIsMenuOpen(false); }}
                className="w-full py-4 px-6 rounded-xl bg-orange-500 text-white font-bold text-lg text-left shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
              >
                Get Started for Free
              </button>
              
              <div className="mt-auto pt-12 border-t border-white/5">
                <div className="text-slate-500 text-sm font-medium mb-4 uppercase tracking-widest">Our Ecosystem</div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-slate-300 text-sm">ET Markets</div>
                  <div className="text-slate-300 text-sm">ET Prime</div>
                  <div className="text-slate-300 text-sm">Wealth</div>
                  <div className="text-slate-300 text-sm">Panache</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '120px 20px 60px' }}>
        <div style={{ position: 'absolute', top: '10%', left: '10%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(249,115,22,0.1) 0%, transparent 70%)', filter: 'blur(80px)', zIndex: 0 }}></div>
        <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(37,99,235,0.1) 0%, transparent 70%)', filter: 'blur(80px)', zIndex: 0 }}></div>
        
        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '1000px' }}>
          <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 5.5rem)', fontWeight: '900', marginBottom: '1rem', lineHeight: '1.1' }}>
            <span style={{ color: '#F97316' }}>ET</span> Concierge
          </h1>
          <p style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)', maxWidth: '700px', margin: '0 auto 1.5rem', color: '#CCD6F6', lineHeight: '1.6' }}>
            Your professional AI companion for markets, finance, and wealth management.
          </p>
          <div style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 'bold', color: '#F97316', marginBottom: '3rem', height: '2.5rem' }}>
            {heroWord}
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={startOnboarding} style={{ padding: '16px 32px', fontSize: '1.1rem', width: 'auto' }}>
              Build Your Profile Now
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: '80px 5%', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(2rem, 5vw, 2.5rem)', marginBottom: '3rem' }}>Everything you need to <span style={{ color: '#F97316' }}>Succeed</span></h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {features.map((f, i) => (
            <div key={i} className="card-common" style={{ transition: 'transform 0.3s', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>{f.icon}</div>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>{f.title}</h3>
              <p style={{ color: '#8892B0', lineHeight: '1.6', fontSize: '0.95rem' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works Section */}
      <section style={{ background: 'rgba(255,255,255,0.02)', padding: '80px 5%' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '3rem', fontSize: 'clamp(2rem, 5vw, 2.5rem)' }}>The Journey Ahead</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '60px', height: '60px', background: '#F97316', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '1.5rem', fontWeight: 'bold' }}>1</div>
              <h3 style={{ marginBottom: '12px' }}>Onboarding</h3>
              <p style={{ color: '#8892B0', lineHeight: '1.6', fontSize: '0.95rem' }}>Answer a few questions about your financial goals and risk appetite.</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '60px', height: '60px', background: '#2563EB', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '1.5rem', fontWeight: 'bold' }}>2</div>
              <h3 style={{ marginBottom: '12px' }}>Personalization</h3>
              <p style={{ color: '#8892B0', lineHeight: '1.6', fontSize: '0.95rem' }}>Our AI builds a custom persona and filters the market just for you.</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '60px', height: '60px', background: '#10B981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '1.5rem', fontWeight: 'bold' }}>3</div>
              <h3 style={{ marginBottom: '12px' }}>Daily Guidance</h3>
              <p style={{ color: '#8892B0', lineHeight: '1.6', fontSize: '0.95rem' }}>Receive morning briefings, live nudges, and 24/7 expert advice.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: '80px 5%', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(2rem, 5vw, 2.5rem)', marginBottom: '3rem' }}>Trusted by <span style={{ color: '#F97316' }}>Investors</span></h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {testimonials.map((t, i) => (
            <div key={i} className="card-common" style={{ display: 'flex', flexDirection: 'column' }}>
              <p style={{ fontStyle: 'italic', marginBottom: '1.5rem', color: '#CCD6F6', flex: 1, fontSize: '0.95rem' }}>"{t.text}"</p>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{t.name}</div>
                <div style={{ fontSize: '0.85rem', color: '#F97316' }}>{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '80px 5%', maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(2rem, 5vw, 2.5rem)', marginBottom: '3rem' }}>FAQ</h2>
        {faqs.map((f, i) => (
          <div key={i} style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{f.q}</h3>
            <p style={{ color: '#8892B0', lineHeight: '1.6', fontSize: '0.95rem' }}>{f.a}</p>
          </div>
        ))}
      </section>

      {/* Final CTA */}
      <section style={{ padding: '100px 5%', textAlign: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(249,115,22,0.2) 0%, transparent 70%)', filter: 'blur(50px)', zIndex: 0 }}></div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 'clamp(2rem, 6vw, 3rem)', marginBottom: '1.5rem' }}>Ready to take control?</h2>
          <p style={{ fontSize: 'clamp(1rem, 3vw, 1.25rem)', color: '#8892B0', marginBottom: '2.5rem' }}>Join thousands of investors using AI to beat the market.</p>
          <button className="btn-primary" onClick={startOnboarding} style={{ padding: '16px 48px', fontSize: '1.1rem' }}>Get Started for Free</button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '60px 5%', textAlign: 'center', background: '#081220' }}>
        <div style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '1.25rem' }}>
          <span style={{ color: '#F97316' }}>ET</span> Concierge
        </div>
        <p style={{ color: '#8892B0', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem', fontSize: '0.9rem' }}>
          Empowering Indian investors with professional AI-driven financial insights.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '2.5rem', fontSize: '0.85rem', flexWrap: 'wrap' }}>
          <a href="#" style={{ color: '#CCD6F6', textDecoration: 'none' }}>Terms of Service</a>
          <a href="#" style={{ color: '#CCD6F6', textDecoration: 'none' }}>Privacy Policy</a>
          <a href="#" style={{ color: '#CCD6F6', textDecoration: 'none' }}>Contact Us</a>
        </div>
        <p style={{ fontSize: '0.75rem', color: '#495670' }}>© 2026 The Economic Times. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Landing;
