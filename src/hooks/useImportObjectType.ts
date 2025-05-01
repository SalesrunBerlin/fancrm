
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export function useImportObjectType() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const importObjectType = useMutation({
    mutationFn: async ({ sourceObjectId, applicationId }: { sourceObjectId: string, applicationId?: string | null }) => {
      if (!user) {
        throw new Error("User must be logged in to import an object type");
      }

      try {
        // 1. Import the object structure
        const { data: clonedObject, error: cloneError } = await supabase
          .rpc('clone_object_structure', {
            source_object_id: sourceObjectId,
            new_owner_id: user.id
          });

        if (cloneError) throw cloneError;

        // 2. If applicationId is provided, assign the object to the application
        if (applicationId && clonedObject) {
          const { error: assignError } = await supabase
            .from("object_application_assignments")
            .insert({
              object_type_id: clonedObject,
              application_id: applicationId,
              owner_id: user.id
            });
            
          if (assignError) {
            console.error("Error assigning object to application:", assignError);
            // Continue execution even if assignment fails
          }
        }

        return clonedObject;
      } catch (error) {
        console.error("Error importing object type:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["object-types"] });
      toast({
        title: "Success",
        description: "Object structure imported successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Import Failed",
        description: error.message || "There was an error importing the object structure.",
        variant: "destructive",
      });
    },
  });
  
  return importObjectType;
}
