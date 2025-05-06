
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Log the request details to help debugging
    console.log("Request received for get-user-emails function");
    
    // Create a Supabase client with the service role key (which has admin privileges)
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: { persistSession: false }
      }
    );

    // Verify that the request is from an authenticated SuperAdmin user
    const authHeader = req.headers.get("Authorization");
    
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the user from the auth header
    const token = authHeader.replace("Bearer ", "");
    console.log("Verifying token");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      console.error("Invalid token or unauthorized:", userError);
      return new Response(
        JSON.stringify({ error: "Invalid token or unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("User verified, checking SuperAdmin role");
    
    // Check if the user is a SuperAdmin by querying the profiles table
    const { data: profileData, error: profileError } = await supabaseClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return new Response(
        JSON.stringify({ error: "Error fetching user profile" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Profile data:", profileData);

    if (!profileData || profileData.role !== "SuperAdmin") {
      console.error("User not SuperAdmin:", user.id, profileData?.role);
      return new Response(
        JSON.stringify({ error: "Only SuperAdmin users can access this function" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("SuperAdmin verified, fetching emails");

    // Instead of using the RPC, directly query the auth.users table
    try {
      // Query auth schema directly with service role key
      const { data: users, error: usersError } = await supabaseClient
        .from("auth_users_view")
        .select("id, email")
        .order("email");

      if (usersError) {
        console.error("Error fetching users:", usersError);
        return new Response(
          JSON.stringify({ error: usersError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Successfully fetched emails, count:", users?.length || 0);
      
      return new Response(
        JSON.stringify(users || []),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (fetchError) {
      console.error("Error fetching users:", fetchError);
      
      // Fallback to return at least some data
      return new Response(
        JSON.stringify([{ id: user.id, email: user.email }]),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
