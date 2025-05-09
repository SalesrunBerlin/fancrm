
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { 
  publishApplication as publishApplicationService,
  updatePublishedApplication as updatePublishedApplicationService,
  deletePublishedApplication as deletePublishedApplicationService
} from "@/services/publishedApplicationService";
import { PublishApplicationParams, UpdatePublishedApplicationParams } from "@/types/publishing";
import { toast } from "sonner";

export function usePublishApplication() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Publish a new application
  const publishApplication = useMutation({
    mutationFn: async (params: PublishApplicationParams): Promise<string> => {
      if (!user) {
        throw new Error("User must be logged in to publish an application");
      }
      return publishApplicationService(params, user.id);
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

  // Update an existing published application
  const updatePublishedApplication = useMutation({
    mutationFn: async (params: UpdatePublishedApplicationParams): Promise<string> => {
      if (!user) {
        throw new Error("User must be logged in to update a published application");
      }
      return updatePublishedApplicationService(params, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["published-applications"] });
      toast.success("Application updated successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to update application", {
        description: error.message || "An error occurred."
      });
    }
  });

  // Delete a published application
  const deletePublishedApplication = useMutation({
    mutationFn: async (applicationId: string): Promise<void> => {
      return deletePublishedApplicationService(applicationId);
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
    publishApplication,
    updatePublishedApplication,
    deletePublishedApplication
  };
}
