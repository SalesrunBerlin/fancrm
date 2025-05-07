
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }
  
  try {
    // Create a Supabase client with the Auth context of the logged in user
    const authHeader = req.headers.get("Authorization")!;
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    
    // Check if the user calling the function is an admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Nicht authentifiziert" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    // Check if the user is an admin
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      return new Response(
        JSON.stringify({ error: "Fehler bei der Benutzerüberprüfung" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const isAdmin = profileData.role === "admin" || profileData.role === "SuperAdmin" || profileData.role === "superadmin";
    
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Keine Berechtigung zum Erstellen von Benutzern" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    // Parse the request body
    const { email, password, first_name, last_name, workspace_id, metadata_access = true, data_access = false } = await req.json();
    
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "E-Mail und Passwort sind erforderlich" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Create the user with admin rights
    const { data: functionData, error: functionError } = await supabase.rpc(
      'admin_create_user',
      {
        email,
        password,
        first_name,
        last_name,
        workspace_id,
        metadata_access,
        data_access
      }
    );
    
    if (functionError) {
      return new Response(
        JSON.stringify({ error: functionError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    // Return the user ID
    return new Response(
      JSON.stringify({ 
        id: functionData,
        message: "Benutzer erfolgreich erstellt" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error:", error.message);
    return new Response(
      JSON.stringify({ error: "Interner Serverfehler: " + error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
