
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
  
  // Database storage for authenticated users - with optimized staleTime/cacheTime
  const { settings: dbSettings, updateSettings: updateDbSettings, isLoading } = 
    useUserViewSettings(objectTypeId, 'filters', false, 300000, 1800000); // 5min stale, 30min cache
    
  // Extract filters from database settings
  const dbFilters = (dbSettings.filters || []) as FilterCondition[];
  
  // Determine which filters to use (DB if authenticated, local otherwise)
  const filters = user ? dbFilters : localFilters;
  
  // Sync local storage with DB when DB settings change - with debouncing
  const [syncTimeout, setSyncTimeout] = useState<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (user && dbFilters.length > 0 && !isLoading) {
      // Clear previous timeout if any
      if (syncTimeout) {
        clearTimeout(syncTimeout);
      }
      
      // Set a new timeout to debounce updates
      const timeout = setTimeout(() => {
        setLocalFilters(dbFilters);
      }, 2000); // 2 second debounce
      
      setSyncTimeout(timeout);
      
      return () => {
        if (timeout) clearTimeout(timeout);
      };
    }
  }, [user, dbFilters, isLoading, setLocalFilters]);
  
  // Update filters in both DB (if authenticated) and local storage - with debouncing
  const [updateTimeout, setUpdateTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const updateFilters = useCallback((newFilters: FilterCondition[]) => {
    // Always update local storage immediately for UI responsiveness
    setLocalFilters(newFilters);
    
    // If user is authenticated, debounce DB updates
    if (user && objectTypeId) {
      // Clear previous timeout if any
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
      
      // Set a new timeout for DB update
      const timeout = setTimeout(() => {
        updateDbSettings({
          filters: newFilters
        });
      }, 2000); // 2 second debounce
      
      setUpdateTimeout(timeout);
      
      return () => {
        if (timeout) clearTimeout(timeout);
      };
    }
  }, [setLocalFilters, updateDbSettings, user, objectTypeId, updateTimeout]);

  // Save a filter with name for future use - with optimizations for infrequent operations
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
