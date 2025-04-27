
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useObjectFields } from "@/hooks/useObjectFields";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const fieldSchema = z.object({
  name: z.string().min(2, {
    message: "Field name must be at least 2 characters.",
  }),
  api_name: z.string().min(2, {
    message: "API name must be at least 2 characters.",
  }).refine(value => /^[a-z0-9_]+$/.test(value), {
    message: "API name must contain only lowercase letters, numbers, and underscores."
  }),
  data_type: z.string().min(2, {
    message: "Data type must be selected.",
  }),
  is_required: z.boolean().default(false),
  options: z.object({
    target_object_type_id: z.string().optional(),
    display_field_api_name: z.string().optional(),
  }).optional(),
});

interface ObjectFieldFormProps {
  objectTypeId: string;
  onComplete?: () => void;
}

export function ObjectFieldForm({ objectTypeId, onComplete }: ObjectFieldFormProps) {
  const { objectTypes } = useObjectTypes();
  const { createField } = useObjectFields(objectTypeId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTargetType, setSelectedTargetType] = useState<string | null>(null);
  const { fields: targetFields } = useObjectFields(selectedTargetType || undefined);
  
  const form = useForm<z.infer<typeof fieldSchema>>({
    resolver: zodResolver(fieldSchema),
    defaultValues: {
      name: "",
      api_name: "",
      data_type: "",
      is_required: false,
      options: {}
    }
  });

  // Auto-generate API name from field name
  useEffect(() => {
    const name = form.watch("name");
    if (name) {
      const apiName = name
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, "")
        .replace(/\s+/g, "_");
      
      // Only update if the api_name hasn't been manually modified
      const currentApiName = form.watch("api_name");
      if (!currentApiName || currentApiName === "") {
        form.setValue("api_name", apiName);
      }
    }
  }, [form.watch("name")]);

  const dataTypeOptions = [
    { label: "Text", value: "text" },
    { label: "Text Area", value: "textarea" },
    { label: "Number", value: "number" },
    { label: "Email", value: "email" },
    { label: "URL", value: "url" },
    { label: "Date", value: "date" },
    { label: "Date & Time", value: "datetime" },
    { label: "Boolean", value: "boolean" },
    { label: "Picklist", value: "picklist" },
    { label: "Currency", value: "currency" },
    { label: "Lookup", value: "lookup" }
  ];

  const onSubmit = async (values: z.infer<typeof fieldSchema>) => {
    try {
      setIsSubmitting(true);
      console.log("Form values before submission:", values);

      // First create the field
      const { data: fieldData, error: fieldError } = await supabase
        .from('object_fields')
        .insert([{
          name: values.name,
          api_name: values.api_name,
          data_type: values.data_type,
          is_required: values.is_required,
          object_type_id: objectTypeId,
          options: values.data_type === 'lookup' ? {
            target_object_type_id: values.options?.target_object_type_id
          } : undefined,
        }])
        .select();

      if (fieldError) {
        console.error("Error creating field:", fieldError);
        toast.error("Failed to create field: " + fieldError.message);
        return;
      }

      // If it's a lookup field and we have a display field, create the config
      if (values.data_type === 'lookup' && values.options?.display_field_api_name && fieldData && fieldData.length > 0) {
        const { error: configError } = await supabase
          .from('field_display_configs')
          .insert([{
            field_id: fieldData[0].id,
            display_field_api_name: values.options.display_field_api_name
          }]);

        if (configError) {
          console.error("Error creating display config:", configError);
          toast.error("Failed to create display config: " + configError.message);
          return;
        }
      }

      toast.success("Field created successfully");
      form.reset();
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to create field");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Field Name</FormLabel>
              <FormControl>
                <Input placeholder="Field Name" {...field} />
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
                <Input placeholder="api_name" {...field} />
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
              <FormLabel>Field Type</FormLabel>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  if (value === "lookup") {
                    form.setValue("options", { target_object_type_id: "" });
                    setSelectedTargetType(null);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select field type" />
                </SelectTrigger>
                <SelectContent>
                  {dataTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.watch("data_type") === "lookup" && (
          <>
            <FormField
              control={form.control}
              name="options.target_object_type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Object</FormLabel>
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedTargetType(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select target object" />
                    </SelectTrigger>
                    <SelectContent>
                      {objectTypes?.filter(t => t.id !== objectTypeId).map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedTargetType && (
              <FormField
                control={form.control}
                name="options.display_field_api_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Field</FormLabel>
                    <Select
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select display field" />
                      </SelectTrigger>
                      <SelectContent>
                        {targetFields?.map((targetField) => (
                          <SelectItem key={targetField.api_name} value={targetField.api_name}>
                            {targetField.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </>
        )}

        <FormField
          control={form.control}
          name="is_required"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel>Required</FormLabel>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          disabled={isSubmitting}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Field
        </Button>
      </form>
    </Form>
  );
}
