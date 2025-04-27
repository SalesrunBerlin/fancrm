
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { type ObjectField } from "./useObjectTypes";

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
        .or(`is_system.eq.true,owner_id.eq.${user?.id}`)
        .order("display_order");

      if (error) {
        console.error("Error fetching fields:", error);
        throw error;
      }

      // Transform the JSON options to match the expected type
      return data.map(field => ({
        ...field,
        options: field.options ? field.options : undefined
      })) as ObjectField[];
    },
    enabled: !!user && !!objectTypeId,
  });

  const createField = useMutation({
    mutationFn: async (newField: Omit<ObjectField, "id" | "created_at" | "updated_at" | "owner_id" | "is_system" | "display_order" | "options" | "default_value">) => {
      if (!user) throw new Error("User must be logged in to create fields");

      const fieldData = {
        ...newField,
        owner_id: user.id,
        is_system: false,
        display_order: fields?.length || 0,
      };

      const { data, error } = await supabase
        .from("object_fields")
        .insert([fieldData])
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

      // Allow updates to system fields' options, but not to their structure
      const field = fields?.find(f => f.id === updatedField.id);
      
      // Prepare the update payload based on whether it's a system field
      let updatePayload: any = {};
      
      if (field?.is_system) {
        // For system fields, only allow updating options
        updatePayload = {
          options: updatedField.options
        };
      } else {
        // For non-system fields, allow updating everything except system status
        updatePayload = {
          name: updatedField.name,
          api_name: updatedField.api_name,
          data_type: updatedField.data_type,
          is_required: updatedField.is_required,
          options: updatedField.options
        };
      }

      const { data, error } = await supabase
        .from("object_fields")
        .update(updatePayload)
        .eq("id", updatedField.id)
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
