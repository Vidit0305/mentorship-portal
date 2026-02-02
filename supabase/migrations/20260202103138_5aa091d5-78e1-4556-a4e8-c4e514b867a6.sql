-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved function that handles role from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Get role from user metadata, default to 'mentee'
  user_role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'mentee');
  
  -- Insert into profiles with the correct role
  INSERT INTO public.profiles (user_id, email, role)
  VALUES (NEW.id, NEW.email, user_role);
  
  -- Insert into user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  -- If the user is a mentor, create their mentor profile
  IF user_role = 'mentor' THEN
    INSERT INTO public.mentor_profiles (user_id, mentor_type, is_available, max_mentees, current_mentees)
    VALUES (NEW.id, 'senior', true, 5, 0);
  END IF;
  
  -- If the user is a mentee, create their mentee profile
  IF user_role = 'mentee' THEN
    INSERT INTO public.mentee_profiles (user_id)
    VALUES (NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();