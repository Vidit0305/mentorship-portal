import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Search, 
  Bell,
  Menu,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react";

interface Notification {
  id: string;
  type: "accepted" | "pending" | "rejected";
  message: string;
  mentor_name?: string;
  mentee_name?: string;
  avatar_url?: string;
  created_at: string;
}

interface RightSidebarProps {
  role: "mentee" | "mentor";
}

export const RightSidebar = ({ role }: RightSidebarProps) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"notifications" | "profile" | "search">("notifications");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState({ accepted: 0, pending: 0, rejected: 0 });

  useEffect(() => {
    if (open && activeTab === "notifications") {
      fetchNotifications();
    }
  }, [open, activeTab, role]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get requests based on role
      const column = role === "mentee" ? "mentee_id" : "mentor_id";
      const otherColumn = role === "mentee" ? "mentor_id" : "mentee_id";

      const { data: requests, error } = await supabase
        .from("mentorship_requests")
        .select("*")
        .eq(column, user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get profiles for the other party
      const otherIds = requests?.map(r => role === "mentee" ? r.mentor_id : r.mentee_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", otherIds);

      // Map to notifications
      const notifs: Notification[] = requests?.map(req => {
        const otherProfile = profiles?.find(p => p.user_id === (role === "mentee" ? req.mentor_id : req.mentee_id));
        const otherName = otherProfile?.full_name || "Unknown";
        
        return {
          id: req.id,
          type: req.status as "accepted" | "pending" | "rejected",
          message: role === "mentee"
            ? `Request to ${otherName}`
            : `Request from ${otherName}`,
          mentor_name: role === "mentee" ? otherName : undefined,
          mentee_name: role === "mentor" ? otherName : undefined,
          avatar_url: otherProfile?.avatar_url || undefined,
          created_at: req.created_at,
        };
      }) || [];

      setNotifications(notifs);
      setCounts({
        accepted: notifs.filter(n => n.type === "accepted").length,
        pending: notifs.filter(n => n.type === "pending").length,
        rejected: notifs.filter(n => n.type === "rejected").length,
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <CheckCircle className="w-4 h-4 text-success" />;
      case "pending":
        return <Clock className="w-4 h-4 text-warning" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return <Badge className="bg-success/20 text-success border-success/30 hover:bg-success/30">Accepted</Badge>;
      case "pending":
        return <Badge className="bg-warning/20 text-warning border-warning/30 hover:bg-warning/30">Pending</Badge>;
      case "rejected":
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30 hover:bg-destructive/30">Rejected</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const filterNotifications = (status: "accepted" | "pending" | "rejected") => {
    return notifications.filter(n => n.type === status);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed right-4 top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-full shadow-medium hidden md:flex"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[340px] sm:w-[400px] p-0">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle className="font-serif text-xl">Quick Menu</SheetTitle>
        </SheetHeader>

        {/* Action Buttons */}
        <div className="flex gap-2 p-4 border-b border-border">
          <Button
            variant={activeTab === "profile" ? "default" : "outline"}
            className="flex-1"
            onClick={() => {
              setOpen(false);
              navigate(role === "mentee" ? "/mentee-dashboard" : "/mentor-dashboard");
            }}
          >
            <User className="w-4 h-4 mr-2" /> Profile
          </Button>
          <Button
            variant={activeTab === "search" ? "default" : "outline"}
            className="flex-1"
            onClick={() => {
              setOpen(false);
              if (role === "mentee") {
                navigate("/find-mentors");
              }
            }}
          >
            <Search className="w-4 h-4 mr-2" /> Search
          </Button>
          <Button
            variant={activeTab === "notifications" ? "default" : "outline"}
            className="flex-1 relative"
            onClick={() => setActiveTab("notifications")}
          >
            <Bell className="w-4 h-4 mr-2" /> 
            {counts.pending > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-warning text-warning-foreground text-xs rounded-full flex items-center justify-center">
                {counts.pending}
              </span>
            )}
          </Button>
        </div>

        {/* Notifications Content */}
        <div className="p-4">
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="accepted" className="text-xs">
                <span className="w-2 h-2 rounded-full bg-success mr-1.5" />
                Accepted ({counts.accepted})
              </TabsTrigger>
              <TabsTrigger value="pending" className="text-xs">
                <span className="w-2 h-2 rounded-full bg-warning mr-1.5" />
                Pending ({counts.pending})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="text-xs">
                <span className="w-2 h-2 rounded-full bg-destructive mr-1.5" />
                Rejected ({counts.rejected})
              </TabsTrigger>
            </TabsList>

            {["accepted", "pending", "rejected"].map((status) => (
              <TabsContent key={status} value={status} className="mt-4">
                <ScrollArea className="h-[calc(100vh-280px)]">
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading...
                    </div>
                  ) : filterNotifications(status as "accepted" | "pending" | "rejected").length === 0 ? (
                    <div className="text-center py-8">
                      <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                      <p className="text-muted-foreground text-sm">
                        No {status} requests
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filterNotifications(status as "accepted" | "pending" | "rejected").map((notif) => (
                        <div
                          key={notif.id}
                          className="flex items-start gap-3 p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors"
                        >
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={notif.avatar_url || ""} />
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              <User className="w-5 h-5" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {notif.message}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {getStatusBadge(notif.type)}
                              <span className="text-xs text-muted-foreground">
                                {formatDate(notif.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
};
