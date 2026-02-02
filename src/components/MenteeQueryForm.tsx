import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Copy, Check, Share2 } from "lucide-react";

const formSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters").max(100),
  course_program_year: z.string().min(2, "Required").max(100),
  university_name: z.string().min(2, "Required").max(200),
  email: z.string().email("Invalid email address").max(255),
  mentorship_type: z.string().min(1, "Please select a type"),
  domain_guidance: z.string().min(2, "Required").max(200),
  query_description: z.string().min(10, "Please provide more details").max(1000),
  expected_outcome: z.string().min(10, "Please provide more details").max(500),
  mentorship_duration: z.string().min(1, "Please select a duration"),
  why_this_mentor: z.string().min(10, "Please provide more details").max(500),
});

type FormValues = z.infer<typeof formSchema>;

interface MenteeQueryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mentorId: string;
  mentorName: string;
}

export const MenteeQueryForm = ({
  open,
  onOpenChange,
  mentorId,
  mentorName,
}: MenteeQueryFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shareableLink, setShareableLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      course_program_year: "",
      university_name: "IILM University",
      email: "",
      mentorship_type: "",
      domain_guidance: "",
      query_description: "",
      expected_outcome: "",
      mentorship_duration: "",
      why_this_mentor: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("mentee_queries")
        .insert({
          mentee_id: user.id,
          mentor_id: mentorId,
          full_name: values.full_name,
          course_program_year: values.course_program_year,
          university_name: values.university_name,
          email: values.email,
          mentorship_type: values.mentorship_type,
          domain_guidance: values.domain_guidance,
          query_description: values.query_description,
          expected_outcome: values.expected_outcome,
          mentorship_duration: values.mentorship_duration,
          why_this_mentor: values.why_this_mentor,
        })
        .select()
        .single();

      if (error) throw error;

      const link = `${window.location.origin}/query/${data.share_token}`;
      setShareableLink(link);

      toast({
        title: "Query submitted!",
        description: "Your query has been sent to the mentor.",
      });
    } catch (error) {
      console.error("Error submitting query:", error);
      toast({
        title: "Error",
        description: "Failed to submit query. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = async () => {
    if (shareableLink) {
      await navigator.clipboard.writeText(shareableLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Link copied!", description: "Shareable link copied to clipboard." });
    }
  };

  const handleClose = () => {
    form.reset();
    setShareableLink(null);
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            Mentor–Mentee Query Form
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Submit your query to {mentorName}
          </p>
        </DialogHeader>

        {shareableLink ? (
          <div className="space-y-4 py-4">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-success" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Query Submitted Successfully!</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Your query has been sent to the mentor. You can also share this link:
              </p>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <Input value={shareableLink} readOnly className="flex-1 text-sm" />
              <Button size="icon" variant="outline" onClick={handleCopyLink}>
                {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <Button className="w-full" onClick={handleClose}>
              Done
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="course_program_year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course / Program & Year</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., BTech CSE – 2nd Year" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="university_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>University / College Name</FormLabel>
                    <FormControl>
                      <Input placeholder="IILM University" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email ID</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="your.email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mentorship_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What type of mentorship are you seeking?</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="academic">Academic</SelectItem>
                        <SelectItem value="career">Career</SelectItem>
                        <SelectItem value="internship">Internship</SelectItem>
                        <SelectItem value="research">Research</SelectItem>
                        <SelectItem value="skill_development">Skill Development</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="domain_guidance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Which course, subject, or domain do you need guidance in?</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Machine Learning, Web Development" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="query_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Briefly describe your query or challenge</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What exactly do you need help with?"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expected_outcome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What outcome do you expect from this mentorship?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your expected outcomes..."
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mentorship_duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred mentorship duration</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="one_time">One-time session</SelectItem>
                        <SelectItem value="short_term">Short-term (1-3 months)</SelectItem>
                        <SelectItem value="long_term">Long-term (3+ months)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="why_this_mentor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Why did you choose this mentor for guidance?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Explain why you selected this mentor..."
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 gap-2" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      Submit Query
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};
