
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ObjectField } from "@/hooks/useObjectTypes";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Define the form schema
const fieldEditSchema = z.object({
  name: z.string().min(1, "Field name is required"),
  api_name: z.string().min(1, "API name is required"),
  target_object_type_id: z.string().optional(),
  display_field_api_name: z.string().optional(),
});

export type FieldEditFormData = z.infer<typeof fieldEditSchema>;

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

  // Initialize the form with field data
  const form = useForm<FieldEditFormData>({
    resolver: zodResolver(fieldEditSchema),
    defaultValues: {
      name: field?.name || "",
      api_name: field?.api_name || "",
      target_object_type_id: field?.options?.target_object_type_id,
      display_field_api_name: field?.options?.display_field_api_name,
    },
    values: field ? {
      name: field.name,
      api_name: field.api_name,
      target_object_type_id: field.options?.target_object_type_id,
      display_field_api_name: field.options?.display_field_api_name,
    } : undefined,
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
      toast.success("Field updated successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to update field", {
        description: error?.message || "An error occurred while updating the field"
      });
    },
  });

  const onSubmit = async (data: FieldEditFormData) => {
    if (!field) return undefined;
    
    // Prepare field options based on field type
    let options = { ...field.options } || {};
    
    if (field.data_type === 'lookup') {
      options = {
        ...options,
        target_object_type_id: data.target_object_type_id,
        display_field_api_name: data.display_field_api_name
      };
    }
    
    await updateField.mutateAsync({
      id: field.id,
      name: data.name,
      options,
    });
    
    return field;
  };

  const isSubmitting = updateField.isPending;

  return {
    field,
    isLoading,
    error,
    updateField,
    form,
    isSubmitting,
    onSubmit,
  };
}
