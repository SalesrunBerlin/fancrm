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
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Separator } from "@/components/ui/separator";
import { ApplicationCheckboxList } from "./ApplicationCheckboxList";

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

interface ObjectTypeFormProps {
  onComplete?: () => void;
}

export function ObjectTypeForm({ onComplete }: ObjectTypeFormProps) {
  const { createObjectType } = useObjectTypes();
  const { user } = useAuth();
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [isCreatingApplicationAssignments, setIsCreatingApplicationAssignments] = useState(false);

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

  // Check if the field already exists
  const checkFieldExists = async (objectTypeId: string, fieldApiName: string) => {
    try {
      const { data, error } = await supabase
        .from("object_fields")
        .select("id")
        .eq("object_type_id", objectTypeId)
        .eq("api_name", fieldApiName)
        .single();
        
      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
        console.warn("Error checking if field exists:", error);
        return false;
      }
      
      return !!data;
    } catch (err) {
      console.error("Exception checking field existence:", err);
      return false;
    }
  };

  const createDefaultField = async (objectTypeId: string, fieldApiName: string) => {
    if (!user) {
      console.error("User not authenticated, cannot create fields");
      throw new Error("Authentication required to create fields");
    }
    
    const userId = user.id;
    console.log(`Creating default field ${fieldApiName} for object type ${objectTypeId} by user ${userId}`);
    
    try {
      // First check if field already exists (to avoid duplicate errors)
      const fieldExists = await checkFieldExists(objectTypeId, fieldApiName);
      if (fieldExists) {
        console.log(`Field ${fieldApiName} already exists for object type ${objectTypeId}, skipping creation`);
        return null;
      }
      
      // Create the default field (text field)
      const fieldName = fieldApiName === "name" 
        ? "Name" 
        : fieldApiName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      
      console.log(`Creating primary field: ${fieldName} (${fieldApiName})`);
      
      const { data: field, error: fieldError } = await supabase
        .from("object_fields")
        .insert({
          object_type_id: objectTypeId,
          name: fieldName,
          api_name: fieldApiName,
          data_type: "text",
          is_required: true,
          is_system: false,
          display_order: 1,
          owner_id: userId
        })
        .select();

      if (fieldError) {
        console.error("Error creating default field:", fieldError);
        throw fieldError;
      }
      
      if (!field || field.length === 0) {
        console.error("No default field returned after creation");
        throw new Error("Failed to create default field, no data returned");
      }

      console.log(`Successfully created default field: ${fieldName}`, field);
      
      // Create a description field
      try {
        const descriptionApiName = "description";
        
        // Check if the description field already exists
        const descriptionFieldExists = await checkFieldExists(objectTypeId, descriptionApiName);
        if (descriptionFieldExists) {
          console.log(`Description field already exists, skipping creation`);
          return field;
        }
        
        const descriptionName = "Description";
        
        console.log(`Creating description field: ${descriptionName}`);

        const { data: descriptionField, error: descriptionError } = await supabase
          .from("object_fields")
          .insert({
            object_type_id: objectTypeId,
            name: descriptionName,
            api_name: descriptionApiName,
            data_type: "textarea",
            is_required: false,
            is_system: false,
            display_order: 2,
            owner_id: userId
          })
          .select();

        if (descriptionError) {
          console.error("Error creating description field:", descriptionError);
          toast({
            title: "Warning",
            description: `Default field created, but failed to create the description field: ${descriptionError.message}`,
            variant: "destructive",
          });
        } else {
          console.log(`Successfully created description field: ${descriptionName}`, descriptionField);
        }
      } catch (descriptionError) {
        console.error("Exception creating description field:", descriptionError);
        toast({
          title: "Warning",
          description: "Default field was created, but there was an error creating the description field",
          variant: "destructive",
        });
      }
      
      return field;
    } catch (error) {
      console.error("Failed to create fields:", error);
      throw error;
    }
  };

  // Create application assignments for a newly created object type
  const createApplicationAssignments = async (objectTypeId: string) => {
    if (!user || selectedApplications.length === 0) return;
    
    try {
      setIsCreatingApplicationAssignments(true);
      
      const assignments = selectedApplications.map(appId => ({
        application_id: appId,
        object_type_id: objectTypeId,
        owner_id: user.id
      }));
      
      const { error } = await supabase
        .from("object_application_assignments")
        .insert(assignments);
        
      if (error) throw error;
      
      console.log(`Created ${assignments.length} application assignments for object type ${objectTypeId}`);
    } catch (error) {
      console.error("Error creating application assignments:", error);
      toast({
        title: "Warning",
        description: "Object type was created, but there was an issue assigning it to applications",
        variant: "destructive",
      });
    } finally {
      setIsCreatingApplicationAssignments(false);
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
        try {
          // Create the default field and the additional text field
          await createDefaultField(result.id, values.default_field_api_name.trim());
          
          // Create application assignments if any are selected
          if (selectedApplications.length > 0) {
            await createApplicationAssignments(result.id);
          }
          
          toast.success("Object type created successfully");
        } catch (fieldError: any) {
          console.error("Error creating fields:", fieldError);
          toast.error("Object type was created, but there was an issue creating the fields", {
            description: fieldError?.message || 'Unknown error'
          });
        }
      }

      form.reset();
      setSelectedApplications([]);
      
      if (onComplete) {
        onComplete();
      }
    } catch (error: any) {
      console.error("Error creating object type:", error);
      toast.error("Object type could not be created", {
        description: error?.message || 'Unknown error'
      });
    }
  };

  // Listen for user auth status
  useEffect(() => {
    if (!user) {
      console.log("Warning: No authenticated user detected. Field creation may fail.");
    }
  }, [user]);

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
        
        <Separator className="my-6" />
        
        <div className="space-y-2">
          <FormLabel>Assign to Applications</FormLabel>
          <FormDescription>
            Select which applications this object should be available in
          </FormDescription>
          <ApplicationCheckboxList 
            selectedApplications={selectedApplications}
            onSelectionChange={setSelectedApplications}
          />
        </div>

        <Button 
          type="submit" 
          disabled={createObjectType.isPending || isCreatingApplicationAssignments}
          className="w-full"
        >
          {(createObjectType.isPending || isCreatingApplicationAssignments) && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Create Object Type
        </Button>
      </form>
    </Form>
  );
}
