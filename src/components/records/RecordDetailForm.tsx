
import { ObjectField } from "@/hooks/useObjectTypes";
import { ObjectRecord } from "@/hooks/useObjectRecords";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { LookupField } from "./LookupField";
import { LookupValueDisplay } from "./LookupValueDisplay";

interface RecordDetailFormProps {
  record: ObjectRecord;
  fields: ObjectField[];
  onFieldChange: (fieldName: string, value: any) => void;
  editedValues: Record<string, any>;
  isEditing?: boolean;
}

export function RecordDetailForm({ record, fields, onFieldChange, editedValues, isEditing = false }: RecordDetailFormProps) {
  // Get field value, prioritizing edited values
  const getFieldValue = (fieldApiName: string) => {
    if (fieldApiName in editedValues) {
      return editedValues[fieldApiName];
    }
    return record.field_values?.[fieldApiName] || "";
  };

  const renderField = (field: ObjectField) => {
    const value = getFieldValue(field.api_name);
    
    if (isEditing) {
      switch (field.data_type) {
        case "textarea":
          return (
            <Textarea
              id={field.api_name}
              value={value}
              onChange={(e) => onFieldChange(field.api_name, e.target.value)}
              required={field.is_required}
            />
          );
        case "picklist":
          return (
            <Select 
              value={value} 
              onValueChange={(val) => onFieldChange(field.api_name, val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="option1">Option 1</SelectItem>
                <SelectItem value="option2">Option 2</SelectItem>
                <SelectItem value="option3">Option 3</SelectItem>
              </SelectContent>
            </Select>
          );
        case "boolean":
          return (
            <Select 
              value={String(!!value)} 
              onValueChange={(val) => onFieldChange(field.api_name, val === "true")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
          );
        case "date":
          return (
            <Input
              type="date"
              id={field.api_name}
              value={value}
              onChange={(e) => onFieldChange(field.api_name, e.target.value)}
              required={field.is_required}
            />
          );
        case "number":
        case "currency":
          return (
            <Input
              type="number"
              id={field.api_name}
              value={value}
              onChange={(e) => onFieldChange(field.api_name, e.target.value ? Number(e.target.value) : null)}
              step={field.data_type === "currency" ? "0.01" : "1"}
              required={field.is_required}
            />
          );
        case "email":
          return (
            <Input
              type="email"
              id={field.api_name}
              value={value}
              onChange={(e) => onFieldChange(field.api_name, e.target.value)}
              required={field.is_required}
            />
          );
        case "url":
          return (
            <Input
              type="url"
              id={field.api_name}
              value={value}
              onChange={(e) => onFieldChange(field.api_name, e.target.value)}
              required={field.is_required}
            />
          );
        case "lookup":
          if (!field.options?.target_object_type_id) return null;
          return (
            <LookupField
              value={value}
              onChange={(newValue) => onFieldChange(field.api_name, newValue)}
              targetObjectTypeId={field.options.target_object_type_id}
              disabled={false}
            />
          );
        default:
          return (
            <Input
              type="text"
              id={field.api_name}
              value={value}
              onChange={(e) => onFieldChange(field.api_name, e.target.value)}
              required={field.is_required}
            />
          );
      }
    } else {
      // Non-edit mode for all fields
      if (field.data_type === 'lookup' && field.options?.target_object_type_id) {
        return (
          <div className="pt-1">
            <LookupValueDisplay 
              value={value} 
              fieldOptions={field.options} 
            />
          </div>
        );
      }
      return <p className="pt-1">{value || "-"}</p>;
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      {fields.map(field => (
        <div key={field.api_name} className="space-y-2">
          <Label htmlFor={field.api_name}>
            {field.name}
            {field.is_required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {renderField(field)}
        </div>
      ))}
    </div>
  );
}
