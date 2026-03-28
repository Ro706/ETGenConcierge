-- ================================================
-- DELETE SPECIFIC USERS SCRIPT
-- ================================================

-- This script deletes users from Supabase Auth and their associated profiles/registrations (via ON DELETE CASCADE).
-- Emails provided:
-- 1. rohitmandal21062004@gmail.com
-- 2. monidipa2106@gamil.com
-- 3. ro21062004@gamil.com

DO $$
BEGIN
  DELETE FROM auth.users 
  WHERE email IN (
    'rohitmandal21062004@gmail.com', 
    'monidipa2106@gamil.com', 
    'ro21062004@gamil.com'
  );

  RAISE NOTICE 'Users with emails rohitmandal21062004@gmail.com, monidipa2106@gamil.com, and ro21062004@gamil.com have been deleted from auth.users.';
END $$;
