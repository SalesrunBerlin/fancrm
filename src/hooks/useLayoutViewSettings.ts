
import { useState, useEffect, useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useLayoutViewSettings(objectTypeId: string | undefined) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const isLoggedIn = !!user;
  
  // Local storage as fallback or for non-authenticated users
  const localStorageKey = objectTypeId ? `layout-settings-${objectTypeId}` : '';
  const [localViewMode, setLocalViewMode] = useLocalStorage<"table" | "kanban">(localStorageKey, "table");
  
  // State for server-side settings
  const [serverViewMode, setServerViewMode] = useState<"table" | "kanban">("table");
  const [isLoading, setIsLoading] = useState(true);
  
  // Function to safely parse JSON if needed
  const safeParseJSON = (data: any): { viewMode?: "table" | "kanban" } => {
    if (!data) return {};
    
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error('Error parsing settings JSON:', e);
        return {};
      }
    }
    
    return data as { viewMode?: "table" | "kanban" };
  };
  
  // Function to load settings from server if user is logged in
  const loadServerSettings = useCallback(async () => {
    if (!isLoggedIn || !objectTypeId || isAuthLoading) return;
    
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('user_view_settings')
        .select('settings_data')
        .eq('user_id', user.id)
        .eq('object_type_id', objectTypeId)
        .eq('settings_type', 'layout')
        .maybeSingle();
      
      if (error) {
        console.error("Error loading layout settings:", error);
      } else if (data) {
        const parsedSettings = safeParseJSON(data.settings_data);
        
        if (parsedSettings && parsedSettings.viewMode) {
          console.log("Loaded layout settings:", parsedSettings);
          setServerViewMode(parsedSettings.viewMode);
        } else {
          console.log("No valid layout settings found, using local settings:", localViewMode);
          // If no settings found on server but we have local settings, let's use those
          await updateViewMode(localViewMode);
        }
      } else {
        console.log("No layout settings found, using local settings:", localViewMode);
        // If no settings found on server but we have local settings, let's use those
        await updateViewMode(localViewMode);
      }
    } catch (error) {
      console.error("Failed to load layout settings:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, objectTypeId, user?.id, isAuthLoading, localViewMode]);

  // Load server settings on mount and when dependencies change
  useEffect(() => {
    loadServerSettings();
  }, [loadServerSettings]);

  // Get the effective view mode - server settings if logged in, else local
  const viewMode = isLoggedIn ? serverViewMode : localViewMode;

  // Function to update view mode
  const updateViewMode = useCallback(async (newMode: "table" | "kanban") => {
    console.log("Updating view mode to:", newMode);
    
    // First update local state for immediate feedback
    if (isLoggedIn) {
      setServerViewMode(newMode);
    } else {
      setLocalViewMode(newMode);
    }
    
    // If logged in, also save to server
    if (isLoggedIn && objectTypeId) {
      try {
        const { error } = await supabase
          .from('user_view_settings')
          .upsert({
            user_id: user.id,
            object_type_id: objectTypeId,
            settings_type: 'layout',
            settings_data: { viewMode: newMode }
          }, {
            onConflict: 'user_id,object_type_id,settings_type'
          });
        
        if (error) {
          console.error("Error saving layout settings:", error);
          loadServerSettings();
        } else {
          console.log("Successfully saved layout settings to server");
        }
      } catch (error) {
        console.error("Failed to save layout settings:", error);
        loadServerSettings();
      }
    } else {
      console.log("Saved layout settings to local storage");
    }
  }, [isLoggedIn, objectTypeId, user?.id, setLocalViewMode, loadServerSettings]);

  return {
    viewMode,
    updateViewMode,
    isLoading: isLoading || isAuthLoading
  };
}
