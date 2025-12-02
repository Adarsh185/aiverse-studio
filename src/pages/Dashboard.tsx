import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, 
  Image as ImageIcon, 
  Video, 
  Code, 
  LogOut,
  Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        navigate("/auth");
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You've been successfully signed out.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const features = [
    {
      title: "AI Chat",
      description: "Intelligent conversations powered by advanced AI",
      icon: MessageSquare,
      href: "/chat",
      available: true,
    },
    {
      title: "Image Generation",
      description: "Create stunning images from text descriptions",
      icon: ImageIcon,
      href: "/image",
      available: false,
    },
    {
      title: "Video Generation",
      description: "Generate videos using AI technology",
      icon: Video,
      href: "/video",
      available: false,
    },
    {
      title: "Code Editor",
      description: "Collaborative code editing with AI assistance",
      icon: Code,
      href: "/code",
      available: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">AIverse</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 animate-fade-in">
        <div className="mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-2">
            Welcome back, {user?.user_metadata?.full_name || "there"}
          </h2>
          <p className="text-muted-foreground">
            Choose an AI tool to get started
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className={`transition-smooth hover:shadow-md ${
                  feature.available ? "cursor-pointer" : "opacity-60"
                }`}
                onClick={() => feature.available && navigate(feature.href)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    {!feature.available && (
                      <span className="text-xs text-muted-foreground px-2 py-1 rounded-full bg-muted">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <CardTitle className="mt-4">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
