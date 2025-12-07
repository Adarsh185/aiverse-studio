import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Users, Trash2, LogIn } from "lucide-react";
import { CollaborationSession, SessionInvite } from "@/hooks/useCollaborationSession";

interface SessionListProps {
  sessions: CollaborationSession[];
  pendingInvites: SessionInvite[];
  onCreateSession: (name: string) => Promise<CollaborationSession | null>;
  onJoinSession: (sessionId: string) => Promise<void>;
  onDeleteSession: (sessionId: string) => Promise<void>;
  onAcceptInvite: (inviteId: string, sessionId: string) => Promise<void>;
  onDeclineInvite: (inviteId: string) => Promise<void>;
  userId: string;
}

export const SessionList = ({
  sessions,
  pendingInvites,
  onCreateSession,
  onJoinSession,
  onDeleteSession,
  onAcceptInvite,
  onDeclineInvite,
  userId,
}: SessionListProps) => {
  const [newSessionName, setNewSessionName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!newSessionName.trim()) return;
    setIsCreating(true);
    const session = await onCreateSession(newSessionName);
    if (session) {
      await onJoinSession(session.id);
    }
    setNewSessionName("");
    setIsDialogOpen(false);
    setIsCreating(false);
  };

  return (
    <div className="space-y-6">
      {pendingInvites.length > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">Pending Invitations</CardTitle>
            <CardDescription>You've been invited to collaborate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
              >
                <span className="text-sm">Session Invite</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => onAcceptInvite(invite.id, invite.session_id)}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDeclineInvite(invite.id)}
                  >
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Your Sessions</CardTitle>
            <CardDescription>Create or join collaboration sessions</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Session
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Session</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input
                  placeholder="Session name..."
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
                <Button onClick={handleCreate} disabled={isCreating} className="w-full">
                  {isCreating ? "Creating..." : "Create Session"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No sessions yet. Create one to start collaborating!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium">{session.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {session.host_id === userId ? "Host" : "Participant"} •{" "}
                      {new Date(session.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => onJoinSession(session.id)}>
                      <LogIn className="h-4 w-4 mr-2" />
                      Join
                    </Button>
                    {session.host_id === userId && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onDeleteSession(session.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
