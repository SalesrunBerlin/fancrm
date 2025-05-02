
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Loader2, Save, Circle } from "lucide-react";
import { ActionType, ActionColor } from "@/hooks/useActions";
import { supabase } from "@/integrations/supabase/client";

const actionFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  action_type: z.enum(["new_record", "linked_record"] as const),
  target_object_id: z.string().min(1, "Target object is required"),
  source_field_id: z.string().optional().nullable(),
  color: z.string().default("default"),
});

type ActionFormData = z.infer<typeof actionFormSchema>;

export interface ActionFormProps {
  defaultValues?: Partial<ActionFormData>;
  objects: Array<{ id: string; name: string }>;
  onSubmit: (data: ActionFormData) => void | Promise<void>;
  isSubmitting?: boolean;
}

// Expanded color options with at least 40 colors
const colorOptions = [
  // Default button variants
  { value: "default", label: "Blue (Default)", className: "bg-primary" },
  { value: "destructive", label: "Red", className: "bg-destructive" },
  { value: "secondary", label: "Gray", className: "bg-secondary" },
  { value: "warning", label: "Amber", className: "bg-amber-500" },
  { value: "success", label: "Green", className: "bg-green-600" },
  
  // Extended color palette - blues & teals
  { value: "cyan", label: "Cyan", className: "bg-cyan-500" },
  { value: "teal", label: "Teal", className: "bg-teal-500" },
  { value: "sky", label: "Sky Blue", className: "bg-sky-500" },
  { value: "azure", label: "Azure", className: "bg-sky-600" },
  { value: "cobalt", label: "Cobalt", className: "bg-blue-700" },
  { value: "navy", label: "Navy", className: "bg-blue-900" },
  { value: "turquoise", label: "Turquoise", className: "bg-teal-400" },
  { value: "seafoam", label: "Seafoam", className: "bg-green-300" },
  
  // Greens & yellows
  { value: "emerald", label: "Emerald", className: "bg-emerald-500" },
  { value: "lime", label: "Lime", className: "bg-lime-500" },
  { value: "yellow", label: "Yellow", className: "bg-yellow-500" },
  { value: "olive", label: "Olive", className: "bg-yellow-700" },
  { value: "forest", label: "Forest", className: "bg-green-800" },
  { value: "mint", label: "Mint", className: "bg-green-200" },
  { value: "sage", label: "Sage", className: "bg-green-200" },
  
  // Reds, oranges & browns
  { value: "orange", label: "Orange", className: "bg-orange-500" },
  { value: "coral", label: "Coral", className: "bg-orange-400" },
  { value: "maroon", label: "Maroon", className: "bg-red-800" },
  { value: "brown", label: "Brown", className: "bg-amber-800" },
  { value: "crimson", label: "Crimson", className: "bg-red-700" },
  { value: "burgundy", label: "Burgundy", className: "bg-red-900" },
  { value: "brick", label: "Brick", className: "bg-red-600" },
  { value: "sienna", label: "Sienna", className: "bg-amber-700" },
  { value: "ochre", label: "Ochre", className: "bg-yellow-600" },
  { value: "gold", label: "Gold", className: "bg-yellow-400" },
  { value: "bronze", label: "Bronze", className: "bg-amber-600" },
  
  // Purples & pinks
  { value: "purple", label: "Purple", className: "bg-purple-600" },
  { value: "violet", label: "Violet", className: "bg-violet-600" },
  { value: "indigo", label: "Indigo", className: "bg-indigo-600" },
  { value: "lavender", label: "Lavender", className: "bg-purple-300" },
  { value: "fuchsia", label: "Fuchsia", className: "bg-fuchsia-500" },
  { value: "magenta", label: "Magenta", className: "bg-pink-600" },
  { value: "rose", label: "Rose", className: "bg-rose-500" },
  { value: "pink", label: "Pink", className: "bg-pink-500" },
  { value: "plum", label: "Plum", className: "bg-purple-800" },
  { value: "mauve", label: "Mauve", className: "bg-purple-400" },
  
  // Grays
  { value: "slate", label: "Slate", className: "bg-slate-500" },
  { value: "silver", label: "Silver", className: "bg-gray-400" },
  { value: "charcoal", label: "Charcoal", className: "bg-gray-700" },
];

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
        color: defaultValues.color || "default",
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

  // Helper function to get color circle style
  const getColorStyle = (colorValue: string) => {
    const color = colorOptions.find(c => c.value === colorValue);
    return color ? color.className : "bg-primary";
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem className="flex-shrink-0">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon" 
                      className="w-8 h-8 rounded-full p-0 border-2 border-muted"
                    >
                      <Circle className={`h-5 w-5 ${getColorStyle(field.value)}`} />
                      <span className="sr-only">Toggle color picker</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-3" align="start">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Select action color</h4>
                      <div className="grid grid-cols-8 gap-2">
                        {colorOptions.map((color) => (
                          <Button
                            key={color.value}
                            type="button"
                            variant={field.value === color.value ? "default" : "outline"}
                            size="icon"
                            className="w-6 h-6 rounded-full p-0"
                            onClick={() => field.onChange(color.value)}
                            title={color.label}
                          >
                            <Circle className={`h-4 w-4 ${color.className}`} />
                            <span className="sr-only">{color.label}</span>
                          </Button>
                        ))}
                      </div>
                      <div className="pt-2">
                        <p className="text-xs text-muted-foreground">
                          Selected: {colorOptions.find(c => c.value === field.value)?.label}
                        </p>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input placeholder="Enter action name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
