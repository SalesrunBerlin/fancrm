
// If this file doesn't already exist, create it with the necessary export
export interface RecordFormData {
  [key: string]: any;
}

// Add the FieldType enum which is referenced in importDuplicateUtils.ts
export enum FieldType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  BOOLEAN = 'boolean',
  PICKLIST = 'picklist',
  EMAIL = 'email',
  PHONE = 'phone',
  URL = 'url',
  TEXTAREA = 'textarea',
  LOOKUP = 'lookup',
  FORMULA = 'formula',
  RICH_TEXT = 'rich_text',
  AUTO_NUMBER = 'auto_number'
}

// Define DuplicateRecord interface that's used in importDuplicateUtils.ts
export interface DuplicateRecord {
  id: string;
  rowIndex: number;
  matchType: 'email_match' | 'field_match';
  sourceRecord: Record<string, any>;
  existingRecord: Record<string, any>;
  matchingFields: string[];
  existingRecordId: string;
  fields: Record<string, any>;
}
