
export type FieldValue = string | number | boolean | Date | null | Record<string, any>;

export interface RecordFormData {
  [key: string]: FieldValue;
}

export interface RecordUpdateData {
  id: string;
  field_values: RecordFormData;
}

// Helper type for record field validation
export interface FieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
}
