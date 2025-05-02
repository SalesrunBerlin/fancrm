
import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";

export type ViewMode = 'table' | 'kanban';

export interface UserFieldSettings {
  visibleFields: string[];
  viewMode: ViewMode;
  kanbanField?: string;
}

export function useUserFieldSettings(objectTypeId: string | undefined) {
  const storageKey = objectTypeId ? `field-settings-${objectTypeId}` : '';
  
  // Initialize with default settings
  const [settings, setSettings] = useLocalStorage<UserFieldSettings>(
    storageKey,
    {
      visibleFields: [],
      viewMode: 'table',
      kanbanField: undefined
    }
  );

  const updateVisibleFields = useCallback((fieldApiNames: string[]) => {
    setSettings(prev => ({
      ...prev,
      visibleFields: fieldApiNames
    }));
  }, [setSettings]);
  
  const updateViewMode = useCallback((mode: ViewMode) => {
    setSettings(prev => ({
      ...prev,
      viewMode: mode
    }));
  }, [setSettings]);
  
  const updateKanbanField = useCallback((fieldApiName: string | undefined) => {
    setSettings(prev => ({
      ...prev,
      kanbanField: fieldApiName
    }));
  }, [setSettings]);

  return {
    visibleFields: settings.visibleFields,
    viewMode: settings.viewMode,
    kanbanField: settings.kanbanField,
    updateVisibleFields,
    updateViewMode,
    updateKanbanField
  };
}
