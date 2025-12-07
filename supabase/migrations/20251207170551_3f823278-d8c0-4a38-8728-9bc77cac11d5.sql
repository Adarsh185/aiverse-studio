-- Create collaboration sessions table
CREATE TABLE public.collaboration_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Untitled Session',
  code_content TEXT DEFAULT '',
  code_language TEXT DEFAULT 'javascript',
  max_participants INTEGER DEFAULT 4,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create session invites table
CREATE TABLE public.session_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.collaboration_sessions(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  invited_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create session participants table
CREATE TABLE public.session_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.collaboration_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(session_id, user_id)
);

-- Create session messages table for shared chat
CREATE TABLE public.session_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.collaboration_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  content TEXT NOT NULL,
  is_ai_response BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.collaboration_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_messages ENABLE ROW LEVEL SECURITY;

-- Collaboration sessions policies
CREATE POLICY "Users can view sessions they host or participate in"
ON public.collaboration_sessions FOR SELECT
USING (
  auth.uid() = host_id OR
  EXISTS (SELECT 1 FROM public.session_participants WHERE session_id = id AND user_id = auth.uid())
);

CREATE POLICY "Users can create sessions"
ON public.collaboration_sessions FOR INSERT
WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update their sessions"
ON public.collaboration_sessions FOR UPDATE
USING (auth.uid() = host_id OR EXISTS (SELECT 1 FROM public.session_participants WHERE session_id = id AND user_id = auth.uid()));

CREATE POLICY "Hosts can delete their sessions"
ON public.collaboration_sessions FOR DELETE
USING (auth.uid() = host_id);

-- Session invites policies
CREATE POLICY "Users can view invites for sessions they host or are invited to"
ON public.session_invites FOR SELECT
USING (
  auth.uid() = invited_by OR
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

CREATE POLICY "Hosts can create invites"
ON public.session_invites FOR INSERT
WITH CHECK (auth.uid() = invited_by);

CREATE POLICY "Hosts can update invites"
ON public.session_invites FOR UPDATE
USING (auth.uid() = invited_by OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Hosts can delete invites"
ON public.session_invites FOR DELETE
USING (auth.uid() = invited_by);

-- Session participants policies
CREATE POLICY "Users can view participants of sessions they are in"
ON public.session_participants FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.collaboration_sessions WHERE id = session_id AND host_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.session_participants sp WHERE sp.session_id = session_participants.session_id AND sp.user_id = auth.uid())
);

CREATE POLICY "Users can join sessions they are invited to"
ON public.session_participants FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.collaboration_sessions WHERE id = session_id AND host_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.session_invites WHERE session_id = session_participants.session_id AND email = (SELECT email FROM auth.users WHERE id = auth.uid()) AND status = 'accepted')
);

CREATE POLICY "Users can leave sessions"
ON public.session_participants FOR DELETE
USING (user_id = auth.uid());

-- Session messages policies
CREATE POLICY "Participants can view session messages"
ON public.session_messages FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.collaboration_sessions WHERE id = session_id AND host_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.session_participants WHERE session_id = session_messages.session_id AND user_id = auth.uid())
);

CREATE POLICY "Participants can create messages"
ON public.session_messages FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND (
    EXISTS (SELECT 1 FROM public.collaboration_sessions WHERE id = session_id AND host_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.session_participants WHERE session_id = session_messages.session_id AND user_id = auth.uid())
  )
);

-- Enable realtime for collaboration tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.collaboration_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_participants;

-- Create updated_at trigger for sessions
CREATE TRIGGER update_collaboration_sessions_updated_at
BEFORE UPDATE ON public.collaboration_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();