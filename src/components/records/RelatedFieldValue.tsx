
import { LookupValueDisplay } from "./LookupValueDisplay";

interface RelatedFieldValueProps {
  field: {
    api_name: string;
    data_type: string;
    options?: any;
  };
  value: any;
}

export function RelatedFieldValue({ field, value }: RelatedFieldValueProps) {
  if (field.data_type === "lookup" && field.options) {
    return (
      <LookupValueDisplay
        value={value}
        fieldOptions={{
          target_object_type_id: (typeof field.options === 'object' ? 
            (field.options as { target_object_type_id?: string })?.target_object_type_id : '') || ''
        }}
      />
    );
  }
  
  return (
    <>{value !== null && value !== undefined ? String(value) : "—"}</>
  );
}
