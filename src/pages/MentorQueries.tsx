import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  User, 
  LogOut, 
  ArrowLeft,
  MessageSquare,
  Send,
  CheckCircle,
  Clock
} from "lucide-react";
import { User as SupabaseUser } from "@supabase/supabase-js";

interface MenteeQuery {
  id: string;
  mentee_id: string;
  full_name: string;
  email: string;
  course_program_year: string;
  university_name: string;
  mentorship_type: string;
  domain_guidance: string;
  query_description: string;
  expected_outcome: string;
  mentorship_duration: string;
  why_this_mentor: string;
  mentor_reply: string | null;
  replied_at: string | null;
  created_at: string;
  mentee_profile?: {
    avatar_url: string | null;
  } | null;
}

const MentorQueries = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [queries, setQueries] = useState<MenteeQuery[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Reply modal
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState<MenteeQuery | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
        .eq("mentor_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch mentee profiles for avatars
      const menteeIds = queriesData?.map(q => q.mentee_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, avatar_url")
        .in("user_id", menteeIds);

      const queriesWithProfiles = queriesData?.map(q => ({
        ...q,
        mentee_profile: profiles?.find(p => p.user_id === q.mentee_id) || null,
      })) || [];

      setQueries(queriesWithProfiles);
    } catch (error) {
      console.error("Error fetching queries:", error);
      toast({
        title: "Oops!",
        description: "Failed to load queries. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReply = (query: MenteeQuery) => {
    setSelectedQuery(query);
    setReplyText(query.mentor_reply || "");
    setReplyDialogOpen(true);
  };

  const handleSubmitReply = async () => {
    if (!selectedQuery || !replyText.trim()) {
      toast({
        title: "Please enter a reply",
        description: "Your reply cannot be empty.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from("mentee_queries")
        .update({
          mentor_reply: replyText,
          replied_at: new Date().toISOString(),
        })
        .eq("id", selectedQuery.id);

      if (error) throw error;

      toast({
        title: "Reply sent!",
        description: "Your response has been saved successfully.",
        duration: 5000,
      });

      setReplyDialogOpen(false);
      setSelectedQuery(null);
      setReplyText("");
      if (user) fetchQueries(user.id);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to send reply";
      toast({
        title: "Something went wrong",
        description: message,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setSubmitting(false);
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
              Mentee Queries
            </h2>
            <p className="text-muted-foreground">
              View and respond to queries from your mentees.
            </p>
          </div>

          {queries.length === 0 ? (
            <div className="text-center py-16">
              <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="font-serif text-xl text-foreground mb-2">No Queries Yet</h3>
              <p className="text-muted-foreground">
                You haven't received any queries from mentees.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {queries.map((query) => (
                <Card key={query.id} className="glass-card overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-14 h-14 border-2 border-background">
                        <AvatarImage src={query.mentee_profile?.avatar_url || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          <User className="w-7 h-7" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-serif text-lg font-semibold text-foreground">
                              {query.full_name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {query.course_program_year} • {query.university_name}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {query.mentor_reply ? (
                              <Badge className="bg-success/20 text-success border-success/30">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Replied
                              </Badge>
                            ) : (
                              <Badge className="bg-warning/20 text-warning border-warning/30">
                                <Clock className="w-3 h-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Type: </span>
                            <span className="text-foreground">{query.mentorship_type}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Domain: </span>
                            <span className="text-foreground">{query.domain_guidance}</span>
                          </div>
                        </div>

                        <div className="p-3 bg-accent/30 rounded-lg mb-3">
                          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Query</p>
                          <p className="text-sm text-foreground line-clamp-3">{query.query_description}</p>
                        </div>

                        {query.mentor_reply && (
                          <div className="p-3 bg-success/10 border border-success/20 rounded-lg mb-3">
                            <p className="text-xs uppercase tracking-wider text-success mb-1">Your Reply</p>
                            <p className="text-sm text-foreground line-clamp-2">{query.mentor_reply}</p>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            Received on {formatDate(query.created_at)}
                          </p>
                          <Button
                            size="sm"
                            onClick={() => handleOpenReply(query)}
                            className="gap-2"
                          >
                            <Send className="w-4 h-4" />
                            {query.mentor_reply ? "Edit Reply" : "Reply"}
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

      <MobileBottomNav role="mentor" />
      <DashboardSidebar role="mentor" />

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              Reply to {selectedQuery?.full_name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedQuery && (
            <div className="space-y-4">
              <div className="p-3 bg-accent/30 rounded-lg">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Original Query</p>
                <p className="text-sm text-foreground">{selectedQuery.query_description}</p>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Expected Outcome</p>
                <p className="text-sm text-foreground">{selectedQuery.expected_outcome}</p>
              </div>

              <div>
                <Textarea
                  placeholder="Write your response..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right mt-1">
                  {replyText.length} / 500 characters
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setReplyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitReply} disabled={submitting}>
              <Send className="w-4 h-4 mr-2" />
              {submitting ? "Sending..." : "Send Reply"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MentorQueries;
