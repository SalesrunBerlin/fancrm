
import { useState, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ObjectField } from "@/hooks/useObjectTypes";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { parseMultiFormatDate } from "@/lib/utils";
import { useObjectRecords, ObjectRecord } from "@/hooks/useObjectRecords";

interface ImportData {
  headers: string[];
  rows: string[][];
}

interface ColumnMapping {
  sourceColumnIndex: number;
  sourceColumnName: string;
  targetField: ObjectField | null;
}

interface DuplicateRecord {
  importRowIndex: number;
  existingRecord: ObjectRecord;
  matchingFields: string[];
  action: 'create' | 'update';
}

const STORAGE_KEY_PREFIX = 'import_data_';

export function useImportRecords(objectTypeId: string, fields: ObjectField[]) {
  const [importData, setImportData] = useState<ImportData | null>(null);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateRecord[]>([]);
  const [matchingFields, setMatchingFields] = useState<string[]>([]);
  const [isDuplicateCheckCompleted, setIsDuplicateCheckCompleted] = useState(false);
  const [duplicateCheckIntensity, setDuplicateCheckIntensity] = useState<'strict' | 'moderate' | 'lenient'>('moderate');
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Load cached import data when component mounts
  useEffect(() => {
    if (objectTypeId) {
      const cachedDataStr = localStorage.getItem(`${STORAGE_KEY_PREFIX}${objectTypeId}`);
      if (cachedDataStr) {
        try {
          const cachedData = JSON.parse(cachedDataStr);
          setImportData(cachedData.importData);
          
          // If fields are available, restore mappings with the latest field data
          if (fields && fields.length > 0 && cachedData.columnMappings) {
            const restoredMappings = cachedData.columnMappings.map((mapping: ColumnMapping) => {
              if (mapping.targetField && mapping.targetField.id) {
                // Find the current field by ID
                const updatedField = fields.find(f => f.id === mapping.targetField?.id);
                return {
                  ...mapping,
                  targetField: updatedField || mapping.targetField
                };
              }
              return mapping;
            });
            setColumnMappings(restoredMappings);
          } else {
            setColumnMappings(cachedData.columnMappings || []);
          }
          
          // Restore matching fields if available
          if (cachedData.matchingFields) {
            setMatchingFields(cachedData.matchingFields);
          }
        } catch (error) {
          console.error("Error restoring cached import data:", error);
        }
      }
    }
  }, [objectTypeId, fields]);

  // Save import data to localStorage whenever it changes
  useEffect(() => {
    if (objectTypeId && importData) {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${objectTypeId}`, JSON.stringify({
        importData,
        columnMappings,
        matchingFields
      }));
    }
  }, [objectTypeId, importData, columnMappings, matchingFields]);

  // Parse pasted text into a structured format
  const parseImportText = useCallback((text: string) => {
    // Detect delimiter (tab or comma)
    const lines = text.trim().split(/\r?\n/);
    if (lines.length === 0) return null;
    
    const firstLine = lines[0];
    // Check if it's likely tab-delimited
    const isTabDelimited = firstLine.includes('\t');
    const delimiter = isTabDelimited ? '\t' : ',';
    
    // Parse headers
    const headers = firstLine.split(delimiter).map(h => h.trim());
    
    // Parse data rows
    const rows = lines.slice(1).map(line => 
      line.split(delimiter).map(cell => cell.trim())
    );
    
    // Generate initial column mappings
    const mappings: ColumnMapping[] = headers.map((header, index) => {
      // Try to find a matching field
      const matchingField = fields.find(field => 
        field.name.toLowerCase() === header.toLowerCase() || 
        field.api_name.toLowerCase() === header.toLowerCase()
      );
      
      return {
        sourceColumnIndex: index,
        sourceColumnName: header,
        targetField: matchingField || null
      };
    });
    
    setImportData({ headers, rows });
    setColumnMappings(mappings);
    
    // Cache the import data
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${objectTypeId}`, JSON.stringify({
      importData: { headers, rows },
      columnMappings: mappings
    }));
    
    return { headers, rows, mappings };
  }, [fields, objectTypeId]);

  // Update a column mapping
  const updateColumnMapping = useCallback((columnIndex: number, fieldId: string | null) => {
    setColumnMappings(prev => {
      const updatedMappings = prev.map((mapping, idx) => {
        if (idx === columnIndex) {
          return {
            ...mapping,
            targetField: fieldId ? fields.find(f => f.id === fieldId) || null : null
          };
        }
        return mapping;
      });
      
      // Cache the updated mappings
      if (importData) {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${objectTypeId}`, JSON.stringify({
          importData,
          columnMappings: updatedMappings
        }));
      }
      
      return updatedMappings;
    });
  }, [fields, objectTypeId, importData]);

  // Clear the cached import data
  const clearImportData = useCallback(() => {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${objectTypeId}`);
    setImportData(null);
    setColumnMappings([]);
    setDuplicates([]);
    setIsDuplicateCheckCompleted(false);
  }, [objectTypeId]);

  // Update matching fields for duplicate detection
  const updateMatchingFields = useCallback((fieldApiNames: string[]) => {
    setMatchingFields(fieldApiNames);
    
    // Cache the updated matching fields
    if (importData) {
      const cachedDataStr = localStorage.getItem(`${STORAGE_KEY_PREFIX}${objectTypeId}`);
      if (cachedDataStr) {
        try {
          const cachedData = JSON.parse(cachedDataStr);
          localStorage.setItem(`${STORAGE_KEY_PREFIX}${objectTypeId}`, JSON.stringify({
            ...cachedData,
            matchingFields: fieldApiNames
          }));
        } catch (error) {
          console.error("Error updating cached matching fields:", error);
        }
      }
    }
  }, [importData, objectTypeId]);

  // Update duplicate check intensity
  const updateDuplicateCheckIntensity = useCallback((intensity: 'strict' | 'moderate' | 'lenient') => {
    setDuplicateCheckIntensity(intensity);
    // Also cache this setting
    if (importData) {
      const cachedDataStr = localStorage.getItem(`${STORAGE_KEY_PREFIX}${objectTypeId}`);
      if (cachedDataStr) {
        try {
          const cachedData = JSON.parse(cachedDataStr);
          localStorage.setItem(`${STORAGE_KEY_PREFIX}${objectTypeId}`, JSON.stringify({
            ...cachedData,
            duplicateCheckIntensity: intensity
          }));
        } catch (error) {
          console.error("Error updating cached duplicate check intensity:", error);
        }
      }
    }
  }, [importData, objectTypeId]);

  // Update action for a duplicate record
  const updateDuplicateAction = useCallback((rowIndex: number, action: 'create' | 'update') => {
    setDuplicates(prev => prev.map(duplicate => 
      duplicate.importRowIndex === rowIndex 
        ? { ...duplicate, action }
        : duplicate
    ));
  }, []);

  // Helper function to compare two values based on intensity setting
  const compareValues = useCallback((value1: string, value2: string): boolean => {
    // Normalize values for comparison
    const v1 = value1.trim().toLowerCase();
    const v2 = value2.trim().toLowerCase();
    
    // Skip comparison if either value is empty
    if (!v1 || !v2) return false;
    
    switch (duplicateCheckIntensity) {
      case 'strict':
        // Strict: exact match after normalization
        return v1 === v2;
      
      case 'moderate':
        // Moderate: values are similar (contains or is contained)
        return v1.includes(v2) || v2.includes(v1);
      
      case 'lenient':
        // Lenient: check if one is a substring of the other or if Levenshtein distance is small
        if (v1.includes(v2) || v2.includes(v1)) return true;
        
        // Simple implementation of Levenshtein distance for lenient matching
        // Calculate distance as percentage of the longer string length
        const distance = levenshteinDistance(v1, v2);
        const maxLength = Math.max(v1.length, v2.length);
        if (maxLength === 0) return true; // Both empty means match
        const similarityPercentage = (maxLength - distance) / maxLength;
        return similarityPercentage > 0.7; // 70% similarity threshold
        
      default:
        return v1 === v2;
    }
  }, [duplicateCheckIntensity]);

  // Helper function to calculate Levenshtein distance between two strings
  const levenshteinDistance = (a: string, b: string): number => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    
    const matrix: number[][] = [];
    
    // Initialize matrix
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    
    // Fill matrix
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        const cost = a[j - 1] === b[i - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,       // deletion
          matrix[i][j - 1] + 1,       // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }
    
    return matrix[b.length][a.length];
  };

  // Check for duplicates based on matching fields
  const checkForDuplicates = useCallback(async () => {
    if (!importData || !columnMappings || !objectTypeId) {
      return false;
    }
    
    try {
      // If no matching fields were selected, automatically select suitable fields
      if (!matchingFields.length) {
        console.log("No matching fields selected. Auto-selecting fields for duplicate check.");
        
        // Prioritize unique identifying fields like name, email, ID
        const priorityFieldTypes = ['text', 'email', 'phone', 'url'];
        const potentialMatchFields = fields
          .filter(field => priorityFieldTypes.includes(field.data_type))
          .map(field => field.api_name);
        
        if (potentialMatchFields.length) {
          updateMatchingFields(potentialMatchFields.slice(0, 2)); // Use up to 2 fields
          console.log("Auto-selected matching fields:", potentialMatchFields.slice(0, 2));
        } else {
          // If no suitable fields, use the first text field
          const firstTextField = fields.find(f => f.data_type === 'text');
          if (firstTextField) {
            updateMatchingFields([firstTextField.api_name]);
            console.log("Auto-selected matching field:", firstTextField.api_name);
          } else {
            console.warn("No suitable fields found for duplicate matching");
            return false;
          }
        }
      }
      
      // Get all existing records for this object type
      const { data: existingRecords, error } = await supabase
        .from('object_records')
        .select(`
          *,
          field_values:object_field_values(field_api_name, value)
        `)
        .eq('object_type_id', objectTypeId);

      if (error) throw error;
      
      if (!existingRecords || existingRecords.length === 0) {
        // No existing records, so no duplicates
        setIsDuplicateCheckCompleted(true);
        return false;
      }
      
      // Process the records into a more usable format
      const processedExistingRecords = existingRecords.map((record: any) => {
        const fieldValues = record.field_values.reduce((acc: any, fv: any) => {
          acc[fv.field_api_name] = fv.value;
          return acc;
        }, {});
        
        return { ...record, field_values: fieldValues };
      });
      
      console.log(`Running duplicate check with ${duplicateCheckIntensity} intensity on ${matchingFields.length} fields`);
      
      // Check each import row against existing records
      const foundDuplicates: DuplicateRecord[] = [];
      
      importLoop: for (let rowIndex = 0; rowIndex < importData.rows.length; rowIndex++) {
        const importRow = importData.rows[rowIndex];
        
        // Build a map of field values for the current import row
        const importRowFieldValues: Record<string, string> = {};
        columnMappings.forEach(mapping => {
          if (mapping.targetField) {
            importRowFieldValues[mapping.targetField.api_name] = importRow[mapping.sourceColumnIndex] || '';
          }
        });
        
        // Check against each existing record
        for (const existingRecord of processedExistingRecords) {
          const matchingFieldsList: string[] = [];
          let matchCount = 0;
          
          // Check each matching field
          for (const fieldApiName of matchingFields) {
            const importValue = importRowFieldValues[fieldApiName] || '';
            const existingValue = existingRecord.field_values[fieldApiName] || '';
            
            // Compare values based on intensity setting
            if (compareValues(importValue, existingValue)) {
              matchingFieldsList.push(fieldApiName);
              matchCount++;
            }
          }
          
          // Determine if this is a duplicate based on matching strategy
          const isPartialMatch = duplicateCheckIntensity === 'lenient' && 
              matchCount > 0 && matchCount >= Math.ceil(matchingFields.length * 0.5); // At least 50% of fields match for lenient
              
          const isFullMatch = matchCount === matchingFields.length;
          
          // Consider it a duplicate if all fields match (or using partial match in lenient mode)
          if (isFullMatch || isPartialMatch) {
            foundDuplicates.push({
              importRowIndex: rowIndex,
              existingRecord,
              matchingFields: matchingFieldsList,
              action: 'create' // Default action is create
            });
            
            // Found a duplicate for this row, so move to the next import row
            continue importLoop;
          }
        }
      }
      
      setDuplicates(foundDuplicates);
      setIsDuplicateCheckCompleted(true);
      console.log(`Found ${foundDuplicates.length} potential duplicates`);
      
      // Return true if duplicates found, false otherwise
      return foundDuplicates.length > 0;
    } catch (error) {
      console.error("Error checking for duplicates:", error);
      toast.error("Failed to check for duplicate records");
      return false;
    }
  }, [importData, columnMappings, objectTypeId, matchingFields, fields, compareValues, updateMatchingFields, duplicateCheckIntensity]);

  // Import the records to the database
  const importRecords = useCallback(async (selectedRowIndices?: number[]) => {
    if (!importData || !objectTypeId || !user) {
      console.error("Missing required data for import:", { importData, objectTypeId, user });
      return;
    }

    setIsImporting(true);
    let successCount = 0;
    let errorCount = 0;
    let updateCount = 0;

    try {
      // Get map of row indices to duplicate actions
      const duplicateActionsMap = duplicates.reduce((map, duplicate) => {
        map[duplicate.importRowIndex] = duplicate;
        return map;
      }, {} as Record<number, DuplicateRecord>);
      
      // Determine which rows to process
      const rowsToProcess = selectedRowIndices || Array.from({ length: importData.rows.length }, (_, i) => i);
      
      // Process each selected row of data
      for (const rowIndex of rowsToProcess) {
        if (rowIndex >= importData.rows.length) {
          console.warn(`Row index ${rowIndex} is out of bounds, skipping`);
          continue;
        }
        
        const row = importData.rows[rowIndex];
        
        try {
          // Check if this row is marked for update
          const duplicateInfo = duplicateActionsMap[rowIndex];
          const shouldUpdate = duplicateInfo && duplicateInfo.action === 'update';
          
          // Create field values for this row
          const fieldValues: Record<string, string> = {};
          for (const mapping of columnMappings) {
            if (mapping.targetField) {
              let value = row[mapping.sourceColumnIndex] || '';
              
              // Process date values based on field type
              if (mapping.targetField.data_type === 'date' || mapping.targetField.data_type === 'datetime') {
                const parsedDate = parseMultiFormatDate(value);
                if (parsedDate) {
                  value = parsedDate;
                }
              }
              
              fieldValues[mapping.targetField.api_name] = value;
            }
          }
          
          if (shouldUpdate) {
            // Update existing record
            const recordId = duplicateInfo.existingRecord.id;
            
            console.log("Updating existing record:", recordId, "with values:", fieldValues);
            
            // Update the field values
            const fieldValuesArray = Object.entries(fieldValues).map(([field_api_name, value]) => ({
              record_id: recordId,
              field_api_name,
              value
            }));
            
            for (const fieldValue of fieldValuesArray) {
              // Check if field value already exists
              const { data: existingValue } = await supabase
                .from('object_field_values')
                .select('*')
                .eq('record_id', recordId)
                .eq('field_api_name', fieldValue.field_api_name)
                .single();
              
              if (existingValue) {
                // Update existing field value
                const { error } = await supabase
                  .from('object_field_values')
                  .update({ value: fieldValue.value })
                  .eq('record_id', recordId)
                  .eq('field_api_name', fieldValue.field_api_name);
                
                if (error) throw error;
              } else {
                // Insert new field value
                const { error } = await supabase
                  .from('object_field_values')
                  .insert(fieldValue);
                
                if (error) throw error;
              }
            }
            
            // Update the record's updated_at timestamp
            const { error: recordUpdateError } = await supabase
              .from('object_records')
              .update({ updated_at: new Date().toISOString() })
              .eq('id', recordId);
            
            if (recordUpdateError) throw recordUpdateError;
            
            updateCount++;
            successCount++;
          } else {
            // Create a new record
            console.log("Creating new record with owner_id:", user.id);
            
            // Create a new record in object_records
            const { data: recordData, error: recordError } = await supabase
              .from('object_records')
              .insert({
                object_type_id: objectTypeId,
                owner_id: user.id
              })
              .select('id')
              .single();

            if (recordError) {
              console.error("Error creating record:", recordError);
              throw recordError;
            }
            
            const recordId = recordData.id;
            console.log("Created record with ID:", recordId);

            // Insert field values
            const fieldValuesArray = Object.entries(fieldValues).map(([field_api_name, value]) => ({
              record_id: recordId,
              field_api_name,
              value
            }));
            
            if (fieldValuesArray.length > 0) {
              console.log("Inserting field values:", fieldValuesArray);
              const { error: valuesError } = await supabase
                .from('object_field_values')
                .insert(fieldValuesArray);

              if (valuesError) {
                console.error("Error inserting field values:", valuesError);
                throw valuesError;
              }
            }
            
            successCount++;
          }
        } catch (error) {
          console.error("Error processing row:", error);
          errorCount++;
        }
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["object-records", objectTypeId] });
      
      // Show success message
      toast.success(
        `Import completed: ${successCount} records processed (${successCount - updateCount} created, ${updateCount} updated)${errorCount > 0 ? `, ${errorCount} failed` : ''}`
      );
      
      // Clear cached import data after successful import
      clearImportData();
      
      return { success: successCount, updated: updateCount, errors: errorCount };
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import records");
      return { success: 0, updated: 0, errors: importData.rows.length };
    } finally {
      setIsImporting(false);
    }
  }, [importData, objectTypeId, columnMappings, queryClient, user, duplicates, clearImportData]);

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
