
-- Add view count to services
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- Create event registrations table
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can register themselves" ON public.event_registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can see their own registrations" ON public.event_registrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can see all registrations" ON public.event_registrations
  FOR ALL USING (auth.jwt()->>'email' = 'ETadminAi@gamil.com');

-- Function to increment service views
CREATE OR REPLACE FUNCTION increment_service_views(service_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.services
  SET views_count = views_count + 1
  WHERE id = service_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
