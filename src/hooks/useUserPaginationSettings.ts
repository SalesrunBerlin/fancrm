
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const useUserPaginationSettings = (objectTypeId?: string) => {
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
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
          .eq('settings_type', 'pagination')
          .single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 is "no rows returned" - not an error for us
          console.error("Error loading pagination settings:", error);
        }

        if (data && data.settings_data) {
          const settings = data.settings_data;
          setPageSize(settings.pageSize || 10);
          setCurrentPage(settings.currentPage || 1);
        }
      } catch (error) {
        console.error("Failed to load pagination settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (objectTypeId) {
      loadSettings();
    }

    // Reset to page 1 when object type changes
    setCurrentPage(1);
  }, [objectTypeId, user?.id]);

  // Save settings when they change
  useEffect(() => {
    const saveSettings = async () => {
      if (!objectTypeId || !user?.id || isLoading) {
        return;
      }

      try {
        const settings = {
          pageSize,
          currentPage
        };

        const { error } = await supabase
          .from('user_view_settings')
          .upsert({
            user_id: user.id,
            object_type_id: objectTypeId,
            settings_type: 'pagination',
            settings_data: settings
          }, {
            onConflict: 'user_id,object_type_id,settings_type'
          });

        if (error) {
          console.error("Error saving pagination settings:", error);
        }
      } catch (error) {
        console.error("Failed to save pagination settings:", error);
      }
    };

    // Only save settings after initial load
    if (!isLoading && objectTypeId && user?.id) {
      // Debounce saving to avoid too many DB writes
      const timeoutId = setTimeout(() => {
        saveSettings();
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [pageSize, currentPage, objectTypeId, user?.id, isLoading]);

  return {
    pageSize,
    currentPage,
    setPageSize,
    setCurrentPage,
    isLoading
  };
};
