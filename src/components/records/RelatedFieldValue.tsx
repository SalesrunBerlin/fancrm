
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
        // Sicheres Parsen des Datums
        if (typeof value === 'string') {
          // Versuche es mit parseISO für ISO-Strings
          const date = parseISO(value);
          if (isValid(date)) {
            return <span>{format(date, 'dd.MM.yyyy')}</span>;
          }
          
          // Falls parseISO fehlschlägt, versuche es mit new Date()
          const fallbackDate = new Date(value);
          if (isValid(fallbackDate)) {
            return <span>{format(fallbackDate, 'dd.MM.yyyy')}</span>;
          }
        }
        // Falls alles fehlschlägt, zeige den ursprünglichen Wert an
        return <span>{String(value)}</span>;
      } catch (error) {
        console.error("Error formatting date:", error, value);
        return <span>{String(value)}</span>;
      }
      
    case 'datetime':
      try {
        // Sicheres Parsen des Datums und der Zeit
        if (typeof value === 'string') {
          // Versuche es mit parseISO für ISO-Strings
          const date = parseISO(value);
          if (isValid(date)) {
            return <span>{format(date, 'dd.MM.yyyy HH:mm')}</span>;
          }
          
          // Falls parseISO fehlschlägt, versuche es mit new Date()
          const fallbackDate = new Date(value);
          if (isValid(fallbackDate)) {
            return <span>{format(fallbackDate, 'dd.MM.yyyy HH:mm')}</span>;
          }
        }
        // Falls alles fehlschlägt, zeige den ursprünglichen Wert an
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
