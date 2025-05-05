
export type FieldValue = string | number | boolean | Date | null | Record<string, any>;

export interface RecordFormData {
  [key: string]: FieldValue;
}

export interface RecordUpdateData {
  id: string;
  field_values: RecordFormData;
}
