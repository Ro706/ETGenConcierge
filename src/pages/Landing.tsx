import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

const Landing = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [heroWord, setHeroWord] = useState("News");

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
    <div style={{ position: 'relative', overflowX: 'hidden', background: '#0A1628', color: 'white', fontFamily: 'Inter, sans-serif' }}>
      {/* Landing Nav */}
      <nav style={{ 
        position: 'fixed', top: 0, left: 0, right: 0, padding: '20px 40px', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100,
        background: 'rgba(10, 22, 40, 0.8)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div className="nav-logo" style={{ fontSize: '24px', fontWeight: 'bold' }}>
          <span style={{ color: '#F97316' }}>ET</span> Concierge
        </div>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <button onClick={() => navigate('/auth')} style={{ background: 'none', color: 'white', fontWeight: '600', cursor: 'pointer', border: 'none' }}>Login</button>
          <button onClick={startOnboarding} style={{ background: '#F97316', color: 'white', padding: '10px 24px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>Get Started</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '120px 20px 60px' }}>
        <div style={{ position: 'absolute', top: '10%', left: '10%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(249,115,22,0.1) 0%, transparent 70%)', filter: 'blur(80px)', zIndex: 0 }}></div>
        <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(37,99,235,0.1) 0%, transparent 70%)', filter: 'blur(80px)', zIndex: 0 }}></div>
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: 'clamp(48px, 10vw, 90px)', fontWeight: '900', marginBottom: '20px', lineHeight: '1.1' }}>
            <span style={{ color: '#F97316' }}>ET</span> Concierge
          </h1>
          <p style={{ fontSize: 'clamp(18px, 3vw, 24px)', maxWidth: '800px', margin: '0 auto 24px', color: '#CCD6F6', lineHeight: '1.6' }}>
            Your professional AI companion for markets, finance, and wealth management.
          </p>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#F97316', marginBottom: '48px', height: '40px' }}>
            {heroWord}
          </div>
          
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={startOnboarding} style={{ padding: '18px 48px', fontSize: '18px', fontWeight: 'bold', background: '#F97316', color: 'white', borderRadius: '12px', border: 'none', cursor: 'pointer', boxShadow: '0 0 30px rgba(249,115,22,0.3)', transition: 'transform 0.2s' }}>
              Build Your Profile Now
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: '100px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '42px', marginBottom: '60px' }}>Everything you need to <span style={{ color: '#F97316' }}>Succeed</span></h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
          {features.map((f, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', padding: '40px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', transition: 'transform 0.3s' }}>
              <div style={{ fontSize: '40px', marginBottom: '20px' }}>{f.icon}</div>
              <h3 style={{ fontSize: '22px', marginBottom: '12px' }}>{f.title}</h3>
              <p style={{ color: '#8892B0', lineHeight: '1.6' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works Section */}
      <section style={{ background: 'rgba(255,255,255,0.02)', padding: '100px 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '60px', fontSize: '42px' }}>The Journey Ahead</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '40px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '80px', height: '80px', background: '#F97316', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '24px', fontWeight: 'bold' }}>1</div>
              <h3 style={{ marginBottom: '15px' }}>Onboarding</h3>
              <p style={{ color: '#8892B0', lineHeight: '1.6' }}>Answer a few questions about your financial goals and risk appetite.</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '80px', height: '80px', background: '#2563EB', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '24px', fontWeight: 'bold' }}>2</div>
              <h3 style={{ marginBottom: '15px' }}>Personalization</h3>
              <p style={{ color: '#8892B0', lineHeight: '1.6' }}>Our AI builds a custom persona and filters the market just for you.</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '80px', height: '80px', background: '#10B981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '24px', fontWeight: 'bold' }}>3</div>
              <h3 style={{ marginBottom: '15px' }}>Daily Guidance</h3>
              <p style={{ color: '#8892B0', lineHeight: '1.6' }}>Receive morning briefings, live nudges, and 24/7 expert advice.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: '100px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '42px', marginBottom: '60px' }}>Trusted by <span style={{ color: '#F97316' }}>Investors</span></h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
          {testimonials.map((t, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', padding: '30px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ fontStyle: 'italic', marginBottom: '20px', color: '#CCD6F6' }}>"{t.text}"</p>
              <div>
                <div style={{ fontWeight: 'bold' }}>{t.name}</div>
                <div style={{ fontSize: '14px', color: '#F97316' }}>{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '100px 20px', maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '42px', marginBottom: '60px' }}>FAQ</h2>
        {faqs.map((f, i) => (
          <div key={i} style={{ marginBottom: '30px', paddingBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>{f.q}</h3>
            <p style={{ color: '#8892B0', lineHeight: '1.6' }}>{f.a}</p>
          </div>
        ))}
      </section>

      {/* Final CTA */}
      <section style={{ padding: '100px 20px', textAlign: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(249,115,22,0.2) 0%, transparent 70%)', filter: 'blur(50px)', zIndex: 0 }}></div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: '48px', marginBottom: '24px' }}>Ready to take control?</h2>
          <p style={{ fontSize: '20px', color: '#8892B0', marginBottom: '40px' }}>Join thousands of investors using AI to beat the market.</p>
          <button onClick={startOnboarding} style={{ padding: '18px 48px', fontSize: '18px', fontWeight: 'bold', background: '#F97316', color: 'white', borderRadius: '12px', border: 'none', cursor: 'pointer' }}>Get Started for Free</button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '60px 20px', textAlign: 'center', background: '#081220' }}>
        <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '20px' }}>
          <span style={{ color: '#F97316' }}>ET</span> Concierge
        </div>
        <p style={{ color: '#8892B0', marginBottom: '30px', maxWidth: '600px', margin: '0 auto 30px' }}>
          Empowering Indian investors with professional AI-driven financial insights.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginBottom: '40px', fontSize: '14px' }}>
          <a href="#" style={{ color: '#CCD6F6', textDecoration: 'none' }}>Terms of Service</a>
          <a href="#" style={{ color: '#CCD6F6', textDecoration: 'none' }}>Privacy Policy</a>
          <a href="#" style={{ color: '#CCD6F6', textDecoration: 'none' }}>Contact Us</a>
        </div>
        <p style={{ fontSize: '12px', color: '#495670' }}>© 2026 The Economic Times. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Landing;
