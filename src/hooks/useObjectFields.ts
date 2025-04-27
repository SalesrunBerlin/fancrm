import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import type { ObjectField } from "./useObjectTypes";

export function useObjectFields(objectTypeId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: fields, isLoading } = useQuery({
    queryKey: ["object-fields", objectTypeId],
    queryFn: async (): Promise<ObjectField[]> => {
      const { data, error } = await supabase
        .from("object_fields")
        .select("*")
        .eq("object_type_id", objectTypeId)
        .order("display_order");

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!objectTypeId,
  });

  const createField = useMutation({
    mutationFn: async (newField: Omit<ObjectField, "id" | "created_at" | "updated_at" | "owner_id" | "is_system" | "display_order" | "options" | "default_value">) => {
      if (!user) throw new Error("User must be logged in to create fields");

      // Ensure owner_id is set to the current user's ID
      const { data, error } = await supabase
        .from("object_fields")
        .insert([{
          ...newField,
          owner_id: user.id,
          is_system: false,
          display_order: fields?.length || 0,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["object-fields", objectTypeId] });
      toast({
        title: "Success",
        description: "Field created successfully",
      });
    },
    onError: (error) => {
      console.error("Error creating field:", error);
      toast({
        title: "Error",
        description: "Failed to create field: " + (error instanceof Error ? error.message : "Unknown error"),
        variant: "destructive",
      });
    },
  });

  const updateField = useMutation({
    mutationFn: async (updatedField: Partial<ObjectField> & { id: string }) => {
      if (!user) throw new Error("User must be logged in to update fields");

      // Check if field is a system field
      const field = fields?.find(f => f.id === updatedField.id);
      if (field?.is_system) {
        throw new Error("Cannot update a system field");
      }

      const { data, error } = await supabase
        .from("object_fields")
        .update({
          name: updatedField.name,
          api_name: updatedField.api_name,
          data_type: updatedField.data_type,
          is_required: updatedField.is_required,
          // Don't update system status or owner
        })
        .eq("id", updatedField.id)
        .eq("owner_id", user.id) // Ensure user can only update their own fields
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["object-fields", objectTypeId] });
      toast({
        title: "Success",
        description: "Field updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating field:", error);
      toast({
        title: "Error",
        description: "Failed to update field",
        variant: "destructive",
      });
    },
  });

  const deleteField = useMutation({
    mutationFn: async (fieldId: string) => {
      if (!user) throw new Error("User must be logged in to delete fields");

      // Check if field is a system field
      const field = fields?.find(f => f.id === fieldId);
      if (field?.is_system) {
        throw new Error("Cannot delete a system field");
      }

      const { error } = await supabase
        .from("object_fields")
        .delete()
        .eq("id", fieldId)
        .eq("owner_id", user.id) // Ensure user can only delete their own fields
        .eq("is_system", false); // Extra safety check

      if (error) throw error;
      return { id: fieldId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["object-fields", objectTypeId] });
      toast({
        title: "Success",
        description: "Field deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Error deleting field:", error);
      toast({
        title: "Error",
        description: "Failed to delete field",
        variant: "destructive",
      });
    },
  });

  return {
    fields,
    isLoading,
    createField,
    updateField,
    deleteField,
  };
}
