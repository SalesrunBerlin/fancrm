
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ObjectField } from "./useObjectTypes";
import { useAuth } from "@/contexts/AuthContext";
import { safeErrorToast } from "@/patches/FixToastVariants";

export const useObjectFieldEdit = (fieldId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: field,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["object-field", fieldId],
    queryFn: async (): Promise<ObjectField> => {
      const { data, error } = await supabase
        .from("object_fields")
        .select("*")
        .eq("id", fieldId)
        .single();

      if (error) {
        throw error;
      }

      return data as ObjectField;
    },
    enabled: !!fieldId,
  });

  const updateField = useMutation({
    mutationFn: async (values: Partial<ObjectField>) => {
      if (!user) throw new Error("User must be logged in to update field");
      if (!field || !field.id) throw new Error("Field not found");

      // Prepare the update data
      const updateData: Record<string, any> = {};
      
      // Only include fields that have changed
      for (const [key, value] of Object.entries(values)) {
        if (field[key as keyof ObjectField] !== value) {
          updateData[key] = value;
        }
      }

      // If nothing has changed, don't perform update
      if (Object.keys(updateData).length === 0) {
        return field;
      }

      const { data, error } = await supabase
        .from("object_fields")
        .update(updateData)
        .eq("id", field.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as ObjectField;
    },
    onSuccess: (data) => {
      toast("Field updated", {
        description: "The field has been updated successfully.",
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["object-field", fieldId] });
      
      if (data.object_type_id) {
        queryClient.invalidateQueries({
          queryKey: ["object-fields", data.object_type_id],
        });
      }
    },
    onError: (error: Error) => {
      safeErrorToast("Error updating field", {
        description: error.message,
      });
    },
  });

  const deleteField = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User must be logged in to delete field");
      if (!field) throw new Error("Field not found");

      const { error } = await supabase
        .from("object_fields")
        .delete()
        .eq("id", field.id);

      if (error) {
        throw error;
      }

      return field;
    },
    onSuccess: (data) => {
      toast("Field deleted", {
        description: "The field has been permanently deleted.",
      });

      // Invalidate queries
      if (data.object_type_id) {
        queryClient.invalidateQueries({
          queryKey: ["object-fields", data.object_type_id],
        });
      }
    },
    onError: (error: Error) => {
      safeErrorToast("Error deleting field", {
        description: error.message,
      });
    },
  });

  return {
    field,
    isLoading,
    error,
    updateField,
    deleteField,
  };
};
