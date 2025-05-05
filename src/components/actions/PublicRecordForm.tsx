
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Check } from "lucide-react";
import { createPublicRecord } from "@/services/publicActionService";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

interface PublicRecordFormProps {
  objectTypeId: string;
  objectFields: Array<{
    id: string;
    api_name: string;
    name: string;
    data_type: string;
    is_required: boolean;
    options?: any;
    default_value?: any;
  }>;
  actionFields: Array<{
    id: string;
    field_id: string;
    is_preselected: boolean;
    is_enabled: boolean;
    default_value?: string | null;
    display_order: number;
  }>;
  onSuccess?: () => void;
}

export function PublicRecordForm({ 
  objectTypeId, 
  objectFields, 
  actionFields,
  onSuccess 
}: PublicRecordFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Filter fields based on action configuration
  const enabledFields = objectFields.filter(field => {
    const actionField = actionFields.find(af => af.field_id === field.id);
    return actionField && actionField.is_enabled;
  });

  // Sort fields by display_order from actionFields
  const sortedFields = [...enabledFields].sort((a, b) => {
    const aOrder = actionFields.find(af => af.field_id === a.id)?.display_order || 0;
    const bOrder = actionFields.find(af => af.field_id === b.id)?.display_order || 0;
    return aOrder - bOrder;
  });

  // Get default values from actionFields
  const defaultValues: Record<string, any> = {};
  sortedFields.forEach(field => {
    const actionField = actionFields.find(af => af.field_id === field.id);
    if (actionField && actionField.default_value) {
      defaultValues[field.api_name] = actionField.default_value;
    } else if (field.default_value) {
      defaultValues[field.api_name] = field.default_value;
    }
  });

  // Create dynamic form schema based on fields
  const formSchema = z.object(
    sortedFields.reduce((schema, field) => {
      let fieldSchema;
      
      // Create appropriate schema based on field type
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
        schema[field.api_name] = fieldSchema.nonempty(`${field.name} is required`);
      } else {
        schema[field.api_name] = fieldSchema.optional();
      }
      
      return schema;
    }, {} as Record<string, z.ZodTypeAny>)
  );

  // Create form with react-hook-form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    
    try {
      await createPublicRecord(objectTypeId, values);
      toast.success("Record created successfully");
      setIsSuccess(true);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Error creating record:", error);
      toast.error("Failed to create record", {
        description: error.message || "Please try again later"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="rounded-full bg-green-100 p-3">
          <Check className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Thank You!</h2>
        <p className="text-center text-muted-foreground">Your submission has been received successfully.</p>
        <Button 
          onClick={() => {
            setIsSuccess(false);
            form.reset(defaultValues);
          }}
          className="mt-4"
        >
          Submit another response
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {sortedFields.map((field) => {
          const actionField = actionFields.find(af => af.field_id === field.id);
          const isEnabled = actionField?.is_enabled || false;
          
          if (!isEnabled) return null;

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
        })}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit"
          )}
        </Button>
      </form>
    </Form>
  );
}
