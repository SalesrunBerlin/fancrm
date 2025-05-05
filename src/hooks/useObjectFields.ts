import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { ObjectField } from "./useObjectTypes";

export type CreateFieldInput = {
  name: string;
  api_name: string;
  data_type: string;
  is_required: boolean;
  object_type_id: string;
  options?: {
    target_object_type_id?: string;
    display_field_api_name?: string;
    description?: string;
    [key: string]: any;
  } | null;
};

export function useObjectFields(objectTypeId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get fields for an object type
  const {
    data: fields,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["object-fields", objectTypeId],
    queryFn: async (): Promise<ObjectField[]> => {
      if (!objectTypeId) {
        return [];
      }

      const { data, error } = await supabase
        .from("object_fields")
        .select("*")
        .eq("object_type_id", objectTypeId)
        .order("display_order");

      if (error) {
        console.error("Error fetching object fields:", error);
        throw error;
      }

      // Transform the data to match the ObjectField interface
      return (data || []).map(field => ({
        ...field,
        options: field.options as ObjectField['options']
      })) as ObjectField[];
    },
    enabled: !!objectTypeId,
  });

  // Create a new field
  const createField = useMutation({
    mutationFn: async (fieldInput: CreateFieldInput): Promise<ObjectField> => {
      if (!user) {
        throw new Error("You must be logged in to create a field");
      }

      // Get the current max display order
      const { data: maxOrderResult, error: maxOrderError } = await supabase
        .from("object_fields")
        .select("display_order")
        .eq("object_type_id", fieldInput.object_type_id)
        .order("display_order", { ascending: false })
        .limit(1);

      if (maxOrderError) {
        console.error("Error fetching max display order:", maxOrderError);
      }

      const maxOrder = maxOrderResult && maxOrderResult.length > 0 
        ? maxOrderResult[0].display_order || 0 
        : 0;

      // Set additional options for auto-number fields
      if (fieldInput.data_type === 'auto_number') {
        // Extract auto_number specific options
        const autoNumberOptions = {
          auto_number_prefix: fieldInput.options?.auto_number_prefix || "",
          auto_number_format: fieldInput.options?.auto_number_format || "0000",
          auto_number_start: fieldInput.options?.auto_number_start || 1,
          is_read_only: true // Auto-number fields are always read-only
        };
        
        fieldInput.options = {
          ...(fieldInput.options || {}),
          ...autoNumberOptions
        };
      }

      // Create the new field
      const { data, error } = await supabase
        .from("object_fields")
        .insert([
          {
            ...fieldInput,
            display_order: maxOrder + 1,
            owner_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        ...data,
        options: data.options as ObjectField['options']
      } as ObjectField;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["object-fields", variables.object_type_id] });
      toast.success("Field created successfully", {
        description: "Your new field has been added to the object type."
      });
    },
    onError: (error: any) => {
      toast.error("Failed to create field", {
        description: error.message || "An error occurred while creating the field."
      });
    },
  });

  // Update a field
  const updateField = useMutation({
    mutationFn: async (field: Partial<ObjectField> & { id: string, object_type_id: string }) => {
      if (!user) {
        throw new Error("You must be logged in to update a field");
      }

      const { id, ...updateData } = field;

      const { data, error } = await supabase
        .from("object_fields")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        ...data,
        options: data.options as ObjectField['options']
      } as ObjectField;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["object-fields", variables.object_type_id] });
      toast.success("Field updated successfully", {
        description: "The field has been updated."
      });
    },
    onError: (error: any) => {
      toast.error("Failed to update field", {
        description: error.message || "An error occurred while updating the field."
      });
    },
  });

  // Delete a field
  const deleteField = useMutation({
    mutationFn: async (fieldId: string) => {
      if (!user || !objectTypeId) {
        throw new Error("You must be logged in to delete a field");
      }

      const { error } = await supabase
        .from("object_fields")
        .delete()
        .eq("id", fieldId);

      if (error) {
        throw error;
      }

      return fieldId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["object-fields", objectTypeId] });
      toast.success("Field deleted successfully", {
        description: "The field has been removed from this object type."
      });
    },
    onError: (error: any) => {
      toast.error("Failed to delete field", {
        description: error.message || "An error occurred while deleting the field."
      });
    },
  });

  // Utility function to update field orders
  const updateFieldOrder = useMutation({
    mutationFn: async (orderedFields: { id: string, display_order: number }[]) => {
      if (!user || !objectTypeId) {
        throw new Error("You must be logged in to reorder fields");
      }

      // Use individual updates for each field
      for (const field of orderedFields) {
        const { error } = await supabase
          .from("object_fields")
          .update({ display_order: field.display_order })
          .eq("id", field.id)
          .eq("object_type_id", objectTypeId);

        if (error) {
          throw error;
        }
      }

      return orderedFields;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["object-fields", objectTypeId] });
      toast.success("Field order updated", {
        description: "The fields have been reordered successfully."
      });
    },
    onError: (error: any) => {
      toast.error("Failed to update field order", {
        description: error.message || "An error occurred while reordering the fields."
      });
    },
  });

  return {
    fields: fields || [],
    isLoading,
    error,
    refetch,
    createField,
    updateField,
    deleteField,
    updateFieldOrder,
  };
}
