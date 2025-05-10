
import { useUserViewSettings } from "./useUserViewSettings";

interface KanbanViewSettings {
  fieldApiName: string;
  expandedColumns: string[];
  selectedRecords?: string[];
  visibleCardFields?: string[];
}

export function useKanbanViewSettings(objectTypeId: string | undefined) {
  const { settings, updateSettings, isLoading } = useUserViewSettings(objectTypeId, 'kanban');
  
  // Cast generic settings to our specific type
  const kanbanSettings = settings as KanbanViewSettings;
  
  // Initialize with default values if properties are missing
  const effectiveSettings: KanbanViewSettings = {
    fieldApiName: kanbanSettings.fieldApiName || '',
    expandedColumns: kanbanSettings.expandedColumns || [],
    selectedRecords: kanbanSettings.selectedRecords || [],
    visibleCardFields: kanbanSettings.visibleCardFields || []
  };

  const updateFieldApiName = (fieldApiName: string) => {
    updateSettings({
      ...effectiveSettings,
      fieldApiName
    });
  };

  const toggleColumnExpansion = (columnId: string, isExpanded: boolean) => {
    const expandedColumns = [...effectiveSettings.expandedColumns];
    
    if (isExpanded && !expandedColumns.includes(columnId)) {
      expandedColumns.push(columnId);
    } else if (!isExpanded) {
      const index = expandedColumns.indexOf(columnId);
      if (index !== -1) {
        expandedColumns.splice(index, 1);
      }
    }
    
    updateSettings({
      ...effectiveSettings,
      expandedColumns
    });
  };

  const isColumnExpanded = (columnId: string): boolean => {
    return effectiveSettings.expandedColumns.includes(columnId);
  };

  const updateSelectedRecords = (recordIds: string[]) => {
    updateSettings({
      ...effectiveSettings,
      selectedRecords: recordIds
    });
  };

  const getSelectedRecords = (): string[] => {
    return effectiveSettings.selectedRecords || [];
  };

  const updateVisibleCardFields = (fieldApiNames: string[]) => {
    updateSettings({
      ...effectiveSettings,
      visibleCardFields: fieldApiNames
    });
  };

  const getVisibleCardFields = (): string[] => {
    return effectiveSettings.visibleCardFields || [];
  };

  return {
    settings: effectiveSettings,
    updateFieldApiName,
    toggleColumnExpansion,
    isColumnExpanded,
    updateSelectedRecords,
    getSelectedRecords,
    updateVisibleCardFields,
    getVisibleCardFields,
    isLoading
  };
}
