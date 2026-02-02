import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/components/ThemeProvider";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Search, 
  Bell,
  Menu,
  CheckCircle,
  Clock,
  XCircle,
  LogOut,
  Moon,
  Sun,
  Home,
  Info,
  MessageSquare,
  ChevronLeft
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

interface DashboardSidebarProps {
  role: "mentee" | "mentor";
}

export const DashboardSidebar = ({ role }: DashboardSidebarProps) => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"notifications" | "menu">("menu");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState({ accepted: 0, pending: 0, rejected: 0 });

  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

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

      const column = role === "mentee" ? "mentee_id" : "mentor_id";

      const { data: requests, error } = await supabase
        .from("mentorship_requests")
        .select("*")
        .eq(column, user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const otherIds = requests?.map(r => role === "mentee" ? r.mentor_id : r.mentee_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", otherIds);

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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const menuItems = [
    { icon: Home, label: "Home", onClick: () => { setOpen(false); navigate(role === "mentee" ? "/mentee-dashboard" : "/mentor-dashboard"); } },
    { icon: Search, label: "Search", onClick: () => { setOpen(false); role === "mentee" && navigate("/find-mentors"); } },
    { icon: Bell, label: "Notifications", onClick: () => setActiveTab("notifications") },
  ];

  const bottomMenuItems = [
    { icon: Info, label: "About", onClick: () => {} },
    { icon: MessageSquare, label: "Send Feedback", onClick: () => {} },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed right-4 top-4 z-40 w-10 h-10 rounded-lg shadow-md hover-lift hidden md:flex"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[300px] p-0 flex flex-col">
        <SheetHeader className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-display text-xl">WorthIt?</SheetTitle>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </SheetHeader>

        {activeTab === "menu" ? (
          <div className="flex flex-col h-full">
            {/* Main Menu Items */}
            <div className="p-2 space-y-1">
              {menuItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={item.onClick}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-foreground hover:bg-accent transition-colors text-left"
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                  {item.label === "Notifications" && counts.pending > 0 && (
                    <Badge variant="destructive" className="ml-auto text-xs">
                      {counts.pending}
                    </Badge>
                  )}
                </button>
              ))}
            </div>

            <div className="flex-1" />

            {/* Bottom Section */}
            <div className="p-2 border-t border-border space-y-1">
              {bottomMenuItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={item.onClick}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors text-left"
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              ))}

              {/* Dark Mode Toggle */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3 text-muted-foreground">
                  {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                  <span>Dark Mode</span>
                </div>
                <Switch
                  checked={isDark}
                  onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                />
              </div>

              <Separator className="my-2" />

              {/* Sign Out */}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors text-left"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Back button */}
            <button
              onClick={() => setActiveTab("menu")}
              className="flex items-center gap-2 px-4 py-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to menu</span>
            </button>

            {/* Notifications */}
            <Tabs defaultValue="pending" className="flex-1 px-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="accepted" className="text-xs">
                  <span className="w-2 h-2 rounded-full bg-success mr-1.5" />
                  ({counts.accepted})
                </TabsTrigger>
                <TabsTrigger value="pending" className="text-xs">
                  <span className="w-2 h-2 rounded-full bg-warning mr-1.5" />
                  ({counts.pending})
                </TabsTrigger>
                <TabsTrigger value="rejected" className="text-xs">
                  <span className="w-2 h-2 rounded-full bg-destructive mr-1.5" />
                  ({counts.rejected})
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
        )}
      </SheetContent>
    </Sheet>
  );
};
