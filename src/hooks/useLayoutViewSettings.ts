
import { useCallback, useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useUserViewSettings } from "./useUserViewSettings";
import { useAuth } from "@/contexts/AuthContext";

export type ViewMode = "table" | "kanban";

export function useLayoutViewSettings(objectTypeId: string | undefined) {
  const { user } = useAuth();
  const userId = user?.id || 'anonymous';
  
  // Local storage as fallback
  const storageKey = objectTypeId ? `view-mode-${objectTypeId}` : '';
  const [localViewMode, setLocalViewMode] = useLocalStorage<ViewMode>(
    storageKey,
    "table"
  );
  
  // Database storage for authenticated users
  const { settings: dbSettings, updateSettings: updateDbSettings, isLoading } = 
    useUserViewSettings(objectTypeId, 'layout');
    
  // Extract view mode from database settings
  const dbViewMode = (dbSettings.viewMode || "table") as ViewMode;
  
  // Determine which view mode to use (DB if authenticated, local otherwise)
  const viewMode = user ? dbViewMode : localViewMode;
  
  // Sync local storage with DB when DB settings change
  useEffect(() => {
    if (user && dbViewMode && !isLoading) {
      setLocalViewMode(dbViewMode);
    }
  }, [user, dbViewMode, isLoading, setLocalViewMode]);
  
  // Update view mode in both DB (if authenticated) and local storage
  const updateViewMode = useCallback((newViewMode: ViewMode) => {
    // Always update local storage for immediate UI updates
    setLocalViewMode(newViewMode);
    
    // If user is authenticated, also update database
    if (user && objectTypeId) {
      updateDbSettings({
        viewMode: newViewMode
      });
    }
  }, [setLocalViewMode, updateDbSettings, user, objectTypeId]);

  return {
    viewMode,
    updateViewMode,
    isLoading
  };
}
