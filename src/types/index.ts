
export interface DuplicateRecord {
  importRowIndex: number;
  recordId: string;
  matchScore: number;
  action: 'skip' | 'update' | 'create';
  matchingFields: Record<string, {importValue: string, existingValue: string}>;
}
