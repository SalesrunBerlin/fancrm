
// Define our own Json type since it's not exported from database.ts
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

// Extension of ObjectField type to handle Json types for default_value and options
export interface ObjectFieldWithJson {
  id: string;
  name: string;
  api_name: string;
  description?: string;
  data_type: string;
  is_required: boolean;
  is_unique?: boolean;
  is_system?: boolean;
  default_value?: Json | null;
  options?: Json | null;
  object_type_id: string;
  display_order: number;
  owner_id: string;
  created_at: string;
  updated_at?: string;
}

// Add ObjectField interface to fix TypeScript errors
export interface ObjectField {
  id: string;
  name: string;
  api_name: string;
  description?: string;
  data_type: string;
  is_required: boolean;
  is_unique?: boolean;
  is_system?: boolean;
  default_value?: string | null;
  options?: any | null;
  object_type_id: string;
  display_order: number;
  owner_id: string;
  created_at: string;
  updated_at?: string;
}

// Extend ObjectRecord interface to include missing properties
export interface ObjectRecord {
  id: string;
  record_id: string | null;
  object_type_id: string;
  created_at: string;
  updated_at: string;
  owner_id: string | null;
  created_by: string | null;
  last_modified_by: string | null;
  field_values?: { [key: string]: any };
  fieldValues?: { [key: string]: any }; // Keep both field names for backward compatibility
  displayName?: string;
  objectName?: string;
}

// Helper function to convert ObjectFieldWithJson to ObjectField
export function convertToObjectField(field: ObjectFieldWithJson): any {
  // Convert Json types to string for compatibility
  return {
    ...field,
    default_value: field.default_value !== null 
      ? typeof field.default_value === 'string' 
        ? field.default_value 
        : JSON.stringify(field.default_value) 
      : null,
    options: field.options !== null 
      ? typeof field.options === 'string' 
        ? field.options 
        : JSON.stringify(field.options) 
      : null
  };
}

// Helper function to convert an array of ObjectFieldWithJson to ObjectField[]
export function convertToObjectFields(fields: ObjectFieldWithJson[]): any[] {
  return fields.map(convertToObjectField);
}
