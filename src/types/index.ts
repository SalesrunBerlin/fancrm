
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

// Add missing type definitions
export interface ContactType {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  account_id?: string;
  created_at?: string;
}

export interface AccountType {
  id: string;
  name: string;
  industry?: string;
  website?: string;
  created_at?: string;
}

export interface DealType {
  id: string;
  name: string;
  amount: number;
  status: string;
  close_date?: string;
  account_id?: string;
  contact_id?: string;
  created_at?: string;
}

export interface RecordFormData {
  [key: string]: any;
}

// Consolidated DuplicateRecord interface to be used across the application
export interface DuplicateRecord {
  id: string;
  values: Record<string, any>;
  sourceRowIndex?: number;
  importRowIndex?: number;
  existingRecord?: Record<string, any>;
  matchingFields?: string[];
  matchScore?: number;
  action?: 'skip' | 'update' | 'create';
  record?: Record<string, string>;
}
