
import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";

export function useUserFieldSettings(objectTypeId: string | undefined) {
  const storageKey = objectTypeId ? `visible-fields-${objectTypeId}` : '';
  const [visibleFields, setVisibleFields] = useLocalStorage<string[]>(
    storageKey,
    []
  );

  const updateVisibleFields = useCallback((fieldApiNames: string[]) => {
    setVisibleFields(fieldApiNames);
  }, [setVisibleFields]);

  return {
    visibleFields,
    updateVisibleFields
  };
}
