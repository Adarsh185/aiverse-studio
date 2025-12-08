import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users } from "lucide-react";
import { useCollaborationSession } from "@/hooks/useCollaborationSession";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { SessionList } from "@/components/collaboration/SessionList";
import { CollaborativeWorkspace } from "@/components/collaboration/CollaborativeWorkspace";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";

const Collaborate = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  const {
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
  } = useCollaborationSession(user);

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications(user);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });
  }, [navigate]);

  const handleNotificationAction = async (notification: Notification) => {
    if (notification.type === "invite" && notification.data?.session_id) {
      // Reload sessions and pending invites
      await loadSessions();
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold">Collaboration</h1>
            </div>
          </div>
          <NotificationDropdown
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onDelete={deleteNotification}
            onClearAll={clearAll}
            onAction={handleNotificationAction}
          />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 animate-fade-in">
        {currentSession ? (
          <CollaborativeWorkspace
            session={currentSession}
            messages={messages}
            participants={participants}
            invites={invites}
            userId={user.id}
            userEmail={user.email || "Anonymous"}
            onLeave={leaveSession}
            onSendMessage={sendMessage}
            onSendAIMessage={sendAIMessage}
            onUpdateCode={updateCode}
            onUpdateLanguage={updateLanguage}
            onInvite={inviteByEmail}
          />
        ) : (
          <div className="max-w-3xl mx-auto">
            <SessionList
              sessions={sessions}
              pendingInvites={pendingInvites}
              onCreateSession={createSession}
              onJoinSession={joinSession}
              onDeleteSession={deleteSession}
              onAcceptInvite={acceptInvite}
              onDeclineInvite={declineInvite}
              userId={user.id}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default Collaborate;
