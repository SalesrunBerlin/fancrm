
/**
 * This file provides utility functions and type enhancements for ObjectField issues.
 * 
 * The errors occur because we're trying to add 'created_at' to ObjectField objects
 * which isn't defined in the type.
 */

import { ObjectField } from "@/hooks/useObjectTypes";

// Enhanced ObjectField type with created_at
export interface EnhancedObjectField extends ObjectField {
  created_at?: string;
  updated_at?: string;
}

// Safe conversion utility to handle the created_at field
export function toSafeObjectField(fieldData: any): ObjectField {
  // Extract only the fields that are part of the ObjectField interface
  const {
    id,
    object_type_id,
    name,
    api_name,
    data_type,
    is_required,
    is_system,
    default_value,
    options,
    display_order,
    owner_id,
    // Omit created_at as it's not part of the interface
  } = fieldData;

  return {
    id,
    object_type_id,
    name,
    api_name,
    data_type,
    is_required,
    is_system,
    default_value,
    options,
    display_order,
    owner_id,
  };
}

// Usage example:
// import { toSafeObjectField } from "@/patches/FixObjectFieldType";
//
// const newField = {
//   id: "123",
//   object_type_id: "456",
//   name: "Field Name",
//   api_name: "field_name",
//   data_type: "text",
//   created_at: new Date().toISOString() // This would cause a type error
// };
//
// const safeField = toSafeObjectField(newField);
