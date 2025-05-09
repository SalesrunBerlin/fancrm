
import { supabase } from "@/integrations/supabase/client";
import { PublishedApplication, PublishedField } from "@/types/publishing";
import { toast } from "sonner";

// Helper function to normalize publisher data
export const normalizePublisherData = (app: any): PublishedApplication => {
  // Make sure publisher exists and has the right shape
  const publisher = app.publisher || {};
  
  return {
    ...app,
    publisher: {
      id: publisher.id || app.published_by,
      email: publisher.email || 'Unknown email',
      user_metadata: {
        full_name: publisher.user_metadata?.full_name || null
      }
    }
  };
};

// Fetch all published applications that are public or published by the current user
export const fetchPublishedApplications = async (userId?: string): Promise<PublishedApplication[]> => {
  console.log("Fetching published applications, user:", userId);
  try {
    // Get all public applications regardless of who's logged in
    const { data: publicApps, error: publicError } = await supabase
      .from("published_applications")
      .select(`
        *,
        publisher:published_by(id, email, user_metadata)
      `)
      .eq("is_public", true)
      .eq("is_active", true);
      
    if (publicError) {
      console.error("Error fetching public applications:", publicError);
      throw publicError;
    }
    
    console.log("Public apps fetched:", publicApps?.length || 0);
    
    let allApps = [];
    
    // Process and normalize public apps
    const processedPublicApps = (publicApps || []).map(app => {
      return normalizePublisherData(app);
    });
    
    allApps = processedPublicApps;
    
    // If user is logged in, also get their private published apps
    if (userId) {
      const { data: privateApps, error: privateError } = await supabase
        .from("published_applications")
        .select(`
          *,
          publisher:published_by(id, email, user_metadata)
        `)
        .eq("is_public", false)
        .eq("published_by", userId)
        .eq("is_active", true);
        
      if (privateError) {
        console.error("Error fetching private applications:", privateError);
        // Don't throw error here, just log it and continue with public apps
      } else if (privateApps) {
        console.log("Private apps fetched:", privateApps.length);
        // Process and normalize private apps
        const processedPrivateApps = privateApps.map(app => {
          return normalizePublisherData(app);
        });
        
        // Combine public and private apps
        allApps = [...allApps, ...processedPrivateApps];
      }
    }
    
    return allApps as PublishedApplication[];
  } catch (err) {
    console.error("Error in published applications query:", err);
    // Return empty array instead of throwing to prevent UI from breaking
    return [];
  }
};

// Fetch details for a specific published application including its objects and actions
export const fetchPublishedApplicationDetails = async (applicationId?: string): Promise<PublishedApplication | null> => {
  if (!applicationId) return null;

  try {
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

    return {
      ...(appData as unknown as PublishedApplication),
      objects: objectsData as unknown as PublishedApplication['objects'] || [],
      actions: actionsData as unknown as PublishedApplication['actions'] || []
    };
  } catch (error) {
    console.error("Error fetching published application details:", error);
    throw error;
  }
};

// Get fields for a specific object in a published application
export const fetchObjectFields = async (objectTypeId: string): Promise<PublishedField[]> => {
  try {
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
  } catch (error) {
    console.error("Error fetching object fields:", error);
    throw error;
  }
};

// Publish a new application
export const publishApplication = async (
  params: {
    name: string;
    description: string;
    isPublic: boolean;
    objectTypeIds: string[];
    actionIds: string[];
    fieldSettings?: Record<string, Record<string, boolean>>;
    version?: string;
    applicationId?: string;
  },
  userId: string
): Promise<string> => {
  if (!userId) {
    throw new Error("User must be logged in to publish an application");
  }

  try {
    // 1. Create the published application
    const { data: appData, error: appError } = await supabase
      .from("published_applications")
      .insert({
        name: params.name,
        description: params.description,
        published_by: userId,
        is_public: params.isPublic,
        version: params.version || "1.0",
        application_id: params.applicationId
      })
      .select()
      .single();

    if (appError) {
      throw appError;
    }

    const publishedApplicationId = appData.id;

    // 2. Add object types to the published application
    if (params.objectTypeIds.length > 0) {
      const objectInserts = params.objectTypeIds.map(objectTypeId => ({
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
      if (params.fieldSettings) {
        for (const objectTypeId of params.objectTypeIds) {
          const objectFieldSettings = params.fieldSettings[objectTypeId];
          
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
    if (params.actionIds.length > 0) {
      const actionInserts = params.actionIds.map(actionId => ({
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
  } catch (error) {
    console.error("Error publishing application:", error);
    throw error;
  }
};

// Update an existing published application
export const updatePublishedApplication = async (
  params: {
    id: string;
    name: string;
    description: string;
    isPublic: boolean;
    objectTypeIds: string[];
    actionIds: string[];
    fieldSettings?: Record<string, Record<string, boolean>>;
    version: string;
  },
  userId: string
): Promise<string> => {
  if (!userId) {
    throw new Error("User must be logged in to update a published application");
  }

  try {
    // 1. Update the published application details
    const { data: appData, error: appError } = await supabase
      .from("published_applications")
      .update({
        name: params.name,
        description: params.description,
        is_public: params.isPublic,
        version: params.version,
        updated_at: new Date().toISOString()
      })
      .eq("id", params.id)
      .eq("published_by", userId)
      .select()
      .single();

    if (appError) {
      throw appError;
    }

    // 2. Delete existing objects and actions to replace with new ones
    const { error: deleteObjectsError } = await supabase
      .from("published_application_objects")
      .delete()
      .eq("published_application_id", params.id);

    if (deleteObjectsError) {
      throw deleteObjectsError;
    }

    const { error: deleteActionsError } = await supabase
      .from("published_application_actions")
      .delete()
      .eq("published_application_id", params.id);

    if (deleteActionsError) {
      throw deleteActionsError;
    }

    // 3. Add updated object types to the published application
    if (params.objectTypeIds.length > 0) {
      const objectInserts = params.objectTypeIds.map(objectTypeId => ({
        published_application_id: params.id,
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
      if (params.fieldSettings) {
        for (const objectTypeId of params.objectTypeIds) {
          const objectFieldSettings = params.fieldSettings[objectTypeId];
          
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
    if (params.actionIds.length > 0) {
      const actionInserts = params.actionIds.map(actionId => ({
        published_application_id: params.id,
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

    return params.id;
  } catch (error) {
    console.error("Error updating published application:", error);
    throw error;
  }
};

// Delete a published application
export const deletePublishedApplication = async (applicationId: string): Promise<void> => {
  try {
    // Delete application (cascade should handle related objects and actions)
    const { error } = await supabase
      .from("published_applications")
      .delete()
      .eq("id", applicationId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error deleting published application:", error);
    throw error;
  }
};
