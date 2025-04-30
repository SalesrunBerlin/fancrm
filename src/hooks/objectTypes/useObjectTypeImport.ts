
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export function useObjectTypeImport() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

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

  return {
    importObjectType
  };
}
