
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
  last_viewed_at?: string;
}

export interface ReportData {
  columns: string[];
  columnDefs?: { key: string; header: string; objectName: string; }[];
  rows: Record<string, any>[];
  totalCount: number;
}
