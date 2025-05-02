
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { ColumnMapping } from "@/hooks/useImportRecords";

export interface StoredImportData {
  rawText: string;
  headers: string[];
  rows: string[][];
  columnMappings: ColumnMapping[];
  step: "paste" | "mapping" | "duplicate-check" | "preview" | "batch-field-creation" | "importing";
  processingNewField: boolean;
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

  const updateProcessingState = (processingNewField: boolean) => {
    if (storedData) {
      setStoredData({
        ...storedData,
        processingNewField
      });
    }
  };

  const updateColumnMapping = (columnIndex: number, fieldId: string | null) => {
    if (storedData && storedData.columnMappings) {
      const updatedMappings = [...storedData.columnMappings];
      updatedMappings[columnIndex] = {
        ...updatedMappings[columnIndex],
        targetField: fieldId ? {
          id: fieldId,
          name: "",  // These will be populated when data is fully restored
          api_name: ""
        } : null
      };
      
      setStoredData({
        ...storedData,
        columnMappings: updatedMappings
      });
    }
  };

  return {
    storedData,
    storeImportData,
    clearImportData,
    updateProcessingState,
    updateColumnMapping
  };
}
