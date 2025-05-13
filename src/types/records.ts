
import { RecordFormData } from '@/types';

export interface RecordUpdateData {
  id: string;
  field_values: RecordFormData;
}

// This interface extends the base RecordFormData type
export interface EnhancedRecordFormData extends RecordFormData {
  // Add any specific properties needed for form handling
  [key: string]: any;
}

// This type needs to be exported for proper record creation
export type { RecordFormData };
