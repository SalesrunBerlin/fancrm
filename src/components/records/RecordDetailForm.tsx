import { ObjectField } from "@/hooks/useObjectTypes";
import { ObjectRecord } from "@/hooks/useObjectRecords";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { LookupField } from "./LookupField";
import { LookupValueDisplay } from "./LookupValueDisplay";
import { useFieldPicklistValues } from "@/hooks/useFieldPicklistValues";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";

interface RecordDetailFormProps {
  record: ObjectRecord;
  fields: ObjectField[];
  onFieldChange: (fieldName: string, value: any) => void;
  editedValues: Record<string, any>;
  isEditing?: boolean;
  maxHeight?: string;
  objectTypeId?: string;
  onSave?: (values: Record<string, any>) => void;
  readonly?: boolean;
  showCard?: boolean;
}

export function RecordDetailForm({ 
  record, 
  fields, 
  onFieldChange, 
  editedValues, 
  isEditing = false,
  maxHeight,
  objectTypeId,
  onSave,
  readonly = false,
  showCard = true 
}: RecordDetailFormProps) {
  const getFieldValue = (fieldApiName: string) => {
    // First check in editedValues
    if (fieldApiName in editedValues) {
      return editedValues[fieldApiName];
    }
    
    // Next check in record.fieldValues (new property name)
    if (record.fieldValues && fieldApiName in record.fieldValues) {
      return record.fieldValues[fieldApiName];
    }
    
    // Fallback to record.field_values (legacy property name)
    if (record.field_values && fieldApiName in record.field_values) {
      return record.field_values[fieldApiName];
    }
    
    // If nothing found, return empty string
    return "";
  };

  console.log("Record in RecordDetailForm:", record);
  console.log("Fields in RecordDetailForm:", fields);
  console.log("Edited values:", editedValues);

  const renderField = (field: ObjectField) => {
    const value = getFieldValue(field.api_name);
    console.log(`Field: ${field.name}, API Name: ${field.api_name}, Value:`, value);
    
    const { picklistValues } = useFieldPicklistValues(field.id);
    
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
                {picklistValues?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
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
          if (field.options && 'target_object_type_id' in field.options && field.options.target_object_type_id) {
            return (
              <LookupField
                value={value}
                onChange={(newValue) => onFieldChange(field.api_name, newValue)}
                targetObjectTypeId={field.options.target_object_type_id}
                disabled={false}
              />
            );
          }
          return null;
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
      if (field.data_type === 'lookup' && field.options && 'target_object_type_id' in field.options && field.options.target_object_type_id) {
        return (
          <div className="pt-1">
            <LookupValueDisplay 
              value={value} 
              fieldOptions={field.options as { target_object_type_id: string }}
            />
          </div>
        );
      } 
    
      // Special case for auto_number fields
      if (field.data_type === 'auto_number') {
        return <p className="pt-1 font-medium">{value || "-"}</p>;
      }
      
      return <p className="pt-1">{value || "-"}</p>;
    }
  };

  // If there are no fields defined, show a message and a link to create fields
  if (fields.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-6 space-y-4">
          <p className="text-center text-muted-foreground">No fields defined for this object type.</p>
          
          {objectTypeId && (
            <div className="flex justify-center">
              <Button 
                variant="outline" 
                asChild
                className="border-dashed"
              >
                <Link to={`/settings/objects/${objectTypeId}/fields/new`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add your first field
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const content = (
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

  useEffect(() => {
    if (record && fields.length > 0) {
      // Handle both field_values and fieldValues properties for compatibility
      const recordValues = record.field_values || record.fieldValues || {};
      let initialValues: Record<string, any> = {};
      
      for (const field of fields) {
        const value = getFieldValue(field.api_name);
        initialValues[field.api_name] = value;
      }
      
      onFieldChange("", initialValues);
    }
  }, [record, fields]);

  return maxHeight ? (
    <ScrollArea className="w-full" style={{ maxHeight }}>
      {content}
    </ScrollArea>
  ) : content;
}
