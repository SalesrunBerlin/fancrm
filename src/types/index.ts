
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

// Re-export the types from lib/types/records for backwards compatibility
export type { RecordFormData, FieldValue, RecordUpdateData } from '@/lib/types/records';

// Add missing types that were imported elsewhere with expanded properties to match mockData
export interface ContactType {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  lastContact?: string;
  name?: string;  // For compatibility with some components
  accountName?: string; // For compatibility with RecentContacts
  tags?: string[];
}

export interface AccountType {
  id: string;
  name: string;
  industry: string;
  website: string;
  employees: number;
  type?: string; // For compatibility with mockData
  tags?: string[];
  createdAt?: string; // Add this to fix mockData type errors
  updatedAt?: string; // Add this to fix mockData type errors
  ownerId?: string; // Add this to fix mockData type errors
  contactCount?: number; // Add this for compatibility with mockData
}

export interface DealType {
  id: string;
  name: string;
  amount: number;
  stage: string;
  closeDate: string;
  probability: number;
  contactId: string;
  accountId: string;
  status?: string; // For compatibility with mockData
  accountName?: string; // For compatibility with RecentDeals
  account?: string; // For compatibility with RecentDeals
  value?: number; // For compatibility with RecentDeals
}

export interface DuplicateRecord {
  id: string;
  fields: Record<string, any>;
  matchScore: number;
  matchFields: string[];
  action?: 'skip' | 'update' | 'create'; // Required for DuplicateRecordsResolver
  importRowIndex?: number; // Required for DuplicateRecordsResolver
  record?: Record<string, any>; // Required for DuplicateRecordsResolver
  existingRecord?: Record<string, any>; // Required for DuplicateRecordsResolver
}
