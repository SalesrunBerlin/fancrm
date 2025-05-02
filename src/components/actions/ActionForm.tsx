import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import { ActionType, ActionColor } from "@/hooks/useActions";
import { supabase } from "@/integrations/supabase/client";

const actionFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  action_type: z.enum(["new_record", "linked_record"] as const),
  target_object_id: z.string().min(1, "Target object is required"),
  source_field_id: z.string().optional().nullable(),
  color: z.enum(["default", "destructive", "outline", "secondary", "ghost", "link", "warning", "success"] as const).default("default"),
});

type ActionFormData = z.infer<typeof actionFormSchema>;

export interface ActionFormProps {
  defaultValues?: Partial<ActionFormData>;
  objects: Array<{ id: string; name: string }>;
  onSubmit: (data: ActionFormData) => void | Promise<void>;
  isSubmitting?: boolean;
}

export function ActionForm({
  defaultValues,
  objects,
  onSubmit,
  isSubmitting = false,
}: ActionFormProps) {
  const navigate = useNavigate();
  const form = useForm<ActionFormData>({
    resolver: zodResolver(actionFormSchema),
    defaultValues: {
      name: "",
      description: "",
      action_type: "new_record" as ActionType,
      target_object_id: "",
      source_field_id: null,
      color: "default",
      ...defaultValues,
    },
  });
  
  const [lookupFields, setLookupFields] = useState<Array<{
    id: string;
    name: string;
    api_name: string;
    target_object_type_id: string;
  }>>([]);
  
  const actionType = form.watch("action_type");
  const targetObjectId = form.watch("target_object_id");
  const selectedColor = form.watch("color");

  // Update form when defaultValues change
  useEffect(() => {
    if (defaultValues) {
      form.reset({
        name: defaultValues.name || "",
        description: defaultValues.description || "",
        action_type: defaultValues.action_type || "new_record",
        target_object_id: defaultValues.target_object_id || "",
        source_field_id: defaultValues.source_field_id || null,
      });
    }
  }, [defaultValues, form]);

  // Fetch lookup fields when the target object changes and action type is linked_record
  useEffect(() => {
    if (actionType === "linked_record" && targetObjectId) {
      // Fetch lookup fields for the selected target object
      const fetchLookupFields = async () => {
        try {
          const { data, error } = await supabase
            .from("object_fields")
            .select("id, name, api_name, options")
            .eq("object_type_id", targetObjectId)
            .eq("data_type", "lookup");

          if (error) throw error;

          const processedFields = data
            .filter(field => field.options)
            .map(field => {
              let targetObjectTypeId = '';
              
              try {
                let options = field.options;
                // Handle options as string
                if (typeof options === 'string') {
                  const parsedOptions = JSON.parse(options);
                  if (parsedOptions && typeof parsedOptions === 'object' && 'target_object_type_id' in parsedOptions) {
                    targetObjectTypeId = String(parsedOptions.target_object_type_id);
                  }
                } 
                // Handle options as object
                else if (typeof options === 'object' && options !== null) {
                  const optionsObj = options as Record<string, any>;
                  if ('target_object_type_id' in optionsObj) {
                    targetObjectTypeId = String(optionsObj.target_object_type_id);
                  }
                }
              } catch (e) {
                console.error("Error processing field options:", e);
              }
              
              return {
                id: field.id,
                name: field.name,
                api_name: field.api_name,
                target_object_type_id: targetObjectTypeId
              };
            })
            .filter(field => field.target_object_type_id);
          
          setLookupFields(processedFields);
        } catch (error) {
          console.error("Error fetching lookup fields:", error);
        }
      };

      fetchLookupFields();
    }
  }, [actionType, targetObjectId]);

  const handleSubmit = (data: ActionFormData) => {
    // If action type is not linked_record, make sure source_field_id is null
    if (data.action_type !== "linked_record") {
      data.source_field_id = null;
    }
    
    onSubmit(data);
  };

  // Helper function to get button style based on selected color
  const getButtonStyle = (color: ActionColor) => {
    return `bg-${color === 'default' ? 'primary' : color}-500 hover:bg-${color === 'default' ? 'primary' : color}-600 text-white px-6 py-1 rounded`;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter action name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter action description"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="action_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Action Type</FormLabel>
              <Select
                value={field.value}
                onValueChange={(value) => field.onChange(value as ActionType)}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select action type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="new_record">New Record (Global)</SelectItem>
                  <SelectItem value="linked_record">Linked Record</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="target_object_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target Object</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target object" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {objects.map((obj) => (
                    <SelectItem key={obj.id} value={obj.id}>{obj.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {actionType === "linked_record" && (
          <FormField
            control={form.control}
            name="source_field_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Source Field (Lookup Field)</FormLabel>
                <Select
                  value={field.value || undefined} 
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select lookup field" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {lookupFields.length === 0 ? (
                      <SelectItem value="no-fields-available" disabled>
                        No lookup fields available
                      </SelectItem>
                    ) : (
                      lookupFields.map((lookupField) => (
                        <SelectItem key={lookupField.id} value={lookupField.id}>
                          {lookupField.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Button Color</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select button color" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="default">Blue (Default)</SelectItem>
                  <SelectItem value="destructive">Red</SelectItem>
                  <SelectItem value="success">Green</SelectItem>
                  <SelectItem value="warning">Orange</SelectItem>
                  <SelectItem value="secondary">Gray</SelectItem>
                  <SelectItem value="outline">Outline</SelectItem>
                  <SelectItem value="ghost">Ghost</SelectItem>
                </SelectContent>
              </Select>
              <div className="mt-2">
                <div className="text-xs text-gray-500 mb-2">Preview:</div>
                <Button type="button" variant={field.value} className="pointer-events-none">
                  Button Preview
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/actions")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Action
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
