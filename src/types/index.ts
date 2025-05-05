
export interface DuplicateRecord {
  importRowIndex: number;
  recordId: string;
  matchScore: number;
  action: 'skip' | 'update' | 'create';
  matchingFields: Record<string, {importValue: string, existingValue: string}>;
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
}

export interface AccountType {
  id: string;
  name: string;
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
}
