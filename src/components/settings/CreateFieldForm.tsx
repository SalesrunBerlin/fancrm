
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useObjectFields } from "@/hooks/useObjectFields";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect } from "react";
import { toast } from "sonner";

const createFieldSchema = z.object({
  name: z.string().min(1, "Field name is required"),
  api_name: z.string().min(1, "API name is required").regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "API name must start with a letter and contain only letters, numbers and underscores"),
  data_type: z.string().min(1, "Data type is required"),
  description: z.string().optional(),
  is_required: z.boolean().default(false),
});

type CreateFieldFormValues = z.infer<typeof createFieldSchema>;

interface CreateFieldFormProps {
  objectTypeId: string;
  apiNameSuggestion?: string;
  onComplete?: () => void;
}

export function CreateFieldForm({ objectTypeId, apiNameSuggestion, onComplete }: CreateFieldFormProps) {
  const { createField } = useObjectFields(objectTypeId);

  const form = useForm<CreateFieldFormValues>({
    resolver: zodResolver(createFieldSchema),
    defaultValues: {
      name: "",
      api_name: "",
      data_type: "text",
      description: "",
      is_required: false,
    },
  });

  // If apiNameSuggestion is provided, generate a clean API name and set it
  useEffect(() => {
    if (apiNameSuggestion) {
      const suggestedName = apiNameSuggestion.trim();
      const cleanApiName = suggestedName
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "_")
        .replace(/^[^a-z]/, "a"); // Ensure first character is a letter
      
      form.setValue("name", suggestedName);
      form.setValue("api_name", cleanApiName);
    }
  }, [apiNameSuggestion, form]);

  // Auto-generate API name when name changes
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue("name", name);
    
    // Only auto-generate if API name is empty or was previously auto-generated
    const currentApiName = form.getValues("api_name");
    if (!currentApiName || currentApiName === form.getValues("name").toLowerCase().replace(/[^a-z0-9_]/g, "_")) {
      const apiName = name
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "_")
        .replace(/^[^a-z]/, "a"); // Ensure first character is a letter
      form.setValue("api_name", apiName);
    }
  };

  const onSubmit = async (data: CreateFieldFormValues) => {
    try {
      await createField.mutateAsync({
        ...data,
        object_type_id: objectTypeId,
      });
      
      toast.success("Field created successfully");
      
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error("Error creating field:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Field Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter field name" 
                  {...field} 
                  onChange={handleNameChange}
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
                  placeholder="api_name" 
                  {...field} 
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select field type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="textarea">Text Area</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="datetime">Date/Time</SelectItem>
                  <SelectItem value="picklist">Picklist</SelectItem>
                  <SelectItem value="boolean">Boolean</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="url">URL</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="lookup">Lookup</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Field description (optional)" 
                  {...field} 
                />
              </FormControl>
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
              </div>
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={createField.isPending}>
          {createField.isPending ? "Creating..." : "Create Field"}
        </Button>
      </form>
    </Form>
  );
}
