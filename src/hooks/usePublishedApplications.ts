
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
  publisher?: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
    };
  };
  objects?: PublishedObject[];
  actions?: PublishedAction[];
}

export interface PublishedObject {
  id: string;
  published_application_id: string;
  object_type_id: string;
  is_included: boolean;
  created_at: string;
  updated_at: string;
  // Fix the type to include required fields
  object_type: {
    id: string;
    name: string;
    api_name: string;
    description?: string;
  };
}

export interface PublishedAction {
  id: string;
  published_application_id: string;
  action_id: string;
  is_included: boolean;
  created_at: string;
  updated_at: string;
  // Fix the type to include required fields
  action: {
    id: string;
    name: string;
    description?: string;
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
      let query = supabase
        .from("published_applications")
        .select(`
          *,
          publisher:published_by(id, email, user_metadata)
        `);

      if (user) {
        // If user is logged in, show their private published apps and all public apps
        query = query.or(`is_public.eq.true,published_by.eq.${user.id}`);
      } else {
        // If user is not logged in, only show public apps
        query = query.eq("is_public", true);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching published applications:", error);
        throw error;
      }

      return data || [];
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
          ...appData,
          objects: typedObjectsData || [],
          actions: typedActionsData || []
        };
      },
      enabled: !!applicationId
    });
  };

  // Publish a new application
  const publishApplication = useMutation({
    mutationFn: async ({
      name,
      description,
      isPublic,
      objectTypeIds,
      actionIds
    }: {
      name: string;
      description: string;
      isPublic: boolean;
      objectTypeIds: string[];
      actionIds: string[];
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
          is_public: isPublic
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
    deletePublishedApplication
  };
}
