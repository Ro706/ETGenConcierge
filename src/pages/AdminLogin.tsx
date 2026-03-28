import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Login Error Details:", error);
        throw error;
      }

      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('user_id', data.user.id)
          .single();

        if (profileError || !profile?.is_admin) {
          await supabase.auth.signOut();
          toast.error("Access Denied: You do not have admin privileges.");
          return;
        }

        toast.success("Welcome back, Admin!");
        navigate("/admin");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to login");
    } finally {
      setLoading(false);
    }
  };

  const handleDirectEntry = () => {
    setEmail("ETadminAi@gmail.com");
    setPassword("Admin123");
    toast.info("Credentials pre-filled. Please click 'Login to Dashboard'.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A192F] px-4">
      <Card className="w-full max-w-md bg-[#112240] border-white/10 text-white shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="text-orange-500" size={24} />
          </div>
          <CardTitle className="text-2xl font-bold">Admin Portal</CardTitle>
          <CardDescription className="text-slate-400">
            Secure login for ET Concierge Administrators
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-[#0A192F] border-white/10 text-white focus:border-orange-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-[#0A192F] border-white/10 text-white focus:border-orange-500"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold h-11"
            >
              {loading ? "Authenticating..." : "Login to Dashboard"}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleDirectEntry}
              className="w-full border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
            >
              Direct Entry
            </Button>

            <div className="w-full border-t border-white/5 pt-4">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="w-full text-sm text-slate-400 hover:text-white flex items-center justify-center gap-1 transition-colors mt-2"
              >
                <ArrowLeft size={14} /> Back to Public Site
              </button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default AdminLogin;
