
-- Add is_admin column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create a policy to allow users to read their own admin status (already covered by existing profile policies usually, but let's be explicit)
-- Assuming there's a policy like "Profiles are viewable by users who created them"

-- Set the specific user as admin (optional but helpful for the user)
-- UPDATE public.profiles SET is_admin = true WHERE email = 'ETadminAi@gamil.com'; 
-- Note: Email might not be in profiles table, usually it's in auth.users joined by user_id.

-- Function to check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT is_admin FROM public.profiles WHERE user_id = $1;
$$ LANGUAGE plpgsql SECURITY DEFINER;
