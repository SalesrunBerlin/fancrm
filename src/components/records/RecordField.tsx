
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ObjectField } from "@/hooks/useObjectTypes";
import type { RecordFormData } from "@/lib/types/records";

interface RecordFieldProps {
  field: ObjectField;
  form: UseFormReturn<RecordFormData>;
}

export function RecordField({ field, form }: RecordFieldProps) {
  const renderFieldInput = () => {
    switch (field.data_type) {
      case 'textarea':
        return <Textarea {...form.register(field.api_name, { 
          required: field.is_required ? `${field.name} is required` : false 
        })} />;
      case 'number':
        return <Input type="number" {...form.register(field.api_name, { 
          required: field.is_required ? `${field.name} is required` : false,
          valueAsNumber: true 
        })} />;
      case 'email':
        return <Input type="email" {...form.register(field.api_name, { 
          required: field.is_required ? `${field.name} is required` : false,
          pattern: {
            value: /\S+@\S+\.\S+/,
            message: "Invalid email address"
          }
        })} />;
      case 'url':
        return <Input type="url" {...form.register(field.api_name, { 
          required: field.is_required ? `${field.name} is required` : false,
          pattern: {
            value: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
            message: "Invalid URL"
          }
        })} />;
      case 'date':
        return <Input type="date" {...form.register(field.api_name, { 
          required: field.is_required ? `${field.name} is required` : false 
        })} />;
      default:
        return <Input {...form.register(field.api_name, { 
          required: field.is_required ? `${field.name} is required` : false 
        })} />;
    }
  };

  return (
    <FormField
      control={form.control}
      name={field.api_name}
      render={({ field: formField }) => (
        <FormItem>
          <FormLabel>{field.name}{field.is_required && <span className="text-red-500 ml-1">*</span>}</FormLabel>
          <FormControl>
            {renderFieldInput()}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
