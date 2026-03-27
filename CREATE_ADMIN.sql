-- ================================================
-- CREATE ADMIN USER AND PROFILE SCRIPT
-- ================================================

-- 1. Create the user in Supabase Auth (This handles the password hashing correctly)
-- We use a do block to handle the potential existence of the user
DO $$
DECLARE
  new_user_id UUID := gen_random_uuid();
BEGIN
  -- Only insert if the user doesn't exist
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'ETadminAi@gamil.com') THEN
    INSERT INTO auth.users (
      id, 
      email, 
      encrypted_password, 
      email_confirmed_at, 
      raw_app_meta_data, 
      raw_user_meta_data, 
      created_at, 
      updated_at, 
      role, 
      aud,
      instance_id
    )
    VALUES (
      new_user_id,
      'ETadminAi@gamil.com',
      -- This is the hash for 'Admin123'
      crypt('Admin123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"display_name":"ET Admin"}',
      now(),
      now(),
      'authenticated',
      'authenticated',
      '00000000-0000-0000-0000-000000000000'
    );

    -- 2. Create the profile and set as admin
    INSERT INTO public.profiles (user_id, display_name, is_admin, updated_at)
    VALUES (new_user_id, 'ET Admin', true, now());

    RAISE NOTICE 'Admin user created successfully with ID: %', new_user_id;
  ELSE
    -- If user exists, just make sure they are an admin
    UPDATE public.profiles 
    SET is_admin = true 
    WHERE user_id = (SELECT id FROM auth.users WHERE email = 'ETadminAi@gamil.com');
    
    RAISE NOTICE 'User already existed. Admin privileges updated.';
  END IF;
END $$;
