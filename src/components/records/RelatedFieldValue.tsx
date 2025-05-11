
import { ObjectField } from "@/hooks/useObjectTypes";
import { LookupValueDisplay } from "./LookupValueDisplay";
import { format, isValid, parseISO } from "date-fns";
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
        // Safe date parsing logic
        if (typeof value === 'string') {
          // Try parseISO for ISO strings
          const parsedDate = parseISO(value);
          if (isValid(parsedDate)) {
            return <span>{format(parsedDate, 'dd.MM.yyyy')}</span>;
          }
          
          // If that fails, try with the Date constructor
          const fallbackDate = new Date(value);
          if (isValid(fallbackDate)) {
            return <span>{format(fallbackDate, 'dd.MM.yyyy')}</span>;
          }
        }
        
        // If all parsing attempts fail or value is not a string
        console.warn("Invalid date value:", value);
        return <span>{String(value)}</span>;
      } catch (error) {
        console.error("Error formatting date:", error, value);
        return <span>{String(value)}</span>;
      }
      
    case 'datetime':
      try {
        // Safe date-time parsing logic
        if (typeof value === 'string') {
          // Try parseISO for ISO strings
          const parsedDate = parseISO(value);
          if (isValid(parsedDate)) {
            return <span>{format(parsedDate, 'dd.MM.yyyy HH:mm')}</span>;
          }
          
          // If that fails, try with the Date constructor
          const fallbackDate = new Date(value);
          if (isValid(fallbackDate)) {
            return <span>{format(fallbackDate, 'dd.MM.yyyy HH:mm')}</span>;
          }
        }
        
        // If all parsing attempts fail or value is not a string
        console.warn("Invalid datetime value:", value);
        return <span>{String(value)}</span>;
      } catch (error) {
        console.error("Error formatting datetime:", error, value);
        return <span>{String(value)}</span>;
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
