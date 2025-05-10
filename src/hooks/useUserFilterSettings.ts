
import { useUserViewSettings } from "./useUserViewSettings";
import { FilterCondition } from "@/hooks/useObjectRecords";

export function useUserFilterSettings(objectTypeId: string | undefined) {
  const { settings, updateSettings, isLoading } = useUserViewSettings(objectTypeId, 'filter');
  
  // Cast generic settings to our specific type
  const filters = settings.filters as FilterCondition[] || [];

  const updateFilters = (newFilters: FilterCondition[]) => {
    updateSettings({
      ...settings,
      filters: newFilters
    });
  };

  return {
    filters,
    updateFilters,
    isLoading
  };
}
