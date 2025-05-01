
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ObjectType } from "@/hooks/useObjectTypes";

export function useApplicationObjects(applicationId?: string) {
  const { user } = useAuth();

  const {
    data: applicationObjects,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["application-objects", applicationId],
    queryFn: async (): Promise<ObjectType[]> => {
      if (!applicationId || !user) {
        return [];
      }
      
      // Get objects assigned to this application
      const { data, error } = await supabase
        .from("object_application_assignments")
        .select(`
          object_type_id,
          object:object_types(*)
        `)
        .eq("application_id", applicationId);
      
      if (error) {
        console.error("Error fetching application objects:", error);
        throw error;
      }
      
      // Extract the object data from the query result
      const objects = data
        .map(item => item.object as ObjectType)
        .filter(obj => obj); // Filter out any undefined objects
      
      return objects || [];
    },
    enabled: !!applicationId && !!user,
  });

  return {
    applicationObjects,
    isLoading,
    error
  };
}
