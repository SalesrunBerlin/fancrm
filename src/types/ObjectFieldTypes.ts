export interface ObjectField {
  id: string;
  object_type_id: string;
  name: string;
  api_name: string;
  description?: string | null;
  data_type: string;
  is_required: boolean;
  is_unique: boolean;
  is_system: boolean;
  is_active: boolean;
  default_value?: any;
  validation_regex?: string | null;
  validation_message?: string | null;
  help_text?: string | null;
  display_order: number;
  is_searchable: boolean;
  is_audit_tracked: boolean;
  picklist_values?: PicklistValue[];
  related_object_type_id?: string | null;
  related_field_id?: string | null;
  lookup_settings?: LookupSettings | null;
  auto_number_settings?: AutoNumberSettings | null;
  field_settings?: FieldSettings | null;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
  ui_settings?: UISettings;
  max_length?: number;
  options?: any;
}

export interface PicklistValue {
  id?: string;
  value: string;
  label: string;
  is_active?: boolean;
  display_order?: number;
  color?: string;
  icon?: string;
  description?: string;
  isNew?: boolean;
  metadata?: Record<string, any>;
}

export interface LookupSettings {
  display_fields: string[];
  search_fields: string[];
  filter_criteria?: Record<string, any>;
  default_sort_field?: string;
  default_sort_direction?: 'asc' | 'desc';
}

export interface AutoNumberSettings {
  format: string;
  starting_number: number;
  increment_by: number;
  prefix?: string;
  suffix?: string;
}

export interface FieldSettings {
  decimals?: number;
  min_value?: number;
  max_value?: number;
  min_date?: string;
  max_date?: string;
  rich_text?: boolean;
  display_format?: string;
  currency_settings?: {
    currency_code: string;
    decimal_places: number;
  };
  address_settings?: {
    enable_map: boolean;
    required_fields: string[];
  };
  file_settings?: {
    allowed_extensions: string[];
    max_size: number;
    max_files: number;
  };
}

export interface UISettings {
  show_in_table?: boolean;
  show_in_detail?: boolean;
  column_width?: number;
  readonly?: boolean;
  conditional_visibility?: {
    condition: string;
    field_api_name: string;
    value: any;
  };
}

// Add new types for record handling
export interface ObjectRecord {
  id: string;
  object_type_id: string;
  name?: string;
  displayName?: string;
  objectName?: string; 
  field_values?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface ObjectFieldWithJson extends ObjectField {
  settings_json?: string;
}

// Helper function to convert API fields to ObjectFields
export const convertToObjectFields = (fields: any[]): ObjectField[] => {
  return fields.map(field => {
    return {
      ...field,
      // Add any necessary transformations here
    } as ObjectField;
  });
};
