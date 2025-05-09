import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// Define types for published application entities
export interface PublishedApplication {
  id: string;
  name: string;
  description: string;
  published_by: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  version?: string;
  application_id?: string;
  is_active?: boolean;
  publisher?: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
    };
  };
  objects?: PublishedObject[];
  actions?: PublishedAction[];
  fields?: PublishedField[];
}

export interface PublishedObject {
  id: string;
  published_application_id: string;
  object_type_id: string;
  is_included: boolean;
  created_at: string;
  updated_at: string;
  object_type: {
    id: string;
    name: string;
    api_name: string;
    description?: string;
  };
  fields?: PublishedField[];
}

export interface PublishedAction {
  id: string;
  published_application_id: string;
  action_id: string;
  is_included: boolean;
  created_at: string;
  updated_at: string;
  action: {
    id: string;
    name: string;
    description?: string;
  };
}

export interface PublishedField {
  id: string;
  object_type_id: string;
  field_id: string; 
  field_api_name?: string;
  is_included: boolean;
  created_at: string;
  updated_at: string;
  field?: {
    id: string;
    name: string;
    api_name: string;
    data_type: string;
  };
}

export function usePublishedApplications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get all published applications that are public or published by the current user
  const {
    data: publishedApplications,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["published-applications"],
    queryFn: async (): Promise<PublishedApplication[]> => {
      // Ensure we get all public applications regardless of who's logged in
      const query = supabase
        .from("published_applications")
        .select(`
          *,
          publisher:published_by(id, email, user_metadata)
        `)
        .eq("is_public", true)
        .eq("is_active", true);

      // If user is logged in, also get their private published apps
      if (user) {
        const { data: publicApps, error: publicError } = await query;
        
        if (publicError) {
          console.error("Error fetching public applications:", publicError);
          throw publicError;
        }
        
        // Get private apps by the current user
        const { data: privateApps, error: privateError } = await supabase
          .from("published_applications")
          .select(`
            *,
            publisher:published_by(id, email, user_metadata)
          `)
          .eq("is_public", false)
          .eq("published_by", user.id)
          .eq("is_active", true);
          
        if (privateError) {
          console.error("Error fetching private applications:", privateError);
          throw privateError;
        }
        
        // Combine public and private apps
        return [...(publicApps || []), ...(privateApps || [])] as PublishedApplication[];
      } else {
        // If user is not logged in, only return public apps
        const { data, error } = await query;
        
        if (error) {
          console.error("Error fetching public applications:", error);
          throw error;
        }
        
        return data as PublishedApplication[] || [];
      }
    }
  });

  // Get details for a specific published application including its objects and actions
  const usePublishedApplicationDetails = (applicationId?: string) => {
    return useQuery({
      queryKey: ["published-application", applicationId],
      queryFn: async (): Promise<PublishedApplication | null> => {
        if (!applicationId) return null;

        // Get the application details
        const { data: appData, error: appError } = await supabase
          .from("published_applications")
          .select(`
            *,
            publisher:published_by(id, email, user_metadata)
          `)
          .eq("id", applicationId)
          .single();

        if (appError) {
          console.error("Error fetching published application:", appError);
          throw appError;
        }

        // Get included objects
        const { data: objectsData, error: objectsError } = await supabase
          .from("published_application_objects")
          .select(`
            *,
            object_type:object_type_id(id, name, api_name, description)
          `)
          .eq("published_application_id", applicationId);

        if (objectsError) {
          console.error("Error fetching published objects:", objectsError);
          throw objectsError;
        }

        // Get included actions
        const { data: actionsData, error: actionsError } = await supabase
          .from("published_application_actions")
          .select(`
            *,
            action:action_id(id, name, description)
          `)
          .eq("published_application_id", applicationId);

        if (actionsError) {
          console.error("Error fetching published actions:", actionsError);
          throw actionsError;
        }

        // Type assertion to ensure correct types
        const typedObjectsData = objectsData as unknown as PublishedObject[];
        const typedActionsData = actionsData as unknown as PublishedAction[];

        return {
          ...(appData as unknown as PublishedApplication),
          objects: typedObjectsData || [],
          actions: typedActionsData || []
        };
      },
      enabled: !!applicationId
    });
  };

  // Get fields for a specific object in a published application
  const getObjectFields = async (objectTypeId: string): Promise<PublishedField[]> => {
    const { data, error } = await supabase
      .from("object_fields")
      .select(`
        id,
        name,
        api_name,
        data_type,
        is_required,
        is_system,
        object_type_id
      `)
      .eq("object_type_id", objectTypeId);

    if (error) {
      console.error("Error fetching object fields:", error);
      throw error;
    }

    // Get publishing status for each field
    const { data: publishingData, error: publishingError } = await supabase
      .from("object_field_publishing")
      .select("*")
      .eq("object_type_id", objectTypeId);

    if (publishingError) {
      console.error("Error fetching field publishing status:", publishingError);
      throw publishingError;
    }

    // Create a map of field_id to publishing status
    const publishingMap = publishingData.reduce((acc: Record<string, boolean>, item: any) => {
      acc[item.field_id] = item.is_included;
      return acc;
    }, {});

    // Merge field data with publishing status
    return data.map(field => ({
      id: crypto.randomUUID(), // Generate a temporary ID for the published field
      object_type_id: objectTypeId,
      field_id: field.id,
      field_api_name: field.api_name,
      is_included: publishingMap[field.id] !== undefined ? publishingMap[field.id] : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      field: {
        id: field.id,
        name: field.name,
        api_name: field.api_name,
        data_type: field.data_type
      }
    })) as PublishedField[];
  };

  // Publish a new application
  const publishApplication = useMutation({
    mutationFn: async ({
      name,
      description,
      isPublic,
      objectTypeIds,
      actionIds,
      fieldSettings,
      version = "1.0",
      applicationId
    }: {
      name: string;
      description: string;
      isPublic: boolean;
      objectTypeIds: string[];
      actionIds: string[];
      fieldSettings?: Record<string, Record<string, boolean>>;
      version?: string;
      applicationId?: string;
    }): Promise<string> => {
      if (!user) {
        throw new Error("User must be logged in to publish an application");
      }

      // 1. Create the published application
      const { data: appData, error: appError } = await supabase
        .from("published_applications")
        .insert({
          name,
          description,
          published_by: user.id,
          is_public: isPublic,
          version,
          application_id: applicationId
        })
        .select()
        .single();

      if (appError) {
        throw appError;
      }

      const publishedApplicationId = appData.id;

      // 2. Add object types to the published application
      if (objectTypeIds.length > 0) {
        const objectInserts = objectTypeIds.map(objectTypeId => ({
          published_application_id: publishedApplicationId,
          object_type_id: objectTypeId,
          is_included: true
        }));

        const { error: objectsError } = await supabase
          .from("published_application_objects")
          .insert(objectInserts);

        if (objectsError) {
          throw objectsError;
        }

        // Update field publishing status
        if (fieldSettings) {
          for (const objectTypeId of objectTypeIds) {
            const objectFieldSettings = fieldSettings[objectTypeId];
            
            if (objectFieldSettings) {
              for (const [fieldId, isIncluded] of Object.entries(objectFieldSettings)) {
                const { error: fieldPublishingError } = await supabase
                  .from("object_field_publishing")
                  .upsert({
                    object_type_id: objectTypeId,
                    field_id: fieldId,
                    is_included: isIncluded
                  });

                if (fieldPublishingError) {
                  console.error("Error updating field publishing status:", fieldPublishingError);
                }
              }
            }
          }
        }
      }

      // 3. Add actions to the published application
      if (actionIds.length > 0) {
        const actionInserts = actionIds.map(actionId => ({
          published_application_id: publishedApplicationId,
          action_id: actionId,
          is_included: true
        }));

        const { error: actionsError } = await supabase
          .from("published_application_actions")
          .insert(actionInserts);

        if (actionsError) {
          throw actionsError;
        }
      }

      return publishedApplicationId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["published-applications"] });
      toast.success("Application published successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to publish application", {
        description: error.message || "An error occurred."
      });
    }
  });

  // Update an existing published application
  const updatePublishedApplication = useMutation({
    mutationFn: async ({
      id,
      name,
      description,
      isPublic,
      objectTypeIds,
      actionIds,
      fieldSettings,
      version
    }: {
      id: string;
      name: string;
      description: string;
      isPublic: boolean;
      objectTypeIds: string[];
      actionIds: string[];
      fieldSettings?: Record<string, Record<string, boolean>>;
      version: string;
    }): Promise<string> => {
      if (!user) {
        throw new Error("User must be logged in to update a published application");
      }

      // 1. Update the published application details
      const { data: appData, error: appError } = await supabase
        .from("published_applications")
        .update({
          name,
          description,
          is_public: isPublic,
          version,
          updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .eq("published_by", user.id)
        .select()
        .single();

      if (appError) {
        throw appError;
      }

      // 2. Delete existing objects and actions to replace with new ones
      const { error: deleteObjectsError } = await supabase
        .from("published_application_objects")
        .delete()
        .eq("published_application_id", id);

      if (deleteObjectsError) {
        throw deleteObjectsError;
      }

      const { error: deleteActionsError } = await supabase
        .from("published_application_actions")
        .delete()
        .eq("published_application_id", id);

      if (deleteActionsError) {
        throw deleteActionsError;
      }

      // 3. Add updated object types to the published application
      if (objectTypeIds.length > 0) {
        const objectInserts = objectTypeIds.map(objectTypeId => ({
          published_application_id: id,
          object_type_id: objectTypeId,
          is_included: true
        }));

        const { error: objectsError } = await supabase
          .from("published_application_objects")
          .insert(objectInserts);

        if (objectsError) {
          throw objectsError;
        }

        // Update field publishing status
        if (fieldSettings) {
          for (const objectTypeId of objectTypeIds) {
            const objectFieldSettings = fieldSettings[objectTypeId];
            
            if (objectFieldSettings) {
              for (const [fieldId, isIncluded] of Object.entries(objectFieldSettings)) {
                const { error: fieldPublishingError } = await supabase
                  .from("object_field_publishing")
                  .upsert({
                    object_type_id: objectTypeId,
                    field_id: fieldId,
                    is_included: isIncluded
                  });

                if (fieldPublishingError) {
                  console.error("Error updating field publishing status:", fieldPublishingError);
                }
              }
            }
          }
        }
      }

      // 4. Add actions to the published application
      if (actionIds.length > 0) {
        const actionInserts = actionIds.map(actionId => ({
          published_application_id: id,
          action_id: actionId,
          is_included: true
        }));

        const { error: actionsError } = await supabase
          .from("published_application_actions")
          .insert(actionInserts);

        if (actionsError) {
          throw actionsError;
        }
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["published-applications"] });
      toast.success("Application updated successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to update application", {
        description: error.message || "An error occurred."
      });
    }
  });

  // Delete a published application
  const deletePublishedApplication = useMutation({
    mutationFn: async (applicationId: string): Promise<void> => {
      // Delete application (cascade should handle related objects and actions)
      const { error } = await supabase
        .from("published_applications")
        .delete()
        .eq("id", applicationId);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["published-applications"] });
      toast.success("Application unpublished successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to unpublish application", {
        description: error.message || "An error occurred."
      });
    }
  });

  return {
    publishedApplications,
    isLoading,
    error,
    refetch,
    usePublishedApplicationDetails,
    publishApplication,
    deletePublishedApplication,
    updatePublishedApplication,
    getObjectFields
  };
}
