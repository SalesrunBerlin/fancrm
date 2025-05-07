
// Add DuplicateRecord type definition to fix imports
export interface DuplicateRecord {
  id: string;
  rowIndex: number;
  importRowIndex: number;
  existingRecord: {
    id: string;
    [key: string]: any;
  };
  matchScore: number;
  fields: Record<string, string>;
  action: 'skip' | 'update' | 'create';
  record: Record<string, string>;
  matchType: 'field_match' | 'exact_match';
  sourceRecord: Record<string, string>;
}
