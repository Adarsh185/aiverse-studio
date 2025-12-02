import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, Circle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RealtimeChannel } from "@supabase/supabase-js";

interface PresenceState {
  user_id: string;
  email: string;
  online_at: string;
}

const Collaborate = () => {
  const [user, setUser] = useState<User | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<PresenceState[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        navigate("/auth");
      } else {
        setUser(session.user);
        setupPresence(session.user);
      }
    });

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [navigate]);

  const setupPresence = (currentUser: User) => {
    const collaborationChannel = supabase.channel("collaboration-room", {
      config: {
        presence: {
          key: currentUser.id,
        },
      },
    });

    collaborationChannel
      .on("presence", { event: "sync" }, () => {
        const state = collaborationChannel.presenceState();
        const users: PresenceState[] = [];
        
        Object.keys(state).forEach((key) => {
          const presences = state[key] as any[];
          if (presences && presences.length > 0) {
            const presence = presences[0] as PresenceState;
            if (presence.user_id && presence.email) {
              users.push(presence);
            }
          }
        });
        
        setOnlineUsers(users);
      })
      .on("presence", { event: "join" }, ({ newPresences }) => {
        console.log("User joined:", newPresences);
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        console.log("User left:", leftPresences);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          const presenceTrackStatus = await collaborationChannel.track({
            user_id: currentUser.id,
            email: currentUser.email || "Anonymous",
            online_at: new Date().toISOString(),
          });
          console.log("Presence track status:", presenceTrackStatus);
        }
      });

    setChannel(collaborationChannel);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold">Collaboration</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl animate-fade-in">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Real-Time Collaboration</CardTitle>
              <CardDescription>
                See who's online and collaborate in real-time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Active Users</p>
                      <p className="text-sm text-muted-foreground">
                        Currently in this workspace
                      </p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold">{onlineUsers.length}</div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Online Now
                  </h3>
                  {onlineUsers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No other users online
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {onlineUsers.map((presence) => (
                        <div
                          key={presence.user_id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card transition-smooth hover:shadow-sm"
                        >
                          <Circle
                            className="h-3 w-3 fill-green-500 text-green-500"
                            aria-label="Online"
                          />
                          <div className="flex-1">
                            <p className="font-medium">
                              {presence.email}
                              {presence.user_id === user?.id && (
                                <span className="ml-2 text-xs text-muted-foreground">
                                  (You)
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Online since {new Date(presence.online_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Collaboration Features</CardTitle>
              <CardDescription>Work together in real-time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-border">
                  <h4 className="font-semibold mb-2">Real-Time Presence</h4>
                  <p className="text-sm text-muted-foreground">
                    See who's currently online in your workspace. Perfect for coordinating
                    with team members.
                  </p>
                </div>
                <div className="p-4 rounded-lg border border-border opacity-60">
                  <h4 className="font-semibold mb-2">Shared Workspace (Coming Soon)</h4>
                  <p className="text-sm text-muted-foreground">
                    Collaborate on projects in real-time with shared cursors and live updates.
                  </p>
                </div>
                <div className="p-4 rounded-lg border border-border opacity-60">
                  <h4 className="font-semibold mb-2">Team Chat (Coming Soon)</h4>
                  <p className="text-sm text-muted-foreground">
                    Communicate with your team directly within the collaboration space.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Collaborate;
