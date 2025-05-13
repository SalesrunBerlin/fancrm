
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { FilterCondition } from "./useObjectRecords";
import { v4 as uuidv4 } from "uuid";

interface SavedFilter {
  id: string;
  name: string;
  description?: string;
  conditions: FilterCondition[];
  createdAt: string;
  isDefault?: boolean;
}

export const useUserFilterSettings = (objectTypeId?: string) => {
  const [filters, setFilters] = useState<FilterCondition[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { user } = useAuth();

  // Load filters on component mount
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
          .eq('settings_type', 'filters')
          .single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 is "no rows returned" - not an error for us
          console.error("Error loading filter settings:", error);
        }

        if (data?.settings_data) {
          const settingsData = data.settings_data;
          setSettings(settingsData);
          setFilters(settingsData.activeFilters || []);
          setSavedFilters(settingsData.savedFilters || []);
        }
      } catch (error) {
        console.error("Failed to load filter settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (objectTypeId && user?.id) {
      loadSettings();
    } else {
      // Reset filters when object type changes
      setFilters([]);
      setSavedFilters([]);
      setIsLoading(false);
    }
  }, [objectTypeId, user?.id]);

  // Save filters when they change
  const saveSettings = useCallback(async (
    newActiveFilters: FilterCondition[],
    newSavedFilters: SavedFilter[] = savedFilters
  ) => {
    if (!objectTypeId || !user?.id) return;

    try {
      const settingsData = {
        ...settings,
        activeFilters: newActiveFilters,
        savedFilters: newSavedFilters
      };

      const { error } = await supabase
        .from('user_view_settings')
        .upsert({
          user_id: user.id,
          object_type_id: objectTypeId,
          settings_type: 'filters',
          settings_data: settingsData
        }, {
          onConflict: 'user_id,object_type_id,settings_type'
        });

      if (error) {
        console.error("Error saving filter settings:", error);
      } else {
        setSettings(settingsData);
      }
    } catch (error) {
      console.error("Failed to save filter settings:", error);
    }
  }, [objectTypeId, user?.id, settings, savedFilters]);

  // Update active filters
  const updateFilters = useCallback((newFilters: FilterCondition[]) => {
    setFilters(newFilters);
    saveSettings(newFilters);
  }, [saveSettings]);

  // Save current filters as a saved filter
  const saveAsFilter = useCallback((name: string, description?: string) => {
    if (filters.length === 0) return;

    const newFilter: SavedFilter = {
      id: uuidv4(),
      name,
      description,
      conditions: [...filters],
      createdAt: new Date().toISOString()
    };

    const updatedSavedFilters = [...savedFilters, newFilter];
    setSavedFilters(updatedSavedFilters);
    saveSettings(filters, updatedSavedFilters);
    
    return newFilter.id;
  }, [filters, savedFilters, saveSettings]);

  // Delete a saved filter
  const deleteSavedFilter = useCallback((filterId: string) => {
    const updatedFilters = savedFilters.filter(f => f.id !== filterId);
    setSavedFilters(updatedFilters);
    saveSettings(filters, updatedFilters);
  }, [filters, savedFilters, saveSettings]);

  // Apply a saved filter
  const applySavedFilter = useCallback((filterId: string) => {
    const filter = savedFilters.find(f => f.id === filterId);
    if (filter) {
      setFilters(filter.conditions);
      saveSettings(filter.conditions);
    }
  }, [savedFilters, saveSettings]);

  // Set a filter as default
  const setDefaultFilter = useCallback((filterId: string) => {
    const updatedFilters = savedFilters.map(f => ({
      ...f,
      isDefault: f.id === filterId
    }));
    
    setSavedFilters(updatedFilters);
    saveSettings(filters, updatedFilters);
  }, [filters, savedFilters, saveSettings]);

  // Get a filter by ID
  const getFilterById = useCallback((filterId: string) => {
    return savedFilters.find(f => f.id === filterId);
  }, [savedFilters]);

  return {
    filters,
    updateFilters,
    savedFilters,
    saveAsFilter,
    deleteSavedFilter,
    applySavedFilter,
    setDefaultFilter,
    getFilterById,
    settings,
    isLoading
  };
};
