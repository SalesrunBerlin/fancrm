
/**
 * Utility functions for handling duplicate records during import
 */

import { ColumnMapping } from "@/hooks/useImportRecords";
import { supabase } from "@/integrations/supabase/client";
import { DuplicateRecord as DuplicateRecordType } from "@/types";

export interface DuplicateRecord {
  importRowIndex: number;
  existingRecord: Record<string, any>;
  matchingFields: string[];
  matchScore: number;
  action: 'skip' | 'update' | 'create';
  record: Record<string, string>;
}

/**
 * Checks for potential duplicate records based on provided matchingFields
 */
export async function findDuplicateRecords(
  objectTypeId: string,
  importData: { headers: string[], rows: string[][] },
  columnMappings: ColumnMapping[],
  matchingFields: string[],
  duplicateCheckIntensity: 'low' | 'medium' | 'high'
): Promise<DuplicateRecordType[]> {
  if (!importData || matchingFields.length === 0) {
    return [];
  }

  try {
    const foundDuplicates: DuplicateRecordType[] = [];
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
              id: recordId, // Add id to match the DuplicateRecord type in types/index.ts
              importRowIndex: rowIndex,
              existingRecord: {
                id: recordId,
                ...recordData
              },
              matchingFields: matchingFields,
              matchScore: score,
              matchFields: matchingFields, // Add matchFields to match the DuplicateRecord type in types/index.ts
              action: 'skip', // Default action
              fields: recordData, // Add fields to match the DuplicateRecord type in types/index.ts
              record: importRecord
            });
          }
        }
      }
    }
    
    return foundDuplicates;
  } catch (error) {
    console.error("Error checking for duplicates:", error);
    throw error;
  }
}
