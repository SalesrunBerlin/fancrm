
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export type ViewMode = "table" | "kanban";

export const useLayoutViewSettings = (objectTypeId?: string) => {
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { user } = useAuth();

  useEffect(() => {
    const loadSettings = async () => {
      if (!objectTypeId || !user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('user_view_settings')
          .select('settings_data')
          .eq('user_id', user.id)
          .eq('object_type_id', objectTypeId)
          .eq('settings_type', 'layout')
          .single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 is "no rows returned" - not an error for us
          console.error("Error loading layout settings:", error);
        }

        if (data && data.settings_data && data.settings_data.viewMode) {
          setViewMode(data.settings_data.viewMode);
        }
      } catch (error) {
        console.error("Failed to load layout settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (objectTypeId) {
      loadSettings();
    }
  }, [objectTypeId, user?.id]);

  const updateViewMode = async (newMode: ViewMode) => {
    if (!objectTypeId || !user?.id) return;

    setViewMode(newMode);
    
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
      }
    } catch (error) {
      console.error("Failed to save layout settings:", error);
    }
  };

  return {
    viewMode,
    updateViewMode,
    isLoading
  };
};
