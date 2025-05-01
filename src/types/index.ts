
export type FieldValue = string | number | boolean | Date | null;

export interface RecordFormData {
  [key: string]: FieldValue;
}

export interface RecordUpdateData {
  id: string;
  field_values: RecordFormData;
}

// Add DuplicateRecord type to match the useImportRecords hook
export interface DuplicateRecord {
  importRowIndex: number;
  existingRecord: Record<string, any>;
  matchingFields: string[];
  matchScore: number;
  action: 'skip' | 'update' | 'create';
  record: Record<string, string>;
}

// Add ColumnMapping type for the Import functionality
export interface ColumnMapping {
  sourceColumnName: string;
  sourceColumnIndex: number;
  targetField: {
    id: string;
    name: string;
    api_name: string;
  } | null;
}

// Add types for Dashboard components to fix build errors
export interface ContactType {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  lastActivity?: string;
}

export interface AccountType {
  id: string;
  name: string;
  industry?: string;
  website?: string;
  location?: string;
  employees?: number;
}

export interface DealType {
  id: string;
  name: string;
  value: number;
  stage: string;
  closeDate?: string;
  probability?: number;
  account?: string;
}
