import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Application } from "@/hooks/useApplications";

export interface ObjectApplicationAssignment {
  id: string;
  object_type_id: string;
  application_id: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  application?: Application;
}

export function useObjectApplicationAssignments(objectTypeId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: assignments,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["object-application-assignments", objectTypeId],
    queryFn: async (): Promise<ObjectApplicationAssignment[]> => {
      if (!objectTypeId || !user) {
        return [];
      }
      
      // Get assignments with application details
      const { data, error } = await supabase
        .from("object_application_assignments")
        .select(`
          *,
          application:applications(*)
        `)
        .eq("object_type_id", objectTypeId)
        .eq("owner_id", user.id);
      
      if (error) {
        console.error("Error fetching application assignments:", error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!objectTypeId && !!user,
  });

  const assignObjectToApplication = useMutation({
    mutationFn: async ({
      objectTypeId,
      applicationId,
    }: {
      objectTypeId: string;
      applicationId: string;
    }) => {
      if (!user) {
        throw new Error("User must be logged in to create an assignment");
      }

      const { data, error } = await supabase
        .from("object_application_assignments")
        .insert([
          {
            object_type_id: objectTypeId,
            application_id: applicationId,
            owner_id: user.id,
          },
        ])
        .select(`
          *,
          application:applications(*)
        `)
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["object-application-assignments", objectTypeId] 
      });
      toast.success("Object assigned to application successfully");
    },
    onError: (error) => {
      toast.error("Failed to assign object to application: " + (error instanceof Error ? error.message : "Unknown error"));
    },
  });

  const removeObjectFromApplication = useMutation({
    mutationFn: async (assignmentId: string) => {
      if (!user) {
        throw new Error("User must be logged in to remove an assignment");
      }

      const { error } = await supabase
        .from("object_application_assignments")
        .delete()
        .eq("id", assignmentId)
        .eq("owner_id", user.id);

      if (error) {
        throw error;
      }

      return assignmentId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["object-application-assignments", objectTypeId] 
      });
      toast.success("Object removed from application successfully");
    },
    onError: (error) => {
      toast.error("Failed to remove object from application: " + (error instanceof Error ? error.message : "Unknown error"));
    },
  });

  // Get the applications that an object is NOT assigned to yet
  const getUnassignedApplications = async (): Promise<Application[]> => {
    if (!objectTypeId || !user) {
      return [];
    }
    
    // Get all user's applications
    const { data: allApplications, error: appError } = await supabase
      .from("applications")
      .select("*")
      .eq("owner_id", user.id);
    
    if (appError) {
      console.error("Error fetching applications:", appError);
      throw appError;
    }
    
    // Filter out already assigned applications
    const assignedAppIds = assignments?.map(a => a.application_id) || [];
    return (allApplications || []).filter(app => !assignedAppIds.includes(app.id));
  };

  return {
    assignments,
    isLoading,
    error,
    refetch,
    assignObjectToApplication,
    removeObjectFromApplication,
    getUnassignedApplications,
  };
}
