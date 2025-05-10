
import { useCallback, useEffect, useState } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useUserViewSettings } from "./useUserViewSettings";
import { useAuth } from "@/contexts/AuthContext";
import { FilterCondition } from "@/types/FilterCondition";

export function useUserFilterSettings(objectTypeId: string | undefined) {
  const { user } = useAuth();
  const userId = user?.id || 'anonymous';
  
  // Local storage as fallback
  const storageKey = objectTypeId ? `filters-${objectTypeId}` : '';
  const [localFilters, setLocalFilters] = useLocalStorage<FilterCondition[]>(
    storageKey,
    []
  );
  
  // Database storage for authenticated users
  const { settings: dbSettings, updateSettings: updateDbSettings, isLoading } = 
    useUserViewSettings(objectTypeId, 'filters');
    
  // Extract filters from database settings
  const dbFilters = (dbSettings.filters || []) as FilterCondition[];
  
  // Determine which filters to use (DB if authenticated, local otherwise)
  const filters = user ? dbFilters : localFilters;
  
  // Sync local storage with DB when DB settings change
  useEffect(() => {
    if (user && dbFilters.length > 0 && !isLoading) {
      setLocalFilters(dbFilters);
    }
  }, [user, dbFilters, isLoading, setLocalFilters]);
  
  // Update filters in both DB (if authenticated) and local storage
  const updateFilters = useCallback((newFilters: FilterCondition[]) => {
    // Always update local storage for immediate UI updates
    setLocalFilters(newFilters);
    
    // If user is authenticated, also update database
    if (user && objectTypeId) {
      updateDbSettings({
        filters: newFilters
      });
    }
  }, [setLocalFilters, updateDbSettings, user, objectTypeId]);

  // Save a filter with name for future use
  const saveFilter = useCallback(async (name: string, conditions: FilterCondition[]) => {
    if (!user || !objectTypeId) return null;
    
    try {
      // Save to database using supabase
      const { data, error } = await updateDbSettings({
        savedFilters: [...(dbSettings.savedFilters || []), { 
          id: crypto.randomUUID(), 
          name, 
          conditions,
          created_at: new Date().toISOString()
        }]
      });
      
      if (error) throw error;
      return data;
    } catch (err) {
      console.error("Error saving filter:", err);
      return null;
    }
  }, [user, objectTypeId, updateDbSettings, dbSettings]);

  // Delete a saved filter
  const deleteFilter = useCallback(async (filterId: string) => {
    if (!user || !objectTypeId) return false;
    
    try {
      // Remove from database
      const updatedFilters = (dbSettings.savedFilters || []).filter(
        (filter: SavedFilter) => filter.id !== filterId
      );
      
      const { error } = await updateDbSettings({
        savedFilters: updatedFilters
      });
      
      if (error) throw error;
      return true;
    } catch (err) {
      console.error("Error deleting filter:", err);
      return false;
    }
  }, [user, objectTypeId, updateDbSettings, dbSettings]);

  return {
    filters,
    updateFilters,
    savedFilters: dbSettings.savedFilters || [],
    saveFilter,
    deleteFilter,
    isLoading,
    error: null
  };
}

interface SavedFilter {
  id: string;
  name: string;
  conditions: FilterCondition[];
  created_at: string;
}

// Re-export FilterCondition from types to make it available to components
export type { FilterCondition, SavedFilter };
