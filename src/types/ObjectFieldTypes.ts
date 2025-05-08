
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

// Updated ObjectField interface to match useObjectTypes.ObjectField
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

// Helper function to convert ObjectFieldWithJson to ObjectField
export function convertToObjectField(field: ObjectFieldWithJson): ObjectField {
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
export function convertToObjectFields(fields: ObjectFieldWithJson[]): ObjectField[] {
  return fields.map(convertToObjectField);
}
