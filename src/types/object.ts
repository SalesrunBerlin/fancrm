
// Define FieldType enum for import functionality
export enum FieldType {
  TEXT = "text",
  NUMBER = "number",
  BOOLEAN = "boolean",
  DATE = "date",
  EMAIL = "email",
  PHONE = "phone",
  URL = "url",
  TEXTAREA = "textarea",
  PICKLIST = "picklist",
  LOOKUP = "lookup",
  CURRENCY = "currency",
  PERCENT = "percent",
  AUTO_NUMBER = "auto_number",
  FORMULA = "formula"
}

// Export additional types as needed for object functionality
export interface ObjectFieldType {
  id: string;
  name: string;
  api_name: string;
  data_type: string;
  type?: FieldType;
}
