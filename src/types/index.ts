
export interface DuplicateRecord {
  importRowIndex: number;
  recordId: string;
  matchScore: number;
  action: 'skip' | 'update' | 'create';
  matchingFields: Record<string, {importValue: string, existingValue: string}>;
}

export interface RecordFormData {
  [key: string]: string | number | boolean | Date | null | Record<string, any>;
}

export interface RecordUpdateData {
  id: string;
  field_values: RecordFormData;
}
