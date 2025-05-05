
export interface DuplicateRecord {
  importRowIndex: number;
  recordId: string;
  matchScore: number;
  action: 'skip' | 'update' | 'create';
  matchingFields: Record<string, {importValue: string, existingValue: string}>;
  existingRecord?: Record<string, string>;
  record?: Record<string, string>;
  fields?: Record<string, string>;
  id?: string;
}

export interface RecordFormData {
  [key: string]: string | number | boolean | Date | null | Record<string, any>;
}

export interface RecordUpdateData {
  id: string;
  field_values: RecordFormData;
}

// Add missing types referenced in components
export interface ContactType {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  accountId?: string;
  accountName?: string;
  tags?: string[];  // Add tags property that's used in mockData
}

export interface AccountType {
  id: string;
  name: string;
  type?: string;  // Add type property that's used in mockData
  website?: string | null;
  industry?: string;
  employees?: number;
  createdAt?: string;
  updatedAt?: string;
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
  probability?: number; // Add probability property that's used in mockData
  contactId?: string;
  accountId?: string;
  closeDate?: string;
}
