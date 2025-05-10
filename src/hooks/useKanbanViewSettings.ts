
import { useLocalStorage } from "./useLocalStorage";

interface KanbanViewSettings {
  fieldApiName: string;
  expandedColumns: string[];
  selectedRecords?: string[];
  visibleCardFields?: string[]; // Add new property for visible fields
}

export function useKanbanViewSettings(objectTypeId: string | undefined) {
  const storageKey = objectTypeId ? `kanban-settings-${objectTypeId}` : '';
  const [settings, setSettings] = useLocalStorage<KanbanViewSettings>(
    storageKey,
    { fieldApiName: '', expandedColumns: [], selectedRecords: [], visibleCardFields: [] }
  );

  const updateFieldApiName = (fieldApiName: string) => {
    setSettings(prev => ({ ...prev, fieldApiName }));
  };

  const toggleColumnExpansion = (columnId: string, isExpanded: boolean) => {
    setSettings(prev => {
      if (isExpanded && !prev.expandedColumns.includes(columnId)) {
        return { ...prev, expandedColumns: [...prev.expandedColumns, columnId] };
      } else if (!isExpanded) {
        return { ...prev, expandedColumns: prev.expandedColumns.filter(id => id !== columnId) };
      }
      return prev;
    });
  };

  const isColumnExpanded = (columnId: string): boolean => {
    return settings.expandedColumns.includes(columnId);
  };

  const updateSelectedRecords = (recordIds: string[]) => {
    setSettings(prev => ({ ...prev, selectedRecords: recordIds }));
  };

  const getSelectedRecords = (): string[] => {
    return settings.selectedRecords || [];
  };

  // Add new methods for visible card fields
  const updateVisibleCardFields = (fieldApiNames: string[]) => {
    setSettings(prev => ({ ...prev, visibleCardFields: fieldApiNames }));
  };

  const getVisibleCardFields = (): string[] => {
    return settings.visibleCardFields || [];
  };

  return {
    settings,
    updateFieldApiName,
    toggleColumnExpansion,
    isColumnExpanded,
    updateSelectedRecords,
    getSelectedRecords,
    updateVisibleCardFields,
    getVisibleCardFields
  };
}
