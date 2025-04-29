
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";

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
        
        console.log(`Fetched ${data?.length || 0} published objects:`, data);
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

  const importObjectType = useMutation({
    mutationFn: async (sourceObjectId: string) => {
      if (!user) throw new Error("User must be logged in to import object types");

      console.log("Starting import of object structure:", sourceObjectId);
      
      // First, let's manually create a copy of the source object
      try {
        // 1. Get the source object data
        const { data: sourceObject, error: sourceObjectError } = await supabase
          .from("object_types")
          .select("*")
          .eq("id", sourceObjectId)
          .single();

        if (sourceObjectError) {
          console.error("Error fetching source object:", sourceObjectError);
          throw sourceObjectError;
        }

        if (!sourceObject) {
          throw new Error("Source object not found");
        }

        // 2. Create the new object (clone)
        const newObjectData = {
          name: sourceObject.name,
          api_name: sourceObject.api_name.toLowerCase(),
          description: sourceObject.description,
          icon: sourceObject.icon,
          is_active: true,
          show_in_navigation: true,
          default_field_api_name: sourceObject.default_field_api_name,
          is_system: false,
          is_published: false,
          is_template: true,
          source_object_id: sourceObjectId,
          owner_id: user.id
        };

        const { data: newObject, error: newObjectError } = await supabase
          .from("object_types")
          .insert([newObjectData])
          .select()
          .single();

        if (newObjectError) {
          console.error("Error creating new object:", newObjectError);
          throw newObjectError;
        }

        // 3. Get all fields from the source object
        const { data: sourceFields, error: sourceFieldsError } = await supabase
          .from("object_fields")
          .select("*")
          .eq("object_type_id", sourceObjectId)
          .order("display_order");

        if (sourceFieldsError) {
          console.error("Error fetching source fields:", sourceFieldsError);
          throw sourceFieldsError;
        }

        // 4. Create new fields in the target object
        if (sourceFields && sourceFields.length > 0) {
          const newFields = sourceFields.map(field => ({
            object_type_id: newObject.id,
            name: field.name,
            api_name: field.api_name,
            data_type: field.data_type,
            is_required: field.is_required,
            is_system: false,
            display_order: field.display_order,
            options: field.options,
            default_value: field.default_value,
            owner_id: user.id
          }));

          const { error: newFieldsError } = await supabase
            .from("object_fields")
            .insert(newFields);

          if (newFieldsError) {
            console.error("Error creating new fields:", newFieldsError);
            // We continue even if some fields failed, to maintain the object
            console.warn("Some fields may not have been copied correctly");
          }

          // 5. Get the newly created fields to copy picklist values
          const { data: createdFields, error: createdFieldsError } = await supabase
            .from("object_fields")
            .select("id, api_name, data_type")
            .eq("object_type_id", newObject.id);

          if (createdFieldsError) {
            console.error("Error fetching created fields:", createdFieldsError);
            // Continue with what we have
          }

          // 6. Copy picklist values for picklist fields
          if (createdFields && createdFields.length > 0) {
            for (const sourceField of sourceFields) {
              if (sourceField.data_type === "picklist") {
                const matchingNewField = createdFields.find(f => f.api_name === sourceField.api_name);
                
                if (matchingNewField) {
                  // Get picklist values for the source field
                  const { data: picklistValues, error: picklistError } = await supabase
                    .from("field_picklist_values")
                    .select("*")
                    .eq("field_id", sourceField.id)
                    .order("order_position");

                  if (picklistError) {
                    console.error(`Error fetching picklist values for field ${sourceField.name}:`, picklistError);
                    continue; // Continue with next field
                  }

                  if (picklistValues && picklistValues.length > 0) {
                    const newPicklistValues = picklistValues.map(value => ({
                      field_id: matchingNewField.id,
                      label: value.label,
                      value: value.value,
                      order_position: value.order_position,
                      owner_id: user.id
                    }));

                    const { error: newPicklistError } = await supabase
                      .from("field_picklist_values")
                      .insert(newPicklistValues);

                    if (newPicklistError) {
                      console.error(`Error creating picklist values for field ${matchingNewField.name}:`, newPicklistError);
                    }
                  }
                }
              }
            }
          }
        }

        console.log("Object import completed successfully:", newObject.id);
        return newObject.id;
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
    deleteSystemObjects,
    refreshPublishedObjects
  };
}
