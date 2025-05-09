
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
    
    // Check if the user calling the function is authenticated
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

    // Allow both admin and superadmin roles
    const isAdmin = profileData.role === "admin" || profileData.role === "SuperAdmin" || profileData.role === "superadmin";
    
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Keine Berechtigung zum Erstellen von Benutzern" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    // Parse the request body
    const { email, password, first_name, last_name, workspace_id, metadata_access = true, data_access = false } = await req.json();
    
    // Find or create a workspace
    let finalWorkspaceId = workspace_id;
    
    if (!finalWorkspaceId) {
      console.log("No workspace provided, checking for existing workspaces...");
      
      // Check if admin has any workspaces
      const { data: existingWorkspaces, error: workspaceError } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1);
      
      if (workspaceError) {
        console.error("Error checking existing workspaces:", workspaceError);
      }
      
      if (existingWorkspaces && existingWorkspaces.length > 0) {
        console.log("Using existing workspace:", existingWorkspaces[0].id);
        finalWorkspaceId = existingWorkspaces[0].id;
      } else {
        console.log("No existing workspaces found, creating a new default workspace");
        
        // Create a new default workspace
        const { data: newWorkspace, error: createWorkspaceError } = await supabase
          .from('workspaces')
          .insert({
            name: `${profileData.first_name || 'Default'}'s Workspace`,
            description: 'Default workspace created automatically',
            owner_id: user.id
          })
          .select('id')
          .single();
        
        if (createWorkspaceError) {
          return new Response(
            JSON.stringify({ error: "Fehler beim Erstellen des Workspace: " + createWorkspaceError.message }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
          );
        }
        
        finalWorkspaceId = newWorkspace.id;
        console.log("Created new workspace:", finalWorkspaceId);
      }
    }
    
    // Create the user with admin rights
    const { data: functionData, error: functionError } = await supabase.rpc(
      'admin_create_user',
      {
        email,
        password,
        first_name,
        last_name,
        workspace_id: finalWorkspaceId,
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
    
    // Get the created user's email for confirmation
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('email, screen_name')
      .eq('id', functionData)
      .single();

    const userEmail = userData?.email || email;
    
    // Update created_by field to link this user to the current admin
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ created_by: user.id })
      .eq('id', functionData);
      
    if (updateError) {
      console.error("Failed to update created_by field:", updateError);
      // Continue even if this fails, as the user has been created
    }
    
    // Return the user ID and email
    return new Response(
      JSON.stringify({ 
        id: functionData,
        email: userEmail,
        screen_name: userData?.screen_name || first_name,
        message: "Benutzer erfolgreich erstellt",
        workspace_id: finalWorkspaceId
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
