-- Enable realtime for mentorship_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.mentorship_requests;

-- Add unique constraints for upserts to work properly
ALTER TABLE public.mentee_profiles DROP CONSTRAINT IF EXISTS mentee_profiles_user_id_key;
ALTER TABLE public.mentee_profiles ADD CONSTRAINT mentee_profiles_user_id_key UNIQUE (user_id);

ALTER TABLE public.mentor_profiles DROP CONSTRAINT IF EXISTS mentor_profiles_user_id_key;
ALTER TABLE public.mentor_profiles ADD CONSTRAINT mentor_profiles_user_id_key UNIQUE (user_id);