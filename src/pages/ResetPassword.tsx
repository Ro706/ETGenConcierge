import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Password updated!', description: 'You can now log in with your new password.' });
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A1628] px-4">
      <Card className="w-full max-w-md bg-[#112236] border-white/10 text-[#F0F4FF]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl" style={{ fontFamily: "'Playfair Display', serif" }}>
            Reset Password
          </CardTitle>
        </CardHeader>
        <form onSubmit={handleReset}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-[#8A9BB5]">New Password</Label>
              <Input
                id="new-password"
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
          <CardFooter>
            <Button type="submit" disabled={loading} className="w-full bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white">
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default ResetPassword;
