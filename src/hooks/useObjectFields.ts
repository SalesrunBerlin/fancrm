
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { type ObjectField } from "./useObjectTypes";

// Define the CreateFieldInput type for better type safety
export interface CreateFieldInput {
  name: string;
  api_name: string;
  data_type: string;
  is_required: boolean;
  object_type_id: string;
  options?: {
    target_object_type_id?: string;
    display_field_api_name?: string;
    [key: string]: any;
  };
}

export function useObjectFields(objectTypeId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: fields, isLoading } = useQuery({
    queryKey: ["object-fields", objectTypeId],
    queryFn: async (): Promise<ObjectField[]> => {
      if (!objectTypeId) {
        console.log("No objectTypeId provided, skipping fields fetch");
        return [];
      }
      
      console.log(`Fetching fields for object type: ${objectTypeId}`);
      
      // First determine the object type status (template, published, ownership)
      const { data: objectType, error: objectError } = await supabase
        .from("object_types")
        .select("is_template, source_object_id, is_published, owner_id")
        .eq("id", objectTypeId)
        .single();

      if (objectError) {
        console.error("Error fetching object type:", objectError);
        throw objectError;
      }

      // Check if this is a published object
      const isPublishedObject = objectType.is_published;
      const isOwnedByOthers = objectType.owner_id !== user?.id;

      console.log("Object fields query for:", { 
        objectTypeId, 
        isPublishedObject, 
        isOwnedByOthers,
        userID: user?.id,
        ownerID: objectType.owner_id 
      });

      // Base query for fields
      let query = supabase
        .from("object_fields")
        .select("*")
        .eq("object_type_id", objectTypeId);

      // For published objects, don't filter by owner_id - show all fields that are published
      // For all other scenarios (user's own objects or templates), use the original filter
      if (isPublishedObject && isOwnedByOthers) {
        // For published objects owned by others, we don't add any owner filter
        // This allows showing all fields that are part of the published object
        console.log("Fetching all fields for published object without owner filter");
      } else {
        // For regular objects or objects owned by the current user,
        // use the original filter logic
        console.log("Using owner filter for fields");
        query = query.or(`is_system.eq.true,owner_id.eq.${user?.id}`);
      }

      const { data, error } = await query.order("display_order");

      if (error) {
        console.error("Error fetching fields:", error);
        throw error;
      }

      console.log("Fields fetched:", data.length);

      // For published objects owned by others, check for field publishing settings
      if (isPublishedObject && isOwnedByOthers) {
        const { data: publishingSettings, error: publishingError } = await supabase
          .from("object_field_publishing")
          .select("*")
          .eq("object_type_id", objectTypeId);

        if (publishingError) {
          console.error("Error fetching publishing settings:", publishingError);
          // Don't throw here, just continue with all fields
        }
        
        if (publishingSettings && publishingSettings.length > 0) {
          console.log("Applying publishing filters to fields");
          
          // Create a map of field_id -> is_included
          const publishingMap = new Map();
          publishingSettings.forEach(setting => {
            publishingMap.set(setting.field_id, setting.is_included);
          });
          
          // Filter fields by publishing settings
          data = data.filter(field => {
            return publishingMap.has(field.id) ? publishingMap.get(field.id) : true;
          });
          
          console.log("After publishing filter, fields count:", data.length);
        }
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
    mutationFn: async (newField: CreateFieldInput) => {
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
