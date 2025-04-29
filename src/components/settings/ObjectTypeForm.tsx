
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
  FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

const objectTypeSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  api_name: z.string().min(2, {
    message: "API name must be at least 2 characters.",
  }).refine(value => /^[a-z0-9_]+$/.test(value), {
    message: "API name must contain only lowercase letters, numbers, and underscores."
  }),
  description: z.string().optional(),
  icon: z.string().min(1, {
    message: "Please select an icon.",
  }),
  default_field_api_name: z.string().min(1, {
    message: "Default field is required.",
  }),
});

type ObjectTypeFormValues = z.infer<typeof objectTypeSchema>;

export function ObjectTypeForm() {
  const { createObjectType } = useObjectTypes();
  const { toast } = useToast();

  const form = useForm<ObjectTypeFormValues>({
    resolver: zodResolver(objectTypeSchema),
    defaultValues: {
      name: "",
      api_name: "",
      description: "",
      icon: "building",
      default_field_api_name: "name",
    },
  });

  // Generate API name from name
  const generateApiName = () => {
    const name = form.getValues("name");
    if (name && !form.getValues("api_name")) {
      const generatedApiName = name
        .toLowerCase()
        .replace(/\s+/g, '_')      // Replace spaces with underscores
        .replace(/[^a-z0-9_]/g, '') // Remove special characters
        .replace(/^[0-9]/, 'x$&');  // Prefix with 'x' if starts with number
      form.setValue("api_name", generatedApiName);
    }
  };

  const createDefaultField = async (objectTypeId: string, fieldApiName: string) => {
    try {
      // Create the default field (text field)
      const { data: field, error: fieldError } = await supabase
        .from("object_fields")
        .insert({
          object_type_id: objectTypeId,
          name: fieldApiName === "name" ? "Name" : fieldApiName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          api_name: fieldApiName,
          data_type: "text",
          is_required: true,
          is_system: false,
          display_order: 1,
        })
        .select();

      if (fieldError) {
        console.error("Error creating default field:", fieldError);
        throw fieldError;
      }
      
      return field;
    } catch (error) {
      console.error("Failed to create default field:", error);
      throw error;
    }
  };

  const onSubmit = async (values: ObjectTypeFormValues) => {
    try {
      // First create the object type
      const result = await createObjectType.mutateAsync({
        name: values.name.trim(),
        api_name: values.api_name.trim().toLowerCase(),
        description: values.description?.trim() || null,
        icon: values.icon,
        default_field_api_name: values.default_field_api_name.trim(),
        is_system: false,
        is_active: true,
        show_in_navigation: true,
        is_published: false,
        is_template: false,
        source_object_id: null
      });
      
      if (result && result.id) {
        // Then create the default field
        await createDefaultField(result.id, values.default_field_api_name.trim());
      }

      form.reset();

      toast({
        title: "Success",
        description: "Object type and default field were created successfully",
      });
    } catch (error) {
      console.error("Error creating object type:", error);
      toast({
        title: "Error",
        description: "Object type could not be created",
        variant: "destructive",
      });
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
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter object name" {...field} />
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
                  placeholder="Click here to generate API name" 
                  {...field} 
                  onClick={generateApiName}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Icon</FormLabel>
              <Select 
                value={field.value}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an icon" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="building">Building</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="briefcase">Briefcase</SelectItem>
                  <SelectItem value="calendar">Calendar</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="default_field_api_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default Field</FormLabel>
              <FormControl>
                <Input placeholder="Name of default field" {...field} />
              </FormControl>
              <FormDescription>
                This field will be used as title in the detail view and will be created automatically
              </FormDescription>
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
                <Textarea placeholder="Enter a description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          disabled={createObjectType.isPending}
          className="w-full"
        >
          {createObjectType.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Create Object Type
        </Button>
      </form>
    </Form>
  );
}
