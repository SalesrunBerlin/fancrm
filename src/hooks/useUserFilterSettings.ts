
import { useUserViewSettings } from "./useUserViewSettings";
import { FilterCondition } from "@/hooks/useObjectRecords";

// Define the type for our filter settings
export interface FilterSettings {
  filters: FilterCondition[];
  savedFilters?: {id: string, name: string, conditions: FilterCondition[]}[];
  lastApplied?: string;
}

export function useUserFilterSettings(objectTypeId: string | undefined) {
  const { settings, updateSettings, isLoading } = useUserViewSettings<FilterSettings>(objectTypeId, 'filter');
  
  // Cast generic settings to our specific type with safety check
  const filters = Array.isArray(settings?.filters) ? settings.filters : [];
  const savedFilters = Array.isArray(settings?.savedFilters) ? settings.savedFilters : [];

  // Function to update filters
  const updateFilters = (newFilters: FilterCondition[]) => {
    updateSettings({
      ...settings,
      filters: newFilters,
      lastApplied: new Date().toISOString()
    });
  };

  // Function to save a filter
  const saveFilter = (name: string, conditions: FilterCondition[]) => {
    if (!name) return;
    
    const newFilter = {
      id: crypto.randomUUID(),
      name,
      conditions
    };
    
    const updatedSavedFilters = [
      newFilter,
      ...(savedFilters || [])
    ].slice(0, 10); // Keep only 10 most recent
    
    updateSettings({
      ...settings,
      savedFilters: updatedSavedFilters
    });
    
    return newFilter;
  };

  // Function to delete a saved filter
  const deleteFilter = (filterId: string) => {
    if (!settings?.savedFilters) return;
    
    const updatedFilters = settings.savedFilters.filter(f => f.id !== filterId);
    
    updateSettings({
      ...settings,
      savedFilters: updatedFilters
    });
  };

  // Function to get a specific saved filter by ID
  const getFilterById = (filterId: string) => {
    return savedFilters.find(filter => filter.id === filterId);
  };

  return {
    filters,
    savedFilters,
    updateFilters,
    saveFilter,
    deleteFilter,
    getFilterById,
    settings,
    updateSettings,
    isLoading
  };
}
