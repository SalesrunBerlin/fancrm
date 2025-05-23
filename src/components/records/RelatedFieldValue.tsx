
import { ObjectField } from "@/hooks/useObjectTypes";
import { LookupValueDisplay } from "./LookupValueDisplay";
import { format } from "date-fns";
import { formatWithLineBreaks } from "@/lib/utils/textFormatUtils";

interface RelatedFieldValueProps {
  field: ObjectField;
  value: any;
}

export function RelatedFieldValue({ field, value }: RelatedFieldValueProps) {
  if (value === undefined || value === null) {
    return <span>—</span>;
  }

  switch (field.data_type) {
    case 'text':
    case 'textarea':
    case 'rich_text':
    case 'long_text':
    case 'url':
    case 'email':
    case 'phone':
      return <span className="whitespace-pre-line">{formatWithLineBreaks(String(value))}</span>;
      
    case 'number':
      return <span>{value}</span>;
      
    case 'date':
      try {
        return <span>{format(new Date(value), 'dd.MM.yyyy')}</span>;
      } catch {
        return <span>{value}</span>;
      }
      
    case 'datetime':
      try {
        return <span>{format(new Date(value), 'dd.MM.yyyy HH:mm')}</span>;
      } catch {
        return <span>{value}</span>;
      }
      
    case 'checkbox':
      return <span>{value === true ? 'Yes' : 'No'}</span>;
      
    case 'lookup':
      return field.options ? (
        <LookupValueDisplay 
          value={value} 
          fieldOptions={field.options as { target_object_type_id: string }}
        />
      ) : (
        <span>{String(value)}</span>
      );
      
    default:
      return <span>{String(value)}</span>;
  }
}
