import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.21.4";

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Define the feedback item schema
const FeedbackItemSchema = z.object({
  url: z.string().url(),
  field_type: z.enum(["company", "address", "phone", "email", "ceo"]),
  initial_value: z.string().optional(),
  correct_value: z.string().optional(),
  extraction_method: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  html_snippet: z.string().max(10240).optional(), // Max 10KB
});

// Define the schema for the array of feedback items
const FeedbackPayloadSchema = z.array(FeedbackItemSchema);

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the service role key (needed to use the API on behalf of the user)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Error getting user" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the request payload
    const payload = await req.json();
    const result = FeedbackPayloadSchema.safeParse(payload);

    if (!result.success) {
      return new Response(
        JSON.stringify({ error: "Invalid payload", details: result.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate a user hash (for privacy)
    const userHash = await generateUserHash(user.id);

    // Filter out feedback items where initial_value === correct_value (no signal)
    const feedbackItems = result.data.filter(
      (item) => item.initial_value !== item.correct_value && item.initial_value !== null && item.correct_value !== null
    );

    if (feedbackItems.length === 0) {
      return new Response(
        JSON.stringify({ message: "No significant feedback to log" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize HTML snippets to avoid storing PII
    const sanitizedItems = feedbackItems.map((item) => ({
      ...item,
      user_hash: userHash,
      html_snippet: item.html_snippet ? sanitizeHtmlSnippet(item.html_snippet) : null,
    }));

    // Insert the feedback items into the database
    const { error: insertError } = await supabaseClient
      .from("scraper_feedback")
      .insert(sanitizedItems);

    if (insertError) {
      console.error("Error inserting feedback:", insertError);
      return new Response(
        JSON.stringify({ error: "Error inserting feedback", details: insertError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ message: `Successfully logged ${sanitizedItems.length} feedback items` }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Unexpected error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Generate a user hash to anonymize feedback while still being able to group by user
async function generateUserHash(userId: string): Promise<string> {
  const salt = Deno.env.get("USER_HASH_SALT") || "impressum-scraper-feedback";
  const encoder = new TextEncoder();
  const data = encoder.encode(userId + salt);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Sanitize HTML snippet to remove PII like emails
function sanitizeHtmlSnippet(html: string): string {
  if (!html) return "";

  // Truncate to 10KB if larger
  let sanitized = html.length > 10240 ? html.substring(0, 10240) : html;

  // Replace email addresses with <EMAIL>
  sanitized = sanitized.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "<EMAIL>");

  // Other PII sanitization could be added here as needed

  return sanitized;
}
