
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ObjectField } from "@/hooks/useObjectTypes";

export function useObjectFieldEdit(fieldId: string, objectTypeId: string) {
  const queryClient = useQueryClient();

  // Get field details
  const {
    data: field,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["object-field", fieldId],
    queryFn: async (): Promise<ObjectField | null> => {
      if (!fieldId) return null;

      const { data, error } = await supabase
        .from("object_fields")
        .select("*")
        .eq("id", fieldId)
        .single();

      if (error) {
        console.error("Error fetching field:", error);
        throw error;
      }

      // Transform the data to match the ObjectField interface
      return {
        ...data,
        options: data.options as ObjectField['options']
      } as ObjectField;
    },
    enabled: !!fieldId,
  });

  // Update field
  const updateField = useMutation({
    mutationFn: async (fieldData: Partial<ObjectField> & { id: string }) => {
      const { id, ...updateData } = fieldData;
      
      // Make sure to include the object_type_id
      const payload = {
        ...updateData,
        object_type_id: objectTypeId
      };

      const { data, error } = await supabase
        .from("object_fields")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating field:", error);
        throw error;
      }

      return {
        ...data,
        options: data.options as ObjectField['options']
      } as ObjectField;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["object-fields", objectTypeId] });
      queryClient.invalidateQueries({ queryKey: ["object-field", fieldId] });
      toast("Field updated successfully");
    },
    onError: (error: any) => {
      toast("Failed to update field", {
        description: error?.message || "An error occurred while updating the field"
      });
    },
  });

  return {
    field,
    isLoading,
    error,
    updateField,
  };
}
