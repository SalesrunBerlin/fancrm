
import { RecordFormData } from '@/types';

export interface RecordUpdateData {
  id: string;
  field_values: RecordFormData;
}

// This type needs to be exported for proper record creation
export type { RecordFormData };
