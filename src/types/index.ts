
export enum FieldType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  BOOLEAN = 'boolean',
  PICKLIST = 'picklist',
  LOOKUP = 'lookup',
  EMAIL = 'email',
  PHONE = 'phone',
  URL = 'url',
  CURRENCY = 'currency',
  PERCENT = 'percent',
  AUTO_NUMBER = 'auto_number',
  TEXTAREA = 'textarea',
  RICH_TEXT = 'rich_text',
  LONG_TEXT = 'long_text',
  DATETIME = 'datetime'
}

// Add missing PublicActionToken type
export interface PublicActionToken {
  id: string;
  token: string;
  action_id: string;
  created_at: string;
  expires_at?: string | null;
  is_active: boolean;
  views_count: number;
  submissions_count: number;
  name?: string | null;
  created_by?: string;
}

// Add missing ObjectField type
export interface ObjectField {
  id: string;
  name: string;
  api_name: string;
  object_type_id: string;
  data_type: string;
  is_required: boolean;
  is_system: boolean;
  default_value?: string | null;
  options?: any;
  display_order?: number;
  owner_id?: string;
  created_at?: string;
  updated_at?: string;
}

// Add missing types for dashboard components
export interface ContactType {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company?: string;
  title?: string;
  created_at: string;
  updated_at: string;
}

export interface AccountType {
  id: string;
  name: string;
  website?: string;
  industry?: string;
  created_at: string;
  updated_at: string;
}

export interface DealType {
  id: string;
  name: string;
  amount: number;
  stage: string;
  close_date?: string;
  created_at: string;
  updated_at: string;
}

// Add the DuplicateRecord interface
export interface DuplicateRecord {
  id: string;
  name: string;
  fields: {
    [key: string]: any;
  };
}

// Make sure RecordFormData is exported
export interface RecordFormData {
  [key: string]: any;
}

// Add missing ColumnMapping type
export interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  fieldType: string;
}
