import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export interface ObjectField {
  id: string;
  name: string;
  api_name: string;
  data_type: string;
  is_required: boolean;
  object_type_id: string;
  is_system: boolean;
  display_order: number | null;
  options?: {
    target_object_type_id?: string;
    display_field_api_name?: string;
    description?: string;
    [key: string]: any;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface ObjectType {
  id: string;
  name: string;
  api_name: string;
  description: string | null;
  is_system: boolean;
  is_published: boolean;
  is_archived: boolean;
  is_active: boolean;
  show_in_navigation: boolean;
  is_template: boolean;
  owner_id: string;
  default_field_api_name: string | null;
  icon: string | null;
  created_at: string;
  updated_at: string;
  fields?: ObjectField[];
}

export function useObjectTypes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get user's object types
  const {
    data: objectTypes,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["object-types"],
    queryFn: async (): Promise<ObjectType[]> => {
      if (!user) {
        return [];
      }
      
      const { data, error } = await supabase
        .from("object_types")
        .select("*")
        .eq("owner_id", user.id)
        .eq("is_archived", false)
        .order("name");
      
      if (error) {
        console.error("Error fetching object types:", error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!user,
  });

  // Get published object types (globally available)
  const {
    data: publishedObjects,
    isLoading: isLoadingPublished,
  } = useQuery({
    queryKey: ["published-object-types"],
    queryFn: async (): Promise<ObjectType[]> => {
      if (!user) {
        return [];
      }
      
      const { data, error } = await supabase
        .from("object_types")
        .select("*")
        .eq("is_published", true)
        .neq("owner_id", user.id) // Exclude user's own objects
        .order("name");
      
      if (error) {
        console.error("Error fetching published object types:", error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!user,
  });

  // Get archived object types
  const {
    data: archivedObjects,
    isLoading: isLoadingArchived,
  } = useQuery({
    queryKey: ["archived-object-types"],
    queryFn: async (): Promise<ObjectType[]> => {
      if (!user) {
        return [];
      }
      
      const { data, error } = await supabase
        .from("object_types")
        .select("*")
        .eq("owner_id", user.id)
        .eq("is_archived", true)
        .order("name");
      
      if (error) {
        console.error("Error fetching archived object types:", error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!user,
  });

  // Create a new object type
  const createObjectType = useMutation({
    mutationFn: async ({ 
      name, 
      api_name, 
      description = null 
    }: { 
      name: string; 
      api_name: string; 
      description?: string | null; 
    }) => {
      if (!user) {
        throw new Error("You must be logged in to create an object type");
      }
      
      // Insert the object type
      const { data, error } = await supabase
        .from("object_types")
        .insert([
          {
            name,
            api_name,
            description,
            owner_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["object-types"] });
      toast.success("Object created successfully", {
        description: "Your new object has been created."
      });
    },
    onError: (error: any) => {
      toast.error("Failed to create object", {
        description: error.message || "An error occurred while creating the object type."
      });
    },
  });

  // Update an object type
  const updateObjectType = useMutation({
    mutationFn: async (objectType: Partial<ObjectType> & { id: string }) => {
      if (!user) {
        throw new Error("You must be logged in to update an object type");
      }
      
      const { id, ...updateData } = objectType;
      
      const { data, error } = await supabase
        .from("object_types")
        .update(updateData)
        .eq("id", id)
        .eq("owner_id", user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["object-types"] });
      toast.success("Object updated successfully", {
        description: "Your object has been updated."
      });
    },
    onError: (error: any) => {
      toast.error("Failed to update object", {
        description: error.message || "An error occurred while updating the object type."
      });
    },
  });

  // Archive an object type
  const archiveObjectType = useMutation({
    mutationFn: async (id: string) => {
      if (!user) {
        throw new Error("You must be logged in to archive an object type");
      }
      
      const { data, error } = await supabase
        .from("object_types")
        .update({ is_archived: true })
        .eq("id", id)
        .eq("owner_id", user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["object-types"] });
      queryClient.invalidateQueries({ queryKey: ["archived-object-types"] });
      toast.success("Object archived successfully", {
        description: "Your object has been archived."
      });
    },
    onError: (error: any) => {
      toast.error("Failed to archive object", {
        description: error.message || "An error occurred while archiving the object type."
      });
    },
  });

  // Restore an object type from archive
  const restoreObjectType = useMutation({
    mutationFn: async (id: string) => {
      if (!user) {
        throw new Error("You must be logged in to restore an object type");
      }
      
      const { data, error } = await supabase
        .from("object_types")
        .update({ is_archived: false })
        .eq("id", id)
        .eq("owner_id", user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["object-types"] });
      queryClient.invalidateQueries({ queryKey: ["archived-object-types"] });
      toast.success("Object restored successfully", {
        description: "Your object has been restored from the archive."
      });
    },
    onError: (error: any) => {
      toast.error("Failed to restore object", {
        description: error.message || "An error occurred while restoring the object type."
      });
    },
  });

  // Delete an object type
  const deleteObjectType = useMutation({
    mutationFn: async (id: string) => {
      if (!user) {
        throw new Error("You must be logged in to delete an object type");
      }
      
      const { error } = await supabase
        .from("object_types")
        .delete()
        .eq("id", id)
        .eq("owner_id", user.id);

      if (error) {
        throw error;
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["object-types"] });
      queryClient.invalidateQueries({ queryKey: ["archived-object-types"] });
      toast.success("Object deleted successfully", {
        description: "Your object has been permanently deleted."
      });
    },
    onError: (error: any) => {
      toast.error("Failed to delete object", {
        description: error.message || "An error occurred while deleting the object type."
      });
    },
  });

  // Publish an object type
  const publishObjectType = useMutation({
    mutationFn: async (id: string) => {
      if (!user) {
        throw new Error("You must be logged in to publish an object type");
      }
      
      // First, check if the object has any fields
      const { data: fields, error: fieldsError } = await supabase
        .from("object_fields")
        .select("id")
        .eq("object_type_id", id);
      
      if (fieldsError) {
        throw fieldsError;
      }
      
      if (!fields || fields.length === 0) {
        throw new Error("Cannot publish an object type without any fields. Please add at least one field.");
      }
      
      // Then publish the object type
      const { data, error } = await supabase
        .from("object_types")
        .update({ is_published: true })
        .eq("id", id)
        .eq("owner_id", user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }
      
      // Create default field publishing settings (include all fields)
      const fieldIdsToInclude = fields.map(field => ({
        field_id: field.id,
        object_type_id: id,
        is_included: true,
        owner_id: user.id
      }));
      
      if (fieldIdsToInclude.length > 0) {
        const { error: publishError } = await supabase
          .from("object_field_publishing")
          .upsert(fieldIdsToInclude);
        
        if (publishError) {
          console.error("Error setting up field publishing:", publishError);
          // Continue anyway - we've published the object
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["object-types"] });
      toast.success("Object published", {
        description: "Your object type is now available in the structure library."
      });
    },
    onError: (error: any) => {
      toast.error("Failed to publish object", {
        description: error.message || "An error occurred while publishing the object type."
      });
    },
  });

  // Unpublish an object type
  const unpublishObjectType = useMutation({
    mutationFn: async (id: string) => {
      if (!user) {
        throw new Error("You must be logged in to unpublish an object type");
      }
      
      const { data, error } = await supabase
        .from("object_types")
        .update({ is_published: false })
        .eq("id", id)
        .eq("owner_id", user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["object-types"] });
      toast.success("Object unpublished", {
        description: "Your object type is no longer available in the structure library."
      });
    },
    onError: (error: any) => {
      toast.error("Failed to unpublish object", {
        description: error.message || "An error occurred while unpublishing the object type."
      });
    },
  });

  // Import an object type from the published library
  const importObjectType = useMutation({
    mutationFn: async (sourceObjectId: string) => {
      if (!user) {
        throw new Error("User must be logged in to import an object type");
      }

      try {
        // Import the object structure using a database function
        const { data: clonedObject, error: cloneError } = await supabase
          .rpc('clone_object_structure', {
            source_object_id: sourceObjectId,
            new_owner_id: user.id
          });

        if (cloneError) throw cloneError;

        return clonedObject;
      } catch (error) {
        console.error("Error importing object type:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["object-types"] });
      toast.success("Object structure imported", {
        description: "The object structure has been imported successfully to your account."
      });
    },
    onError: (error: any) => {
      toast.error("Import failed", {
        description: error.message || "There was an error importing the object structure."
      });
    },
  });

  return {
    objectTypes,
    publishedObjects,
    archivedObjects,
    isLoading,
    isLoadingPublished,
    isLoadingArchived,
    error,
    refetch,
    createObjectType,
    updateObjectType,
    archiveObjectType,
    restoreObjectType,
    deleteObjectType,
    publishObjectType,
    unpublishObjectType,
    importObjectType,
  };
}
