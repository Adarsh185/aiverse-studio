import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Video, Loader2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

const VideoGen = () => {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [navigate]);

  const pollForResult = async (taskId: string) => {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max (5s intervals)

    const poll = async () => {
      attempts++;
      
      if (attempts > maxAttempts) {
        setLoading(false);
        setStatusMessage("");
        toast({
          variant: "destructive",
          title: "Timeout",
          description: "Video generation took too long. Please try again.",
        });
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke("generate-video", {
          body: { taskId },
        });

        if (error) throw error;

        console.log("Poll response:", data);

        // Check for task status
        if (data.task_status === "SUCCESS" || data.task_status === "COMPLETED") {
          // Video is ready
          const videoUrl = data.video_result?.[0]?.url || data.video_result?.url;
          
          if (videoUrl) {
            setGeneratedVideo(videoUrl);
            setLoading(false);
            setProgress(100);
            setStatusMessage("");
            toast({
              title: "Success!",
              description: "Your video has been generated.",
            });
          } else {
            throw new Error("No video URL in response");
          }
          return;
        } else if (data.task_status === "FAIL" || data.task_status === "FAILED") {
          throw new Error(data.message || "Video generation failed");
        } else {
          // Still processing
          setProgress(Math.min(attempts * 2, 90));
          setStatusMessage(`Processing... (${attempts * 5}s elapsed)`);
          pollingRef.current = setTimeout(poll, 5000);
        }
      } catch (error: any) {
        console.error("Polling error:", error);
        setLoading(false);
        setStatusMessage("");
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to check video status",
        });
      }
    };

    poll();
  };

  const generateVideo = async () => {
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setGeneratedVideo(null);
    setProgress(5);
    setStatusMessage("Starting video generation...");

    try {
      const { data, error } = await supabase.functions.invoke("generate-video", {
        body: { prompt },
      });

      if (error) throw error;

      if (data?.taskId) {
        setProgress(10);
        setStatusMessage("Video generation in progress...");
        pollForResult(data.taskId);
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error("Video generation error:", error);
      setLoading(false);
      setStatusMessage("");
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to generate video",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      generateVideo();
    }
  };

  const downloadVideo = () => {
    if (!generatedVideo) return;

    const link = document.createElement("a");
    link.href = generatedVideo;
    link.download = `aiverse-video-${Date.now()}.mp4`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            <Video className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold">Video Generation</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl animate-fade-in">
        <Card>
          <CardHeader>
            <CardTitle>Create AI Videos</CardTitle>
            <CardDescription>
              Describe your video scene and AI will bring it to life
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="prompt">Video Prompt</Label>
              <Input
                id="prompt"
                placeholder="A majestic eagle soaring through misty mountains at sunrise..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
              />
              <p className="text-sm text-muted-foreground">
                Describe motion, scenery, and atmosphere for best results
              </p>
            </div>

            {loading && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground text-center">{statusMessage}</p>
              </div>
            )}

            <Button
              onClick={generateVideo}
              disabled={loading || !prompt.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Video...
                </>
              ) : (
                <>
                  <Video className="mr-2 h-4 w-4" />
                  Generate Video
                </>
              )}
            </Button>

            {generatedVideo && (
              <div className="space-y-4 animate-fade-in">
                <div className="rounded-lg overflow-hidden border border-border bg-black">
                  <video
                    src={generatedVideo}
                    controls
                    autoPlay
                    loop
                    className="w-full h-auto"
                  />
                </div>
                <Button
                  onClick={downloadVideo}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Video
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default VideoGen;
