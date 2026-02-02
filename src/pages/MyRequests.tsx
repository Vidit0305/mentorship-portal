import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Footer } from "@/components/Footer";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { 
  User, 
  LogOut, 
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
  MessageSquare
} from "lucide-react";
import { User as SupabaseUser } from "@supabase/supabase-js";

interface RequestWithMentor {
  id: string;
  mentor_id: string;
  introduction: string;
  goals: string;
  status: "pending" | "accepted" | "rejected";
  rejection_message: string | null;
  created_at: string;
  mentor_profile: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  mentor_details: {
    mentor_type: string;
    expertise: string[] | null;
  } | null;
}

const MyRequests = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [requests, setRequests] = useState<RequestWithMentor[]>([]);
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
        fetchRequests(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchRequests = async (userId: string) => {
    try {
      const { data: requestsData, error: requestsError } = await supabase
        .from("mentorship_requests")
        .select("*")
        .eq("mentee_id", userId)
        .order("created_at", { ascending: false });

      if (requestsError) throw requestsError;

      // Get mentor profiles
      const mentorIds = requestsData?.map(r => r.mentor_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", mentorIds);

      const { data: mentorProfiles } = await supabase
        .from("mentor_profiles")
        .select("user_id, mentor_type, expertise")
        .in("user_id", mentorIds);

      const requestsWithMentors: RequestWithMentor[] = requestsData?.map(req => ({
        ...req,
        mentor_profile: profiles?.find(p => p.user_id === req.mentor_id) || null,
        mentor_details: mentorProfiles?.find(m => m.user_id === req.mentor_id) || null,
      })) || [];

      setRequests(requestsWithMentors);
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast({
        title: "Error",
        description: "Failed to load requests",
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <CheckCircle className="w-5 h-5 text-success" />;
      case "pending":
        return <Clock className="w-5 h-5 text-warning" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return <Badge className="bg-success/20 text-success border-success/30">Accepted</Badge>;
      case "pending":
        return <Badge className="bg-warning/20 text-warning border-warning/30">Pending</Badge>;
      case "rejected":
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Rejected</Badge>;
      default:
        return null;
    }
  };

  const filterRequests = (status: "all" | "pending" | "accepted" | "rejected") => {
    if (status === "all") return requests;
    return requests.filter(r => r.status === status);
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
        <div className="animate-pulse text-muted-foreground">Loading requests...</div>
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
              <Link to="/" className="flex flex-col">
                <h1 className="text-lg font-semibold text-foreground" style={{ fontFamily: "Georgia, serif" }}>
                  IILM UNIVERSITY
                </h1>
                <span className="text-xs text-muted-foreground">Mentorship Portal</span>
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
              My Requests
            </h2>
            <p className="text-muted-foreground">
              Track the status of your mentorship requests.
            </p>
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="all">All ({requests.length})</TabsTrigger>
              <TabsTrigger value="pending" className="text-warning">
                Pending ({filterRequests("pending").length})
              </TabsTrigger>
              <TabsTrigger value="accepted" className="text-success">
                Accepted ({filterRequests("accepted").length})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="text-destructive">
                Rejected ({filterRequests("rejected").length})
              </TabsTrigger>
            </TabsList>

            {["all", "pending", "accepted", "rejected"].map((status) => (
              <TabsContent key={status} value={status}>
                {filterRequests(status as "all" | "pending" | "accepted" | "rejected").length === 0 ? (
                  <div className="text-center py-16">
                    <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="font-serif text-xl text-foreground mb-2">No Requests</h3>
                    <p className="text-muted-foreground mb-4">
                      {status === "all"
                        ? "You haven't sent any mentorship requests yet."
                        : `No ${status} requests.`}
                    </p>
                    <Button onClick={() => navigate("/find-mentors")}>
                      Find Mentors
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filterRequests(status as "all" | "pending" | "accepted" | "rejected").map((request) => (
                      <Card key={request.id} className="glass-card overflow-hidden">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <Avatar className="w-14 h-14 border-2 border-background">
                              <AvatarImage src={request.mentor_profile?.avatar_url || ""} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                <User className="w-7 h-7" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-serif text-lg font-semibold text-foreground">
                                  {request.mentor_profile?.full_name || "Mentor"}
                                </h3>
                                <div className="flex items-center gap-2">
                                  {getStatusBadge(request.status)}
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground capitalize mb-3">
                                {request.mentor_details?.mentor_type} Mentor
                              </p>
                              
                              <div className="space-y-3">
                                <div>
                                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                                    Your Introduction
                                  </p>
                                  <p className="text-sm text-foreground line-clamp-2">
                                    {request.introduction}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                                    Your Goals
                                  </p>
                                  <p className="text-sm text-foreground line-clamp-2">
                                    {request.goals}
                                  </p>
                                </div>
                                {request.status === "rejected" && request.rejection_message && (
                                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                                    <p className="text-xs uppercase tracking-wider text-destructive mb-1">
                                      Rejection Message
                                    </p>
                                    <p className="text-sm text-foreground">
                                      {request.rejection_message}
                                    </p>
                                  </div>
                                )}
                              </div>
                              
                              <p className="text-xs text-muted-foreground mt-3">
                                Sent on {formatDate(request.created_at)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </main>

      <Footer />
      <MobileBottomNav role="mentee" />
      <DashboardSidebar role="mentee" />
    </div>
  );
};

export default MyRequests;
