
import { useUserViewSettings } from "./useUserViewSettings";

export function useUserPaginationSettings(objectTypeId: string | undefined) {
  const { settings, updateSettings, isLoading } = useUserViewSettings(objectTypeId, 'pagination');
  
  const pageSize = settings?.pageSize || 20;
  const currentPage = settings?.currentPage || 1;

  const setPageSize = (newPageSize: number) => {
    updateSettings({
      ...settings,
      pageSize: newPageSize,
      // Reset to page 1 when changing page size
      currentPage: 1
    });
  };

  const setCurrentPage = (newPage: number) => {
    updateSettings({
      ...settings,
      currentPage: newPage
    });
  };

  return {
    pageSize,
    currentPage,
    setPageSize,
    setCurrentPage,
    isLoading
  };
}
