import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Footer } from "@/components/Footer";
import { RightSidebar } from "@/components/RightSidebar";
import { 
  User, 
  LogOut, 
  Edit2, 
  Save, 
  X, 
  Camera,
  Clock,
  CheckCircle,
  TrendingUp,
  Search,
  Users
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

interface MenteeProfile {
  id: string;
  user_id: string;
  course: string | null;
  specialisation: string | null;
  year: string | null;
  semester: string | null;
  section: string | null;
  interests: string[] | null;
  career_goals: string | null;
}

const MenteeDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [menteeProfile, setMenteeProfile] = useState<MenteeProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [fullName, setFullName] = useState("");
  const [course, setCourse] = useState("");
  const [specialisation, setSpecialisation] = useState("");
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");
  const [section, setSection] = useState("");
  const [interests, setInterests] = useState("");
  const [careerGoals, setCareerGoals] = useState("");

  // Stats
  const [acceptedMentors, setAcceptedMentors] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);

  // Chart data - simulated for now
  const chartData = [
    { month: "Jan", mentors: 0 },
    { month: "Feb", mentors: 1 },
    { month: "Mar", mentors: 1 },
    { month: "Apr", mentors: 2 },
    { month: "May", mentors: 2 },
    { month: "Jun", mentors: acceptedMentors },
  ];

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

      // Fetch mentee profile
      const { data: menteeData, error: menteeError } = await supabase
        .from("mentee_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (menteeError && menteeError.code !== "PGRST116") {
        // Profile doesn't exist, create one
        const { data: newMentee, error: createError } = await supabase
          .from("mentee_profiles")
          .insert({ user_id: userId })
          .select()
          .single();
        
        if (createError) throw createError;
        setMenteeProfile(newMentee);
      } else if (menteeData) {
        setMenteeProfile(menteeData);
        setCourse(menteeData.course || "");
        setSpecialisation(menteeData.specialisation || "");
        setYear(menteeData.year || "");
        setSemester(menteeData.semester || "");
        setSection(menteeData.section || "");
        setInterests(menteeData.interests?.join(", ") || "");
        setCareerGoals(menteeData.career_goals || "");
      }

      // Fetch mentorship stats
      const { count: accepted } = await supabase
        .from("mentorship_requests")
        .select("*", { count: "exact", head: true })
        .eq("mentee_id", userId)
        .eq("status", "accepted");

      const { count: pending } = await supabase
        .from("mentorship_requests")
        .select("*", { count: "exact", head: true })
        .eq("mentee_id", userId)
        .eq("status", "pending");

      setAcceptedMentors(accepted || 0);
      setPendingRequests(pending || 0);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      // Update main profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      // Update mentee profile
      const interestsArray = interests.split(",").map(i => i.trim()).filter(i => i);
      
      const { error: menteeError } = await supabase
        .from("mentee_profiles")
        .upsert({
          user_id: user.id,
          course,
          specialisation,
          year,
          semester,
          section,
          interests: interestsArray,
          career_goals: careerGoals
        }, { onConflict: "user_id" });

      if (menteeError) throw menteeError;

      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully.",
      });

      setIsEditing(false);
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
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

  if (loading) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen hero-gradient flex flex-col pb-16 md:pb-0">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex flex-col">
              <h1 className="text-lg font-semibold text-foreground" style={{ fontFamily: "Georgia, serif" }}>
                IILM UNIVERSITY
              </h1>
              <span className="text-xs text-muted-foreground">Mentorship Portal</span>
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="font-serif text-3xl font-semibold text-foreground mb-2">
              Welcome back{fullName ? `, ${fullName}` : ""}! 👋
            </h2>
            <p className="text-muted-foreground">
              Manage your profile and track your mentorship journey.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Card */}
            <div className="lg:col-span-2">
              <Card className="glass-card overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <CardTitle className="font-serif text-xl">Your Profile</CardTitle>
                  {!isEditing ? (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      <Edit2 className="w-4 h-4 mr-2" /> Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                        <X className="w-4 h-4 mr-2" /> Cancel
                      </Button>
                      <Button variant="default" size="sm" onClick={handleSave} disabled={saving}>
                        <Save className="w-4 h-4 mr-2" /> {saving ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar Section */}
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <Avatar className="w-24 h-24 border-4 border-background shadow-soft">
                        <AvatarImage src={profile?.avatar_url || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                          <User className="w-10 h-10" />
                        </AvatarFallback>
                      </Avatar>
                      {isEditing && (
                        <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors shadow-md">
                          <Camera className="w-4 h-4 text-primary-foreground" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarUpload}
                          />
                        </label>
                      )}
                    </div>
                    <div>
                      {isEditing ? (
                        <Input
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Your full name"
                          className="text-lg font-semibold mb-1"
                        />
                      ) : (
                        <h3 className="font-serif text-xl font-semibold text-foreground">
                          {fullName || "Add your name"}
                        </h3>
                      )}
                      <p className="text-sm text-muted-foreground">{profile?.email}</p>
                    </div>
                  </div>

                  {/* Academic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Course</Label>
                      {isEditing ? (
                        <Input value={course} onChange={(e) => setCourse(e.target.value)} placeholder="e.g., B.Tech" />
                      ) : (
                        <p className="text-foreground">{course || "Not specified"}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Specialisation</Label>
                      {isEditing ? (
                        <Input value={specialisation} onChange={(e) => setSpecialisation(e.target.value)} placeholder="e.g., Computer Science" />
                      ) : (
                        <p className="text-foreground">{specialisation || "Not specified"}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Year</Label>
                      {isEditing ? (
                        <Input value={year} onChange={(e) => setYear(e.target.value)} placeholder="e.g., 3rd Year" />
                      ) : (
                        <p className="text-foreground">{year || "Not specified"}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Semester & Section</Label>
                      {isEditing ? (
                        <div className="flex gap-2">
                          <Input value={semester} onChange={(e) => setSemester(e.target.value)} placeholder="Sem" className="w-1/2" />
                          <Input value={section} onChange={(e) => setSection(e.target.value)} placeholder="Sec" className="w-1/2" />
                        </div>
                      ) : (
                        <p className="text-foreground">
                          {semester || section ? `${semester} - Section ${section}` : "Not specified"}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Interests */}
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Interests</Label>
                    {isEditing ? (
                      <Input 
                        value={interests} 
                        onChange={(e) => setInterests(e.target.value)} 
                        placeholder="e.g., Machine Learning, Web Development, Research"
                      />
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {menteeProfile?.interests?.length ? (
                          menteeProfile.interests.map((interest, i) => (
                            <span key={i} className="px-3 py-1 bg-accent rounded-full text-sm text-accent-foreground">
                              {interest}
                            </span>
                          ))
                        ) : (
                          <p className="text-muted-foreground">No interests added</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Career Goals */}
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Career Goals</Label>
                    {isEditing ? (
                      <Textarea 
                        value={careerGoals} 
                        onChange={(e) => setCareerGoals(e.target.value)} 
                        placeholder="Describe your career aspirations..."
                        rows={3}
                      />
                    ) : (
                      <p className="text-foreground">{careerGoals || "Not specified"}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Insights Section */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="stat-card">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-foreground">{acceptedMentors}</p>
                      <p className="text-xs text-muted-foreground">Connected</p>
                    </div>
                  </div>
                </Card>
                <Card className="stat-card">
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
                  <CardTitle className="font-serif text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Mentorship Growth
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorMentors" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "hsl(var(--card))", 
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px"
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="mentors" 
                          stroke="hsl(var(--primary))" 
                          fillOpacity={1} 
                          fill="url(#colorMentors)" 
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
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/find-mentors")}>
                    <Search className="w-4 h-4 mr-2" /> Find Mentors
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/my-requests")}>
                    <Users className="w-4 h-4 mr-2" /> My Requests
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <MobileBottomNav role="mentee" />
      <RightSidebar role="mentee" />
    </div>
  );
};

export default MenteeDashboard;
