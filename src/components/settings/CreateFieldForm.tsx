import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useObjectFields } from "@/hooks/useObjectFields";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { usePicklistCreation } from "@/hooks/usePicklistCreation";
import { PicklistValuesInput } from "./PicklistValuesInput";
import { LookupFieldConfig } from "./LookupFieldConfig";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  api_name: z.string().min(1, "API Name is required")
    .regex(/^[a-z][a-z0-9_]*$/, "API Name must start with a lowercase letter and contain only lowercase letters, numbers, and underscores"),
  data_type: z.string().min(1, "Data Type is required"),
  is_required: z.boolean().default(false),
  description: z.string().optional(),
});

interface CreateFieldFormProps {
  objectTypeId: string;
  onFieldCreated?: () => void;
}

export function CreateFieldForm({ objectTypeId, onFieldCreated }: CreateFieldFormProps) {
  const [loading, setLoading] = useState(false);
  const { createField } = useObjectFields(objectTypeId);
  const { objectTypes } = useObjectTypes();
  const [picklistValues, setPicklistValues] = useState<string[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const { addBatchPicklistValues } = usePicklistCreation(selectedFieldId);
  const [lookupConfig, setLookupConfig] = useState<{
    targetObjectTypeId: string;
    displayFieldApiName: string;
  } | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      api_name: "",
      data_type: "text",
      is_required: false,
      description: "",
    },
  });

  const dataType = form.watch("data_type");
  const fieldName = form.watch("name");

  // Auto-generate API name from field name
  useEffect(() => {
    if (fieldName && !form.getValues("api_name")) {
      const apiName = fieldName
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "_");
      form.setValue("api_name", apiName, { shouldValidate: true });
    }
  }, [fieldName, form]);

  const createObjectField = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      
      // Ensure name is provided
      const fieldData = {
        object_type_id: objectTypeId,
        name: values.name, // This is now explicitly required by the type
        api_name: values.api_name,
        data_type: values.data_type,
        is_required: values.is_required,
        description: values.description
      };

      // Add lookup field options if applicable
      if (values.data_type === "lookup" && lookupConfig) {
        fieldData.options = {
          target_object_type_id: lookupConfig.targetObjectTypeId,
          display_field_api_name: lookupConfig.displayFieldApiName
        };
      }
      
      // Create the field
      const result = await createField.mutateAsync(fieldData);
      
      // If it's a picklist field and we have values, add them
      if (values.data_type === "picklist" && picklistValues.length > 0 && result?.id) {
        await addBatchPicklistValues(result.id, picklistValues);
      }
      
      form.reset();
      onFieldCreated?.();
    } catch (error) {
      console.error('Error creating field:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(createObjectField)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Field Name</FormLabel>
              <FormControl>
                <Input placeholder="Customer Name" {...field} />
              </FormControl>
              <FormDescription>
                The display name for this field
              </FormDescription>
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
                <Input placeholder="customer_name" {...field} />
              </FormControl>
              <FormDescription>
                The API identifier for this field (lowercase, no spaces)
              </FormDescription>
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
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a data type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="datetime">Date & Time</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="url">URL</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="picklist">Picklist</SelectItem>
                  <SelectItem value="lookup">Lookup</SelectItem>
                  <SelectItem value="checkbox">Checkbox</SelectItem>
                  <SelectItem value="textarea">Text Area</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                The type of data this field will store
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {dataType === "picklist" && (
          <PicklistValuesInput
            values={picklistValues}
            onChange={setPicklistValues}
          />
        )}

        {dataType === "lookup" && (
          <LookupFieldConfig
            objectTypes={objectTypes || []}
            onChange={setLookupConfig}
          />
        )}

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter a description for this field"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Optional description to explain the purpose of this field
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_required"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Required Field</FormLabel>
                <FormDescription>
                  Make this field mandatory when creating records
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Field"
          )}
        </Button>
      </form>
    </Form>
  );
}
