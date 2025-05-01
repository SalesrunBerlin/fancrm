
import type { ObjectField } from "@/hooks/useObjectTypes";

// For import functionality
export interface ColumnMapping {
  sourceColumn: string;
  targetField: ObjectField | { id: string; name: string; api_name: string; };
  isMatched: boolean;
}

export interface LookupOption {
  id: string;
  label: string;
}

// For RecordFormData
export type FieldValue = string | number | boolean | Date | null;

export interface RecordFormData {
  [key: string]: FieldValue;
}

export interface RecordUpdateData {
  id: string;
  field_values: RecordFormData;
}

// For contacts, deals, and accounts
export interface ContactType {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  accountName?: string;
  tags?: string[];
}

export interface AccountType {
  id: string;
  name: string;
  type?: string;
  website?: string | null;
  industry?: string;
  createdAt: string;
  updatedAt: string;
  ownerId?: string;
  contactCount?: number;
  tags?: string[];
}

export interface DealType {
  id: string;
  name: string;
  amount?: number;
  value?: number;
  status?: string;
  stage?: string;
  accountName?: string;
  account?: string;
  closeDate?: string;
}
