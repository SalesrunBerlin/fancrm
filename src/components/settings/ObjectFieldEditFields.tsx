
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

interface ObjectFieldEditFieldsProps {
  form: UseFormReturn<FieldEditFormData>;
  field: ObjectField;
  targetFields?: ObjectField[];
}

export function ObjectFieldEditFields({ form, field, targetFields }: ObjectFieldEditFieldsProps) {
  const { objectTypes } = useObjectTypes();
  
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
          <h3 className="text-sm font-medium mb-2">Picklist Values</h3>
          <PicklistValuesManager fieldId={field.id} />
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
                <Select
                  value={displayField.value || ""}
                  onValueChange={displayField.onChange}
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
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}
    </div>
  );
}
