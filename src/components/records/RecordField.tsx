
import { useState } from "react";
import { useFormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { ControllerRenderProps, UseFormReturn } from "react-hook-form";
import { ObjectField } from "@/hooks/useObjectTypes";
import { LookupField } from "./LookupField";
import { useFieldPicklistValues } from "@/hooks/useFieldPicklistValues";
import { Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PicklistSuggestionDialog } from "@/components/settings/PicklistSuggestionDialog";
import { useParams } from "react-router-dom";

interface RecordFieldProps {
  field: ObjectField;
  form: UseFormReturn<any>;
}

export function RecordField({ field, form }: RecordFieldProps) {
  const { name } = useFormField();
  const value = form.watch(field.api_name);
  const { picklistValues, isLoading: loadingPicklist } = useFieldPicklistValues(field.id);
  const [showSuggestionDialog, setShowSuggestionDialog] = useState(false);
  const { objectTypeId } = useParams<{ objectTypeId: string }>();

  const renderField = () => {
    switch (field.data_type) {
      case "text":
        return (
          <Input
            type="text"
            placeholder={field.name}
            {...form.register(field.api_name, { required: field.is_required })}
          />
        );
      case "textarea":
        return (
          <Textarea
            placeholder={field.name}
            {...form.register(field.api_name, { required: field.is_required })}
          />
        );
      case "number":
        return (
          <Input
            type="number"
            placeholder={field.name}
            {...form.register(field.api_name, { required: field.is_required })}
          />
        );
      case "email":
        return (
          <Input
            type="email"
            placeholder={field.name}
            {...form.register(field.api_name, { required: field.is_required })}
          />
        );
      case "boolean":
        return (
          <Select
            value={value === true ? "true" : value === false ? "false" : ""}
            onValueChange={(value) => form.setValue(field.api_name, value === "true", { shouldValidate: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.name} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">True</SelectItem>
              <SelectItem value="false">False</SelectItem>
            </SelectContent>
          </Select>
        );
      case "date":
        return (
          <Input
            type="date"
            placeholder={field.name}
            {...form.register(field.api_name, { required: field.is_required })}
          />
        );
      case "picklist":
        if (loadingPicklist) {
          return <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading options...</span>
          </div>;
        }
        
        if (!picklistValues || picklistValues.length === 0) {
          return <div className="flex gap-2 items-center">
            <Input 
              type="text"
              placeholder={`No options available for ${field.name}`}
              disabled
            />
            <Button 
              variant="outline" 
              size="icon"
              title="Suggest values from existing records"
              onClick={() => setShowSuggestionDialog(true)}
            >
              <Star className="h-4 w-4" />
            </Button>
          </div>;
        }
        
        return (
          <div className="flex gap-2 items-center">
            <Select
              value={value || ""}
              onValueChange={(val) => form.setValue(field.api_name, val, { shouldValidate: true })}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={`Select ${field.name.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {picklistValues.map(option => (
                  <SelectItem key={option.id} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="icon"
              title="Suggest values from existing records"
              onClick={() => setShowSuggestionDialog(true)}
            >
              <Star className="h-4 w-4" />
            </Button>
          </div>
        );
      case "lookup":
        const fieldOptions = field.options as { target_object_type_id?: string } | undefined;
        const targetObjectTypeId = fieldOptions?.target_object_type_id;
        
        if (!targetObjectTypeId) {
          console.error(`Lookup field ${field.name} missing target object type id`);
          return null;
        }
        
        return (
          <LookupField
            value={value}
            onChange={(newValue) => {
              form.setValue(field.api_name, newValue, { shouldValidate: true });
            }}
            targetObjectTypeId={targetObjectTypeId}
            disabled={form.formState.isSubmitting}
          />
        );
        
      default:
        return (
          <Input
            type="text"
            placeholder={field.name}
            {...form.register(field.api_name, { required: field.is_required })}
          />
        );
    }
  };

  return (
    <FormItem>
      <FormLabel>{field.name}</FormLabel>
      <FormControl>
        {renderField()}
      </FormControl>
      {field.options && typeof field.options === 'object' && 'description' in field.options && (
        <FormDescription>{String(field.options.description)}</FormDescription>
      )}
      <FormMessage />
      
      {/* Suggestion Dialog */}
      {field.data_type === "picklist" && showSuggestionDialog && objectTypeId && (
        <PicklistSuggestionDialog
          isOpen={showSuggestionDialog}
          onClose={() => setShowSuggestionDialog(false)}
          objectTypeId={objectTypeId}
          fieldId={field.id}
        />
      )}
    </FormItem>
  );
}
