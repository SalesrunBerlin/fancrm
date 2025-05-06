
import { FilterCondition } from "@/hooks/useObjectRecords";

export interface ReportField {
  objectTypeId: string;
  fieldApiName: string;
  displayName: string;
  isVisible: boolean;
  order: number;
}

export interface ReportDefinition {
  id: string;
  name: string;
  description?: string;
  objectIds: string[]; // One or more objects
  selectedFields: ReportField[];
  filters: FilterCondition[];
  created_at: string;
  updated_at: string;
}

export interface ReportData {
  columns: string[];
  rows: Record<string, any>[];
  totalCount: number;
}
