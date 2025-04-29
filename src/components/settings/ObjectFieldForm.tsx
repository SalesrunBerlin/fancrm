
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
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Separator } from "@/components/ui/separator";
import { PicklistValuesManager } from "./PicklistValuesManager";
import { ObjectField } from "@/hooks/useObjectTypes";
import type { CreateFieldInput } from "@/hooks/useObjectFields";

// Define data type options constant here to ensure it's available throughout the component
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
  onComplete?: (field: ObjectField) => void;
  initialName?: string;
}

export function ObjectFieldForm({ objectTypeId, onComplete, initialName }: ObjectFieldFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPicklistValues, setShowPicklistValues] = useState(false);
  const [createdFieldId, setCreatedFieldId] = useState<string | null>(null);
  const [createdField, setCreatedField] = useState<ObjectField | null>(null);
  const { objectTypes } = useObjectTypes();
  const { createField, fields } = useObjectFields(objectTypeId);
  const { user } = useAuth();
  
  const form = useForm<z.infer<typeof fieldSchema>>({
    resolver: zodResolver(fieldSchema),
    defaultValues: {
      name: initialName || "",
      api_name: "",
      data_type: "",
      is_required: false,
      options: {}
    }
  });

  // Watch for data_type changes
  const dataType = form.watch("data_type");

  useEffect(() => {
    if (dataType === "picklist") {
      setShowPicklistValues(true);
    } else {
      setShowPicklistValues(false);
      setCreatedFieldId(null);
    }
  }, [dataType]);

  const onSubmit = async (values: z.infer<typeof fieldSchema>) => {
    try {
      setIsSubmitting(true);
      
      // Create the field using our properly typed input
      const fieldInput: CreateFieldInput = {
        name: values.name,
        api_name: values.api_name,
        data_type: values.data_type,
        is_required: values.is_required,
        object_type_id: objectTypeId,
        options: values.options,
      };
      
      const fieldData = await createField.mutateAsync(fieldInput);

      // Ensure we're using the correct type for the created field
      if (fieldData) {
        // Store the created field properly typed for later use
        setCreatedField(fieldData as ObjectField);
        
        if (values.data_type === "picklist") {
          setCreatedFieldId(fieldData.id);
          toast.success("Field created! You can now add picklist values.");
        } else {
          toast.success("Field created successfully");
          if (onComplete) {
            onComplete(fieldData as ObjectField);
          }
        }
      }
    } catch (error) {
      console.error("Error creating field:", error);
      toast.error("Failed to create field");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePicklistComplete = () => {
    toast.success("Field and picklist values created successfully");
    if (onComplete && createdField) {
      onComplete(createdField);
    }
  };

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
                onValueChange={field.onChange}
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

        {!createdFieldId && (
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Field
          </Button>
        )}
      </form>

      {createdFieldId && (
        <div className="mt-6">
          <Separator className="my-4" />
          <h3 className="text-lg font-medium mb-4">Add Picklist Values</h3>
          <PicklistValuesManager 
            fieldId={createdFieldId} 
          />
          <Button 
            onClick={handlePicklistComplete}
            className="mt-4 w-full"
          >
            Complete Setup
          </Button>
        </div>
      )}
    </Form>
  );
}
