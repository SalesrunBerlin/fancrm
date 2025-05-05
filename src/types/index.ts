
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
}

export interface AccountType {
  id: string;
  name: string;
  industry: string;
  website: string;
  createdAt: string;
}

export interface DealType {
  id: string;
  name: string;
  amount: number;
  stage: string;
  closeDate: string;
  probability: number;
}
