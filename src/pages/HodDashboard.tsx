import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  User, LogOut, Users, GraduationCap, BookOpen, Search, Loader2, Layers,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import iilmLogo from "@/assets/iilm-logo.png";

interface UserProfile {
  user_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: string;
}

const HodDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [mentors, setMentors] = useState<UserProfile[]>([]);
  const [mentees, setMentees] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({
    totalMentors: 0, totalMentees: 0, totalRequests: 0, totalQueries: 0,
  });

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) {
        navigate("/auth?role=hod");
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      const isHod = roles?.some(r => r.role === "hod");
      if (!isHod) {
        await supabase.auth.signOut();
        navigate("/");
        toast({ title: "Access Denied", description: "You don't have HOD privileges.", variant: "destructive" });
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", session.user.id)
        .single();

      setFullName(profile?.full_name || "");
      await fetchData();
      setLoading(false);
    });
  }, [navigate, toast]);

  const fetchData = async () => {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, email, avatar_url, role");

    if (profiles) {
      setMentors(profiles.filter(p => p.role === "mentor"));
      setMentees(profiles.filter(p => p.role === "mentee"));
      setStats(prev => ({
        ...prev,
        totalMentors: profiles.filter(p => p.role === "mentor").length,
        totalMentees: profiles.filter(p => p.role === "mentee").length,
      }));
    }

    const { count: reqCount } = await supabase
      .from("mentorship_requests")
      .select("*", { count: "exact", head: true });

    const { count: queryCount } = await supabase
      .from("mentee_queries")
      .select("*", { count: "exact", head: true });

    setStats(prev => ({
      ...prev,
      totalRequests: reqCount || 0,
      totalQueries: queryCount || 0,
    }));
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const filterUsers = (users: UserProfile[]) =>
    users.filter(u =>
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const UserTable = ({ users }: { users: UserProfile[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map(u => (
          <TableRow key={u.user_id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={u.avatar_url || ""} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{u.full_name || "—"}</span>
              </div>
            </TableCell>
            <TableCell className="text-muted-foreground">{u.email}</TableCell>
            <TableCell>
              <Badge variant="outline" className="capitalize">{u.role}</Badge>
            </TableCell>
          </TableRow>
        ))}
        {users.length === 0 && (
          <TableRow>
            <TableCell colSpan={3} className="text-center text-muted-foreground py-8">No users found</TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate("/")} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <img src={iilmLogo} alt="IILM University" className="h-10 md:h-12 w-auto" />
              <div className="flex flex-col items-start">
                <h1 className="text-lg md:text-xl font-semibold text-foreground" style={{ fontFamily: "Georgia, serif" }}>IILM UNIVERSITY</h1>
                <span className="text-xs text-primary font-medium italic">HOD Portal</span>
              </div>
            </button>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="hidden md:flex items-center gap-1 bg-primary/10 text-primary border-primary/30">
                <Layers className="w-3 h-3" /> HOD
              </Badge>
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={handleSignOut}><LogOut className="w-5 h-5" /></Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="font-serif text-3xl font-semibold text-foreground mb-2">
              Welcome{fullName ? `, ${fullName}` : ""}! 📋
            </h2>
            <p className="text-muted-foreground">Monitor mentors and mentees under your department.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: GraduationCap, label: "Mentors", value: stats.totalMentors },
              { icon: Users, label: "Mentees", value: stats.totalMentees },
              { icon: BookOpen, label: "Requests", value: stats.totalRequests },
              { icon: Layers, label: "Queries", value: stats.totalQueries },
            ].map((stat, i) => (
              <Card key={i} className="stat-card">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input placeholder="Search users..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 h-12" />
          </div>

          <Tabs defaultValue="mentors" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="mentors" className="gap-2"><GraduationCap className="w-4 h-4" /> Mentors ({filterUsers(mentors).length})</TabsTrigger>
              <TabsTrigger value="mentees" className="gap-2"><Users className="w-4 h-4" /> Mentees ({filterUsers(mentees).length})</TabsTrigger>
            </TabsList>
            <TabsContent value="mentors">
              <Card className="glass-card"><CardHeader><CardTitle className="font-serif">Mentors</CardTitle></CardHeader><CardContent><UserTable users={filterUsers(mentors)} /></CardContent></Card>
            </TabsContent>
            <TabsContent value="mentees">
              <Card className="glass-card"><CardHeader><CardTitle className="font-serif">Mentees</CardTitle></CardHeader><CardContent><UserTable users={filterUsers(mentees)} /></CardContent></Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default HodDashboard;
