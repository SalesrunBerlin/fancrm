
import { ColumnMapping } from "@/hooks/useImportRecords";
import { ObjectField } from "@/hooks/useObjectTypes";

export interface ImportDataType {
  headers: string[];
  rows: string[][];
}

/**
 * Removes square brackets from the beginning and end of a string
 */
export const removeSquareBrackets = (text: string): string => {
  if (!text) return text;
  if (text.startsWith('[') && text.endsWith(']')) {
    return text.substring(1, text.length - 1);
  }
  return text;
};

/**
 * Parses CSV or tab-delimited text into structured import data
 */
export const parseImportText = (text: string): ImportDataType | null => {
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
  
  return { headers, rows };
};

/**
 * Creates initial column mappings from imported data headers
 */
export const createInitialColumnMappings = (
  importData: ImportDataType, 
  fields: ObjectField[]
): ColumnMapping[] => {
  return importData.headers.map((header, index) => {
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
};

/**
 * Detects the most likely data type for a column based on name and content
 */
export const guessDataTypeForColumn = (
  columnName: string,
  sampleValues: string[]
): string => {
  const lowercaseColumnName = columnName.toLowerCase();
  
  // First check name patterns
  if (lowercaseColumnName.includes('email')) return 'email';
  if (lowercaseColumnName.includes('phone')) return 'phone';
  if (lowercaseColumnName.includes('date')) return 'date';
  if (lowercaseColumnName.includes('url') || lowercaseColumnName.includes('website')) return 'url';
  if (lowercaseColumnName.includes('description') || lowercaseColumnName.includes('note')) return 'textarea';
  
  // Check data patterns
  if (sampleValues.length > 0) {
    // Check if all values are numbers
    if (sampleValues.every(val => !isNaN(Number(val)) && val.trim() !== '')) {
      return 'number';
    }
    
    // Check if it looks like an email pattern
    if (sampleValues.some(val => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))) {
      return 'email';
    }
    
    // Check if it looks like a URL pattern
    if (sampleValues.some(val => /^https?:\/\//.test(val))) {
      return 'url';
    }
    
    // Check if it could be a picklist (few unique values compared to total)
    if (sampleValues.length >= 5) {
      const uniqueValues = new Set(sampleValues);
      if (uniqueValues.size <= Math.min(10, sampleValues.length * 0.5)) {
        return 'picklist';
      }
    }
  }
  
  // Default to text
  return 'text';
};

/**
 * Gets sample data from import rows for a specific column
 */
export const getSampleValuesForColumn = (
  importData: ImportDataType,
  columnIndex: number,
  maxSamples = 20
): string[] => {
  if (!importData) return [];
  
  return importData.rows
    .slice(0, maxSamples)
    .map(row => row[columnIndex])
    .filter(val => val !== null && val !== undefined && val.trim() !== '');
};
