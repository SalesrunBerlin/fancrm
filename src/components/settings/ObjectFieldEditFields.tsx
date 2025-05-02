
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ObjectField } from "@/hooks/useObjectTypes";
import { useObjectFieldEdit } from "@/hooks/useObjectFieldEdit";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

// Define the form schema based on the field data
const fieldFormSchema = z.object({
  name: z.string().min(2, { message: "Field name must be at least 2 characters" }),
  api_name: z.string().min(2, { message: "API name must be at least 2 characters" })
    .refine(value => /^[a-z0-9_]+$/.test(value), {
      message: "API name must only contain lowercase letters, numbers, and underscores"
    }),
  is_required: z.boolean().default(false),
  data_type: z.string(),
  options: z.record(z.any()).optional(),
});

export interface ObjectFieldEditFieldsProps {
  field: ObjectField;
}

export function ObjectFieldEditFields({ field }: ObjectFieldEditFieldsProps) {
  const { updateField } = useObjectFieldEdit(field.id);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize the form with the field data
  const form = useForm<z.infer<typeof fieldFormSchema>>({
    resolver: zodResolver(fieldFormSchema),
    defaultValues: {
      name: field.name,
      api_name: field.api_name,
      is_required: field.is_required || false,
      data_type: field.data_type,
      options: field.options || {},
    },
  });

  const isSystemField = field.is_system === true;

  async function onSubmit(values: z.infer<typeof fieldFormSchema>) {
    try {
      setIsSubmitting(true);
      await updateField.mutateAsync(values);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {isSystemField && (
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This is a system field. Some properties cannot be modified.
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Field Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Field Name" 
                    {...field} 
                    disabled={isSystemField} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="api_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>API Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="API Name" 
                    {...field} 
                    disabled={true} // API name cannot be changed
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="data_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data Type</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={true} // Data type cannot be changed
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="textarea">Text Area</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="url">URL</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="datetime">Date/Time</SelectItem>
                    <SelectItem value="checkbox">Checkbox</SelectItem>
                    <SelectItem value="picklist">Picklist</SelectItem>
                    <SelectItem value="lookup">Lookup</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_required"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>Required Field</FormLabel>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSystemField}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            disabled={isSubmitting || isSystemField}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </form>
      </Form>
    </div>
  );
}
