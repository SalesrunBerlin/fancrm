
import { useState, useEffect, useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Define types for our settings
export interface UserViewSettings {
  // Generic settings structure that can accommodate different setting types
  [key: string]: any;
}

export type SettingsType = 'kanban' | 'filter' | 'layout' | 'pagination';

export function useUserViewSettings(
  objectTypeId: string | undefined, 
  settingsType: SettingsType
) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const isLoggedIn = !!user;
  
  // Local storage as fallback or for non-authenticated users
  const localStorageKey = objectTypeId ? `${settingsType}-settings-${objectTypeId}` : '';
  const [localSettings, setLocalSettings] = useLocalStorage<UserViewSettings>(localStorageKey, {});
  
  // State for server-side settings
  const [serverSettings, setServerSettings] = useState<UserViewSettings>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Function to safely parse JSON if needed
  const safeParseJSON = (data: any): UserViewSettings => {
    if (!data) return {};
    
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error('Error parsing settings JSON:', e);
        return {};
      }
    }
    
    return data as UserViewSettings;
  };

  // Function to load settings from server if user is logged in
  const loadServerSettings = useCallback(async () => {
    if (!isLoggedIn || !objectTypeId || isAuthLoading) return;
    
    try {
      setIsLoading(true);
      console.log(`Loading ${settingsType} settings for object: ${objectTypeId}`);
      
      const { data, error } = await supabase
        .from('user_view_settings')
        .select('settings_data')
        .eq('user_id', user.id)
        .eq('object_type_id', objectTypeId)
        .eq('settings_type', settingsType)
        .maybeSingle();
      
      if (error) {
        console.error(`Error loading ${settingsType} settings:`, error);
      } else if (data) {
        // Safely parse the data if it's a string
        const parsedSettings = safeParseJSON(data.settings_data);
        console.log(`Loaded ${settingsType} settings:`, parsedSettings);
        setServerSettings(parsedSettings);
      } else {
        console.log(`No ${settingsType} settings found for object: ${objectTypeId}`);
        // If no settings found on server but we have local settings, let's use those
        if (Object.keys(localSettings).length > 0) {
          console.log(`Using local ${settingsType} settings:`, localSettings);
          // Save local settings to server
          await updateSettings(localSettings);
        }
      }
    } catch (error) {
      console.error(`Failed to load ${settingsType} settings:`, error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, objectTypeId, user?.id, settingsType, isAuthLoading, localSettings]);

  // Load server settings on mount and when dependencies change
  useEffect(() => {
    loadServerSettings();
  }, [loadServerSettings]);

  // Get the effective settings - server settings if logged in, else local
  const settings = isLoggedIn ? serverSettings : localSettings;

  // Function to update settings
  const updateSettings = useCallback(async (newSettings: UserViewSettings) => {
    console.log(`Updating ${settingsType} settings:`, newSettings);
    
    // First update local state for immediate feedback
    if (isLoggedIn) {
      setServerSettings(newSettings);
    } else {
      setLocalSettings(newSettings);
    }
    
    // If logged in, also save to server
    if (isLoggedIn && objectTypeId) {
      try {
        setIsSaving(true);
        
        const { error } = await supabase
          .from('user_view_settings')
          .upsert({
            user_id: user.id,
            object_type_id: objectTypeId,
            settings_type: settingsType,
            settings_data: newSettings
          }, {
            onConflict: 'user_id,object_type_id,settings_type'
          });
        
        if (error) {
          console.error(`Error saving ${settingsType} settings:`, error);
          // Revert to previous settings on error
          loadServerSettings();
        } else {
          console.log(`Successfully saved ${settingsType} settings to server`);
        }
      } catch (error) {
        console.error(`Failed to save ${settingsType} settings:`, error);
        loadServerSettings();
      } finally {
        setIsSaving(false);
      }
    } else {
      console.log(`Saved ${settingsType} settings to local storage`);
    }
  }, [isLoggedIn, objectTypeId, user?.id, settingsType, setLocalSettings, loadServerSettings]);

  return {
    settings,
    updateSettings,
    isLoading: isLoading || isAuthLoading,
    isSaving
  };
}
