
export interface UserFieldMapping {
  id: string;
  source_user_id: string;
  target_user_id: string;
  source_object_id: string;
  target_object_id: string;
  source_field_api_name: string;
  target_field_api_name: string;
  created_at: string;
  updated_at: string;
}

export interface MappingStatus {
  isConfigured: boolean;
  mappedFields: number;
  totalFields: number;
}

export interface ObjectTypeInfo {
  id: string;
  name: string;
  api_name: string;
  fields: {
    id: string;
    name: string;
    api_name: string;
    data_type: string;
  }[];
}

// New type for creating field mappings that doesn't require an ID
export interface CreateFieldMapping {
  source_user_id: string;
  target_user_id: string;
  source_object_id: string;
  target_object_id: string;
  source_field_api_name: string;
  target_field_api_name: string;
}
