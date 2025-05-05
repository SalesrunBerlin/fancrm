
// Public action token type
export interface PublicActionToken {
  id: string;
  action_id: string;
  token: string;
  name: string | null;
  created_at: string;
  created_by: string;
  expires_at: string | null;
  is_active: boolean;
}

// Record form data type
export interface RecordFormData {
  [key: string]: string | number | boolean | Date | null | Record<string, any>;
}

// Record update data type
export interface RecordUpdateData {
  id: string;
  field_values: RecordFormData;
}

// Types for mock data
export interface ContactType {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  first_name?: string;
  last_name?: string;
  firstName?: string;
  lastName?: string;
}

export interface AccountType {
  id: string;
  name: string;
  industry: string;
  website: string;
  createdAt: string;
  type?: string;
}

export interface DealType {
  id: string;
  name: string;
  amount: number;
  stage: string;
  closeDate: string;
  probability: number;
  status?: string;
  accountName?: string;
  account?: string;
  value?: number;
}

// Add DuplicateRecord type for imports
export interface DuplicateRecord {
  id: string;
  rowIndex: number;
  matchType: string;
  sourceRecord: any;
  existingRecord: any;
  resolution?: string;
}
