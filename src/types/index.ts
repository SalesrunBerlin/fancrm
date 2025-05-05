export type ObjectType = {
  id: string;
  created_at: string;
  name: string;
  api_name: string;
  description: string | null;
  default_field_api_name: string | null;
  owner_id: string | null;
  is_system: boolean;
  icon?: string | null;
  color?: string | null;
};

export type ObjectField = {
  id: string;
  created_at: string;
  object_type_id: string;
  name: string;
  api_name: string;
  description: string | null;
  data_type: string;
  is_required: boolean;
  is_unique: boolean;
  display_order: number;
  options: any;
  owner_id: string | null;
};

export type ObjectFieldOption = {
  id: string;
  created_at: string;
  object_field_id: string;
  name: string;
  value: string;
};

export type RecordFormData = {
  [key: string]: string | boolean | number | null;
};
