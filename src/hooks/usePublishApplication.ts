
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { PublishApplicationParams, UpdatePublishedApplicationParams } from "@/types/publishing";

export function usePublishApplication() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const publishApplication = useMutation({
    mutationFn: async (params: PublishApplicationParams): Promise<string> => {
      if (!user) {
        throw new Error("User must be logged in to publish an application");
      }

      try {
        console.log("Publishing application with params:", JSON.stringify(params, null, 2));
        
        // 1. Create the published application
        const { data: appData, error: appError } = await supabase
          .from("published_applications")
          .insert({
            name: params.name,
            description: params.description,
            published_by: user.id,
            is_public: params.isPublic,
            version: params.version || "1.0",
            application_id: params.applicationId
          })
          .select()
          .single();

        if (appError) {
          console.error("Error publishing application:", appError);
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
            console.error("Error adding objects to published application:", objectsError);
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
            console.error("Error adding actions to published application:", actionsError);
            throw actionsError;
          }
        }

        console.log("Successfully published application with ID:", publishedApplicationId);
        return publishedApplicationId;
      } catch (error) {
        console.error("Error in publishApplication:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["published-applications"] });
      toast.success("Application published successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to publish application", { description: error.message || "An unknown error occurred" });
    }
  });

  const updatePublishedApplication = useMutation({
    mutationFn: async (params: UpdatePublishedApplicationParams): Promise<string> => {
      if (!user) {
        throw new Error("User must be logged in to update a published application");
      }

      try {
        console.log("Updating published application:", params.id);
        
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
          .eq("published_by", user.id)
          .select()
          .single();

        if (appError) {
          console.error("Error updating published application:", appError);
          throw appError;
        }

        // 2. Delete existing objects and actions to replace with new ones
        const { error: deleteObjectsError } = await supabase
          .from("published_application_objects")
          .delete()
          .eq("published_application_id", params.id);

        if (deleteObjectsError) {
          console.error("Error deleting existing published objects:", deleteObjectsError);
          throw deleteObjectsError;
        }

        const { error: deleteActionsError } = await supabase
          .from("published_application_actions")
          .delete()
          .eq("published_application_id", params.id);

        if (deleteActionsError) {
          console.error("Error deleting existing published actions:", deleteActionsError);
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
            console.error("Error adding objects to updated published application:", objectsError);
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
            console.error("Error adding actions to updated published application:", actionsError);
            throw actionsError;
          }
        }

        console.log("Successfully updated published application with ID:", params.id);
        return params.id;
      } catch (error) {
        console.error("Error in updatePublishedApplication:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["published-applications"] });
      toast.success("Published application updated successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to update published application", { description: error.message || "An unknown error occurred" });
    }
  });

  const deletePublishedApplication = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      if (!user) {
        throw new Error("User must be logged in to delete a published application");
      }

      try {
        // Delete application (cascade should handle related objects and actions)
        const { error } = await supabase
          .from("published_applications")
          .delete()
          .eq("id", id)
          .eq("published_by", user.id);

        if (error) {
          console.error("Error deleting published application:", error);
          throw error;
        }
        
        console.log("Successfully deleted published application:", id);
      } catch (error) {
        console.error("Error in deletePublishedApplication:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["published-applications"] });
      toast.success("Published application deleted successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to delete published application", { description: error.message || "An unknown error occurred" });
    }
  });

  return {
    publishApplication,
    updatePublishedApplication,
    deletePublishedApplication
  };
}
