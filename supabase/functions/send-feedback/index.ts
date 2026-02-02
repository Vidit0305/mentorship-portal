import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FeedbackRequest {
  rating: number;
  feedback: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { rating, feedback }: FeedbackRequest = await req.json();

    if (!rating || rating < 1 || rating > 5) {
      return new Response(
        JSON.stringify({ error: "Rating must be between 1 and 5" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use Lovable AI to send an email-like notification
    // Since we don't have a direct email service, we'll use the AI gateway to format and log the feedback
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Format the feedback message
    const feedbackMessage = `
IILM University Mentorship Portal Feedback
==========================================
Rating: ${"⭐".repeat(rating)} (${rating}/5)
Message: ${feedback || "No additional comments"}
Timestamp: ${new Date().toISOString()}
==========================================
    `.trim();

    // Log the feedback (in production, you'd send this via an email service)
    console.log("Feedback received:", feedbackMessage);

    // Use AI to generate a confirmation response
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that confirms feedback was received. Keep responses brief and friendly."
          },
          {
            role: "user", 
            content: `Generate a short, friendly confirmation message (1-2 sentences) for someone who just submitted ${rating}/5 star feedback for a mentorship portal.`
          }
        ],
        max_tokens: 100,
      }),
    });

    const aiData = await aiResponse.json();
    const confirmationMessage = aiData.choices?.[0]?.message?.content || "Thank you for your valuable feedback!";

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: confirmationMessage,
        feedbackId: crypto.randomUUID()
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing feedback:", error);
    return new Response(
      JSON.stringify({ error: "Failed to submit feedback" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
