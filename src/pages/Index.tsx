import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sparkles, MessageSquare, Image, Video, Code, Users } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  const features = [
    {
      icon: MessageSquare,
      title: "AI Chat",
      description: "Intelligent conversations",
    },
    {
      icon: Image,
      title: "Image Generation",
      description: "Create stunning visuals",
    },
    {
      icon: Users,
      title: "Collaboration",
      description: "Real-time teamwork",
    },
    {
      icon: Video,
      title: "Video Creation",
      description: "Generate AI videos",
    },
    {
      icon: Code,
      title: "Code Editor",
      description: "Collaborative coding",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-20 animate-fade-in">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Sparkles className="h-10 w-10 text-primary" />
              <h1 className="text-5xl font-bold tracking-tight">AIverse</h1>
            </div>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Your comprehensive AI workspace. Chat, create, code, and collaborate
              with cutting-edge artificial intelligence.
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" onClick={() => navigate("/auth")}>
                Get Started
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
                Sign In
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-20">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="p-6 rounded-xl border border-border bg-card transition-smooth hover:shadow-md animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>

          {/* CTA Section */}
          <div className="text-center p-12 rounded-2xl bg-primary/5 border border-border animate-fade-in">
            <h2 className="text-3xl font-bold mb-4">Ready to explore AI?</h2>
            <p className="text-muted-foreground mb-6">
              Join AIverse today and unlock the full potential of artificial intelligence
            </p>
            <Button size="lg" onClick={() => navigate("/auth")}>
              Create Your Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
