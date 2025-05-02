
import { useState } from "react";
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
import { UseFormReturn } from "react-hook-form";

// Define the form schema based on the field data
export interface ObjectFieldEditFieldsProps {
  field: ObjectField;
  form?: UseFormReturn<any>;
}

export function ObjectFieldEditFields({ field, form: externalForm }: ObjectFieldEditFieldsProps) {
  const { updateField } = useObjectFieldEdit(field.id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // If no external form is provided, create our own internal one
  const isUsingExternalForm = !!externalForm;

  const isSystemField = field.is_system === true;

  async function onSubmit(values: any) {
    if (isUsingExternalForm) return; // Don't submit if using external form
    
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
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This is a system field. Some properties cannot be modified.
          </AlertDescription>
        </Alert>
      )}

      {externalForm ? (
        // If external form is provided, use it
        <div className="space-y-4">
          <FormField
            control={externalForm.control}
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
            control={externalForm.control}
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
            control={externalForm.control}
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
            control={externalForm.control}
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
      ) : (
        // Use our internal form for standalone usage
        <div>Internal form would go here (not used in this context)</div>
      )}
    </div>
  );
}
