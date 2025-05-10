
export interface FilterCondition {
  id: string;
  fieldApiName: string;
  operator: string;
  value: any;
  logicalOperator?: "AND" | "OR";
}

export interface ObjectRecord {
  id: string;
  record_id: string;
  object_type_id: string;
  created_at: string;
  updated_at: string;
  owner_id: string;
  created_by: string;
  last_modified_by: string;
  fieldValues: Record<string, any>;
  field_values: { field_api_name: string; value: any }[];
}
