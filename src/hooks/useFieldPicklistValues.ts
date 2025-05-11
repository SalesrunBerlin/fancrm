
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
  color?: string; // Added color property as optional
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
      if (!fieldId) {
        console.log("No fieldId provided for picklist values");
        return [];
      }

      console.log("Fetching picklist values for field:", fieldId);
      
      // First check if this is a system field
      const { data: fieldInfo, error: fieldError } = await supabase
        .from("object_fields")
        .select("is_system, owner_id, api_name, object_type_id")
        .eq("id", fieldId)
        .maybeSingle();
      
      if (fieldError) {
        console.error("Error fetching field info:", fieldError);
        throw fieldError;
      }
      
      console.log("Field info:", fieldInfo);
      
      // Query picklist values with appropriate filtering
      let query = supabase
        .from("field_picklist_values")
        .select("*")
        .eq("field_id", fieldId);
      
      // Removed the owner_id restriction to allow seeing all picklist values regardless of owner
      // This ensures system fields with picklist values are visible to all users
      
      const { data, error } = await query.order("order_position");

      if (error) {
        console.error("Error fetching picklist values:", error);
        throw error;
      }
      
      console.log(`Found ${data.length} picklist values for field ${fieldId}`);
      return data;
    },
    enabled: !!fieldId,
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
