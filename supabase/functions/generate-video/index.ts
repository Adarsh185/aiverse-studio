import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BIGMODEL_API_URL = "https://open.bigmodel.cn/api/paas/v4/videos/generations";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, taskId } = await req.json();
    const BIGMODEL_API_KEY = Deno.env.get("BIGMODEL_API_KEY");
    
    if (!BIGMODEL_API_KEY) {
      throw new Error("BIGMODEL_API_KEY is not configured");
    }

    // If taskId is provided, check the status
    if (taskId) {
      console.log("Checking status for task:", taskId);
      
      const statusResponse = await fetch(`https://open.bigmodel.cn/api/paas/v4/async-result/${taskId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${BIGMODEL_API_KEY}`,
        },
      });

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        console.error("Status check error:", statusResponse.status, errorText);
        throw new Error(`Status check failed: ${statusResponse.status}`);
      }

      const statusData = await statusResponse.json();
      console.log("Status response:", JSON.stringify(statusData));

      return new Response(
        JSON.stringify(statusData),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Start new video generation
    if (!prompt || typeof prompt !== "string") {
      throw new Error("Prompt is required and must be a string");
    }

    console.log("Starting video generation with prompt:", prompt);

    const response = await fetch(BIGMODEL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${BIGMODEL_API_KEY}`,
      },
      body: JSON.stringify({
        model: "cogvideox",
        prompt: prompt,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("BigModel API error:", response.status, errorText);

      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }

      throw new Error(`BigModel API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Generation started:", JSON.stringify(data));

    return new Response(
      JSON.stringify({ 
        taskId: data.id,
        status: "processing",
        message: "Video generation started"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Video generation error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
