
import { ObjectField } from "@/hooks/useObjectTypes";
import { Input } from "@/components/ui/input";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { FieldEditFormData } from "./schemas/fieldEditSchema";
import { PicklistValuesManager } from "./PicklistValuesManager";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { PicklistSuggestionsDialog } from "./PicklistSuggestionsDialog";

interface ObjectFieldEditFieldsProps {
  form: UseFormReturn<FieldEditFormData>;
  field: ObjectField;
  targetFields?: ObjectField[];
}

export function ObjectFieldEditFields({ form, field, targetFields }: ObjectFieldEditFieldsProps) {
  const { objectTypes } = useObjectTypes();
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Ensure target_object_type_id is set in form when editing a lookup field
  useEffect(() => {
    if (field.data_type === "lookup" && field.options?.target_object_type_id && !form.getValues("target_object_type_id")) {
      form.setValue("target_object_type_id", field.options.target_object_type_id);
    }
  }, [field, form]);
  
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="name"
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel>Field Name</FormLabel>
            <FormControl>
              <Input {...formField} disabled={field.is_system} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="api_name"
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel>API Name</FormLabel>
            <FormControl>
              <Input {...formField} disabled />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {field.data_type === "picklist" && (
        <div className="mt-4 border-t pt-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium">Picklist Values</h3>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowSuggestions(true)}
              className="flex items-center gap-1 text-xs"
            >
              <Star className="h-3.5 w-3.5" />
              Suggest Values
            </Button>
          </div>
          <PicklistValuesManager fieldId={field.id} />
          
          {/* Suggestions dialog */}
          <PicklistSuggestionsDialog 
            isOpen={showSuggestions} 
            onClose={() => setShowSuggestions(false)} 
            objectTypeId={field.object_type_id}
            fieldId={field.id}
          />
        </div>
      )}

      {field.data_type === "lookup" && (
        <>
          <FormField
            control={form.control}
            name="target_object_type_id"
            render={({ field: targetField }) => (
              <FormItem>
                <FormLabel>Target Object</FormLabel>
                <FormControl>
                  <Select
                    value={targetField.value || ""}
                    onValueChange={targetField.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select target object" />
                    </SelectTrigger>
                    <SelectContent>
                      {objectTypes?.filter(t => t.id !== field.object_type_id).map((type) => (
                        <SelectItem
                          key={type.id}
                          value={type.id}
                        >
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="display_field_api_name"
            render={({ field: displayField }) => (
              <FormItem>
                <FormLabel>Display Field</FormLabel>
                <FormControl>
                  <Select
                    value={displayField.value || ""}
                    onValueChange={displayField.onChange}
                    disabled={!form.getValues("target_object_type_id")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select display field" />
                    </SelectTrigger>
                    <SelectContent>
                      {targetFields?.map((targetField) => (
                        <SelectItem
                          key={targetField.api_name}
                          value={targetField.api_name}
                        >
                          {targetField.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}
    </div>
  );
}
