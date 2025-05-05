
export interface DuplicateRecord {
  importRowIndex: number;
  recordId: string;
  matchScore: number;
  action: 'skip' | 'update' | 'create';
  matchingFields: Record<string, {importValue: string, existingValue: string}>;
  existingRecord?: any; // Add this to store the full existing record
}

export interface PublicActionToken {
  id: string;
  token: string;
  action_id: string;
  name: string | null;
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
}
