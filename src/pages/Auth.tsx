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
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      toast({ title: 'Login failed', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, persona_label')
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (profile?.is_admin) {
        navigate('/admin');
      } else {
        if (profile) localStorage.setItem('et_profile', JSON.stringify(profile));
        navigate('/dashboard');
      }
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
      toast({ title: 'Signup failed', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    if (data.user) {
      toast({ title: 'Success!', description: 'Your account has been created.' });
      navigate('/onboarding');
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({ title: 'Email required', description: 'Enter your email to reset your password.', variant: 'destructive' });
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
      toast({ title: 'Reset link sent', description: 'Check your inbox for the reset link.' });
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('user_id', session.user.id)
          .maybeSingle();
        
        if (profile?.is_admin) navigate('/admin');
        else navigate('/dashboard');
      } else if (event === 'PASSWORD_RECOVERY') {
        navigate('/reset-password');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0A192F]">
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
          
          <Tabs defaultValue="login" className="w-full">
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
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold h-12 mt-2" disabled={loading}>
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
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold h-12 mt-2" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin mr-2" /> : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          <CardFooter className="px-0 pt-6 border-t border-white/5 mt-4">
            <p className="text-xs text-center w-full text-slate-500 leading-relaxed">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
