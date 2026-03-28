import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Shield, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'login' | 'signup' | 'check-email'>('login');
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Helper to handle routing after successful auth
  const handleRouting = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_admin, persona_label')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (profile?.is_admin) {
        navigate('/admin');
      } else if (profile?.persona_label) {
        localStorage.setItem('et_profile', JSON.stringify(profile));
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    } catch (err) {
      console.error("Routing error:", err);
      navigate('/onboarding');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      toast({ 
        title: 'Login failed', 
        description: error.message, 
        variant: 'destructive' 
      });
      setLoading(false);
      return;
    }

    if (data.user) {
      await handleRouting(data.user.id);
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const redirectTo = window.location.hostname === 'localhost' 
      ? `${window.location.origin}/auth`
      : 'https://et-gen-concierge.vercel.app/auth';

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: redirectTo,
      },
    });
    
    if (error) {
      toast({ 
        title: 'Signup failed', 
        description: error.message, 
        variant: 'destructive' 
      });
      setLoading(false);
      return;
    }

    if (data.session) {
      toast({ title: 'Welcome!', description: 'Your account has been created successfully.' });
      await handleRouting(data.user!.id);
    } else {
      setView('check-email');
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({ 
        title: 'Email required', 
        description: 'Please enter your email to reset your password.', 
        variant: 'destructive' 
      });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ 
        title: 'Reset link sent', 
        description: 'Check your inbox for the password reset link.' 
      });
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await handleRouting(session.user.id);
      } else if (event === 'PASSWORD_RECOVERY') {
        navigate('/reset-password');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (view === 'check-email') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A192F] px-4">
        <Card className="w-full max-w-md bg-[#112240] border-white/10 text-white shadow-2xl animate-in fade-in zoom-in duration-300">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mb-4">
              <Mail className="text-orange-500" size={32} />
            </div>
            <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
            <CardDescription className="text-slate-400">
              We've sent a temporary verification link to <span className="text-white font-medium">{email}</span>.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-slate-400">
              Click the link in the email to confirm your account. If you don't see it, check your spam folder.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full border-white/10 hover:bg-white/5"
              onClick={() => setView('login')}
            >
              Back to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0A192F]">
      {/* Left side - Branding/Info */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-orange-600 to-orange-800 p-12 flex-col justify-between text-white">
        <div>
          <div className="flex items-center gap-2 mb-8">
            <div className="bg-white p-1.5 rounded-lg">
              <Shield className="text-orange-600" size={24} />
            </div>
            <span className="text-2xl font-bold tracking-tight">ET Concierge</span>
          </div>
          <h1 className="text-5xl font-extrabold leading-tight mb-6">
            Master the Markets with <span className="text-orange-200">AI Intelligence.</span>
          </h1>
          <p className="text-xl text-orange-100/80 max-w-md">
            Your professional companion for real-time market data, personalized insights, and wealth growth strategies.
          </p>
        </div>
        
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
              <ArrowRight className="text-white" size={20} />
            </div>
            <p className="font-medium">Real-time Yahoo Finance Data Integration</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
              <ArrowRight className="text-white" size={20} />
            </div>
            <p className="font-medium">Personalized AI Financial Briefings</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
              <ArrowRight className="text-white" size={20} />
            </div>
            <p className="font-medium">Automated Portfolio Risk Assessment</p>
          </div>
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 lg:p-16">
        <Card className="w-full max-w-md bg-[#112240] border-white/10 text-white shadow-2xl">
          <CardHeader className="space-y-1">
            <div className="md:hidden flex items-center gap-2 mb-4">
              <Shield className="text-orange-500" size={24} />
              <span className="text-xl font-bold">ET Concierge</span>
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight">Welcome</CardTitle>
            <CardDescription className="text-slate-400">
              Sign in or create an account to start your financial journey.
            </CardDescription>
          </CardHeader>
          
          <Tabs defaultValue="login" className="w-full" onValueChange={(v) => setView(v as any)}>
            <TabsList className="grid w-full grid-cols-2 bg-[#0A192F] p-1 mb-6">
              <TabsTrigger value="login" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                Login
              </TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                Register
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-slate-500" size={18} />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-[#0A192F] border-white/10 pl-10 focus:border-orange-500 h-12"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button 
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-xs text-orange-500 hover:text-orange-400 transition-colors"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-slate-500" size={18} />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-[#0A192F] border-white/10 pl-10 focus:border-orange-500 h-12"
                      required
                    />
                  </div>
                </div>
                <Button 
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold h-12 mt-2" 
                  disabled={loading}
                >
                  {loading ? <Loader2 className="animate-spin mr-2" /> : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-slate-500" size={18} />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="bg-[#0A192F] border-white/10 pl-10 focus:border-orange-500 h-12"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-slate-500" size={18} />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-[#0A192F] border-white/10 pl-10 focus:border-orange-500 h-12"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-slate-500" size={18} />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-[#0A192F] border-white/10 pl-10 focus:border-orange-500 h-12"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                <Button 
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold h-12 mt-2" 
                  disabled={loading}
                >
                  {loading ? <Loader2 className="animate-spin mr-2" /> : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          <CardFooter className="px-0 pt-6">
            <p className="text-xs text-center w-full text-slate-500 leading-relaxed">
              By clicking continue, you agree to our <span className="text-slate-400 hover:text-white cursor-pointer underline">Terms of Service</span> and <span className="text-slate-400 hover:text-white cursor-pointer underline">Privacy Policy</span>.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
