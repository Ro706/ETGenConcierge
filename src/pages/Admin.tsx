import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Edit2, Save, X, ArrowLeft, BarChart3, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from "recharts";

interface Service {
  id: string;
  title: string;
  description: string;
  match_goals: string[];
  is_featured: boolean;
  views_count?: number;
}

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  match_sectors: string[];
  registrations_count?: number;
}

const Admin = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<{type: 'services' | 'events', id: string, data: any} | null>(null);

  // New Service Form
  const [newService, setNewService] = useState({ title: "", description: "", match_goals: "", is_featured: false });
  // New Event Form
  const [newEvent, setNewEvent] = useState({ title: "", description: "", event_date: "", match_sectors: "" });

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        // Check for emergency bypass session
        const isEmergencyAdmin = localStorage.getItem("et_admin_mock_session") !== null;
        if (isEmergencyAdmin) {
          fetchData();
          return;
        }

        const checkAdmin = async () => {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('user_id', user.id)
            .single();

          if (error || !profile?.is_admin) {
            toast.error("Access Denied: Admin privileges required.");
            navigate("/dashboard");
            return;
          }
          fetchData();
        };
        checkAdmin();
      } else {
        navigate("/auth");
      }
    }
  }, [user, authLoading]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: sData, error: sError } = await supabase.from("services").select("*").order("created_at", { ascending: false });
      const { data: eData, error: eError } = await supabase.from("events").select("*").order("created_at", { ascending: false });
      const { data: rData } = await supabase.from("event_registrations").select("event_id");
      
      if (sError?.message.includes("schema cache") || eError?.message.includes("schema cache")) {
        console.error("Schema Cache Error detected");
        toast.error("Database Tables Missing: Please run the SQL migration in Supabase SQL Editor.", {
          duration: 10000,
          action: {
            label: "View SQL",
            onClick: () => window.open("https://supabase.com/dashboard/project/_/sql", "_blank")
          }
        });
      }

      if (sData) setServices(sData);
      if (eData) {
        const eventsWithCounts = eData.map(e => ({
          ...e,
          registrations_count: rData?.filter(r => r.event_id === e.id).length || 0
        }));
        setEvents(eventsWithCounts);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async () => {
    if (!editingItem) return;
    const { type, id, data } = editingItem;
    
    let updateData = { ...data };
    if (type === 'services' && typeof data.match_goals === 'string') {
      updateData.match_goals = data.match_goals.split(",").map((g: string) => g.trim()).filter(Boolean);
    }
    if (type === 'events' && typeof data.match_sectors === 'string') {
      updateData.match_sectors = data.match_sectors.split(",").map((s: string) => s.trim()).filter(Boolean);
    }

    const { error } = await supabase.from(type).update(updateData).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Updated successfully!");
      setEditingItem(null);
      fetchData();
    }
  };

  const addService = async () => {
    if (!newService.title || !newService.description) {
      toast.error("Please fill in title and description");
      return;
    }
    
    const goalsArray = newService.match_goals.split(",").map(g => g.trim()).filter(Boolean);
    
    const { error } = await supabase.from("services").insert([{
      title: newService.title,
      description: newService.description,
      match_goals: goalsArray,
      is_featured: newService.is_featured
    }]);

    if (error) {
      console.error("Supabase Error:", error);
      toast.error(error.message);
    } else {
      toast.success("Service added!");
      setNewService({ title: "", description: "", match_goals: "", is_featured: false });
      fetchData();
    }
  };

  const addEvent = async () => {
    if (!newEvent.title || !newEvent.description) return;
    const { error } = await supabase.from("events").insert([{
      title: newEvent.title,
      description: newEvent.description,
      event_date: newEvent.event_date,
      match_sectors: newEvent.match_sectors.split(",").map(s => s.trim()).filter(Boolean)
    }]);
    if (error) toast.error(error.message);
    else {
      toast.success("Event added!");
      setNewEvent({ title: "", description: "", event_date: "", match_sectors: "" });
      fetchData();
    }
  };

  const seedData = async () => {
    setLoading(true);
    try {
      const servicesToSeed = [
        {
          title: 'Tax Shield Optimizer', 
          description: 'A comprehensive review of your income structure to maximize 80C, 80D, and HRA benefits. Perfect for end-of-year planning.', 
          match_goals: ['Save Taxes', 'Plan Retirement'], 
          is_featured: true, 
          views_count: 145
        },
        {
          title: 'Global Market Access', 
          description: 'Diversify your portfolio by investing in US Tech giants and Global ETFs. We handle the LRS documentation and compliance for you.', 
          match_goals: ['Grow Wealth', 'Investor'], 
          is_featured: true, 
          views_count: 89
        },
        {
          title: 'Student Wealth Kickstart', 
          description: 'Specially designed for young earners. Start your investment journey with small SIPs and learn about compound interest early.', 
          match_goals: ['Grow Wealth', 'Build Emergency Fund', 'Student'], 
          is_featured: false, 
          views_count: 210
        },
        {
          title: 'SME Compliance Desk', 
          description: 'End-to-end GST filing, corporate tax planning, and government subsidy advisory for small and medium business owners.', 
          match_goals: ['Business Owner'], 
          is_featured: true, 
          views_count: 56
        },
        {
          title: 'Estate & Will Planning', 
          description: 'Professional legal assistance to draft your will and plan the smooth transition of your assets to the next generation.', 
          match_goals: ['Plan Retirement', 'Grow Wealth'], 
          is_featured: false, 
          views_count: 34
        }
      ];

      const eventsToSeed = [
        {
          title: 'The Post-Budget Masterclass', 
          description: 'A deep-dive analysis of the new Union Budget. Understand how changes in capital gains tax and income slabs affect your wallet.', 
          event_date: '15th July 2026', 
          match_sectors: ['Economy & Policy', 'Banking & Finance']
        },
        {
          title: 'IPO Deep-Dive: Tech Unicorns', 
          description: 'A technical breakdown of upcoming high-profile IPOs. Analyzing the DRHP to help you decide whether to subscribe or avoid.', 
          event_date: '22nd July 2026', 
          match_sectors: ['Markets & Trading', 'Tech & Startups']
        },
        {
          title: 'Founders & Funders Networking', 
          description: 'An exclusive mixer for startup founders to pitch to leading Angel Investors and Venture Capitalists in a private setting.', 
          event_date: '5th August 2026', 
          match_sectors: ['Tech & Startups', 'Business Owner']
        }
      ];

      const { error: sError } = await supabase.from("services").insert(servicesToSeed);
      const { error: eError } = await supabase.from("events").insert(eventsToSeed);

      if (sError || eError) {
        toast.error("Error seeding data. Make sure tables exist.");
      } else {
        toast.success("Database seeded with professional data!");
        fetchData();
      }
    } catch (err) {
      toast.error("Failed to seed data");
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (table: "services" | "events", id: string) => {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Item deleted");
      fetchData();
    }
  };

  const toggleFeatured = async (id: string, current: boolean) => {
    const { error } = await supabase.from("services").update({ is_featured: !current }).eq("id", id);
    if (error) toast.error(error.message);
    else fetchData();
  };

  return (
    <div className="min-h-screen bg-[#0A192F] text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Button variant="ghost" className="mb-4 text-slate-400 hover:text-white" onClick={() => navigate("/dashboard")}>
              <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-slate-400">Manage Services, Events, and Featured Content</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={seedData} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              disabled={loading}
            >
              {loading ? "Seeding..." : "Seed Professional Data"}
            </Button>
            <Button 
              onClick={() => {
                signOut();
                navigate("/auth");
              }} 
              variant="outline"
              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
            >
              Logout
            </Button>
          </div>
        </div>

        <Tabs defaultValue="stats" className="space-y-6">
          <TabsList className="bg-[#112240] border border-white/5">
            <TabsTrigger value="stats"><BarChart3 size={16} className="mr-2" /> Stats</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-[#112240] border-white/5 text-white">
                <CardHeader className="pb-2">
                  <CardDescription className="text-slate-400">Total Service Views</CardDescription>
                  <CardTitle className="text-3xl font-bold flex items-center">
                    <TrendingUp className="text-emerald-500 mr-2" />
                    {services.reduce((acc, s) => acc + (s.views_count || 0), 0)}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="bg-[#112240] border-white/5 text-white">
                <CardHeader className="pb-2">
                  <CardDescription className="text-slate-400">Total Event Registrations</CardDescription>
                  <CardTitle className="text-3xl font-bold flex items-center">
                    <Users className="text-blue-500 mr-2" />
                    {events.reduce((acc, e) => acc + (e.registrations_count || 0), 0)}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-[#112240] border-white/5 text-white">
                <CardHeader>
                  <CardTitle>Service Engagement</CardTitle>
                  <CardDescription>Views per service</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={services}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="title" hide />
                      <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#112240', border: '1px solid rgba(255,255,255,0.1)' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Bar dataKey="views_count" fill="#F97316" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-[#112240] border-white/5 text-white">
                <CardHeader>
                  <CardTitle>Event Popularity</CardTitle>
                  <CardDescription>Registrations per event</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={events}
                        dataKey="registrations_count"
                        nameKey="title"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({title}) => title}
                      >
                        {events.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#F97316', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'][index % 5]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#112240', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="services" className="space-y-6">
            <Card className="bg-[#112240] border-white/5 text-white">
              <CardHeader>
                <CardTitle>Add New Service</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input 
                  placeholder="Service Title" 
                  className="bg-white/5 border-white/10 text-white"
                  value={newService.title}
                  onChange={e => setNewService({...newService, title: e.target.value})}
                />
                <Textarea 
                  placeholder="Description" 
                  className="bg-white/5 border-white/10 text-white"
                  value={newService.description}
                  onChange={e => setNewService({...newService, description: e.target.value})}
                />
                <Input 
                  placeholder="Match Goals (comma separated, e.g. Grow Wealth, Save Tax)" 
                  className="bg-white/5 border-white/10 text-white"
                  value={newService.match_goals}
                  onChange={e => setNewService({...newService, match_goals: e.target.value})}
                />
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="featured" 
                    checked={newService.is_featured} 
                    onChange={e => setNewService({...newService, is_featured: e.target.checked})}
                  />
                  <label htmlFor="featured">Feature on Dashboard (Top 3)</label>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={addService} className="bg-orange-500 hover:bg-orange-600">Add Service</Button>
              </CardFooter>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map(s => (
                <Card key={s.id} className="bg-[#112240] border-white/5 text-white relative group">
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setEditingItem({type: 'services', id: s.id, data: { ...s, match_goals: s.match_goals.join(", ") }})}
                      className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => deleteItem("services", s.id)}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <CardHeader>
                    <div className="flex justify-between items-start pr-12">
                      <CardTitle className="text-lg">{s.title}</CardTitle>
                      {s.is_featured && <span className="bg-orange-500 text-[10px] px-2 py-0.5 rounded font-bold">FEATURED</span>}
                    </div>
                    <div className="flex items-center text-[10px] text-slate-400 mt-1">
                      <TrendingUp size={10} className="mr-1" /> {s.views_count || 0} views
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-400 mb-4 line-clamp-3">{s.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {s.match_goals.map(g => (
                        <span key={g} className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-slate-400">{g}</span>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full border-white/10 text-white hover:bg-white/5"
                      onClick={() => toggleFeatured(s.id, s.is_featured)}
                    >
                      {s.is_featured ? "Remove from Top 3" : "Make Top 3"}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <Card className="bg-[#112240] border-white/5 text-white">
              <CardHeader>
                <CardTitle>Add New Event</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input 
                  placeholder="Event Title" 
                  className="bg-white/5 border-white/10 text-white"
                  value={newEvent.title}
                  onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                />
                <Textarea 
                  placeholder="Description" 
                  className="bg-white/5 border-white/10 text-white"
                  value={newEvent.description}
                  onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                />
                <Input 
                  placeholder="Date (e.g. 15th April 2026)" 
                  className="bg-white/5 border-white/10 text-white"
                  value={newEvent.event_date}
                  onChange={e => setNewEvent({...newEvent, event_date: e.target.value})}
                />
                <Input 
                  placeholder="Match Sectors (comma separated, e.g. Tech, Finance)" 
                  className="bg-white/5 border-white/10 text-white"
                  value={newEvent.match_sectors}
                  onChange={e => setNewEvent({...newEvent, match_sectors: e.target.value})}
                />
              </CardContent>
              <CardFooter>
                <Button onClick={addEvent} className="bg-orange-500 hover:bg-orange-600">Add Event</Button>
              </CardFooter>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map(e => (
                <Card key={e.id} className="bg-[#112240] border-white/5 text-white relative group">
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setEditingItem({type: 'events', id: e.id, data: { ...e, match_sectors: e.match_sectors.join(", ") }})}
                      className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => deleteItem("events", e.id)}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg pr-12">{e.title}</CardTitle>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-orange-500 font-bold">{e.event_date}</p>
                      <div className="flex items-center text-[10px] text-slate-400">
                        <Users size={10} className="mr-1" /> {e.registrations_count || 0} registered
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-400 mb-4 line-clamp-3">{e.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {e.match_sectors.map(s => (
                        <span key={s} className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-slate-400">{s}</span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg bg-[#112240] border-white/10 text-white shadow-2xl animate-in zoom-in duration-200">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Edit {editingItem.type === 'services' ? 'Service' : 'Event'}</CardTitle>
                <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Title</label>
                <Input 
                  className="bg-white/5 border-white/10 text-white"
                  value={editingItem.data.title}
                  onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, title: e.target.value }})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
                <Textarea 
                  className="bg-white/5 border-white/10 text-white h-32"
                  value={editingItem.data.description}
                  onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, description: e.target.value }})}
                />
              </div>
              {editingItem.type === 'services' ? (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Match Goals (comma separated)</label>
                  <Input 
                    className="bg-white/5 border-white/10 text-white"
                    value={editingItem.data.match_goals}
                    onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, match_goals: e.target.value }})}
                  />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Event Date</label>
                    <Input 
                      className="bg-white/5 border-white/10 text-white"
                      value={editingItem.data.event_date}
                      onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, event_date: e.target.value }})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Match Sectors (comma separated)</label>
                    <Input 
                      className="bg-white/5 border-white/10 text-white"
                      value={editingItem.data.match_sectors}
                      onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, match_sectors: e.target.value }})}
                    />
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="flex justify-end gap-2 border-t border-white/5 pt-6">
              <Button variant="ghost" onClick={() => setEditingItem(null)}>Cancel</Button>
              <Button className="bg-orange-500 hover:bg-orange-600" onClick={updateItem}>Save Changes</Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Admin;
