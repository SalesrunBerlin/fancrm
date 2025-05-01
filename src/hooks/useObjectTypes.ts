import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";

// Define object field type
export interface ObjectField {
  id: string;
  object_type_id: string;
  name: string;
  api_name: string;
  data_type: string;
  is_required: boolean;
  is_system: boolean;
  default_value?: any;
  options?: {
    target_object_type_id?: string;
    display_field_api_name?: string;
    description?: string;
  };
  display_order: number;
  owner_id: string;
  created_at: string;
  updated_at: string;
  isPublished?: boolean; // Used for publishing configuration
}

// Define object type
export interface ObjectType {
  id: string;
  name: string;
  api_name: string;
  description: string | null;
  icon: string | null;
  owner_id: string;
  is_system: boolean;
  is_active: boolean;
  show_in_navigation: boolean;
  default_field_api_name?: string;
  created_at: string;
  updated_at: string;
  is_published: boolean;
  is_template: boolean;
  source_object_id: string | null;
}

export function useObjectTypes() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  const [authReady, setAuthReady] = useState(false);
  
  useEffect(() => {
    if (user) {
      setAuthReady(true);
    }
  }, [user]);

  // Fetch user's object types
  const { data: objectTypes, isLoading } = useQuery({
    queryKey: ["object-types"],
    queryFn: async () => {
      if (!user) {
        console.log("No user, skipping object types fetch");
        return [];
      }
      console.log("Fetching object types for user:", user.id);
      
      const { data, error } = await supabase
        .from("object_types")
        .select("*")
        .or(`is_system.eq.true,owner_id.eq.${user.id}`)
        .order("name");

      if (error) {
        console.error("Error fetching object types:", error);
        throw error;
      }
      
      console.log(`Fetched ${data?.length || 0} object types`);
      return data;
    },
    enabled: !!user,
  });

  // Fetch published objects from other users
  const { 
    data: publishedObjects, 
    isLoading: isLoadingPublished,
    refetch: refetchPublished
  } = useQuery({
    queryKey: ["published-objects"],
    queryFn: async () => {
      if (!user) {
        console.log("No user, skipping published objects fetch");
        return [];
      }
      console.log("Fetching published objects. Current user:", user.id);
      
      try {
        const { data, error } = await supabase
          .from("object_types")
          .select("*")
          .eq("is_published", true)
          .neq("owner_id", user.id)
          .order("name");
  
        if (error) {
          console.error("Error fetching published objects:", error);
          throw error;
        }
        
        console.log(`Fetched ${data?.length || 0} published objects`);
        return data;
      } catch (err) {
        console.error("Exception in published objects fetch:", err);
        throw err;
      }
    },
    enabled: !!user && authReady,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Create a new object type
  const createObjectType = useMutation({
    mutationFn: async (newObjectType: Omit<ObjectType, "id" | "created_at" | "updated_at" | "owner_id">) => {
      if (!user) throw new Error("User must be logged in to create object types");

      const { data, error } = await supabase
        .from("object_types")
        .insert([{
          ...newObjectType,
          owner_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["object-types"] });
      toast({
        title: "Success",
        description: "Object type created successfully",
      });
    },
    onError: (error) => {
      console.error("Error creating object type:", error);
      toast({
        title: "Error",
        description: "Failed to create object type",
        variant: "destructive",
      });
    },
  });

  // Update an existing object type
  const updateObjectType = useMutation({
    mutationFn: async (updates: Partial<ObjectType> & { id: string }) => {
      const { data, error } = await supabase
        .from("object_types")
        .update(updates)
        .eq("id", updates.id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("No rows updated");
      }
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["object-types"] });
      queryClient.invalidateQueries({ queryKey: ["published-objects"] });
      toast({
        title: "Success",
        description: "Object type updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating object type:", error);
      toast({
        title: "Error",
        description: "Failed to update object type",
        variant: "destructive",
      });
    }
  });

  // Publish an object type
  const publishObjectType = useMutation({
    mutationFn: async (objectTypeId: string) => {
      const { data, error } = await supabase
        .from("object_types")
        .update({ is_published: true })
        .eq("id", objectTypeId)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("No rows updated");
      }
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["object-types"] });
      queryClient.invalidateQueries({ queryKey: ["published-objects"] });
      toast({
        title: "Success",
        description: "Object type published successfully",
      });
    },
    onError: (error) => {
      console.error("Error publishing object type:", error);
      toast({
        title: "Error",
        description: "Failed to publish object type",
        variant: "destructive",
      });
    }
  });

  // Unpublish an object type
  const unpublishObjectType = useMutation({
    mutationFn: async (objectTypeId: string) => {
      const { data, error } = await supabase
        .from("object_types")
        .update({ is_published: false })
        .eq("id", objectTypeId)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("No rows updated");
      }
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["object-types"] });
      queryClient.invalidateQueries({ queryKey: ["published-objects"] });
      toast({
        title: "Success",
        description: "Object type unpublished successfully",
      });
    },
    onError: (error) => {
      console.error("Error unpublishing object type:", error);
      toast({
        title: "Error",
        description: "Failed to unpublish object type",
        variant: "destructive",
      });
    }
  });

  // Import an object type from a published one
  const importObjectType = useMutation({
    mutationFn: async (sourceObjectId: string) => {
      if (!user) throw new Error("User must be logged in to import object types");

      console.log("Starting import of object structure:", sourceObjectId);
      
      try {
        // Use the clone_object_structure database function to handle the import
        const { data, error } = await supabase.rpc('clone_object_structure', {
          source_object_id: sourceObjectId,
          new_owner_id: user.id
        });
        
        if (error) {
          console.error("Error using clone_object_structure RPC:", error);
          throw new Error(`Failed to import object structure: ${error.message}`);
        }
        
        console.log("Object successfully cloned with database function. New object ID:", data);
        
        // Force refresh published objects view to ensure UI consistency
        const { error: refreshError } = await supabase.rpc('refresh_published_objects_view');
        if (refreshError) {
          console.warn("Error refreshing published objects view:", refreshError);
        }
        
        return data; // This should be the new object ID
      } catch (error) {
        console.error("Exception during object import:", error);
        throw error;
      }
    },
    onSuccess: (newObjectId) => {
      console.log("Successfully imported object with new ID:", newObjectId);
      // Invalidate all relevant queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["object-types"] });
      queryClient.invalidateQueries({ queryKey: ["object-fields"] });
      queryClient.invalidateQueries({ queryKey: ["published-objects"] });
      
      toast({
        title: "Success",
        description: "Object structure imported successfully",
      });
    },
    onError: (error) => {
      console.error("Error importing object structure:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to import object structure. Check console for details.",
        variant: "destructive",
      });
    }
  });

  // Delete an object type and all related data
  const deleteObjectType = useMutation({
    mutationFn: async (objectTypeId: string) => {
      if (!user) throw new Error("User must be logged in to delete object types");
      
      console.log("Starting deletion of object type:", objectTypeId);
      
      try {
        // Step 1: Delete all records for this object type
        console.log("Step 1: Deleting all records for object type");
        
        // First get all records of this object
        const { data: records, error: recordsError } = await supabase
          .from("object_records")
          .select("id")
          .eq("object_type_id", objectTypeId);
        
        if (recordsError) {
          console.error("Error fetching records for deletion:", recordsError);
          throw recordsError;
        }
        
        console.log(`Found ${records?.length || 0} records to delete`);
        
        // Delete record field values for each record
        for (const record of records || []) {
          // Delete values from record_field_values
          const { error: valueDeleteError } = await supabase
            .from("record_field_values")
            .delete()
            .eq("record_id", record.id);
          
          if (valueDeleteError) {
            console.error("Error deleting record field values:", valueDeleteError);
          }
          
          // Also delete from object_field_values
          const { error: objValueDeleteError } = await supabase
            .from("object_field_values")
            .delete()
            .eq("record_id", record.id);
          
          if (objValueDeleteError) {
            console.error("Error deleting object field values:", objValueDeleteError);
          }
        }
        
        // Now delete all the records
        const { error: recordDeleteError } = await supabase
          .from("object_records")
          .delete()
          .eq("object_type_id", objectTypeId);
        
        if (recordDeleteError) {
          console.error("Error deleting records:", recordDeleteError);
          throw recordDeleteError;
        }
        
        console.log("All records deleted successfully");
        
        // Step 2: Delete all fields for this object type
        console.log("Step 2: Deleting all fields for object type");
        
        // Get all fields for this object
        const { data: fields, error: fieldsError } = await supabase
          .from("object_fields")
          .select("id, data_type")
          .eq("object_type_id", objectTypeId);
        
        if (fieldsError) {
          console.error("Error fetching fields for deletion:", fieldsError);
          throw fieldsError;
        }
        
        // Delete picklist values for any picklist fields
        for (const field of fields || []) {
          if (field.data_type === 'picklist') {
            const { error: picklistDeleteError } = await supabase
              .from("field_picklist_values")
              .delete()
              .eq("field_id", field.id);
            
            if (picklistDeleteError) {
              console.error("Error deleting picklist values:", picklistDeleteError);
            }
          }
          
          // Delete field display configs if any
          const { error: displayConfigError } = await supabase
            .from("field_display_configs")
            .delete()
            .eq("field_id", field.id);
          
          if (displayConfigError) {
            console.error("Error deleting field display configs:", displayConfigError);
          }
          
          // Delete field publishing settings if any
          const { error: publishingError } = await supabase
            .from("object_field_publishing")
            .delete()
            .eq("field_id", field.id);
          
          if (publishingError) {
            console.error("Error deleting field publishing settings:", publishingError);
          }
        }
        
        // Delete all fields
        const { error: fieldDeleteError } = await supabase
          .from("object_fields")
          .delete()
          .eq("object_type_id", objectTypeId);
        
        if (fieldDeleteError) {
          console.error("Error deleting fields:", fieldDeleteError);
          throw fieldDeleteError;
        }
        
        console.log("All fields deleted successfully");
        
        // Step 3: Delete any relationships involving this object
        console.log("Step 3: Deleting all relationships for object type");
        
        const { error: relDeleteError } = await supabase
          .from("object_relationships")
          .delete()
          .or(`from_object_id.eq.${objectTypeId},to_object_id.eq.${objectTypeId}`);
        
        if (relDeleteError) {
          console.error("Error deleting relationships:", relDeleteError);
          // Continue with deletion even if relationships fail
        }
        
        // Step 4: Finally delete the object type itself
        console.log("Step 4: Deleting the object type");
        
        const { data, error } = await supabase
          .from("object_types")
          .delete()
          .eq("id", objectTypeId)
          .eq("owner_id", user.id) // Safety check: only delete objects owned by this user
          .select()
          .single();
        
        if (error) {
          console.error("Error deleting object type:", error);
          throw error;
        }
        
        console.log("Object successfully deleted");
        return data;
        
      } catch (error) {
        console.error("Error in deleteObjectType mutation:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["object-types"] });
      console.log("Object deletion completed successfully:", data);
    },
    onError: (error) => {
      console.error("Error deleting object:", error);
      toast({
        title: "Error",
        description: "Failed to delete object: " + (error instanceof Error ? error.message : "Unknown error"),
        variant: "destructive",
      });
    },
  });

  // Delete system objects
  const deleteSystemObjects = useMutation({
    mutationFn: async () => {
      try {
        console.log("Deleting system objects...");
        const { data, error } = await supabase.rpc('delete_system_objects');
        if (error) {
          console.error("Error in delete_system_objects RPC:", error);
          throw error;
        }
        
        const { error: refreshError } = await supabase.rpc('refresh_published_objects_view');
        if (refreshError) {
          console.warn("Error refreshing published objects view:", refreshError);
        }
        
        return data;
      } catch (error) {
        console.error("Error in deleteSystemObjects mutation:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({
        title: "Success",
        description: "System objects deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Error deleting system objects:", error);
      toast({
        title: "Error",
        description: "Failed to delete system objects: " + (error instanceof Error ? error.message : "Unknown error"),
        variant: "destructive",
      });
    }
  });

  // Manually refresh published objects
  const refreshPublishedObjects = async () => {
    console.log("Manually refreshing published objects...");
    try {
      // Force refresh the published objects view
      const { error: refreshError } = await supabase.rpc('refresh_published_objects_view');
      if (refreshError) {
        console.warn("Error refreshing published objects view:", refreshError);
      }
      
      // Refetch the published objects
      const result = await refetchPublished();
      
      // Also invalidate object types to ensure everything is in sync
      queryClient.invalidateQueries({ queryKey: ["object-types"] });
      
      return result;
    } catch (error) {
      console.error("Error during manual refresh:", error);
      throw error;
    }
  };

  return {
    objectTypes,
    isLoading,
    publishedObjects,
    isLoadingPublished,
    createObjectType,
    updateObjectType,
    publishObjectType,
    unpublishObjectType,
    importObjectType,
    deleteObjectType,
    deleteSystemObjects,
    refreshPublishedObjects
  };
}
