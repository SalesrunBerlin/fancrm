
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { ColumnMapping } from "@/hooks/useImportRecords";

export interface StoredImportData {
  rawText: string;
  headers: string[];
  rows: string[][];
  columnMappings: ColumnMapping[];
  step: "paste" | "mapping" | "duplicate-check" | "preview" | "batch-field-creation" | "importing";
}

export function useImportStorage(objectTypeId: string) {
  const storageKey = `import_data_${objectTypeId}`;
  
  const [storedData, setStoredData] = useLocalStorage<StoredImportData | null>(
    storageKey,
    null
  );

  const storeImportData = (data: StoredImportData) => {
    setStoredData(data);
  };

  const clearImportData = () => {
    setStoredData(null);
  };

  return {
    storedData,
    storeImportData,
    clearImportData
  };
}
