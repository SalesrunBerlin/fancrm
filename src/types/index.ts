
// Public action token type
export interface PublicActionToken {
  id: string;
  action_id: string;
  token: string;
  name: string | null;
  created_at: string;
  created_by: string;
  expires_at: string | null;
  is_active: boolean;
}

// Record form data type
export interface RecordFormData {
  [key: string]: string | number | boolean | Date | null | Record<string, any>;
}

// Record update data type
export interface RecordUpdateData {
  id: string;
  field_values: RecordFormData;
}

// Types for mock data
export interface ContactType {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  first_name?: string;
  last_name?: string;
  firstName?: string;
  lastName?: string;
  accountName?: string; // Added for mock data
  tags?: string[]; // Added for mock data
}

export interface AccountType {
  id: string;
  name: string;
  industry: string;
  website: string;
  createdAt: string;
  type?: string;
  employees?: number; // Added for mock data
}

export interface DealType {
  id: string;
  name: string;
  amount: number;
  stage: string;
  closeDate: string;
  probability: number;
  status?: string;
  accountName?: string;
  account?: string;
  value?: number;
  contactId?: string; // Added for mock data
}

// Add DuplicateRecord type for imports
export interface DuplicateRecord {
  id: string;
  rowIndex: number;
  matchType: string;
  sourceRecord: any;
  existingRecord: any;
  resolution?: string;
  action?: string; // Added missing properties
  matchScore?: number;
  importRowIndex?: number;
  record?: any;
  matchingFields?: string[];
  existingRecordId?: string;
  fields?: Record<string, string>;
}

// Create FieldType enum since it's being used in ImportRecordsPage
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
  MULTI_PICKLIST = "multi_picklist",
  LOOKUP = "lookup",
  MASTER_DETAIL = "master_detail",
  CURRENCY = "currency",
  PERCENT = "percent",
  AUTO_NUMBER = "auto_number",
  FORMULA = "formula",
  ROLLUP = "rollup",
  FILE = "file",
  RICH_TEXT = "rich_text",
  GEOLOCATION = "geolocation",
  ADDRESS = "address",
  CHECKBOX = "checkbox"
}

// Export Object types
export * from "./ObjectFieldTypes";
