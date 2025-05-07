
/**
 * Utility functions for handling duplicate records during import
 */

import { ColumnMapping } from "@/hooks/useImportRecords";
import { supabase } from "@/integrations/supabase/client";
import { DuplicateRecord } from "@/types"; // Import the unified DuplicateRecord type

/**
 * Checks for potential duplicate records based on provided matchingFields
 */
export async function findDuplicateRecords(
  objectTypeId: string,
  importData: { headers: string[], rows: string[][] },
  columnMappings: Record<string, string>,
  matchingFieldApiNames: string[],
  duplicateCheckIntensity: 'low' | 'medium' | 'high' = 'medium'
): Promise<DuplicateRecord[]> {
  if (!importData || matchingFieldApiNames.length === 0) {
    return [];
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
      for (const fieldApiName of matchingFieldApiNames) {
        // Find column index for this field
        const columnIndex = importData.headers.findIndex(header => 
          columnMappings[header] === fieldApiName
        );
        
        if (columnIndex >= 0) {
          const value = row[columnIndex];
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
          let totalFields = matchingFieldApiNames.length;
          
          for (const fieldApiName of matchingFieldApiNames) {
            const columnIndex = importData.headers.findIndex(header => 
              columnMappings[header] === fieldApiName
            );
            
            if (columnIndex >= 0) {
              const importValue = row[columnIndex];
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
            importData.headers.forEach((header, idx) => {
              if (columnMappings[header]) {
                importRecord[columnMappings[header]] = row[idx] || '';
              }
            });
            
            foundDuplicates.push({
              id: recordId,
              rowIndex, // For backward compatibility
              importRowIndex: rowIndex,
              existingRecord: {
                id: recordId,
                ...recordData
              },
              matchScore: score,
              fields: recordData,
              action: 'skip',
              record: importRecord,
              matchType: 'field_match',
              sourceRecord: importRecord
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

// For backward compatibility with any code that might be using the old function name
export const findDuplicates = (
  csvData: string[][],
  headers: string[],
  mappings: Record<string, string>,
  records: any[],
  fields: any[]
): DuplicateRecord[] => {
  // This is just a placeholder that returns an empty array
  // Since the new implementation is async and this was likely used synchronously
  console.warn("findDuplicates is deprecated, use findDuplicateRecords instead");
  return [];
};
