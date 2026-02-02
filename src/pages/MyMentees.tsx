import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { 
  User, 
  LogOut, 
  ArrowLeft,
  Users,
  Mail
} from "lucide-react";
import { User as SupabaseUser } from "@supabase/supabase-js";

interface ConnectedMentee {
  id: string;
  mentee_id: string;
  started_at: string;
  mentee_profile: {
    full_name: string | null;
    avatar_url: string | null;
    email: string | null;
  } | null;
  mentee_details: {
    course: string | null;
    year: string | null;
    interests: string[] | null;
  } | null;
}

const MyMentees = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [mentees, setMentees] = useState<ConnectedMentee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        navigate("/auth?role=mentor");
      } else {
        setUser(session.user);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        navigate("/auth?role=mentor");
      } else {
        setUser(session.user);
        fetchConnectedMentees(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchConnectedMentees = async (userId: string) => {
    try {
      const { data: mentorships, error } = await supabase
        .from("active_mentorships")
        .select("*")
        .eq("mentor_id", userId);

      if (error) throw error;

      const menteeIds = mentorships?.map(m => m.mentee_id) || [];
      
      if (menteeIds.length === 0) {
        setMentees([]);
        setLoading(false);
        return;
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, email")
        .in("user_id", menteeIds);

      const { data: menteeProfiles } = await supabase
        .from("mentee_profiles")
        .select("user_id, course, year, interests")
        .in("user_id", menteeIds);

      const connected: ConnectedMentee[] = mentorships?.map(m => ({
        ...m,
        mentee_profile: profiles?.find(p => p.user_id === m.mentee_id) || null,
        mentee_details: menteeProfiles?.find(mp => mp.user_id === m.mentee_id) || null,
      })) || [];

      setMentees(connected);
    } catch (error) {
      console.error("Error fetching mentees:", error);
      toast({
        title: "Oops!",
        description: "Failed to load your mentees. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading mentees...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen hero-gradient flex flex-col pb-16 md:pb-0">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/mentor-dashboard")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <Link to="/" className="flex flex-col items-center">
                <h1 className="text-lg font-semibold text-foreground" style={{ fontFamily: "Georgia, serif" }}>
                  IILM UNIVERSITY
                </h1>
                <span className="text-xs text-primary italic">Mentorship Portal</span>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h2 className="font-serif text-3xl font-semibold text-foreground mb-2">
              My Mentees
            </h2>
            <p className="text-muted-foreground">
              View and manage your connected mentees.
            </p>
          </div>

          {mentees.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="font-serif text-xl text-foreground mb-2">No Mentees Yet</h3>
              <p className="text-muted-foreground mb-4">
                You haven't accepted any mentees yet.
              </p>
              <Button onClick={() => navigate("/mentor-requests")}>
                View Requests
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {mentees.map((mentee) => (
                <Card key={mentee.id} className="glass-card overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-16 h-16 border-2 border-background">
                        <AvatarImage src={mentee.mentee_profile?.avatar_url || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          <User className="w-8 h-8" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-serif text-lg font-semibold text-foreground">
                            {mentee.mentee_profile?.full_name || "Mentee"}
                          </h3>
                          <Badge className="bg-success/20 text-success border-success/30">
                            Active
                          </Badge>
                        </div>
                        
                        {mentee.mentee_profile?.email && (
                          <p className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                            <Mail className="w-4 h-4" />
                            {mentee.mentee_profile.email}
                          </p>
                        )}

                        {mentee.mentee_details?.course && (
                          <p className="text-sm text-foreground mb-2">
                            {mentee.mentee_details.course} • {mentee.mentee_details.year}
                          </p>
                        )}

                        {mentee.mentee_details?.interests && mentee.mentee_details.interests.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {mentee.mentee_details.interests.slice(0, 4).map((interest, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {interest}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        <p className="text-xs text-muted-foreground">
                          Connected since {formatDate(mentee.started_at)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <MobileBottomNav role="mentor" />
      <DashboardSidebar role="mentor" />
    </div>
  );
};

export default MyMentees;
