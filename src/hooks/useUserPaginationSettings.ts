
import { useUserViewSettings } from "./useUserViewSettings";

export interface PaginationSettings {
  pageSize: number;
  currentPage: number;
}

const DEFAULT_PAGE_SIZE = 20;

export function useUserPaginationSettings(objectTypeId: string | undefined) {
  const { settings, updateSettings, isLoading } = useUserViewSettings(objectTypeId, 'pagination');
  
  // Initialize with default values if not set
  const paginationSettings: PaginationSettings = {
    pageSize: settings?.pageSize || DEFAULT_PAGE_SIZE,
    currentPage: settings?.currentPage || 1
  };

  const updatePaginationSettings = (newSettings: Partial<PaginationSettings>) => {
    updateSettings({
      ...settings,
      ...newSettings
    });
  };

  const setPageSize = (pageSize: number) => {
    updatePaginationSettings({ pageSize, currentPage: 1 }); // Reset to page 1 when changing page size
  };

  const setCurrentPage = (currentPage: number) => {
    updatePaginationSettings({ currentPage });
  };

  return {
    pageSize: paginationSettings.pageSize,
    currentPage: paginationSettings.currentPage,
    setPageSize,
    setCurrentPage,
    isLoading
  };
}
