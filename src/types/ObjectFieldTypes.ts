
import { Json } from "@/lib/types/database";

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
