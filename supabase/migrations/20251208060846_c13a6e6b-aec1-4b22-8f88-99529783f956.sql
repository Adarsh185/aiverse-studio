-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view sessions they host or participate in" ON public.collaboration_sessions;
DROP POLICY IF EXISTS "Hosts can update their sessions" ON public.collaboration_sessions;
DROP POLICY IF EXISTS "Hosts can delete their sessions" ON public.collaboration_sessions;
DROP POLICY IF EXISTS "Users can create sessions" ON public.collaboration_sessions;

-- Recreate policies with fixed logic (no recursion)
CREATE POLICY "Users can view sessions they host or participate in" 
ON public.collaboration_sessions 
FOR SELECT 
USING (
  auth.uid() = host_id 
  OR id IN (SELECT session_id FROM session_participants WHERE user_id = auth.uid())
);

CREATE POLICY "Users can create sessions" 
ON public.collaboration_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update their sessions" 
ON public.collaboration_sessions 
FOR UPDATE 
USING (
  auth.uid() = host_id 
  OR id IN (SELECT session_id FROM session_participants WHERE user_id = auth.uid())
);

CREATE POLICY "Hosts can delete their sessions" 
ON public.collaboration_sessions 
FOR DELETE 
USING (auth.uid() = host_id);

-- Fix session_participants policy if needed
DROP POLICY IF EXISTS "Users can view participants of sessions they are in" ON public.session_participants;

CREATE POLICY "Users can view participants of sessions they are in" 
ON public.session_participants 
FOR SELECT 
USING (
  session_id IN (SELECT id FROM collaboration_sessions WHERE host_id = auth.uid())
  OR session_id IN (SELECT session_id FROM session_participants WHERE user_id = auth.uid())
);

-- Create notifications table for in-app notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'invite',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" 
ON public.notifications 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;