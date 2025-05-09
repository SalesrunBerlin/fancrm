
import { useQuery } from "@tanstack/react-query";
import { fetchObjectFields } from "@/services/publishedApplicationService";
import { PublishedField } from "@/types/publishing";

export function useObjectFieldsPublishing(objectTypeId: string) {
  return useQuery({
    queryKey: ["object-fields-publishing", objectTypeId],
    queryFn: async (): Promise<PublishedField[]> => {
      return fetchObjectFields(objectTypeId);
    },
    enabled: !!objectTypeId
  });
}
