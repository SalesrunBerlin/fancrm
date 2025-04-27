
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
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
        return <Textarea {...form.register(field.api_name)} />;
      case 'number':
        return <Input type="number" {...form.register(field.api_name)} />;
      case 'email':
        return <Input type="email" {...form.register(field.api_name)} />;
      default:
        return <Input {...form.register(field.api_name)} />;
    }
  };

  return (
    <FormField
      control={form.control}
      name={field.api_name}
      render={({ field: formField }) => (
        <FormItem>
          <FormLabel>{field.name}</FormLabel>
          <FormControl>
            {renderFieldInput()}
          </FormControl>
        </FormItem>
      )}
    />
  );
}
