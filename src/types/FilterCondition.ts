
import { UUID } from "./index";

export interface FilterCondition {
  id: string;
  fieldApiName: string;
  operator: string;
  value: any;
  logicalOperator?: "AND" | "OR";
}

export interface ObjectRecord {
  id: UUID;
  record_id: string;
  object_type_id: UUID;
  created_at: string;
  updated_at: string;
  owner_id: UUID;
  created_by: UUID;
  last_modified_by: UUID;
  fieldValues: Record<string, any>;
  field_values: { field_api_name: string; value: any }[];
}
