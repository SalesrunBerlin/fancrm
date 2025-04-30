
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PicklistValue {
  id: string;
  field_id: string;
  value: string;
  label: string;
  order_position: number;
  owner_id?: string;
}

interface AddPicklistValueData {
  value: string;
  label: string;
}

export function useFieldPicklistValues(fieldId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: picklistValues, isLoading, refetch } = useQuery({
    queryKey: ["picklist-values", fieldId],
    queryFn: async (): Promise<PicklistValue[]> => {
      // First check if this is a system field
      const { data: fieldInfo, error: fieldError } = await supabase
        .from("object_fields")
        .select("is_system, owner_id")
        .eq("id", fieldId)
        .maybeSingle();
      
      if (fieldError) throw fieldError;
      
      // Query picklist values with appropriate filtering
      let query = supabase
        .from("field_picklist_values")
        .select("*")
        .eq("field_id", fieldId);
      
      // If it's not a system field, or if the current user is not the owner,
      // only show picklist values that the current user owns
      if (!fieldInfo?.is_system && fieldInfo?.owner_id !== user?.id) {
        query = query.eq("owner_id", user?.id);
      }
      
      const { data, error } = await query.order("order_position");

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!fieldId,
  });

  const addValue = useMutation({
    mutationFn: async (data: AddPicklistValueData) => {
      const { error } = await supabase.from("field_picklist_values").insert({
        field_id: fieldId,
        value: data.value,
        label: data.label,
        order_position: (picklistValues?.length || 0) + 1,
        owner_id: user?.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["picklist-values", fieldId] });
    },
  });

  const removeValue = useMutation({
    mutationFn: async (valueId: string) => {
      const { error } = await supabase
        .from("field_picklist_values")
        .delete()
        .eq("id", valueId)
        .eq("owner_id", user?.id); // Only the owner can delete their values

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["picklist-values", fieldId] });
    },
  });

  return {
    picklistValues,
    isLoading,
    addValue,
    removeValue,
    refetch
  };
}
