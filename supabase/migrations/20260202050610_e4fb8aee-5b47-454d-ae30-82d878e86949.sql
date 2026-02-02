-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('mentee', 'mentor', 'admin');

-- Create enum for mentor types
CREATE TYPE public.mentor_type AS ENUM ('senior', 'alumni', 'faculty');

-- Create enum for request status
CREATE TYPE public.request_status AS ENUM ('pending', 'accepted', 'rejected');

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    role app_role NOT NULL DEFAULT 'mentee',
    full_name TEXT,
    avatar_url TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mentee profiles table
CREATE TABLE public.mentee_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    course TEXT,
    specialisation TEXT,
    year TEXT,
    semester TEXT,
    section TEXT,
    interests TEXT[],
    career_goals TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mentor profiles table
CREATE TABLE public.mentor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    mentor_type mentor_type NOT NULL DEFAULT 'senior',
    bio TEXT,
    expertise TEXT[],
    areas_of_guidance TEXT[],
    experience TEXT,
    is_available BOOLEAN DEFAULT true,
    max_mentees INTEGER DEFAULT 5,
    current_mentees INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mentorship requests table
CREATE TABLE public.mentorship_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    mentor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    introduction TEXT NOT NULL,
    goals TEXT NOT NULL,
    status request_status DEFAULT 'pending',
    rejection_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create active mentorships table
CREATE TABLE public.active_mentorships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    mentor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(mentee_id, mentor_id)
);

-- Create user_roles table for admin roles
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentee_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_mentorships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Mentee profiles policies
CREATE POLICY "Users can view all mentee profiles"
ON public.mentee_profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their own mentee profile"
ON public.mentee_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mentee profile"
ON public.mentee_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Mentor profiles policies
CREATE POLICY "Users can view all mentor profiles"
ON public.mentor_profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their own mentor profile"
ON public.mentor_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mentor profile"
ON public.mentor_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Mentorship requests policies
CREATE POLICY "Mentees can view their own requests"
ON public.mentorship_requests FOR SELECT
TO authenticated
USING (auth.uid() = mentee_id OR auth.uid() = mentor_id);

CREATE POLICY "Mentees can create requests"
ON public.mentorship_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = mentee_id);

CREATE POLICY "Mentors can update requests they received"
ON public.mentorship_requests FOR UPDATE
TO authenticated
USING (auth.uid() = mentor_id);

-- Active mentorships policies
CREATE POLICY "Users can view their active mentorships"
ON public.active_mentorships FOR SELECT
TO authenticated
USING (auth.uid() = mentee_id OR auth.uid() = mentor_id);

CREATE POLICY "System can create active mentorships"
ON public.active_mentorships FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = mentor_id OR auth.uid() = mentee_id);

-- User roles policies
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mentee_profiles_updated_at
  BEFORE UPDATE ON public.mentee_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mentor_profiles_updated_at
  BEFORE UPDATE ON public.mentor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mentorship_requests_updated_at
  BEFORE UPDATE ON public.mentorship_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();