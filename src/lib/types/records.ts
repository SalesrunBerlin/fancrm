
export type FieldValue = string | number | boolean | Date | null | Record<string, any>;

export interface RecordFormData {
  [key: string]: FieldValue;
}

export interface RecordUpdateData {
  id: string;
  field_values: RecordFormData;
}

export interface SprintRecord {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  field_values: Record<string, any>;
}

export interface TicketRecord {
  id: string;
  sprint_id: string;
  topic: string;
  description: string;
  status: string;
  priority: string;
  field_values: Record<string, any>;
}
