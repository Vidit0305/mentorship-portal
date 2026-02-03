import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, GraduationCap, Users, Briefcase, Mail, Check, Award, BookOpen } from "lucide-react";

interface MentorProfile {
  user_id: string;
  bio: string | null;
  expertise: string[] | null;
  areas_of_guidance: string[] | null;
  experience: string | null;
  is_available: boolean | null;
  mentor_type: "senior" | "alumni" | "faculty";
  max_mentees: number | null;
  current_mentees: number | null;
  help_type?: string[] | null;
  domain?: string[] | null;
  profile: {
    full_name: string | null;
    avatar_url: string | null;
    email: string | null;
  } | null;
}

interface MentorProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mentor: MentorProfile | null;
}

export function MentorProfileDialog({ open, onOpenChange, mentor }: MentorProfileDialogProps) {
  if (!mentor) return null;

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Mentor Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex items-start gap-4">
            <Avatar className="w-20 h-20 border-4 border-background shadow-soft">
              <AvatarImage src={mentor.profile?.avatar_url || ""} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                <User className="w-10 h-10" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-serif text-xl font-semibold text-foreground">
                {mentor.profile?.full_name || "Anonymous Mentor"}
              </h3>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="secondary" className="flex items-center gap-1">
                  {getMentorTypeIcon(mentor.mentor_type)}
                  {mentor.mentor_type.charAt(0).toUpperCase() + mentor.mentor_type.slice(1)}
                </Badge>
                {mentor.is_available && (
                  <Badge variant="outline" className="text-success border-success/30 bg-success/10">
                    <Check className="w-3 h-3 mr-1" />
                    Available
                  </Badge>
                )}
              </div>
              {mentor.profile?.email && (
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  {mentor.profile.email}
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Bio */}
          {mentor.bio && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Bio
              </h4>
              <p className="text-foreground">{mentor.bio}</p>
            </div>
          )}

          {/* Help Type (formerly Areas of Guidance) */}
          {mentor.areas_of_guidance && mentor.areas_of_guidance.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                <Award className="w-4 h-4" />
                Help
              </h4>
              <div className="flex flex-wrap gap-2">
                {mentor.areas_of_guidance.map((area, i) => (
                  <Badge key={i} variant="secondary">
                    {area}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Expertise */}
          {mentor.expertise && mentor.expertise.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Expertise
              </h4>
              <div className="flex flex-wrap gap-2">
                {mentor.expertise.map((exp, i) => (
                  <Badge key={i} variant="outline">
                    {exp}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Domain (formerly Experience) */}
          {mentor.experience && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Domain
              </h4>
              <p className="text-foreground">{mentor.experience}</p>
            </div>
          )}

          {/* Capacity */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Mentee Capacity
            </h4>
            <p className="text-foreground">
              {mentor.current_mentees || 0} / {mentor.max_mentees || 5} mentees
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
