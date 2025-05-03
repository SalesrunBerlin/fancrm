
import { useState, useEffect } from "react";
import { ObjectField } from "@/hooks/useObjectTypes";
import { useObjectFieldEdit } from "@/hooks/useObjectFieldEdit";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { UseFormReturn } from "react-hook-form";

// Define the form schema based on the field data
const fieldEditSchema = z.object({
  name: z.string().min(1, "Field name is required"),
  api_name: z.string().min(1, "API name is required"),
  data_type: z.string(),
  is_required: z.boolean().optional(),
  target_object_type_id: z.string().optional(),
  display_field_api_name: z.string().optional(),
});

export type FieldEditFormValues = z.infer<typeof fieldEditSchema>;

export interface ObjectFieldEditFieldsProps {
  field: ObjectField;
  form?: UseFormReturn<any>;
}

export function ObjectFieldEditFields({ field, form: externalForm }: ObjectFieldEditFieldsProps) {
  const { updateField } = useObjectFieldEdit(field.id);
  const { objectTypes } = useObjectTypes();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // If no external form is provided, create our own internal one
  const isUsingExternalForm = !!externalForm;
  
  // Create our internal form when not using external form
  const internalForm = useForm<FieldEditFormValues>({
    resolver: zodResolver(fieldEditSchema),
    defaultValues: {
      name: field.name,
      api_name: field.api_name,
      data_type: field.data_type,
      is_required: field.is_required || false,
      target_object_type_id: field.options?.target_object_type_id,
      display_field_api_name: field.options?.display_field_api_name,
    }
  });

  // Determine which form to use
  const form = externalForm || internalForm;

  const isSystemField = field.is_system === true;

  // Reset the form when the field changes
  useEffect(() => {
    form.reset({
      name: field.name,
      api_name: field.api_name,
      data_type: field.data_type,
      is_required: field.is_required || false,
      target_object_type_id: field.options?.target_object_type_id,
      display_field_api_name: field.options?.display_field_api_name,
    });
  }, [field, form]);

  async function onSubmit(values: FieldEditFormValues) {
    if (isUsingExternalForm) return; // Don't submit if using external form
    
    try {
      setIsSubmitting(true);
      
      // Prepare options based on field type
      let options = field.options || {};
      
      if (field.data_type === 'lookup') {
        options = {
          ...options,
          target_object_type_id: values.target_object_type_id,
          display_field_api_name: values.display_field_api_name
        };
      }
      
      await updateField.mutateAsync({
        id: field.id,
        object_type_id: field.object_type_id,
        name: values.name,
        is_required: values.is_required,
        options
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const formContent = (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="name"
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel>Field Name</FormLabel>
            <FormControl>
              <Input 
                placeholder="Field Name" 
                {...formField} 
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
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel>API Name</FormLabel>
            <FormControl>
              <Input 
                placeholder="API Name" 
                {...formField} 
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
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel>Data Type</FormLabel>
            <Select
              value={formField.value}
              onValueChange={formField.onChange}
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
        render={({ field: formField }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel>Required Field</FormLabel>
            </div>
            <FormControl>
              <Switch
                checked={formField.value}
                onCheckedChange={formField.onChange}
                disabled={isSystemField}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  return (
    <div className="space-y-4">
      {isSystemField && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This is a system field. Some properties cannot be modified.
          </AlertDescription>
        </Alert>
      )}

      {isUsingExternalForm ? (
        // If external form is provided, just render the form content
        formContent
      ) : (
        // Use our internal form for standalone usage
        <Form {...internalForm}>
          <form onSubmit={internalForm.handleSubmit(onSubmit)} className="space-y-6">
            {formContent}
            
            <div className="flex justify-end gap-2">
              <Button type="submit" disabled={isSubmitting || isSystemField}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
