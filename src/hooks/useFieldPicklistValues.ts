
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PicklistValue {
  id: string;
  field_id: string;
  value: string;
  label: string;
  order_position: number;
}

interface AddPicklistValueData {
  value: string;
  label: string;
}

export function useFieldPicklistValues(fieldId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: picklistValues, isLoading } = useQuery({
    queryKey: ["picklist-values", fieldId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("field_picklist_values")
        .select("*")
        .eq("field_id", fieldId)
        .order("order_position");

      if (error) throw error;
      return data as PicklistValue[];
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
        .eq("id", valueId);

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
  };
}
