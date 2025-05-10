
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FilterCondition } from "@/types/FilterCondition";

interface SavedFilter {
  id: string;
  name: string;
  conditions: FilterCondition[];
  created_at: string;
}

export function useUserFilterSettings(objectTypeId: string) {
  const queryClient = useQueryClient();
  
  const { data: filters, isLoading, error } = useQuery({
    queryKey: ["user-filter-settings", objectTypeId],
    queryFn: async () => {
      const { data: viewSettings, error } = await supabase
        .from('user_view_settings')
        .select('*')
        .eq('object_type_id', objectTypeId)
        .eq('settings_type', 'saved_filters');

      if (error) {
        throw error;
      }
      
      const savedFilters = viewSettings?.map(setting => {
        const filtersData = setting.settings_data?.filters || [];
        return {
          id: setting.id,
          name: setting.settings_data?.name || 'Unnamed Filter',
          conditions: filtersData,
          created_at: setting.created_at
        };
      }) || [];
      
      return savedFilters as SavedFilter[];
    }
  });

  const saveFilter = async (name: string, conditions: FilterCondition[]) => {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from('user_view_settings')
      .insert({
        user_id: user.user.id,
        object_type_id: objectTypeId,
        settings_type: 'saved_filters',
        settings_data: {
          name: name,
          filters: conditions
        }
      });
    
    if (error) throw error;
    
    // Refetch the filters
    queryClient.invalidateQueries({ queryKey: ["user-filter-settings", objectTypeId] });
    
    return data;
  };
  
  const deleteFilter = async (filterId: string) => {
    const { error } = await supabase
      .from('user_view_settings')
      .delete()
      .eq('id', filterId);
    
    if (error) throw error;
    
    // Refetch the filters
    queryClient.invalidateQueries({ queryKey: ["user-filter-settings", objectTypeId] });
    
    return true;
  };
  
  const updateFilters = async (newFilters: FilterCondition[]) => {
    // Implementation for updating filters
    console.log("Updating filters:", newFilters);
  };

  return {
    filters,
    isLoading,
    error,
    saveFilter,
    deleteFilter,
    updateFilters
  };
}
