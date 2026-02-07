
-- 2. Add phone number fields to mentee_profiles
ALTER TABLE public.mentee_profiles 
ADD COLUMN IF NOT EXISTS student_phone text,
ADD COLUMN IF NOT EXISTS guardian_phone text;

-- 3. Create organizational hierarchy table
CREATE TABLE IF NOT EXISTS public.organizational_hierarchy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  superior_id uuid NOT NULL,
  subordinate_id uuid NOT NULL,
  superior_role public.app_role NOT NULL,
  subordinate_role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(superior_id, subordinate_id)
);

-- Enable RLS
ALTER TABLE public.organizational_hierarchy ENABLE ROW LEVEL SECURITY;

-- RLS policies for organizational_hierarchy
CREATE POLICY "Admin can manage hierarchy"
ON public.organizational_hierarchy
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their hierarchy"
ON public.organizational_hierarchy
FOR SELECT
USING (auth.uid() = superior_id OR auth.uid() = subordinate_id);

-- Dean/HOD view policies
CREATE POLICY "Dean can view all profiles"
ON public.profiles FOR SELECT
USING (public.has_role(auth.uid(), 'dean'));

CREATE POLICY "HOD can view all profiles"
ON public.profiles FOR SELECT
USING (public.has_role(auth.uid(), 'hod'));

CREATE POLICY "Dean can view all mentee profiles"
ON public.mentee_profiles FOR SELECT
USING (public.has_role(auth.uid(), 'dean'));

CREATE POLICY "HOD can view all mentee profiles"
ON public.mentee_profiles FOR SELECT
USING (public.has_role(auth.uid(), 'hod'));

CREATE POLICY "Dean can view all mentor profiles"
ON public.mentor_profiles FOR SELECT
USING (public.has_role(auth.uid(), 'dean'));

CREATE POLICY "HOD can view all mentor profiles"
ON public.mentor_profiles FOR SELECT
USING (public.has_role(auth.uid(), 'hod'));

CREATE POLICY "Dean can view all requests"
ON public.mentorship_requests FOR SELECT
USING (public.has_role(auth.uid(), 'dean'));

CREATE POLICY "HOD can view all requests"
ON public.mentorship_requests FOR SELECT
USING (public.has_role(auth.uid(), 'hod'));

CREATE POLICY "Dean can view all queries"
ON public.mentee_queries FOR SELECT
USING (public.has_role(auth.uid(), 'dean'));

CREATE POLICY "HOD can view all queries"
ON public.mentee_queries FOR SELECT
USING (public.has_role(auth.uid(), 'hod'));

CREATE POLICY "Dean can view all mentorships"
ON public.active_mentorships FOR SELECT
USING (public.has_role(auth.uid(), 'dean'));

CREATE POLICY "HOD can view all mentorships"
ON public.active_mentorships FOR SELECT
USING (public.has_role(auth.uid(), 'hod'));

CREATE POLICY "Dean can view all user roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'dean'));

CREATE POLICY "HOD can view all user roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'hod'));
