
/**
 * Utility functions for handling duplicate records during import
 */

import { DuplicateRecord, FieldType } from "@/types";

/**
 * Finds potential duplicate records in imported CSV data by comparing against
 * existing records.
 */
export function findDuplicates(
  csvData: string[][],
  headers: string[],
  mappings: Record<string, string>,
  existingRecords: Record<string, any>[],
  fields: { api_name: string; name: string; type: string | FieldType }[]
): DuplicateRecord[] {
  const duplicates: DuplicateRecord[] = [];
  
  // Process each CSV row
  csvData.forEach((row, rowIndex) => {
    // Create a record from the CSV row using the field mappings
    const csvRecord: Record<string, any> = {};
    headers.forEach((header, colIndex) => {
      const fieldApiName = mappings[header];
      if (fieldApiName) {
        csvRecord[fieldApiName] = row[colIndex];
      }
    });
    
    // Find matching fields that could be used to identify duplicates
    const potentialMatchingFields = Object.keys(mappings).filter(header => {
      const fieldApiName = mappings[header];
      const value = row[headers.indexOf(header)];
      return fieldApiName && value && value.trim() !== '';
    }).map(header => mappings[header]);
    
    // Check each existing record for potential duplicates
    existingRecords.forEach(existingRecord => {
      // Fields that match between the CSV record and existing record
      const matchingFields: string[] = [];
      
      // Check each potential matching field
      potentialMatchingFields.forEach(fieldApiName => {
        const csvValue = csvRecord[fieldApiName]?.toString().toLowerCase();
        const existingValue = existingRecord[fieldApiName]?.toString().toLowerCase();
        
        if (csvValue && existingValue && csvValue === existingValue) {
          matchingFields.push(fieldApiName);
        }
      });
      
      // If there are enough matching fields, consider it a duplicate
      // (Threshold: at least 2 matching fields or Email field match)
      const isEmailMatch = matchingFields.some(fieldApiName => {
        const field = fields.find(f => f.api_name === fieldApiName);
        return field && field.type === FieldType.EMAIL;
      });
      
      if (matchingFields.length >= 2 || isEmailMatch) {
        // Find display names for matching fields
        const matchingFieldNames = matchingFields.map(fieldApiName => {
          const field = fields.find(f => f.api_name === fieldApiName);
          return field ? field.name : fieldApiName;
        });
        
        // Gather matching field values for display
        const matchingFieldDetails = matchingFields.map(fieldApiName => {
          const field = fields.find(f => f.api_name === fieldApiName);
          return {
            fieldName: field ? field.name : fieldApiName,
            fieldApiName,
            importValue: csvRecord[fieldApiName],
            existingValue: existingRecord[fieldApiName]
          };
        });
        
        duplicates.push({
          id: existingRecord.id,
          rowIndex,
          matchType: isEmailMatch ? 'email_match' : 'field_match',
          sourceRecord: csvRecord,
          existingRecord,
          matchingFields: matchingFieldDetails,
          existingRecordId: existingRecord.id
        });
      }
    });
  });
  
  return duplicates;
}
