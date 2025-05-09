
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchPublishedApplications } from "@/services/publishedApplicationService";
import { PublishedApplication } from "@/types/publishing";

export function usePublishedApplicationList() {
  const { user } = useAuth();

  // Get all published applications that are public or published by the current user
  const {
    data: publishedApplications,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["published-applications"],
    queryFn: async (): Promise<PublishedApplication[]> => {
      return fetchPublishedApplications(user?.id);
    },
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  return {
    publishedApplications,
    isLoading,
    error,
    refetch
  };
}
