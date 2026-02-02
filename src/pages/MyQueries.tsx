import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { 
  ArrowLeft,
  MessageSquare,
  CheckCircle,
  Clock,
  User,
  LogOut
} from "lucide-react";
import { User as SupabaseUser } from "@supabase/supabase-js";

interface Query {
  id: string;
  mentor_id: string;
  query_description: string;
  domain_guidance: string;
  expected_outcome: string;
  mentor_reply: string | null;
  replied_at: string | null;
  created_at: string;
  mentor_profile?: {
    full_name: string | null;
  } | null;
}

const MyQueries = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);

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
        fetchQueries(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchQueries = async (userId: string) => {
    try {
      const { data: queriesData, error } = await supabase
        .from("mentee_queries")
        .select("*")
        .eq("mentee_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch mentor profiles
      const mentorIds = queriesData?.map(q => q.mentor_id) || [];
      if (mentorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", mentorIds);

        const queriesWithProfiles = queriesData?.map(q => ({
          ...q,
          mentor_profile: profiles?.find(p => p.user_id === q.mentor_id) || null,
        })) || [];

        setQueries(queriesWithProfiles);
      } else {
        setQueries([]);
      }
    } catch (error) {
      console.error("Error fetching queries:", error);
      toast({
        title: "Oops!",
        description: "Failed to load your queries. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("my_queries_updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "mentee_queries",
          filter: `mentee_id=eq.${user.id}`,
        },
        () => {
          fetchQueries(user.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

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
        <div className="animate-pulse text-muted-foreground">Loading queries...</div>
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
              <Button variant="ghost" size="icon" onClick={() => navigate("/mentee-dashboard")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <Link to="/" className="flex flex-col items-center">
                <h1 className="text-lg font-semibold text-foreground" style={{ fontFamily: "Georgia, serif" }}>
                  IILM UNIVERSITY
                </h1>
                <span className="text-xs text-primary font-medium italic">Mentorship Portal</span>
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
              My Queries
            </h2>
            <p className="text-muted-foreground">
              View all your submitted queries and mentor replies.
            </p>
          </div>

          {queries.length === 0 ? (
            <div className="text-center py-16">
              <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="font-serif text-xl text-foreground mb-2">No Queries Yet</h3>
              <p className="text-muted-foreground mb-4">
                You haven't submitted any queries yet.
              </p>
              <Button onClick={() => navigate("/find-mentors")}>
                Find Mentors
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {queries.map((query) => (
                <Card key={query.id} className="glass-card overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          To: {query.mentor_profile?.full_name || "Mentor"}
                        </span>
                      </div>
                      {query.mentor_reply ? (
                        <Badge className="bg-success/20 text-success border-success/30 gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Replied
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <Clock className="w-3 h-3" />
                          Pending
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Submitted on {formatDate(query.created_at)}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                        Domain
                      </p>
                      <p className="text-sm text-foreground">{query.domain_guidance}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                        Query
                      </p>
                      <p className="text-sm text-foreground">{query.query_description}</p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                        Expected Outcome
                      </p>
                      <p className="text-sm text-foreground">{query.expected_outcome}</p>
                    </div>

                    {query.mentor_reply && (
                      <div className="bg-success/5 border border-success/20 rounded-lg p-4">
                        <p className="text-xs uppercase tracking-wider text-success mb-1">
                          Mentor's Reply
                        </p>
                        <p className="text-sm text-foreground">{query.mentor_reply}</p>
                        {query.replied_at && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Replied on {formatDate(query.replied_at)}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <MobileBottomNav role="mentee" />
      <DashboardSidebar role="mentee" />
    </div>
  );
};

export default MyQueries;
