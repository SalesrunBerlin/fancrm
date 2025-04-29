
import { useFormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { ControllerRenderProps, UseFormReturn } from "react-hook-form";
import { ObjectField } from "@/hooks/useObjectTypes";
import { LookupField } from "./LookupField";

interface RecordFieldProps {
  field: ObjectField;
  form: UseFormReturn<any>;
}

export function RecordField({ field, form }: RecordFieldProps) {
  const { name } = useFormField();
  const value = form.watch(field.api_name);

  const renderField = () => {
    switch (field.data_type) {
      case "text":
        return (
          <Input
            type="text"
            placeholder={field.name}
            {...form.register(field.api_name, { required: field.is_required })}
            className="w-full"
          />
        );
      case "textarea":
        return (
          <Textarea
            placeholder={field.name}
            {...form.register(field.api_name, { required: field.is_required })}
            className="w-full min-h-[100px]"
          />
        );
      case "number":
        return (
          <Input
            type="number"
            placeholder={field.name}
            {...form.register(field.api_name, { required: field.is_required })}
            className="w-full"
          />
        );
      case "email":
        return (
          <Input
            type="email"
            placeholder={field.name}
            {...form.register(field.api_name, { required: field.is_required })}
            className="w-full"
          />
        );
      case "boolean":
        return (
          <Select
            onValueChange={(value) => form.setValue(field.api_name, value === "true")}
            defaultValue={value ? "true" : "false"}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={field.name} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">True</SelectItem>
              <SelectItem value="false">False</SelectItem>
            </SelectContent>
          </Select>
        );
      case "date":
        return (
          <Input
            type="date"
            placeholder={field.name}
            {...form.register(field.api_name, { required: field.is_required })}
            className="w-full"
          />
        );
      case "lookup":
        const targetObjectTypeId = field.options?.target_object_type_id;
        
        return (
          <LookupField
            value={value}
            onChange={(newValue) => {
              form.setValue(field.api_name, newValue);
            }}
            targetObjectTypeId={targetObjectTypeId}
            disabled={form.formState.isSubmitting}
          />
        );
        
      default:
        return (
          <Input
            type="text"
            placeholder={field.name}
            {...form.register(field.api_name, { required: field.is_required })}
            className="w-full"
          />
        );
    }
  };

  return (
    <FormItem className="w-full">
      <FormLabel>{field.name}</FormLabel>
      <FormControl>
        {renderField()}
      </FormControl>
      {field.options?.description && (
        <FormDescription className="text-xs sm:text-sm">{field.options.description}</FormDescription>
      )}
      <FormMessage />
    </FormItem>
  );
}
