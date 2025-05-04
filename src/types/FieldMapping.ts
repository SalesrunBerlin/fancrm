
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
