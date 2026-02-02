import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { 
  User, 
  LogOut, 
  Edit2, 
  Save, 
  X, 
  Camera,
  Users,
  Clock,
  CheckCircle,
  Bell,
  Inbox
} from "lucide-react";
import { User as SupabaseUser } from "@supabase/supabase-js";

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
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [fullName, setFullName] = useState("");
  const [mentorType, setMentorType] = useState<"senior" | "alumni" | "faculty">("senior");
  const [bio, setBio] = useState("");
  const [expertise, setExpertise] = useState("");
  const [areasOfGuidance, setAreasOfGuidance] = useState("");
  const [experience, setExperience] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [maxMentees, setMaxMentees] = useState("5");

  // Stats
  const [currentMentees, setCurrentMentees] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);

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
    <div className="min-h-screen hero-gradient">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="font-serif text-xl font-semibold text-foreground">
              MentorConnect
            </h1>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                {pendingRequests > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                    {pendingRequests}
                  </span>
                )}
              </Button>
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
              Welcome back{fullName ? `, ${fullName}` : ""}! 🎓
            </h2>
            <p className="text-muted-foreground">
              Manage your mentor profile and review mentorship requests.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Card */}
            <div className="lg:col-span-2">
              <Card className="glass-card overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <CardTitle className="font-serif text-xl">Your Mentor Profile</CardTitle>
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
                  {/* Avatar & Name Section */}
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
                    <div className="flex-1">
                      {isEditing ? (
                        <Input
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Your full name"
                          className="text-lg font-semibold mb-2"
                        />
                      ) : (
                        <h3 className="font-serif text-xl font-semibold text-foreground">
                          {fullName || "Add your name"}
                        </h3>
                      )}
                      <p className="text-sm text-muted-foreground">{profile?.email}</p>
                      
                      {/* Availability Toggle */}
                      <div className="flex items-center gap-3 mt-3">
                        <Switch 
                          checked={isAvailable} 
                          onCheckedChange={setIsAvailable}
                          disabled={!isEditing}
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
                      {isEditing ? (
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
                      ) : (
                        <p className="text-foreground capitalize">{mentorType} {mentorType === "senior" ? "Student" : ""}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Max Mentees</Label>
                      {isEditing ? (
                        <Input 
                          type="number" 
                          value={maxMentees} 
                          onChange={(e) => setMaxMentees(e.target.value)} 
                          min="1" 
                          max="20"
                        />
                      ) : (
                        <p className="text-foreground">{maxMentees} mentees</p>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Bio</Label>
                    {isEditing ? (
                      <Textarea 
                        value={bio} 
                        onChange={(e) => setBio(e.target.value)} 
                        placeholder="Tell mentees about yourself..."
                        rows={3}
                      />
                    ) : (
                      <p className="text-foreground">{bio || "No bio added"}</p>
                    )}
                  </div>

                  {/* Expertise */}
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Expertise</Label>
                    {isEditing ? (
                      <Input 
                        value={expertise} 
                        onChange={(e) => setExpertise(e.target.value)} 
                        placeholder="e.g., Machine Learning, System Design, Career Guidance"
                      />
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {mentorProfile?.expertise?.length ? (
                          mentorProfile.expertise.map((skill, i) => (
                            <span key={i} className="px-3 py-1 bg-accent rounded-full text-sm text-accent-foreground">
                              {skill}
                            </span>
                          ))
                        ) : (
                          <p className="text-muted-foreground">No expertise added</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Areas of Guidance */}
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Areas of Guidance</Label>
                    {isEditing ? (
                      <Input 
                        value={areasOfGuidance} 
                        onChange={(e) => setAreasOfGuidance(e.target.value)} 
                        placeholder="e.g., Resume Review, Interview Prep, Research"
                      />
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {mentorProfile?.areas_of_guidance?.length ? (
                          mentorProfile.areas_of_guidance.map((area, i) => (
                            <span key={i} className="px-3 py-1 bg-primary/10 rounded-full text-sm text-primary">
                              {area}
                            </span>
                          ))
                        ) : (
                          <p className="text-muted-foreground">No areas specified</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Experience */}
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Experience</Label>
                    {isEditing ? (
                      <Textarea 
                        value={experience} 
                        onChange={(e) => setExperience(e.target.value)} 
                        placeholder="Describe your professional experience..."
                        rows={3}
                      />
                    ) : (
                      <p className="text-foreground">{experience || "No experience added"}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Stats & Actions */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="stat-card">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-foreground">{currentMentees}</p>
                      <p className="text-xs text-muted-foreground">Mentees</p>
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

              {/* Capacity Card */}
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="font-serif text-lg">Mentee Capacity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Current / Max</span>
                    <span className="font-semibold text-foreground">{currentMentees} / {maxMentees}</span>
                  </div>
                  <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((currentMentees / parseInt(maxMentees)) * 100, 100)}%` }}
                    />
                  </div>
                  {currentMentees >= parseInt(maxMentees) && (
                    <p className="text-xs text-warning mt-2">You've reached your mentee limit</p>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="font-serif text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/requests")}>
                    <Inbox className="w-4 h-4 mr-2" /> View Requests
                    {pendingRequests > 0 && (
                      <span className="ml-auto bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                        {pendingRequests}
                      </span>
                    )}
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/my-mentees")}>
                    <Users className="w-4 h-4 mr-2" /> My Mentees
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MentorDashboard;
