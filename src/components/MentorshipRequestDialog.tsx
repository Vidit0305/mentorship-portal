import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { User, Send, Loader2 } from "lucide-react";

interface MentorData {
  user_id: string;
  profile: {
    full_name: string | null;
    avatar_url: string | null;
    email: string | null;
  } | null;
  expertise: string[] | null;
  mentor_type: string;
}

interface MentorshipRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mentor: MentorData;
  onSuccess: () => void;
}

export const MentorshipRequestDialog = ({
  open,
  onOpenChange,
  mentor,
  onSuccess,
}: MentorshipRequestDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [introduction, setIntroduction] = useState("");
  const [goals, setGoals] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!introduction.trim() || !goals.trim()) {
      toast({
        title: "Required fields",
        description: "Please fill in both introduction and goals.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if request already exists
      const { data: existing } = await supabase
        .from("mentorship_requests")
        .select("id")
        .eq("mentee_id", user.id)
        .eq("mentor_id", mentor.user_id)
        .single();

      if (existing) {
        toast({
          title: "Request exists",
          description: "You have already sent a request to this mentor.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("mentorship_requests").insert({
        mentee_id: user.id,
        mentor_id: mentor.user_id,
        introduction: introduction.trim(),
        goals: goals.trim(),
        status: "pending",
      });

      if (error) throw error;

      onSuccess();
      onOpenChange(false);
      setIntroduction("");
      setGoals("");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to send request";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Request Mentorship</DialogTitle>
          <DialogDescription>
            Send a mentorship request to connect with this mentor.
          </DialogDescription>
        </DialogHeader>

        {/* Mentor Preview */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-accent/30">
          <Avatar className="w-12 h-12 border-2 border-background">
            <AvatarImage src={mentor.profile?.avatar_url || ""} />
            <AvatarFallback className="bg-primary/10 text-primary">
              <User className="w-6 h-6" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-semibold text-foreground">
              {mentor.profile?.full_name || "Mentor"}
            </h4>
            <p className="text-sm text-muted-foreground capitalize">
              {mentor.mentor_type} Mentor
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Introduce Yourself
            </Label>
            <Textarea
              placeholder="Tell the mentor about yourself, your background, and why you're reaching out..."
              value={introduction}
              onChange={(e) => setIntroduction(e.target.value)}
              className="min-h-[100px]"
              maxLength={500}
              required
            />
            <p className="text-xs text-muted-foreground text-right">
              {introduction.length}/500
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Your Goals
            </Label>
            <Textarea
              placeholder="What do you hope to achieve through this mentorship? What areas do you need guidance in?"
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              className="min-h-[100px]"
              maxLength={500}
              required
            />
            <p className="text-xs text-muted-foreground text-right">
              {goals.length}/500
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="heroPrimary"
              className="flex-1"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" /> Send Request
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
