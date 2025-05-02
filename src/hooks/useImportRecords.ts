import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

// Update the interface to include 'skip' as an action option
export interface DuplicateRecord {
  importRowIndex: number;
  existingRecord: Record<string, any>;
  matchingFields: string[];
  matchScore: number;
  action: 'skip' | 'update' | 'create';
  record: Record<string, string>;
}

interface ImportResult {
  success: number;
  failures: number;
  message?: string;
  error?: any;
  duplicates?: DuplicateRecord[];
}

interface ImportDataType {
  headers: string[];
  rows: string[][];
}

export interface ColumnMapping {
  sourceColumnName: string;
  sourceColumnIndex: number;
  targetField: {
    id: string;
    name: string;
    api_name: string;
  } | null;
}

interface RecordFormData {
  [key: string]: string | null;
}

// Helper function to remove square brackets from the beginning and end of a string
const removeSquareBrackets = (text: string): string => {
  if (!text) return text;
  if (text.startsWith('[') && text.endsWith(']')) {
    return text.substring(1, text.length - 1);
  }
  return text;
};

export function useImportRecords(objectTypeId: string, fields: any[]) {
  const queryClient = useQueryClient();
  const { user } = useAuth(); // Get the current authenticated user
  const [isImporting, setIsImporting] = useState(false);
  const [importData, setImportData] = useState<ImportDataType | null>(null);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateRecord[]>([]);
  const [matchingFields, setMatchingFields] = useState<string[]>([]);
  const [isDuplicateCheckCompleted, setIsDuplicateCheckCompleted] = useState(false);
  const [duplicateCheckIntensity, setDuplicateCheckIntensity] = useState<'low' | 'medium' | 'high'>('medium');

  const createRecord = useMutation({
    mutationFn: async (data: RecordFormData) => {
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      console.log("Creating record with data:", data);
      
      // Create record with owner_id set to current user
      const { data: newRecord, error: recordError } = await supabase
        .from("object_records")
        .insert([{ 
          object_type_id: objectTypeId,
          owner_id: user.id, // Add owner_id to comply with RLS policies
          created_by: user.id, // Also track who created the record
          last_modified_by: user.id
        }])
        .select()
        .single();
      
      if (recordError) {
        console.error("Error creating record:", recordError);
        throw recordError;
      }
      
      // Create field values
      const fieldValues = [];
      
      for (const [fieldApiName, value] of Object.entries(data)) {
        if (value !== null && value !== undefined) {
          fieldValues.push({
            record_id: newRecord.id,
            field_api_name: fieldApiName,
            value: value.toString()
          });
        }
      }
      
      if (fieldValues.length > 0) {
        const { error: valuesError } = await supabase
          .from("object_field_values")
          .insert(fieldValues);
        
        if (valuesError) {
          console.error("Error creating field values:", valuesError);
          throw valuesError;
        }
      }
      
      console.log("Successfully created record with ID:", newRecord.id);
      return newRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["object-records", objectTypeId] });
    }
  });

  const updateRecord = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: RecordFormData }) => {
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      console.log("Updating record:", id, "with data:", data);

      // Update the record to set last_modified_by and ensure owner_id is set
      const { error: recordError } = await supabase
        .from("object_records")
        .update({ 
          updated_at: new Date().toISOString(),
          owner_id: user.id, // Set owner_id to current user to comply with RLS policies
          last_modified_by: user.id
        })
        .eq("id", id);
      
      if (recordError) {
        console.error("Error updating record:", recordError);
        throw recordError;
      }
      
      // Delete existing values
      const { error: deleteError } = await supabase
        .from("object_field_values")
        .delete()
        .eq("record_id", id);
      
      if (deleteError) {
        console.error("Error deleting field values:", deleteError);
        throw deleteError;
      }
      
      // Insert new values
      const fieldValues = [];
      
      for (const [fieldApiName, value] of Object.entries(data)) {
        if (value !== null && value !== undefined) {
          fieldValues.push({
            record_id: id,
            field_api_name: fieldApiName,
            value: value.toString()
          });
        }
      }
      
      if (fieldValues.length > 0) {
        const { error: valuesError } = await supabase
          .from("object_field_values")
          .insert(fieldValues);
        
        if (valuesError) {
          console.error("Error creating field values:", valuesError);
          throw valuesError;
        }
      }
      
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["object-records", objectTypeId] });
    }
  });

  const parseImportText = (text: string): ImportDataType | null => {
    if (!text.trim()) return null;
    
    // Detect delimiter
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) return null;
    
    let delimiter = '\t';
    if (lines[0].includes(',') && !lines[0].includes('\t')) {
      delimiter = ',';
    }
    
    // Parse headers and remove square brackets
    const headers = lines[0].split(delimiter).map(h => removeSquareBrackets(h.trim()));
    
    // Parse rows and remove square brackets from each cell
    const rows = lines.slice(1).map(line => {
      return line.split(delimiter).map(cell => removeSquareBrackets(cell.trim()));
    });
    
    // Create column mappings
    const initialMappings: ColumnMapping[] = headers.map((header, index) => {
      // Try to find a matching field
      const matchingField = fields.find(f => 
        f.name.toLowerCase() === header.toLowerCase() ||
        f.api_name.toLowerCase() === header.toLowerCase()
      );
      
      return {
        sourceColumnName: header,
        sourceColumnIndex: index,
        targetField: matchingField ? {
          id: matchingField.id,
          name: matchingField.name,
          api_name: matchingField.api_name
        } : null
      };
    });
    
    setColumnMappings(initialMappings);
    setImportData({ headers, rows });
    return { headers, rows };
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
      const foundDuplicates: DuplicateRecord[] = [];
      const threshold = {
        low: 0.9,
        medium: 0.7,
        high: 0.5
      }[duplicateCheckIntensity];

      // For each import row, check for potential duplicates
      for (let rowIndex = 0; rowIndex < importData.rows.length; rowIndex++) {
        const row = importData.rows[rowIndex];
        
        // Create a query to find potential duplicates
        let query = supabase
          .from('object_records')
          .select('id, object_field_values!inner(field_api_name, value)')
          .eq('object_type_id', objectTypeId);
        
        // Add field conditions based on matching fields
        for (const fieldApiName of matchingFields) {
          // Find column mapping for this field
          const mapping = columnMappings.find(m => 
            m.targetField?.api_name === fieldApiName
          );
          
          if (mapping) {
            const value = row[mapping.sourceColumnIndex];
            if (value) {
              // Add to query
              query = query.or(`and(object_field_values.field_api_name.eq.${fieldApiName},object_field_values.value.eq.${value})`);
            }
          }
        }
        
        const { data: potentialDuplicates, error } = await query;
        
        if (error) throw error;
        
        if (potentialDuplicates && potentialDuplicates.length > 0) {
          // Group by record_id
          const recordMap = new Map<string, { field_api_name: string; value: string }[]>();
          
          for (const item of potentialDuplicates) {
            const fieldValue = item.object_field_values as unknown as { field_api_name: string; value: string };
            if (!recordMap.has(item.id)) {
              recordMap.set(item.id, [fieldValue]);
            } else {
              const existingValues = recordMap.get(item.id);
              if (existingValues) {
                existingValues.push(fieldValue);
              }
            }
          }
          
          // Calculate match score
          for (const [recordId, fieldValues] of recordMap.entries()) {
            const recordData: Record<string, string> = {};
            fieldValues.forEach(fv => {
              recordData[fv.field_api_name] = fv.value;
            });
            
            // Count matching fields
            let matchCount = 0;
            let totalFields = matchingFields.length;
            
            for (const fieldApiName of matchingFields) {
              const mapping = columnMappings.find(m => 
                m.targetField?.api_name === fieldApiName
              );
              
              if (mapping) {
                const importValue = row[mapping.sourceColumnIndex];
                const existingValue = recordData[fieldApiName];
                
                if (importValue && existingValue && 
                    importValue.toLowerCase() === existingValue.toLowerCase()) {
                  matchCount++;
                }
              }
            }
            
            const score = totalFields > 0 ? matchCount / totalFields : 0;
            
            if (score >= threshold) {
              // Create a record for the row
              const importRecord: Record<string, string> = {};
              columnMappings.forEach(mapping => {
                if (mapping.targetField) {
                  importRecord[mapping.targetField.api_name] = row[mapping.sourceColumnIndex] || '';
                }
              });
              
              foundDuplicates.push({
                importRowIndex: rowIndex,
                existingRecord: {
                  id: recordId,
                  ...recordData
                },
                matchingFields: matchingFields,
                matchScore: score,
                action: 'skip', // Default action
                record: importRecord
              });
            }
          }
        }
      }
      
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
    let successCount = 0;
    let failureCount = 0;
    
    try {
      const selectedRowData = importData.rows.filter((_, idx) => selectedRows.includes(idx));
      
      console.log(`Starting import of ${selectedRowData.length} records as user ${user.id}`);
      
      // Process duplicates first based on their action
      const processedRowIndices = new Set<number>();
      
      for (const duplicate of duplicates) {
        if (!selectedRows.includes(duplicate.importRowIndex)) continue;
        
        processedRowIndices.add(duplicate.importRowIndex);
        
        try {
          if (duplicate.action === 'skip') {
            // Skip this record
            console.log(`Skipping duplicate at row ${duplicate.importRowIndex}`);
            continue;
          } else if (duplicate.action === 'update') {
            // Update existing record
            console.log(`Updating record ${duplicate.existingRecord.id} at row ${duplicate.importRowIndex}`);
            await updateRecord.mutateAsync({
              id: duplicate.existingRecord.id,
              data: duplicate.record
            });
            successCount++;
          } else if (duplicate.action === 'create') {
            // Create new record
            console.log(`Creating new record for duplicate at row ${duplicate.importRowIndex}`);
            await createRecord.mutateAsync(duplicate.record);
            successCount++;
          }
        } catch (error) {
          console.error(`Error processing duplicate at row ${duplicate.importRowIndex}:`, error);
          failureCount++;
        }
      }
      
      // Process remaining rows
      for (let i = 0; i < selectedRowData.length; i++) {
        const rowIndex = selectedRows[i];
        
        // Skip already processed rows (duplicates)
        if (processedRowIndices.has(rowIndex)) continue;
        
        const row = importData.rows[rowIndex];
        const record: Record<string, string> = {};
        
        // Map columns to field values
        for (const mapping of columnMappings) {
          if (mapping.targetField) {
            record[mapping.targetField.api_name] = row[mapping.sourceColumnIndex] || '';
          }
        }
        
        try {
          console.log(`Creating record for row ${rowIndex}`);
          await createRecord.mutateAsync(record);
          successCount++;
        } catch (error) {
          console.error(`Error importing row ${rowIndex}:`, error);
          failureCount++;
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ["object-records", objectTypeId] });
      toast.success(`Successfully imported ${successCount} records (${failureCount} failed)`);
      
      return { success: successCount, failures: failureCount };
    } catch (error) {
      console.error("Error during import:", error);
      toast.error("Failed to complete import");
      return { success: successCount, failures: failureCount };
    } finally {
      setIsImporting(false);
    }
  };

  return {
    importData,
    columnMappings,
    isImporting,
    duplicates,
    matchingFields,
    isDuplicateCheckCompleted,
    duplicateCheckIntensity,
    parseImportText,
    updateColumnMapping,
    importRecords,
    clearImportData,
    checkForDuplicates,
    updateMatchingFields,
    updateDuplicateAction,
    updateDuplicateCheckIntensity
  };
}
