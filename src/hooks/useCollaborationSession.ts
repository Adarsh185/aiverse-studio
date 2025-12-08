import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

export interface CollaborationSession {
  id: string;
  host_id: string;
  name: string;
  code_content: string;
  code_language: string;
  max_participants: number;
  created_at: string;
}

export interface SessionMessage {
  id: string;
  session_id: string;
  user_id: string;
  user_email: string;
  content: string;
  is_ai_response: boolean;
  created_at: string;
}

export interface SessionParticipant {
  id: string;
  session_id: string;
  user_id: string;
  joined_at: string;
}

export interface SessionInvite {
  id: string;
  session_id: string;
  email: string;
  status: string;
  invited_by: string;
  created_at: string;
}

export const useCollaborationSession = (user: User | null) => {
  const [sessions, setSessions] = useState<CollaborationSession[]>([]);
  const [currentSession, setCurrentSession] = useState<CollaborationSession | null>(null);
  const [messages, setMessages] = useState<SessionMessage[]>([]);
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [invites, setInvites] = useState<SessionInvite[]>([]);
  const [pendingInvites, setPendingInvites] = useState<SessionInvite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadSessions = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("collaboration_sessions")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setSessions(data);
    }
  }, [user]);

  const loadPendingInvites = useCallback(async () => {
    if (!user?.email) return;

    const { data, error } = await supabase
      .from("session_invites")
      .select("*")
      .eq("email", user.email)
      .eq("status", "pending");

    if (!error && data) {
      setPendingInvites(data);
    }
  }, [user?.email]);

  const createSession = async (name: string) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from("collaboration_sessions")
      .insert({
        host_id: user.id,
        name,
        code_content: "// Start coding here...\nconsole.log('Hello, World!');",
        code_language: "javascript",
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: "Failed to create session", variant: "destructive" });
      return null;
    }

    await loadSessions();
    return data;
  };

  const joinSession = async (sessionId: string) => {
    if (!user) return;
    setIsLoading(true);

    // First check if already a participant or host
    const { data: session } = await supabase
      .from("collaboration_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (!session) {
      toast({ title: "Error", description: "Session not found", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    // Check participant count
    const { count } = await supabase
      .from("session_participants")
      .select("*", { count: "exact", head: true })
      .eq("session_id", sessionId);

    if ((count || 0) >= session.max_participants) {
      toast({ title: "Error", description: "Session is full (max 4 participants)", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    // Add as participant if not host
    if (session.host_id !== user.id) {
      await supabase
        .from("session_participants")
        .upsert({ session_id: sessionId, user_id: user.id });
    }

    setCurrentSession(session);
    await loadSessionData(sessionId);
    setIsLoading(false);
  };

  const loadSessionData = async (sessionId: string) => {
    // Load messages
    const { data: msgs } = await supabase
      .from("session_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (msgs) setMessages(msgs);

    // Load participants
    const { data: parts } = await supabase
      .from("session_participants")
      .select("*")
      .eq("session_id", sessionId);

    if (parts) setParticipants(parts);

    // Load invites
    const { data: invs } = await supabase
      .from("session_invites")
      .select("*")
      .eq("session_id", sessionId);

    if (invs) setInvites(invs);
  };

  const inviteByEmail = async (email: string) => {
    if (!user || !currentSession) return;

    // Check if already invited
    const existing = invites.find((i) => i.email === email);
    if (existing) {
      toast({ title: "Already invited", description: `${email} has already been invited` });
      return;
    }

    // Check participant limit
    const totalInvited = invites.filter((i) => i.status !== "declined").length + participants.length;
    if (totalInvited >= currentSession.max_participants) {
      toast({ title: "Limit reached", description: "Maximum 4 collaborators allowed", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from("session_invites")
      .insert({
        session_id: currentSession.id,
        email,
        invited_by: user.id,
      });

    if (error) {
      toast({ title: "Error", description: "Failed to send invite", variant: "destructive" });
    } else {
      // Find the invited user and create notification
      const { data: invitedUser } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (invitedUser) {
        await supabase.from("notifications").insert({
          user_id: invitedUser.id,
          type: "invite",
          title: "Collaboration Invite",
          message: `${user.email} invited you to join "${currentSession.name}"`,
          data: { session_id: currentSession.id, inviter_email: user.email },
        });
      }

      toast({ title: "Invite sent", description: `Invitation sent to ${email}` });
      await loadSessionData(currentSession.id);
    }
  };

  const acceptInvite = async (inviteId: string, sessionId: string) => {
    if (!user) return;

    await supabase
      .from("session_invites")
      .update({ status: "accepted" })
      .eq("id", inviteId);

    await supabase
      .from("session_participants")
      .insert({ session_id: sessionId, user_id: user.id });

    await loadPendingInvites();
    await loadSessions();
    await joinSession(sessionId);
  };

  const declineInvite = async (inviteId: string) => {
    await supabase
      .from("session_invites")
      .update({ status: "declined" })
      .eq("id", inviteId);

    await loadPendingInvites();
  };

  const sendMessage = async (content: string) => {
    if (!user || !currentSession) return;

    const { error } = await supabase
      .from("session_messages")
      .insert({
        session_id: currentSession.id,
        user_id: user.id,
        user_email: user.email || "Anonymous",
        content,
        is_ai_response: false,
      });

    if (error) {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    }
  };

  const sendAIMessage = async (content: string) => {
    if (!currentSession) return;

    // Insert AI response placeholder
    await supabase
      .from("session_messages")
      .insert({
        session_id: currentSession.id,
        user_id: "00000000-0000-0000-0000-000000000000",
        user_email: "AI Assistant",
        content,
        is_ai_response: true,
      });
  };

  const updateCode = async (code: string) => {
    if (!currentSession) return;

    await supabase
      .from("collaboration_sessions")
      .update({ code_content: code, updated_at: new Date().toISOString() })
      .eq("id", currentSession.id);
  };

  const updateLanguage = async (language: string) => {
    if (!currentSession) return;

    await supabase
      .from("collaboration_sessions")
      .update({ code_language: language })
      .eq("id", currentSession.id);
  };

  const leaveSession = async () => {
    if (!user || !currentSession) return;

    if (currentSession.host_id !== user.id) {
      await supabase
        .from("session_participants")
        .delete()
        .eq("session_id", currentSession.id)
        .eq("user_id", user.id);
    }

    setCurrentSession(null);
    setMessages([]);
    setParticipants([]);
  };

  const deleteSession = async (sessionId: string) => {
    await supabase
      .from("collaboration_sessions")
      .delete()
      .eq("id", sessionId);

    if (currentSession?.id === sessionId) {
      setCurrentSession(null);
    }
    await loadSessions();
  };

  useEffect(() => {
    if (user) {
      loadSessions();
      loadPendingInvites();
    }
  }, [user, loadSessions, loadPendingInvites]);

  // Realtime subscriptions
  useEffect(() => {
    if (!currentSession) return;

    const messagesChannel = supabase
      .channel(`session-messages-${currentSession.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "session_messages",
          filter: `session_id=eq.${currentSession.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as SessionMessage]);
        }
      )
      .subscribe();

    const sessionChannel = supabase
      .channel(`session-code-${currentSession.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "collaboration_sessions",
          filter: `id=eq.${currentSession.id}`,
        },
        (payload) => {
          setCurrentSession(payload.new as CollaborationSession);
        }
      )
      .subscribe();

    const participantsChannel = supabase
      .channel(`session-participants-${currentSession.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "session_participants",
          filter: `session_id=eq.${currentSession.id}`,
        },
        () => {
          loadSessionData(currentSession.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(sessionChannel);
      supabase.removeChannel(participantsChannel);
    };
  }, [currentSession?.id]);

  return {
    sessions,
    currentSession,
    messages,
    participants,
    invites,
    pendingInvites,
    isLoading,
    createSession,
    joinSession,
    inviteByEmail,
    acceptInvite,
    declineInvite,
    sendMessage,
    sendAIMessage,
    updateCode,
    updateLanguage,
    leaveSession,
    deleteSession,
    loadSessions,
  };
};
