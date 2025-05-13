
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { DuplicateRecord } from "@/types";

export interface ColumnMapping {
  sourceColumnName: string;
  sourceColumnIndex: number;
  targetField: {
    id: string;
    name: string;
    api_name: string;
  } | null;
}

export interface ImportDataType {
  headers: string[];
  rows: string[][];
}

export function useImportRecords() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isImporting, setIsImporting] = useState(false);
  const [importData, setImportData] = useState<ImportDataType | null>(null);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateRecord[]>([]);
  const [matchingFields, setMatchingFields] = useState<string[]>([]);
  const [isDuplicateCheckCompleted, setIsDuplicateCheckCompleted] = useState(false);
  const [duplicateCheckIntensity, setDuplicateCheckIntensity] = useState<'low' | 'medium' | 'high'>('medium');

  // Function to import records
  const importRecords = async (
    objectTypeId: string,
    records: Record<string, any>[],
    progressCallback?: (current: number, total: number) => void
  ) => {
    if (!user) {
      toast.error("You must be logged in to import records");
      return null;
    }
    
    setIsImporting(true);
    
    try {
      // Simulate import process
      const total = records.length;
      let success = 0;
      let failures = 0;
      
      // Process records in batches to update progress
      const batchSize = 10;
      const batches = Math.ceil(total / batchSize);
      
      for (let i = 0; i < batches; i++) {
        const start = i * batchSize;
        const end = Math.min(start + batchSize, total);
        const batch = records.slice(start, end);
        
        // Simulate API request for each batch
        try {
          // In a real implementation, this would be an API call
          await new Promise(resolve => setTimeout(resolve, 300));
          success += batch.length;
        } catch (error) {
          failures += batch.length;
          console.error("Error importing batch:", error);
        }
        
        // Update progress
        if (progressCallback) {
          progressCallback(start + batch.length, total);
        }
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["object-records", objectTypeId] });
      
      return { success, failures };
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import records");
      return { success: 0, failures: records.length };
    } finally {
      setIsImporting(false);
    }
  };

  // Function to guess data types for columns
  const guessDataTypeForColumn = (columnIndex: number): string => {
    if (!importData) return "text";
    
    // Get sample values (first 10 rows)
    const sampleValues = importData.rows
      .slice(0, 10)
      .map(row => row[columnIndex])
      .filter(Boolean);
    
    if (sampleValues.length === 0) return "text";
    
    // Check for email pattern
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (sampleValues.some(v => emailPattern.test(v))) {
      return "email";
    }
    
    // Check for date pattern
    const datePattern = /^\d{1,4}[-./]\d{1,2}[-./]\d{1,4}$/;
    if (sampleValues.every(v => datePattern.test(v))) {
      return "date";
    }
    
    // Check for number pattern
    if (sampleValues.every(v => !isNaN(Number(v)))) {
      return "number";
    }
    
    // Check for boolean pattern
    const boolValues = ["true", "false", "yes", "no", "0", "1"];
    if (sampleValues.every(v => boolValues.includes(v.toLowerCase()))) {
      return "boolean";
    }
    
    return "text";
  };

  return {
    importData,
    columnMappings,
    isImporting,
    duplicates,
    matchingFields,
    isDuplicateCheckCompleted,
    duplicateCheckIntensity,
    importRecords,
    guessDataTypeForColumn
  };
}
