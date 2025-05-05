
import { z } from "zod";
import { ObjectField } from "@/hooks/useObjectTypes";

// Creates a dynamic Zod schema based on the provided fields
export const buildFormSchema = (fields: Array<{
  api_name: string;
  name: string;
  data_type: string;
  is_required: boolean;
}>) => {
  const schemaObj: Record<string, z.ZodTypeAny> = {};
  
  fields.forEach((field) => {
    // Create appropriate schema based on field type
    let fieldSchema;
    
    switch (field.data_type) {
      case "text":
      case "email":
      case "url":
      case "phone":
      case "lookup":
        fieldSchema = z.string();
        break;
      case "number":
        fieldSchema = z.string().transform((val) => val ? parseFloat(val) : null);
        break;
      case "boolean":
        fieldSchema = z.boolean().optional();
        break;
      case "date":
        fieldSchema = z.string();
        break;
      case "textarea":
        fieldSchema = z.string();
        break;
      case "picklist":
        fieldSchema = z.string();
        break;
      default:
        fieldSchema = z.string();
    }
    
    // Make required or optional based on field configuration
    if (field.is_required) {
      schemaObj[field.api_name] = fieldSchema.nonempty(`${field.name} is required`);
    } else {
      schemaObj[field.api_name] = fieldSchema.optional();
    }
  });
  
  return z.object(schemaObj);
};
