
import { useQueryClient } from "@tanstack/react-query";
import { useUserViewSettings } from "./useUserViewSettings";
import { FilterCondition } from "@/hooks/useObjectRecords";

export function useUserFilterSettings(objectTypeId: string | undefined) {
  const queryClient = useQueryClient();
  
  // Use optimized view settings hook with type safety
  const { settings, updateSettings, isLoading } = useUserViewSettings(objectTypeId, 'filter');
  
  // Cast generic settings to our specific type with safety check
  const filters = Array.isArray(settings?.filters) ? settings.filters as FilterCondition[] : [];

  const updateFilters = (newFilters: FilterCondition[]) => {
    // Before updating, let's invalidate related queries to ensure proper invalidation
    queryClient.invalidateQueries({ queryKey: ["object-records", objectTypeId] });
    
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
