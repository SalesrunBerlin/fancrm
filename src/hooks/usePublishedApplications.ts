
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export interface PublishedApplication {
  id: string;
  application_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  is_public: boolean;
  version: string | null;
  published_by: string;
  created_at: string;
  updated_at: string;
}

export interface PublicationSettings {
  id: string;
  application_id: string;
  published_application_id: string;
  include_objects: boolean;
  include_actions: boolean;
  created_at: string;
  updated_at: string;
}

export interface PublishedObject {
  id: string;
  published_application_id: string;
  object_type_id: string;
  is_included: boolean;
  created_at: string;
  updated_at: string;
  object_type?: {
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
  action?: {
    id: string;
    name: string;
    description?: string;
  };
}

export interface PublishApplicationInput {
  applicationId: string;
  name: string;
  description?: string;
  isPublic: boolean;
  version?: string;
  includedObjectIds: string[];
  includedActionIds: string[];
}

export function usePublishedApplications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get all published applications
  const {
    data: publishedApplications,
    isLoading: isLoadingPublishedApps,
    error: publishedAppsError,
    refetch: refetchPublishedApps
  } = useQuery({
    queryKey: ["published-applications"],
    queryFn: async (): Promise<PublishedApplication[]> => {
      const { data, error } = await supabase
        .from("published_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching published applications:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user
  });

  // Get applications published by the current user
  const {
    data: myPublishedApplications,
    isLoading: isLoadingMyPublishedApps
  } = useQuery({
    queryKey: ["my-published-applications"],
    queryFn: async (): Promise<PublishedApplication[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("published_applications")
        .select("*")
        .eq("published_by", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching my published applications:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user
  });

  // Get objects for a published application
  const getPublishedObjects = async (publishedAppId: string): Promise<PublishedObject[]> => {
    const { data, error } = await supabase
      .from("published_application_objects")
      .select(`
        *,
        object_type:object_type_id(id, name, api_name, description)
      `)
      .eq("published_application_id", publishedAppId)
      .eq("is_included", true);

    if (error) {
      console.error("Error fetching published objects:", error);
      throw error;
    }

    return (data || []).map(item => ({
      ...item,
      object_type: item.object_type
    }));
  };

  // Get actions for a published application
  const getPublishedActions = async (publishedAppId: string): Promise<PublishedAction[]> => {
    const { data, error } = await supabase
      .from("published_application_actions")
      .select(`
        *,
        action:action_id(id, name, description)
      `)
      .eq("published_application_id", publishedAppId)
      .eq("is_included", true);

    if (error) {
      console.error("Error fetching published actions:", error);
      throw error;
    }

    return (data || []).map(item => ({
      ...item,
      action: item.action
    }));
  };

  // Publish an application
  const publishApplication = useMutation({
    mutationFn: async (input: PublishApplicationInput): Promise<PublishedApplication> => {
      if (!user) {
        throw new Error("User must be logged in to publish an application");
      }

      // 1. Create the published application record
      const { data: publishedApp, error: publishError } = await supabase
        .from("published_applications")
        .insert({
          application_id: input.applicationId,
          name: input.name,
          description: input.description,
          is_public: input.isPublic,
          version: input.version || "1.0",
          published_by: user.id
        })
        .select()
        .single();

      if (publishError) {
        throw publishError;
      }

      // 2. Create the application publishing settings
      const { error: settingsError } = await supabase
        .from("application_publishing_settings")
        .insert({
          application_id: input.applicationId,
          published_application_id: publishedApp.id,
          include_objects: input.includedObjectIds.length > 0,
          include_actions: input.includedActionIds.length > 0
        });

      if (settingsError) {
        throw settingsError;
      }

      // 3. Add the included objects
      if (input.includedObjectIds.length > 0) {
        const objectInserts = input.includedObjectIds.map(objectId => ({
          published_application_id: publishedApp.id,
          object_type_id: objectId,
          is_included: true
        }));

        const { error: objectsError } = await supabase
          .from("published_application_objects")
          .insert(objectInserts);

        if (objectsError) {
          throw objectsError;
        }
      }

      // 4. Add the included actions
      if (input.includedActionIds.length > 0) {
        const actionInserts = input.includedActionIds.map(actionId => ({
          published_application_id: publishedApp.id,
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

      return publishedApp;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["published-applications"] });
      queryClient.invalidateQueries({ queryKey: ["my-published-applications"] });
      toast.success("Application published successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to publish application", {
        description: error.message || "An error occurred."
      });
    }
  });

  // Toggle published application status (active/inactive)
  const togglePublishedAppStatus = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }): Promise<void> => {
      const { error } = await supabase
        .from("published_applications")
        .update({ is_active: isActive })
        .eq("id", id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["published-applications"] });
      queryClient.invalidateQueries({ queryKey: ["my-published-applications"] });
      toast.success("Application status updated");
    },
    onError: (error: any) => {
      toast.error("Failed to update application status", {
        description: error.message || "An error occurred."
      });
    }
  });

  return {
    publishedApplications,
    myPublishedApplications,
    isLoadingPublishedApps,
    isLoadingMyPublishedApps,
    publishedAppsError,
    publishApplication,
    togglePublishedAppStatus,
    getPublishedObjects,
    getPublishedActions,
    refetchPublishedApps
  };
}
