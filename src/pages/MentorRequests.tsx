import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";

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
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  ChevronLeft,
  Send,
  X
} from "lucide-react";
import { User as SupabaseUser } from "@supabase/supabase-js";

interface MentorshipRequest {
  id: string;
  mentee_id: string;
  mentor_id: string;
  introduction: string;
  goals: string;
  status: "pending" | "accepted" | "rejected";
  rejection_message: string | null;
  created_at: string;
}

interface Profile {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
}

interface MenteeProfile {
  user_id: string;
  course: string | null;
  year: string | null;
  interests: string[] | null;
}

const MentorRequests = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const [profiles, setProfiles] = useState<Map<string, Profile>>(new Map());
  const [menteeProfiles, setMenteeProfiles] = useState<Map<string, MenteeProfile>>(new Map());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "accepted" | "rejected">("pending");
  
  // Rejection modal
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [rejectionMessage, setRejectionMessage] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        navigate("/auth?role=mentor");
      } else {
        setUser(session.user);
        fetchRequests(session.user.id);
      }
    });
  }, [navigate]);

  const fetchRequests = async (userId: string) => {
    try {
      const { data: requestsData, error } = await supabase
        .from("mentorship_requests")
        .select("*")
        .eq("mentor_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setRequests(requestsData || []);

      // Fetch mentee profiles
      const menteeIds = requestsData?.map(r => r.mentee_id) || [];
      if (menteeIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url, email")
          .in("user_id", menteeIds);

        const profileMap = new Map<string, Profile>();
        profilesData?.forEach(p => profileMap.set(p.user_id, p));
        setProfiles(profileMap);

        const { data: menteeProfilesData } = await supabase
          .from("mentee_profiles")
          .select("user_id, course, year, interests")
          .in("user_id", menteeIds);

        const menteeMap = new Map<string, MenteeProfile>();
        menteeProfilesData?.forEach(p => menteeMap.set(p.user_id, p));
        setMenteeProfiles(menteeMap);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId: string, menteeId: string) => {
    setProcessing(true);
    try {
      // Update request status
      const { error: updateError } = await supabase
        .from("mentorship_requests")
        .update({ status: "accepted" })
        .eq("id", requestId);

      if (updateError) throw updateError;

      // Create active mentorship
      const { error: mentorshipError } = await supabase
        .from("active_mentorships")
        .insert({
          mentor_id: user?.id,
          mentee_id: menteeId,
        });

      if (mentorshipError) throw mentorshipError;

      toast({
        title: "Request accepted",
        description: "You've accepted this mentorship request.",
      });

      if (user) fetchRequests(user.id);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to accept request";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    setProcessing(true);

    try {
      const { error } = await supabase
        .from("mentorship_requests")
        .update({ 
          status: "rejected",
          rejection_message: rejectionMessage || null
        })
        .eq("id", selectedRequest);

      if (error) throw error;

      toast({
        title: "Request rejected",
        description: "You've rejected this mentorship request.",
      });

      setRejectDialogOpen(false);
      setSelectedRequest(null);
      setRejectionMessage("");
      if (user) fetchRequests(user.id);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to reject request";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const openRejectDialog = (requestId: string) => {
    setSelectedRequest(requestId);
    setRejectDialogOpen(true);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const filteredRequests = requests.filter(r => 
    filter === "all" ? true : r.status === filter
  );

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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => window.location.href = '/'} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
              <div className="flex flex-col items-center">
                <h1 className="text-lg font-semibold text-foreground font-display">
                  IILM UNIVERSITY
                </h1>
                <span className="text-xs text-primary font-medium italic">Mentorship Portal</span>
              </div>
            </button>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <DashboardSidebar role="mentor" />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-4xl mx-auto">
          {/* Page Title */}
          <div className="mb-8">
            <h2 className="font-serif text-3xl font-semibold text-foreground mb-2">
              Mentorship Requests
            </h2>
            <p className="text-muted-foreground">
              Review and manage incoming mentorship requests from students.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {[
              { value: "pending", label: "Pending", icon: Clock, color: "text-warning" },
              { value: "accepted", label: "Accepted", icon: CheckCircle, color: "text-success" },
              { value: "rejected", label: "Rejected", icon: XCircle, color: "text-destructive" },
              { value: "all", label: "All", icon: MessageSquare, color: "text-muted-foreground" },
            ].map((item) => (
              <Button
                key={item.value}
                variant={filter === item.value ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(item.value as typeof filter)}
                className="gap-2"
              >
                <item.icon className={`w-4 h-4 ${filter === item.value ? "" : item.color}`} />
                {item.label}
                <span className="ml-1 text-xs opacity-70">
                  ({requests.filter(r => item.value === "all" ? true : r.status === item.value).length})
                </span>
              </Button>
            ))}
          </div>

          {/* Requests List */}
          {filteredRequests.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-16 text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="font-serif text-lg font-semibold text-foreground mb-2">
                  No {filter === "all" ? "" : filter} requests
                </h3>
                <p className="text-muted-foreground">
                  {filter === "pending" 
                    ? "You have no pending mentorship requests."
                    : "No requests found with this filter."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => {
                const profile = profiles.get(request.mentee_id);
                const menteeProfile = menteeProfiles.get(request.mentee_id);

                return (
                  <Card key={request.id} className="glass-card hover-lift overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <Avatar className="w-14 h-14 border-2 border-border">
                          <AvatarImage src={profile?.avatar_url || ""} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            <User className="w-6 h-6" />
                          </AvatarFallback>
                        </Avatar>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h4 className="font-serif font-semibold text-foreground text-lg">
                                {profile?.full_name || "Unknown Student"}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {menteeProfile?.course} • {menteeProfile?.year}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(request.status)}
                              <span className="text-xs text-muted-foreground">
                                {formatDate(request.created_at)}
                              </span>
                            </div>
                          </div>

                          {/* Interests */}
                          {menteeProfile?.interests && menteeProfile.interests.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {menteeProfile.interests.slice(0, 3).map((interest, i) => (
                                <span key={i} className="px-2 py-0.5 bg-accent rounded text-xs text-accent-foreground">
                                  {interest}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Introduction */}
                          <div className="mt-4 p-3 bg-accent/30 rounded-lg">
                            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Introduction</p>
                            <p className="text-sm text-foreground">{request.introduction}</p>
                          </div>

                          {/* Goals */}
                          <div className="mt-3 p-3 bg-accent/30 rounded-lg">
                            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Goals</p>
                            <p className="text-sm text-foreground">{request.goals}</p>
                          </div>

                          {/* Rejection message if rejected */}
                          {request.status === "rejected" && request.rejection_message && (
                            <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                              <p className="text-xs uppercase tracking-wider text-destructive mb-1">Rejection Reason</p>
                              <p className="text-sm text-foreground">{request.rejection_message}</p>
                            </div>
                          )}

                          {/* Action Buttons */}
                          {request.status === "pending" && (
                            <div className="flex gap-3 mt-4">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleAccept(request.id, request.mentee_id)}
                                disabled={processing}
                                className="gap-2"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Accept Request
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openRejectDialog(request.id)}
                                disabled={processing}
                                className="gap-2 text-destructive hover:text-destructive"
                              >
                                <XCircle className="w-4 h-4" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Reject Request</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              You can optionally provide a reason for rejecting this request. This will be visible to the mentee.
            </p>
            <Textarea
              placeholder="Reason for rejection (optional)..."
              value={rejectionMessage}
              onChange={(e) => setRejectionMessage(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={processing}>
              <XCircle className="w-4 h-4 mr-2" />
              {processing ? "Rejecting..." : "Reject Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MentorRequests;
