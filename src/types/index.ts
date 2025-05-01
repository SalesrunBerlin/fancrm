// Common Types
import { ColumnMapping as ImportColumnMapping, DuplicateRecord as ImportDuplicateRecord } from "@/hooks/useImportRecords";

// Re-export the types from the hooks
export type ColumnMapping = ImportColumnMapping;
export type DuplicateRecord = ImportDuplicateRecord;

// Other types that might be useful
export interface ObjectFieldType {
  id: string;
  name: string;
  api_name: string;
  data_type: string;
  is_required: boolean;
  is_system: boolean;
  object_type_id: string;
  display_order?: number;
  options?: Record<string, any>;
  default_value?: any;
}

// TypeScript interface for record field values
export interface RecordFieldValue {
  field_api_name: string;
  value: string | null;
}

// TypeScript interface for object record
export interface ObjectRecord {
  id: string;
  object_type_id: string;
  created_at: string;
  updated_at: string;
  fieldValues: Record<string, string | null>;
  displayName?: string | null;
}

// Any additional common types would go here
