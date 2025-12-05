import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      throw new Error("Prompt is required and must be a string");
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    console.log("Generating image with Gemini, prompt:", prompt);

    // Use Gemini 2.5 Flash Image model
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            responseModalities: ["image", "text"],
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);

      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }
      if (response.status === 403) {
        throw new Error("API key invalid or access denied. Please check your Gemini API key.");
      }

      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Received response from Gemini");

    // Extract the base64 image from the response
    const parts = data.candidates?.[0]?.content?.parts;
    let imageData = null;

    if (parts) {
      for (const part of parts) {
        if (part.inlineData) {
          imageData = part.inlineData.data;
          break;
        }
      }
    }

    if (!imageData) {
      console.error("Unexpected response structure:", JSON.stringify(data));
      throw new Error("No image generated. The model may have returned text only.");
    }

    // Return as data URL
    const mimeType = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.mimeType || "image/png";
    const dataUrl = `data:${mimeType};base64,${imageData}`;

    return new Response(
      JSON.stringify({ image: dataUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Image generation error:", error);
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
