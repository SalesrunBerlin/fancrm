
export type FieldValue = string | number | boolean | Date | null;

export interface RecordFormData {
  [key: string]: FieldValue;
}
