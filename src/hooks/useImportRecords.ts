
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

  // Update action for a duplicate record
  const updateDuplicateAction = useCallback((rowIndex: number, action: 'create' | 'update') => {
    setDuplicates(prev => prev.map(duplicate => 
      duplicate.importRowIndex === rowIndex 
        ? { ...duplicate, action }
        : duplicate
    ));
  }, []);

  // Check for duplicates based on matching fields
  const checkForDuplicates = useCallback(async () => {
    if (!importData || !columnMappings || !objectTypeId || !matchingFields.length) {
      return false;
    }
    
    try {
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
          
          // Check each matching field
          for (const fieldApiName of matchingFields) {
            const importValue = importRowFieldValues[fieldApiName] || '';
            const existingValue = existingRecord.field_values[fieldApiName] || '';
            
            // If values match (case-insensitive)
            if (importValue.trim().toLowerCase() === existingValue.trim().toLowerCase() && importValue !== '') {
              matchingFieldsList.push(fieldApiName);
            }
          }
          
          // If all specified matching fields match, consider it a duplicate
          if (matchingFieldsList.length === matchingFields.length) {
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
      
      // Return true if duplicates found, false otherwise
      return foundDuplicates.length > 0;
    } catch (error) {
      console.error("Error checking for duplicates:", error);
      toast.error("Failed to check for duplicate records");
      return false;
    }
  }, [importData, columnMappings, objectTypeId, matchingFields]);

  // Import the records to the database
  const importRecords = useCallback(async () => {
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
      
      // Process each row of data
      for (let rowIndex = 0; rowIndex < importData.rows.length; rowIndex++) {
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
    parseImportText,
    updateColumnMapping,
    importRecords,
    clearImportData,
    checkForDuplicates,
    updateMatchingFields,
    updateDuplicateAction
  };
}
