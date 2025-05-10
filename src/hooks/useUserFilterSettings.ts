
import { useCallback, useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useUserViewSettings } from "./useUserViewSettings";
import { useAuth } from "@/contexts/AuthContext";
import { FilterCondition } from "@/types/FilterCondition";

export function useUserFilterSettings(objectTypeId: string | undefined) {
  const { user } = useAuth();
  const userId = user?.id || 'anonymous';
  
  // Local storage as fallback
  const storageKey = objectTypeId ? `visible-fields-${objectTypeId}` : '';
  const [localVisibleFields, setLocalVisibleFields] = useLocalStorage<string[]>(
    storageKey,
    []
  );
  
  // Database storage for authenticated users
  const { settings: dbSettings, updateSettings: updateDbSettings, isLoading } = 
    useUserViewSettings(objectTypeId, 'fields');
    
  // Extract fields from database settings
  const dbVisibleFields = (dbSettings.visibleFields || []) as string[];
  
  // Determine which fields to use (DB if authenticated, local otherwise)
  const visibleFields = user ? dbVisibleFields : localVisibleFields;
  
  // Sync local storage with DB when DB settings change
  useEffect(() => {
    if (user && dbVisibleFields.length > 0 && !isLoading) {
      setLocalVisibleFields(dbVisibleFields);
    }
  }, [user, dbVisibleFields, isLoading, setLocalVisibleFields]);
  
  // Update visible fields in both DB (if authenticated) and local storage
  const updateVisibleFields = useCallback((fieldApiNames: string[]) => {
    // Always update local storage for immediate UI updates
    setLocalVisibleFields(fieldApiNames);
    
    // If user is authenticated, also update database
    if (user && objectTypeId) {
      updateDbSettings({
        visibleFields: fieldApiNames
      });
    }
  }, [setLocalVisibleFields, updateDbSettings, user, objectTypeId]);

  return {
    visibleFields,
    updateVisibleFields,
    isLoading
  };
}
