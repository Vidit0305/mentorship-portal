-- Create mentee_queries table for the Mentor-Mentee Query Form
CREATE TABLE public.mentee_queries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mentee_id UUID NOT NULL,
  mentor_id UUID NOT NULL,
  share_token UUID NOT NULL DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  course_program_year TEXT NOT NULL,
  university_name TEXT NOT NULL,
  email TEXT NOT NULL,
  mentorship_type TEXT NOT NULL,
  domain_guidance TEXT NOT NULL,
  query_description TEXT NOT NULL,
  expected_outcome TEXT NOT NULL,
  mentorship_duration TEXT NOT NULL,
  why_this_mentor TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.mentee_queries ENABLE ROW LEVEL SECURITY;

-- Mentees can create their own queries
CREATE POLICY "Mentees can create their own queries"
ON public.mentee_queries
FOR INSERT
WITH CHECK (auth.uid() = mentee_id);

-- Mentees can view their own queries
CREATE POLICY "Mentees can view their own queries"
ON public.mentee_queries
FOR SELECT
USING (auth.uid() = mentee_id);

-- Mentors can view queries sent to them
CREATE POLICY "Mentors can view queries sent to them"
ON public.mentee_queries
FOR SELECT
USING (auth.uid() = mentor_id);

-- Anyone can view by share token (for shareable link)
CREATE POLICY "Anyone can view with share token"
ON public.mentee_queries
FOR SELECT
USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_mentee_queries_updated_at
BEFORE UPDATE ON public.mentee_queries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index on share_token for fast lookups
CREATE INDEX idx_mentee_queries_share_token ON public.mentee_queries(share_token);
CREATE INDEX idx_mentee_queries_mentee_id ON public.mentee_queries(mentee_id);
CREATE INDEX idx_mentee_queries_mentor_id ON public.mentee_queries(mentor_id);