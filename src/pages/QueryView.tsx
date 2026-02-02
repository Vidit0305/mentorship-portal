import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Footer } from "@/components/Footer";
import {
  User,
  Mail,
  GraduationCap,
  Building,
  Target,
  Clock,
  FileText,
  Heart,
  ArrowLeft,
} from "lucide-react";

interface QueryData {
  id: string;
  full_name: string;
  course_program_year: string;
  university_name: string;
  email: string;
  mentorship_type: string;
  domain_guidance: string;
  query_description: string;
  expected_outcome: string;
  mentorship_duration: string;
  why_this_mentor: string;
  created_at: string;
}

const QueryView = () => {
  const { token } = useParams();
  const [query, setQuery] = useState<QueryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuery = async () => {
      if (!token) {
        setError("Invalid link");
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("mentee_queries")
          .select("*")
          .eq("share_token", token)
          .single();

        if (error) throw error;
        setQuery(data);
      } catch (err) {
        console.error("Error fetching query:", err);
        setError("Query not found or link has expired.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuery();
  }, [token]);

  const getMentorshipTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      academic: "Academic",
      career: "Career",
      internship: "Internship",
      research: "Research",
      skill_development: "Skill Development",
    };
    return labels[type] || type;
  };

  const getDurationLabel = (duration: string) => {
    const labels: Record<string, string> = {
      one_time: "One-time session",
      short_term: "Short-term (1-3 months)",
      long_term: "Long-term (3+ months)",
    };
    return labels[duration] || duration;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error || !query) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-2">
            Query Not Found
          </h2>
          <p className="text-muted-foreground mb-6">
            {error || "The query you're looking for doesn't exist."}
          </p>
          <Button asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Home
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex flex-col">
              <h1 className="text-lg font-semibold text-foreground font-display">
                IILM UNIVERSITY
              </h1>
              <span className="text-xs text-muted-foreground">Mentorship Portal</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <Badge variant="secondary" className="mb-4">Mentorship Query</Badge>
            <h2 className="font-serif text-3xl font-semibold text-foreground mb-2">
              Query from {query.full_name}
            </h2>
            <p className="text-muted-foreground">
              Submitted on {new Date(query.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="space-y-6">
            {/* Basic Info */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg font-serif">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Name</p>
                      <p className="font-medium">{query.full_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Email</p>
                      <p className="font-medium">{query.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Program</p>
                      <p className="font-medium">{query.course_program_year}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">University</p>
                      <p className="font-medium">{query.university_name}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mentorship Details */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg font-serif">Mentorship Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <Badge variant="outline" className="px-3 py-1">
                    <Target className="w-3 h-3 mr-1" />
                    {getMentorshipTypeLabel(query.mentorship_type)}
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1">
                    <Clock className="w-3 h-3 mr-1" />
                    {getDurationLabel(query.mentorship_duration)}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                    Domain / Subject
                  </p>
                  <p className="text-foreground">{query.domain_guidance}</p>
                </div>
              </CardContent>
            </Card>

            {/* Query Description */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg font-serif">Query Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground whitespace-pre-wrap">{query.query_description}</p>
              </CardContent>
            </Card>

            {/* Expected Outcome */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg font-serif">Expected Outcome</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground whitespace-pre-wrap">{query.expected_outcome}</p>
              </CardContent>
            </Card>

            {/* Why This Mentor */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg font-serif flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary" />
                  Why This Mentor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground whitespace-pre-wrap">{query.why_this_mentor}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default QueryView;
