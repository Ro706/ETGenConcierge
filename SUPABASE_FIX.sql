-- ==========================================
-- NUCLEAR FIX FOR SCHEMA CACHE ERROR
-- ==========================================

-- 1. Drop existing tables to ensure a clean state (Warning: This deletes existing data in these tables)
DROP TABLE IF EXISTS public.event_registrations;
DROP TABLE IF EXISTS public.events;
DROP TABLE IF EXISTS public.services;

-- 2. Create Services Table
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  match_goals TEXT[] NOT NULL DEFAULT '{}',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Create Events Table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  event_date TEXT NOT NULL,
  match_sectors TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Create Event Registrations
CREATE TABLE public.event_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- 5. Create Helper Function
CREATE OR REPLACE FUNCTION increment_service_views(service_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.services
  SET views_count = views_count + 1
  WHERE id = service_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Disable RLS (Simplest fix for local development/prototype)
ALTER TABLE public.services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations DISABLE ROW LEVEL SECURITY;

-- 7. FORCE POSTGREST TO RELOAD EVERYTHING
NOTIFY pgrst, 'reload schema';

-- ==========================================
-- END OF SCRIPT
-- ==========================================
