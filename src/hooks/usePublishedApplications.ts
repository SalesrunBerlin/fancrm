
import { usePublishedApplicationList } from "./usePublishedApplicationList";
import { usePublishedApplicationDetail } from "./usePublishedApplicationDetail";
import { usePublishApplication } from "./usePublishApplication";
import { useObjectFieldsPublishing } from "./useObjectFieldsPublishing";
import { fetchObjectFields } from "@/services/publishedApplicationService";
import type { 
  PublishedApplication, 
  PublishedObject, 
  PublishedAction, 
  PublishedField 
} from "@/types/publishing";

// This is now a facade that aggregates all the functionality from the specialized hooks
export function usePublishedApplications() {
  const {
    publishedApplications,
    isLoading,
    error,
    refetch
  } = usePublishedApplicationList();

  const {
    publishApplication,
    updatePublishedApplication,
    deletePublishedApplication
  } = usePublishApplication();

  // Provide the same API as before, but now using the specialized hooks
  return {
    publishedApplications,
    isLoading,
    error,
    refetch,
    usePublishedApplicationDetails: usePublishedApplicationDetail,
    publishApplication,
    updatePublishedApplication,
    deletePublishedApplication,
    getObjectFields: fetchObjectFields
  };
}

// Re-export types from the new location using 'export type'
export type { PublishedApplication, PublishedObject, PublishedAction, PublishedField } from "@/types/publishing";
