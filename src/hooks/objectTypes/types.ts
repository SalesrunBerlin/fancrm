
export interface ObjectField {
  id: string;
  object_type_id: string;
  name: string;
  api_name: string;
  data_type: string;
  is_required: boolean;
  is_system: boolean;
  default_value?: any;
  options?: {
    target_object_type_id?: string;
    display_field_api_name?: string;
    description?: string;
  };
  display_order: number;
  owner_id: string;
  created_at: string;
  updated_at: string;
  isPublished?: boolean; // Used for publishing configuration
}

// Define object type
export interface ObjectType {
  id: string;
  name: string;
  api_name: string;
  description: string | null;
  icon: string | null;
  owner_id: string;
  is_system: boolean;
  is_active: boolean;
  show_in_navigation: boolean;
  default_field_api_name?: string;
  created_at: string;
  updated_at: string;
  is_published: boolean;
  is_template: boolean;
  source_object_id: string | null;
}
