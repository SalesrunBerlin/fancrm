
import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";

export type ViewMode = "table" | "kanban";

export function useViewMode(objectTypeId: string | undefined) {
  const storageKey = objectTypeId ? `view-mode-${objectTypeId}` : '';
  const [viewMode, setViewMode] = useLocalStorage<ViewMode>(
    storageKey,
    "table"
  );

  // Store the grouping field for Kanban view
  const groupingFieldStorageKey = objectTypeId ? `kanban-grouping-field-${objectTypeId}` : '';
  const [groupingField, setGroupingField] = useLocalStorage<string>(
    groupingFieldStorageKey,
    ""
  );

  const updateViewMode = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, [setViewMode]);

  const updateGroupingField = useCallback((fieldApiName: string) => {
    setGroupingField(fieldApiName);
  }, [setGroupingField]);

  return {
    viewMode,
    updateViewMode,
    groupingField,
    updateGroupingField
  };
}
