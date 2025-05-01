
import type { ObjectField } from "@/hooks/useObjectTypes";

export interface ColumnMapping {
  sourceColumn: string;
  targetField: ObjectField | { id: string; name: string; api_name: string; };
  isMatched: boolean;
}

export interface LookupOption {
  id: string;
  label: string;
}
