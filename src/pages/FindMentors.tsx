import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { MentorshipRequestDialog } from "@/components/MentorshipRequestDialog";
import { MenteeQueryForm } from "@/components/MenteeQueryForm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { 
  User, 
  LogOut, 
  Search,
  Filter,
  Users,
  GraduationCap,
  Briefcase,
  Check,
  ArrowLeft,
  FileText,
  SlidersHorizontal,
  Clock
} from "lucide-react";
import { User as SupabaseUser } from "@supabase/supabase-js";

interface MentorWithProfile {
  user_id: string;
  bio: string | null;
  expertise: string[] | null;
  areas_of_guidance: string[] | null;
  experience: string | null;
  is_available: boolean | null;
  mentor_type: "senior" | "alumni" | "faculty";
  max_mentees: number | null;
  current_mentees: number | null;
  profile: {
    full_name: string | null;
    avatar_url: string | null;
    email: string | null;
  } | null;
  isConnected?: boolean;
  hasPendingRequest?: boolean;
}

const FindMentors = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [mentors, setMentors] = useState<MentorWithProfile[]>([]);
  const [filteredMentors, setFilteredMentors] = useState<MentorWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all");
  
  const [selectedMentor, setSelectedMentor] = useState<MentorWithProfile | null>(null);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [queryFormOpen, setQueryFormOpen] = useState(false);
  const [queryMentor, setQueryMentor] = useState<MentorWithProfile | null>(null);

  // New filters
  const [helpTypeFilter, setHelpTypeFilter] = useState<string[]>([]);
  const [domainFilter, setDomainFilter] = useState<string[]>([]);

  const helpTypes = [
    "Academic Help",
    "Internship Help",
    "Placement Help",
    "Career Guidance",
    "Project Help",
    "Others",
  ];

  const domains = [
    "Computer Science",
    "Data Science",
    "Business & Management",
    "Finance",
    "Marketing",
    "Design & UX",
    "Engineering",
    "Research",
    "Entrepreneurship",
    "Others",
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
        fetchMentors();
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchMentors = async () => {
    try {
      const currentSession = await supabase.auth.getSession();
      const currentUserId = currentSession.data.session?.user.id;

      // Fetch all mentor profiles
      const { data: mentorProfiles, error: mentorError } = await supabase
        .from("mentor_profiles")
        .select("*");

      if (mentorError) throw mentorError;

      // Fetch profiles for all mentors
      const mentorUserIds = mentorProfiles?.map(m => m.user_id) || [];
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, email")
        .in("user_id", mentorUserIds);

      if (profileError) throw profileError;

      // Fetch active mentorships for current user
      let connectedMentorIds: string[] = [];
      if (currentUserId) {
        const { data: mentorships } = await supabase
          .from("active_mentorships")
          .select("mentor_id")
          .eq("mentee_id", currentUserId);
        connectedMentorIds = mentorships?.map(m => m.mentor_id) || [];
      }

      // Fetch pending requests for current user
      let pendingRequestMentorIds: string[] = [];
      if (currentUserId) {
        const { data: pendingRequests } = await supabase
          .from("mentorship_requests")
          .select("mentor_id")
          .eq("mentee_id", currentUserId)
          .eq("status", "pending");
        pendingRequestMentorIds = pendingRequests?.map(r => r.mentor_id) || [];
      }

      // Merge the data
      const mentorsWithProfiles = mentorProfiles?.map(mentor => ({
        ...mentor,
        profile: profiles?.find(p => p.user_id === mentor.user_id) || null,
        isConnected: connectedMentorIds.includes(mentor.user_id),
        hasPendingRequest: pendingRequestMentorIds.includes(mentor.user_id),
      })) || [];

      setMentors(mentorsWithProfiles);
      setFilteredMentors(mentorsWithProfiles);
    } catch (error) {
      console.error("Error fetching mentors:", error);
      toast({
        title: "Error",
        description: "Failed to load mentors",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = mentors;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(mentor => 
        mentor.profile?.full_name?.toLowerCase().includes(query) ||
        mentor.expertise?.some(e => e.toLowerCase().includes(query)) ||
        mentor.areas_of_guidance?.some(a => a.toLowerCase().includes(query)) ||
        mentor.bio?.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (typeFilter !== "all") {
      result = result.filter(mentor => mentor.mentor_type === typeFilter);
    }

    // Availability filter
    if (availabilityFilter === "available") {
      result = result.filter(mentor => mentor.is_available);
    }

    // Help type filter
    if (helpTypeFilter.length > 0) {
      result = result.filter(mentor =>
        mentor.areas_of_guidance?.some(area =>
          helpTypeFilter.some(ht => area.toLowerCase().includes(ht.toLowerCase().replace(" Help", "").replace(" Guidance", "")))
        )
      );
    }

    // Domain filter
    if (domainFilter.length > 0) {
      result = result.filter(mentor =>
        mentor.expertise?.some(exp =>
          domainFilter.some(d => exp.toLowerCase().includes(d.toLowerCase()))
        )
      );
    }

    setFilteredMentors(result);
  }, [searchQuery, typeFilter, availabilityFilter, helpTypeFilter, domainFilter, mentors]);

  const handleOpenQueryForm = (mentor: MentorWithProfile) => {
    setQueryMentor(mentor);
    setQueryFormOpen(true);
  };

  const toggleHelpType = (type: string) => {
    setHelpTypeFilter(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleDomain = (domain: string) => {
    setDomainFilter(prev =>
      prev.includes(domain) ? prev.filter(d => d !== domain) : [...prev, domain]
    );
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleRequestMentorship = (mentor: MentorWithProfile) => {
    setSelectedMentor(mentor);
    setRequestDialogOpen(true);
  };

  const getMentorTypeIcon = (type: string) => {
    switch (type) {
      case "senior":
        return <GraduationCap className="w-4 h-4" />;
      case "alumni":
        return <Users className="w-4 h-4" />;
      case "faculty":
        return <Briefcase className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getMentorTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading mentors...</div>
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
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h2 className="font-serif text-3xl font-semibold text-foreground mb-2">
              Find Your Mentor
            </h2>
            <p className="text-muted-foreground">
              Browse and connect with experienced mentors who can guide your journey.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search by name, expertise, or areas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
              <div className="flex gap-3 flex-wrap">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[140px] h-12">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                    <SelectItem value="alumni">Alumni</SelectItem>
                    <SelectItem value="faculty">Faculty</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                  <SelectTrigger className="w-[160px] h-12">
                    <SelectValue placeholder="Availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="available">Available Only</SelectItem>
                  </SelectContent>
                </Select>

                {/* Help Type Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-12 gap-2">
                      <SlidersHorizontal className="w-4 h-4" />
                      Help Type
                      {helpTypeFilter.length > 0 && (
                        <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                          {helpTypeFilter.length}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Filter by Help Type</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {helpTypes.map((type) => (
                      <DropdownMenuCheckboxItem
                        key={type}
                        checked={helpTypeFilter.includes(type)}
                        onCheckedChange={() => toggleHelpType(type)}
                      >
                        {type}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Domain Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-12 gap-2">
                      <Briefcase className="w-4 h-4" />
                      Domain
                      {domainFilter.length > 0 && (
                        <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                          {domainFilter.length}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Categorisation by Domain</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {domains.map((domain) => (
                      <DropdownMenuCheckboxItem
                        key={domain}
                        checked={domainFilter.includes(domain)}
                        onCheckedChange={() => toggleDomain(domain)}
                      >
                        {domain}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Active filters display */}
            {(helpTypeFilter.length > 0 || domainFilter.length > 0) && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {helpTypeFilter.map((type) => (
                  <Badge
                    key={type}
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive/20"
                    onClick={() => toggleHelpType(type)}
                  >
                    {type} ×
                  </Badge>
                ))}
                {domainFilter.map((domain) => (
                  <Badge
                    key={domain}
                    variant="outline"
                    className="cursor-pointer hover:bg-destructive/20"
                    onClick={() => toggleDomain(domain)}
                  >
                    {domain} ×
                  </Badge>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setHelpTypeFilter([]);
                    setDomainFilter([]);
                  }}
                  className="text-xs text-muted-foreground"
                >
                  Clear all
                </Button>
              </div>
            )}
          </div>

          {/* Mentors Grid */}
          {filteredMentors.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="font-serif text-xl text-foreground mb-2">No Mentors Found</h3>
              <p className="text-muted-foreground">
                {searchQuery || typeFilter !== "all" || availabilityFilter !== "all"
                  ? "Try adjusting your filters or search query."
                  : "No mentors are available at the moment."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMentors.map((mentor) => (
                <Card key={mentor.user_id} className="glass-card overflow-hidden hover:shadow-medium transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-16 h-16 border-2 border-background shadow-soft">
                        <AvatarImage src={mentor.profile?.avatar_url || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary text-lg">
                          <User className="w-8 h-8" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-serif text-lg font-semibold text-foreground truncate">
                          {mentor.profile?.full_name || "Anonymous Mentor"}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="flex items-center gap-1">
                            {getMentorTypeIcon(mentor.mentor_type)}
                            {getMentorTypeLabel(mentor.mentor_type)}
                          </Badge>
                          {mentor.is_available && (
                            <Badge variant="outline" className="text-success border-success/30 bg-success/10">
                              <Check className="w-3 h-3 mr-1" />
                              Available
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {mentor.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {mentor.bio}
                      </p>
                    )}
                    
                    {mentor.expertise && mentor.expertise.length > 0 && (
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Expertise</p>
                        <div className="flex flex-wrap gap-1">
                          {mentor.expertise.slice(0, 3).map((exp, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {exp}
                            </Badge>
                          ))}
                          {mentor.expertise.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{mentor.expertise.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 gap-2">
                      <span className="text-xs text-muted-foreground">
                        {mentor.current_mentees || 0}/{mentor.max_mentees || 5} mentees
                      </span>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleOpenQueryForm(mentor)}
                          disabled={!mentor.is_available}
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Query
                        </Button>
                        {mentor.isConnected ? (
                          <Badge className="bg-success/20 text-success border-success/30 px-3 py-1.5">
                            <Check className="w-3 h-3 mr-1" />
                            Mentor
                          </Badge>
                        ) : mentor.hasPendingRequest ? (
                          <Badge variant="secondary" className="px-3 py-1.5">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        ) : (
                          <Button 
                            size="sm" 
                            onClick={() => handleRequestMentorship(mentor)}
                            disabled={!mentor.is_available || (mentor.current_mentees || 0) >= (mentor.max_mentees || 5)}
                          >
                            Request
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <MobileBottomNav role="mentee" />
      <DashboardSidebar role="mentee" />

      {/* Request Dialog */}
      {selectedMentor && (
        <MentorshipRequestDialog
          open={requestDialogOpen}
          onOpenChange={setRequestDialogOpen}
          mentor={selectedMentor}
          onSuccess={() => {
            toast({
              title: "Request sent!",
              description: "Your mentorship request has been submitted.",
            });
          }}
        />
      )}

      {/* Query Form */}
      {queryMentor && (
        <MenteeQueryForm
          open={queryFormOpen}
          onOpenChange={setQueryFormOpen}
          mentorId={queryMentor.user_id}
          mentorName={queryMentor.profile?.full_name || "Mentor"}
        />
      )}
    </div>
  );
};

export default FindMentors;
