import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpType, setOtpType] = useState<'signup' | 'recovery'>('signup');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      setLoading(false);
      toast({ title: 'Login failed', description: error.message, variant: 'destructive' });
      return;
    }

    if (data.user) {
      // Check if user is admin via profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('user_id', data.user.id)
        .single();

      setLoading(false);
      
      if (profile?.is_admin) {
        navigate('/admin');
      } else {
        const p = localStorage.getItem('et_profile');
        if (p) {
          navigate('/dashboard');
        } else {
          navigate('/onboarding');
        }
      }
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: 'Signup failed', description: error.message, variant: 'destructive' });
    } else {
      setOtpType('signup');
      setShowOtpInput(true);
      toast({ title: 'Check your email!', description: 'We have sent you a confirmation link to verify your account.' });
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      toast({ title: 'Invalid OTP', description: 'Please enter a valid 6-digit code.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: otpType,
    });
    setLoading(false);
    if (error) {
      toast({ title: 'Verification failed', description: error.message, variant: 'destructive' });
    } else {
      if (otpType === 'recovery') {
        toast({ title: 'OTP Verified', description: 'Now you can reset your password.' });
        navigate('/reset-password');
      } else {
        toast({ title: 'Account verified!', description: 'Welcome to ET Concierge.' });
        navigate('/onboarding');
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({ title: 'Enter your email', description: 'Please enter your email address first.', variant: 'destructive' });
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
        title: 'Check your email!', 
        description: 'We have sent a password reset link to your email address.' 
      });
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/reset-password');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleResendEmail = async () => {
    if (!email) {
      toast({ title: 'Enter your email', description: 'Please enter your email address first.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    
    // Recovery (forgot password) doesn't use .resend(), it just calls the initial method again
    const { error } = otpType === 'signup' 
      ? await supabase.auth.resend({ type: 'signup', email })
      : await supabase.auth.resetPasswordForEmail(email);

    setLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Email resent', description: 'A new verification link has been sent to your email.' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A1628] px-4 relative">
      {showOtpInput && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0A1628]/95 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-md bg-[#112236] border-white/10 text-[#F0F4FF] shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
                Confirm Your <span className="text-[#FF6B35]">Email</span>
              </CardTitle>
              <CardDescription className="text-[#8A9BB5]">
                We have sent a verification link to <strong>{email}</strong>. Please check your inbox and click the link to continue.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="bg-[#0A1628] p-6 rounded-lg border border-white/5 text-center">
                <p className="text-[#8A9BB5]">If you don't see the email, please check your spam folder.</p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button
                type="button"
                onClick={() => setShowOtpInput(false)}
                className="w-full bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white h-12 font-bold"
              >
                Back to Login
              </Button>
              <div className="flex justify-center w-full mt-2">
                <button
                  type="button"
                  onClick={handleResendEmail}
                  className="text-sm text-[#FFB347] hover:underline"
                >
                  Resend verification email
                </button>
              </div>
            </CardFooter>
          </Card>
        </div>
      )}

      <Card className="w-full max-w-md bg-[#112236] border-white/10 text-[#F0F4FF]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
            <span className="text-[#FF6B35]">ET</span> Concierge
          </CardTitle>
          <CardDescription className="text-[#8A9BB5]">
            Your personal guide to everything ET
          </CardDescription>
        </CardHeader>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-[#0A1628]">
            <TabsTrigger value="login" className="data-[state=active]:bg-[#FF6B35] data-[state=active]:text-white">
              Login
            </TabsTrigger>
            <TabsTrigger value="signup" className="data-[state=active]:bg-[#FF6B35] data-[state=active]:text-white">
              Sign Up
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-[#8A9BB5]">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-[#0A1628] border-white/10 text-[#F0F4FF] focus:border-[#FF6B35]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-[#8A9BB5]">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-[#0A1628] border-white/10 text-[#F0F4FF] focus:border-[#FF6B35]"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white"
                >
                  {loading ? 'Logging in...' : 'Login'}
                </Button>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-[#FFB347] hover:underline"
                >
                  Forgot password?
                </button>
              </CardFooter>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignup}>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-[#8A9BB5]">Display Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className="bg-[#0A1628] border-white/10 text-[#F0F4FF] focus:border-[#FF6B35]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-[#8A9BB5]">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-[#0A1628] border-white/10 text-[#F0F4FF] focus:border-[#FF6B35]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-[#8A9BB5]">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="bg-[#0A1628] border-white/10 text-[#F0F4FF] focus:border-[#FF6B35]"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white"
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
                <button
                  type="button"
                  onClick={handleResendEmail}
                  className="text-sm text-[#FFB347] hover:underline"
                >
                  Resend verification email?
                </button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Auth;
