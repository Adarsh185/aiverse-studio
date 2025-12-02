import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Sparkles, Loader2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ImageGen = () => {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      }
    });
  }, [navigate]);

  const generateImage = async () => {
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setGeneratedImage(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: { prompt },
      });

      if (error) throw error;

      if (data?.image) {
        setGeneratedImage(data.image);
        toast({
          title: "Success!",
          description: "Your image has been generated.",
        });
      }
    } catch (error: any) {
      console.error("Image generation error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to generate image",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      generateImage();
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;

    const link = document.createElement("a");
    link.href = generatedImage;
    link.download = `aiverse-${Date.now()}.png`;
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
            <Sparkles className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold">Image Generation</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl animate-fade-in">
        <Card>
          <CardHeader>
            <CardTitle>Create AI Images</CardTitle>
            <CardDescription>
              Describe what you want to see and AI will generate it for you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="prompt">Image Prompt</Label>
              <Input
                id="prompt"
                placeholder="A serene sunset over mountains with a lake reflection..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
              />
              <p className="text-sm text-muted-foreground">
                Be detailed and descriptive for best results
              </p>
            </div>

            <Button
              onClick={generateImage}
              disabled={loading || !prompt.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Image
                </>
              )}
            </Button>

            {generatedImage && (
              <div className="space-y-4 animate-fade-in">
                <div className="rounded-lg overflow-hidden border border-border">
                  <img
                    src={generatedImage}
                    alt="Generated artwork"
                    className="w-full h-auto"
                  />
                </div>
                <Button
                  onClick={downloadImage}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Image
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ImageGen;
