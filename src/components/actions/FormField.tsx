
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { UseFormReturn } from "react-hook-form";

interface FormFieldProps {
  field: {
    id: string;
    api_name: string;
    name: string;
    data_type: string;
    is_required: boolean;
    options?: any;
  };
  form: UseFormReturn<any>;
}

export function FormFieldRenderer({ field, form }: FormFieldProps) {
  return (
    <FormField
      key={field.id}
      control={form.control}
      name={field.api_name}
      render={({ field: formField }) => (
        <FormItem>
          <FormLabel>{field.name}</FormLabel>
          <FormControl>
            {field.data_type === "textarea" ? (
              <Textarea
                {...formField}
                className="min-h-24"
                placeholder={`Enter ${field.name.toLowerCase()}`}
              />
            ) : field.data_type === "picklist" ? (
              <Select
                onValueChange={formField.onChange}
                defaultValue={formField.value}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${field.name.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {field.options && typeof field.options === "object" &&
                    field.options.values &&
                    field.options.values.map((item: any, index: number) => (
                      <SelectItem key={index} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            ) : field.data_type === "boolean" ? (
              <div className="flex items-center space-x-2">
                <Switch
                  id={field.api_name}
                  checked={formField.value}
                  onCheckedChange={formField.onChange}
                />
                <label
                  htmlFor={field.api_name}
                  className="text-sm text-muted-foreground"
                >
                  {field.name}
                </label>
              </div>
            ) : field.data_type === "number" ? (
              <Input
                type="number"
                {...formField}
                placeholder={`Enter ${field.name.toLowerCase()}`}
              />
            ) : field.data_type === "email" ? (
              <Input
                type="email"
                {...formField}
                placeholder={`Enter ${field.name.toLowerCase()}`}
              />
            ) : field.data_type === "date" ? (
              <Input
                type="date"
                {...formField}
              />
            ) : (
              <Input
                {...formField}
                placeholder={`Enter ${field.name.toLowerCase()}`}
              />
            )}
          </FormControl>
          {field.options?.description && (
            <FormDescription>{field.options.description}</FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
