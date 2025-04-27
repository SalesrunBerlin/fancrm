
import { useState } from "react";
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
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useObjectTypes } from "@/hooks/useObjectTypes";

const fieldSchema = z.object({
  name: z.string().min(2, {
    message: "Field name must be at least 2 characters.",
  }),
  api_name: z.string().min(2, {
    message: "API name must be at least 2 characters.",
  }),
  data_type: z.string().min(2, {
    message: "Data type must be selected.",
  }),
  is_required: z.boolean().default(false),
  options: z.record(z.any()).optional(),
});

interface ObjectFieldFormProps {
  objectTypeId: string;
  onComplete?: () => void;
}

export function ObjectFieldForm({ objectTypeId, onComplete }: ObjectFieldFormProps) {
  const { objectTypes } = useObjectTypes();
  
  // Create a form instance instead of using useFormContext
  const form = useForm({
    resolver: zodResolver(fieldSchema),
    defaultValues: {
      name: "",
      api_name: "",
      data_type: "",
      is_required: false,
      options: {}
    }
  });

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
      console.log("Form submitted with values:", values);
      // Handle form submission logic here
      
      // Call onComplete callback if provided
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error("Error submitting form:", error);
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
                    form.setValue("options", { target_object_type_id: null });
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
          <FormField
            control={form.control}
            name="options.target_object_type_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target Object</FormLabel>
                <Select
                  value={field.value || ""}
                  onValueChange={field.onChange}
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
        )}

        <FormField
          control={form.control}
          name="is_required"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel>Required</FormLabel>
                <FormDescription>
                  Mark this field as required.
                </FormDescription>
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

        <Button type="submit">Create Field</Button>
      </form>
    </Form>
  );
}
