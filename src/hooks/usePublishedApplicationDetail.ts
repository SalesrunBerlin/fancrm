
import { useQuery } from "@tanstack/react-query";
import { fetchPublishedApplicationDetails } from "@/services/publishedApplicationService";
import { PublishedApplication } from "@/types/publishing";

export function usePublishedApplicationDetail(applicationId?: string) {
  return useQuery({
    queryKey: ["published-application", applicationId],
    queryFn: async (): Promise<PublishedApplication | null> => {
      return fetchPublishedApplicationDetails(applicationId);
    },
    enabled: !!applicationId
  });
}
