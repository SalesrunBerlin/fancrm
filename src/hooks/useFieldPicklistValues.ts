
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
  color?: string; // Color property for Kanban view display
}

interface AddPicklistValueData {
  value: string;
  label: string;
  color?: string; // Added color property to allow setting it when adding values
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
      
      // Generate default colors for picklist values if they don't have one
      const enhancedData = data.map((item, index) => {
        if (!item.color) {
          // Simple array of default colors - these will be used if no color is set
          const defaultColors = [
            "#8B5CF6", "#D946EF", "#EC4899", "#F97316", 
            "#EAB308", "#22C55E", "#06B6D4", "#3B82F6"
          ];
          // Use modulo to cycle through colors if we have more items than colors
          item.color = defaultColors[index % defaultColors.length];
        }
        return item;
      });
      
      console.log(`Found ${enhancedData.length} picklist values for field ${fieldId}`);
      return enhancedData;
    },
    enabled: !!fieldId,
  });

  const addValue = useMutation({
    mutationFn: async (data: AddPicklistValueData) => {
      // Generate a color if none was provided
      const colorToUse = data.color || `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
      
      const { error } = await supabase.from("field_picklist_values").insert({
        field_id: fieldId,
        value: data.value,
        label: data.label,
        order_position: (picklistValues?.length || 0) + 1,
        owner_id: user?.id,
        color: colorToUse // Add the color to the database
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
