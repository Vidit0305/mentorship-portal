-- Add help_type and domain fields to mentor_profiles table
ALTER TABLE public.mentor_profiles
ADD COLUMN IF NOT EXISTS help_type text[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS domain text[] DEFAULT NULL;

-- Add mentor_reply field to mentee_queries table for mentor responses
ALTER TABLE public.mentee_queries
ADD COLUMN IF NOT EXISTS mentor_reply text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS replied_at timestamp with time zone DEFAULT NULL;