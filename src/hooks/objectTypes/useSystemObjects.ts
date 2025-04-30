
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useSystemObjects() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

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

  return {
    deleteSystemObjects
  };
}
