import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { ImageCropper } from "@/components/ImageCropper";
import { PullToRefresh } from "@/components/PullToRefresh";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { 
  User, 
  LogOut, 
  Save, 
  Camera,
  Users,
  Clock,
  CheckCircle,
  Inbox,
  TrendingUp,
  Bell,
  MessageSquare
} from "lucide-react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  role: string;
}

interface MentorProfile {
  id: string;
  user_id: string;
  mentor_type: "senior" | "alumni" | "faculty";
  bio: string | null;
  expertise: string[] | null;
  areas_of_guidance: string[] | null;
  experience: string | null;
  is_available: boolean;
  max_mentees: number;
  current_mentees: number;
}

const MentorDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mentorProfile, setMentorProfile] = useState<MentorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Form state
  const [fullName, setFullName] = useState("");
  const [mentorType, setMentorType] = useState<"senior" | "alumni" | "faculty">("senior");
  const [bio, setBio] = useState("");
  const [expertise, setExpertise] = useState("");
  const [areasOfGuidance, setAreasOfGuidance] = useState("");
  const [experience, setExperience] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [maxMentees, setMaxMentees] = useState("5");

  // Image cropping
  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Stats
  const [currentMentees, setCurrentMentees] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);

  // Chart data
  const chartData = [
    { month: "Jan", mentees: 0 },
    { month: "Feb", mentees: 1 },
    { month: "Mar", mentees: 2 },
    { month: "Apr", mentees: 3 },
    { month: "May", mentees: 3 },
    { month: "Jun", mentees: currentMentees },
  ];

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
        fetchProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    try {
      // Fetch main profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (profileError && profileError.code !== "PGRST116") throw profileError;

      if (profileData) {
        setProfile(profileData);
        setFullName(profileData.full_name || "");
      }

      // Fetch mentor profile
      const { data: mentorData, error: mentorError } = await supabase
        .from("mentor_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (mentorError && mentorError.code !== "PGRST116") {
        // Profile doesn't exist, create one
        const { data: newMentor, error: createError } = await supabase
          .from("mentor_profiles")
          .insert({ user_id: userId })
          .select()
          .single();
        
        if (createError) throw createError;
        setMentorProfile(newMentor);
      } else if (mentorData) {
        setMentorProfile(mentorData);
        setMentorType(mentorData.mentor_type);
        setBio(mentorData.bio || "");
        setExpertise(mentorData.expertise?.join(", ") || "");
        setAreasOfGuidance(mentorData.areas_of_guidance?.join(", ") || "");
        setExperience(mentorData.experience || "");
        setIsAvailable(mentorData.is_available);
        setMaxMentees(mentorData.max_mentees.toString());
        setCurrentMentees(mentorData.current_mentees);
      }

      // Fetch pending requests
      const { count: pending } = await supabase
        .from("mentorship_requests")
        .select("*", { count: "exact", head: true })
        .eq("mentor_id", userId)
        .eq("status", "pending");

      setPendingRequests(pending || 0);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  // Real-time notifications for new requests
  useRealtimeNotifications({
    userId: user?.id || null,
    role: "mentor",
    onNewRequest: () => {
      if (user) fetchProfile(user.id);
    },
  });

  // Track changes
  useEffect(() => {
    if (!profile && !mentorProfile) return;
    
    const profileChanged = fullName !== (profile?.full_name || "");
    const mentorChanged = 
      bio !== (mentorProfile?.bio || "") ||
      expertise !== (mentorProfile?.expertise?.join(", ") || "") ||
      areasOfGuidance !== (mentorProfile?.areas_of_guidance?.join(", ") || "") ||
      experience !== (mentorProfile?.experience || "") ||
      mentorType !== mentorProfile?.mentor_type ||
      isAvailable !== mentorProfile?.is_available ||
      maxMentees !== (mentorProfile?.max_mentees?.toString() || "5");

    setHasChanges(profileChanged || mentorChanged);
  }, [fullName, bio, expertise, areasOfGuidance, experience, mentorType, isAvailable, maxMentees, profile, mentorProfile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      // Update main profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: fullName, role: "mentor" })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      // Update mentor profile
      const expertiseArray = expertise.split(",").map(i => i.trim()).filter(i => i);
      const guidanceArray = areasOfGuidance.split(",").map(i => i.trim()).filter(i => i);
      
      const { error: mentorError } = await supabase
        .from("mentor_profiles")
        .upsert({
          user_id: user.id,
          mentor_type: mentorType,
          bio,
          expertise: expertiseArray,
          areas_of_guidance: guidanceArray,
          experience,
          is_available: isAvailable,
          max_mentees: parseInt(maxMentees)
        }, { onConflict: "user_id" });

      if (mentorError) throw mentorError;

      toast({
        title: "Profile updated",
        description: "Your mentor profile has been saved successfully.",
      });

      setHasChanges(false);
      if (user) fetchProfile(user.id);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to save profile";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCroppedImage = async (blob: Blob) => {
    if (!user) return;

    try {
      const filePath = `${user.id}/avatar.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, blob, { upsert: true, contentType: "image/jpeg" });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

      await supabase
        .from("profiles")
        .update({ avatar_url: urlWithCacheBust })
        .eq("user_id", user.id);

      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated.",
      });

      fetchProfile(user.id);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to upload avatar";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleRefresh = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16 md:pb-0">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex flex-col items-center">
              <h1 className="text-lg font-semibold text-foreground font-display">
                IILM UNIVERSITY
              </h1>
              <span className="text-xs text-primary font-medium italic">Mentorship Portal</span>
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={handleSignOut} className="md:hidden">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <DashboardSidebar role="mentor" />

      <PullToRefresh onRefresh={handleRefresh} className="flex-1">
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Welcome Section */}
            <div className="mb-8 animate-fade-in">
              <h2 className="font-serif text-3xl font-semibold text-foreground mb-2">
                Welcome back{fullName ? `, ${fullName}` : ""}! 🎓
              </h2>
              <p className="text-muted-foreground">
                Manage your mentor profile and review mentorship requests.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Profile Card */}
              <div className="lg:col-span-2 animate-slide-up">
                <Card className="glass-card overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <CardTitle className="font-serif text-xl">Your Mentor Profile</CardTitle>
                    {hasChanges && (
                      <Button variant="default" size="sm" onClick={handleSave} disabled={saving} className="gap-2">
                        <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Avatar & Name Section */}
                    <div className="flex items-center gap-6">
                      <div className="relative group">
                        <Avatar className="w-24 h-24 border-4 border-background shadow-soft transition-transform group-hover:scale-105">
                          <AvatarImage src={profile?.avatar_url || ""} />
                          <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                            <User className="w-10 h-10" />
                          </AvatarFallback>
                        </Avatar>
                        <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-all shadow-md hover:scale-110">
                          <Camera className="w-4 h-4 text-primary-foreground" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageSelect}
                          />
                        </label>
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Full Name</Label>
                        <Input
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Your full name"
                          className="text-lg font-semibold mt-1 mb-2"
                        />
                        <p className="text-sm text-muted-foreground">{profile?.email}</p>
                        
                        {/* Availability Toggle */}
                        <div className="flex items-center gap-3 mt-3">
                          <Switch 
                            checked={isAvailable} 
                            onCheckedChange={setIsAvailable}
                          />
                          <span className={`text-sm ${isAvailable ? "text-success" : "text-muted-foreground"}`}>
                            {isAvailable ? "Available for mentees" : "Not accepting mentees"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Mentor Type & Capacity */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Mentor Type</Label>
                        <Select value={mentorType} onValueChange={(val: "senior" | "alumni" | "faculty") => setMentorType(val)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="senior">Senior Student</SelectItem>
                            <SelectItem value="alumni">Alumni</SelectItem>
                            <SelectItem value="faculty">Faculty</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Max Mentees</Label>
                        <Input 
                          type="number" 
                          value={maxMentees} 
                          onChange={(e) => setMaxMentees(e.target.value)} 
                          min="1" 
                          max="20"
                        />
                      </div>
                    </div>

                    {/* Bio */}
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Bio</Label>
                      <Textarea 
                        value={bio} 
                        onChange={(e) => setBio(e.target.value)} 
                        placeholder="Tell mentees about yourself..."
                        rows={3}
                      />
                    </div>

                    {/* Expertise */}
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Expertise</Label>
                      <Input 
                        value={expertise} 
                        onChange={(e) => setExpertise(e.target.value)} 
                        placeholder="e.g., Machine Learning, System Design, Career Guidance"
                      />
                      <p className="text-xs text-muted-foreground">Separate skills with commas</p>
                    </div>

                    {/* Areas of Guidance */}
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Areas of Guidance</Label>
                      <Input 
                        value={areasOfGuidance} 
                        onChange={(e) => setAreasOfGuidance(e.target.value)} 
                        placeholder="e.g., Resume Review, Interview Prep, Research"
                      />
                    </div>

                    {/* Experience */}
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Experience</Label>
                      <Textarea 
                        value={experience} 
                        onChange={(e) => setExperience(e.target.value)} 
                        placeholder="Describe your experience..."
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="stat-card hover-lift">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-semibold text-foreground">{currentMentees}/{maxMentees}</p>
                        <p className="text-xs text-muted-foreground">Mentees</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="stat-card hover-lift">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-warning" />
                      </div>
                      <div>
                        <p className="text-2xl font-semibold text-foreground">{pendingRequests}</p>
                        <p className="text-xs text-muted-foreground">Pending</p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Growth Chart */}
                <Card className="glass-card">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      <CardTitle className="font-serif text-lg">Insights</CardTitle>
                    </div>
                    <p className="text-xs text-muted-foreground">Mentees connected over time</p>
                  </CardHeader>
                  <CardContent>
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorMentees" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                          <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: "hsl(var(--card))", 
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px"
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="mentees" 
                            stroke="hsl(var(--primary))" 
                            fillOpacity={1} 
                            fill="url(#colorMentees)" 
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="glass-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="font-serif text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-3 hover-lift" 
                      onClick={() => navigate("/mentor-requests")}
                    >
                      <Inbox className="w-4 h-4 text-primary" />
                      View Requests
                      {pendingRequests > 0 && (
                        <span className="ml-auto flex items-center gap-1 bg-warning text-warning-foreground text-xs px-2 py-0.5 rounded-full">
                          <Bell className="w-3 h-3" />
                          {pendingRequests}
                        </span>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-3 hover-lift" 
                      onClick={() => navigate("/my-mentees")}
                    >
                      <Users className="w-4 h-4 text-primary" />
                      My Mentees
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-3 hover-lift" 
                      onClick={() => navigate("/mentor-queries")}
                    >
                      <MessageSquare className="w-4 h-4 text-primary" />
                      Queries
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-3 hover-lift text-destructive hover:text-destructive" 
                      onClick={handleSignOut}
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </PullToRefresh>

      <MobileBottomNav role="mentor" />

      {/* Image Cropper */}
      {selectedImage && (
        <ImageCropper
          open={cropperOpen}
          onClose={() => {
            setCropperOpen(false);
            setSelectedImage(null);
          }}
          imageSrc={selectedImage}
          onCropComplete={handleCroppedImage}
        />
      )}
    </div>
  );
};

export default MentorDashboard;
