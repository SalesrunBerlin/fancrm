
import { LookupValueDisplay } from "./LookupValueDisplay";
import { Fragment } from "react";

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
  
  // Format boolean values
  if (field.data_type === "boolean") {
    return (
      <span className={value === "true" || value === true ? "text-green-600" : "text-gray-500"}>
        {value === "true" || value === true ? "Yes" : "No"}
      </span>
    );
  }
  
  // For text or textarea, ensure they don't overflow on mobile
  if (field.data_type === "text" || field.data_type === "textarea") {
    return (
      <span className="truncate max-w-[150px] sm:max-w-[200px] md:max-w-[250px] block">
        {value !== null && value !== undefined ? String(value) : "—"}
      </span>
    );
  }
  
  return (
    <Fragment>{value !== null && value !== undefined ? String(value) : "—"}</Fragment>
  );
}
