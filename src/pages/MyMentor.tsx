import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";

import { DashboardSidebar } from "@/components/DashboardSidebar";
import { MenteeQueryForm } from "@/components/MenteeQueryForm";
import { 
  User, 
  LogOut, 
  ArrowLeft,
  MessageSquare,
  Send
} from "lucide-react";
import { User as SupabaseUser } from "@supabase/supabase-js";

interface ConnectedMentor {
  id: string;
  mentor_id: string;
  started_at: string;
  mentor_profile: {
    full_name: string | null;
    avatar_url: string | null;
    email: string | null;
  } | null;
  mentor_details: {
    mentor_type: string;
    expertise: string[] | null;
    bio: string | null;
  } | null;
}

const MyMentor = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [mentors, setMentors] = useState<ConnectedMentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [queryFormOpen, setQueryFormOpen] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        navigate("/auth?role=mentee");
      } else {
        setUser(session.user);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        navigate("/auth?role=mentee");
      } else {
        setUser(session.user);
        fetchConnectedMentors(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchConnectedMentors = async (userId: string) => {
    try {
      const { data: mentorships, error } = await supabase
        .from("active_mentorships")
        .select("*")
        .eq("mentee_id", userId);

      if (error) throw error;

      const mentorIds = mentorships?.map(m => m.mentor_id) || [];
      
      if (mentorIds.length === 0) {
        setMentors([]);
        setLoading(false);
        return;
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, email")
        .in("user_id", mentorIds);

      const { data: mentorProfiles } = await supabase
        .from("mentor_profiles")
        .select("user_id, mentor_type, expertise, bio")
        .in("user_id", mentorIds);

      const connected: ConnectedMentor[] = mentorships?.map(m => ({
        ...m,
        mentor_profile: profiles?.find(p => p.user_id === m.mentor_id) || null,
        mentor_details: mentorProfiles?.find(mp => mp.user_id === m.mentor_id) || null,
      })) || [];

      setMentors(connected);
    } catch (error) {
      console.error("Error fetching mentors:", error);
      toast({
        title: "Error",
        description: "Failed to load connected mentors",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleOpenQuery = (mentorId: string, mentorName: string) => {
    setSelectedMentor({ id: mentorId, name: mentorName });
    setQueryFormOpen(true);
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
        <div className="animate-pulse text-muted-foreground">Loading mentors...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen hero-gradient flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/mentee-dashboard")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <button onClick={() => window.location.href = '/'} className="flex flex-col hover:opacity-80 transition-opacity">
                <h1 className="text-lg font-semibold text-foreground" style={{ fontFamily: "Georgia, serif" }}>
                  IILM UNIVERSITY
                </h1>
                <span className="text-xs text-primary italic">Mentorship Portal</span>
              </button>
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
              My Mentors
            </h2>
            <p className="text-muted-foreground">
              View your connected mentors and send queries.
            </p>
          </div>

          {mentors.length === 0 ? (
            <div className="text-center py-16">
              <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="font-serif text-xl text-foreground mb-2">No Connected Mentors</h3>
              <p className="text-muted-foreground mb-4">
                You haven't been connected with any mentors yet.
              </p>
              <Button onClick={() => navigate("/find-mentors")}>
                Find Mentors
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {mentors.map((mentor) => (
                <Card key={mentor.id} className="glass-card overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-16 h-16 border-2 border-background">
                        <AvatarImage src={mentor.mentor_profile?.avatar_url || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          <User className="w-8 h-8" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-serif text-lg font-semibold text-foreground">
                            {mentor.mentor_profile?.full_name || "Mentor"}
                          </h3>
                          <Badge className="bg-success/20 text-success border-success/30 capitalize">
                            {mentor.mentor_details?.mentor_type} Mentor
                          </Badge>
                        </div>
                        
                        {mentor.mentor_profile?.email && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {mentor.mentor_profile.email}
                          </p>
                        )}

                        {mentor.mentor_details?.bio && (
                          <p className="text-sm text-foreground line-clamp-2 mb-3">
                            {mentor.mentor_details.bio}
                          </p>
                        )}

                        {mentor.mentor_details?.expertise && mentor.mentor_details.expertise.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {mentor.mentor_details.expertise.slice(0, 4).map((skill, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            Connected since {formatDate(mentor.started_at)}
                          </p>
                          <Button
                            size="sm"
                            onClick={() => handleOpenQuery(mentor.mentor_id, mentor.mentor_profile?.full_name || "Mentor")}
                            className="gap-2"
                          >
                            <Send className="w-4 h-4" />
                            Send Query
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <DashboardSidebar role="mentee" />

      {/* Query Form Modal */}
      {selectedMentor && (
        <MenteeQueryForm
          open={queryFormOpen}
          onOpenChange={setQueryFormOpen}
          mentorId={selectedMentor.id}
          mentorName={selectedMentor.name}
        />
      )}
    </div>
  );
};

export default MyMentor;
