
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useObjectTypePublishing() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Publish an object type
  const publishObjectType = useMutation({
    mutationFn: async (objectTypeId: string) => {
      const { data, error } = await supabase
        .from("object_types")
        .update({ is_published: true })
        .eq("id", objectTypeId)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("No rows updated");
      }
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["object-types"] });
      queryClient.invalidateQueries({ queryKey: ["published-objects"] });
      toast({
        title: "Success",
        description: "Object type published successfully",
      });
    },
    onError: (error) => {
      console.error("Error publishing object type:", error);
      toast({
        title: "Error",
        description: "Failed to publish object type",
        variant: "destructive",
      });
    }
  });

  // Unpublish an object type
  const unpublishObjectType = useMutation({
    mutationFn: async (objectTypeId: string) => {
      const { data, error } = await supabase
        .from("object_types")
        .update({ is_published: false })
        .eq("id", objectTypeId)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("No rows updated");
      }
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["object-types"] });
      queryClient.invalidateQueries({ queryKey: ["published-objects"] });
      toast({
        title: "Success",
        description: "Object type unpublished successfully",
      });
    },
    onError: (error) => {
      console.error("Error unpublishing object type:", error);
      toast({
        title: "Error",
        description: "Failed to unpublish object type",
        variant: "destructive",
      });
    }
  });

  return {
    publishObjectType,
    unpublishObjectType
  };
}
