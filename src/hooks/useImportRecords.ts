
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { findDuplicateRecords, DuplicateRecord } from "@/utils/importDuplicateUtils";
import { parseImportText, createInitialColumnMappings, getSampleValuesForColumn, guessDataTypeForColumn, ImportDataType } from "@/utils/importDataUtils";
import { createRecord, updateRecord, importRecords as importRecordsService } from "@/services/recordImportService";

export interface ColumnMapping {
  sourceColumnName: string;
  sourceColumnIndex: number;
  targetField: {
    id: string;
    name: string;
    api_name: string;
  } | null;
}

export { DuplicateRecord };

export function useImportRecords(objectTypeId: string, fields: any[]) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isImporting, setIsImporting] = useState(false);
  const [importData, setImportData] = useState<ImportDataType | null>(null);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateRecord[]>([]);
  const [matchingFields, setMatchingFields] = useState<string[]>([]);
  const [isDuplicateCheckCompleted, setIsDuplicateCheckCompleted] = useState(false);
  const [duplicateCheckIntensity, setDuplicateCheckIntensity] = useState<'low' | 'medium' | 'high'>('medium');

  // Mutation for creating records
  const createRecordMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      return createRecord(objectTypeId, data, user);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["object-records", objectTypeId] });
    }
  });

  // Mutation for updating records
  const updateRecordMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Record<string, string> }) => {
      return updateRecord(id, data, user);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["object-records", objectTypeId] });
    }
  });

  const parseImportData = (text: string): ImportDataType | null => {
    const parsedData = parseImportText(text);
    
    if (parsedData) {
      setImportData(parsedData);
      const initialMappings = createInitialColumnMappings(parsedData, fields);
      setColumnMappings(initialMappings);
    }
    
    return parsedData;
  };

  const updateColumnMapping = (columnIndex: number, fieldId: string | null) => {
    setColumnMappings(prev => {
      return prev.map((mapping, idx) => {
        if (idx === columnIndex) {
          const targetField = fieldId 
            ? fields.find(f => f.id === fieldId) 
            : null;
          
          return {
            ...mapping,
            targetField: targetField ? {
              id: targetField.id,
              name: targetField.name,
              api_name: targetField.api_name
            } : null
          };
        }
        return mapping;
      });
    });
  };

  const checkForDuplicates = async (): Promise<boolean> => {
    if (!importData || matchingFields.length === 0) {
      setDuplicates([]);
      setIsDuplicateCheckCompleted(true);
      return false;
    }

    try {
      const foundDuplicates = await findDuplicateRecords(
        objectTypeId,
        importData,
        columnMappings,
        matchingFields,
        duplicateCheckIntensity
      );
      
      setDuplicates(foundDuplicates);
      setIsDuplicateCheckCompleted(true);
      return foundDuplicates.length > 0;
    } catch (error) {
      console.error("Error checking for duplicates:", error);
      toast.error("Failed to check for duplicates");
      return false;
    }
  };

  const updateMatchingFields = (fieldApiNames: string[]) => {
    setMatchingFields(fieldApiNames);
    setIsDuplicateCheckCompleted(false);
  };

  const updateDuplicateAction = (rowIndex: number, action: 'skip' | 'update' | 'create') => {
    setDuplicates(prev => {
      return prev.map(dup => {
        if (dup.importRowIndex === rowIndex) {
          return { ...dup, action };
        }
        return dup;
      });
    });
  };

  const updateDuplicateCheckIntensity = (intensity: 'low' | 'medium' | 'high') => {
    setDuplicateCheckIntensity(intensity);
    setIsDuplicateCheckCompleted(false);
  };

  const clearImportData = () => {
    setImportData(null);
    setColumnMappings([]);
    setDuplicates([]);
    setMatchingFields([]);
    setIsDuplicateCheckCompleted(false);
  };

  const importRecords = async (selectedRows: number[]): Promise<{success: number, failures: number} | null> => {
    if (!importData || !columnMappings.some(m => m.targetField)) {
      toast.error("No valid field mappings found");
      return null;
    }
    
    if (!user) {
      toast.error("You must be logged in to import records");
      return null;
    }
    
    setIsImporting(true);
    
    try {
      const result = await importRecordsService(
        objectTypeId,
        importData,
        columnMappings,
        selectedRows,
        duplicates,
        user
      );
      
      queryClient.invalidateQueries({ queryKey: ["object-records", objectTypeId] });
      return result;
    } finally {
      setIsImporting(false);
    }
  };

  // Utility function for determining the likely data type for a column
  const guessDataTypeForColumn = (columnIndex: number): string => {
    if (!importData) return "text";
    
    // Get the column name
    const columnName = columnMappings[columnIndex]?.sourceColumnName || "";
    
    // Get sample values
    const sampleValues = getSampleValuesForColumn(importData, columnIndex);
    
    return guessDataTypeForColumn(columnName, sampleValues);
  };

  return {
    importData,
    columnMappings,
    isImporting,
    duplicates,
    matchingFields,
    isDuplicateCheckCompleted,
    duplicateCheckIntensity,
    parseImportText: parseImportData,
    updateColumnMapping,
    importRecords,
    clearImportData,
    checkForDuplicates,
    updateMatchingFields,
    updateDuplicateAction,
    updateDuplicateCheckIntensity,
    guessDataTypeForColumn
  };
}
