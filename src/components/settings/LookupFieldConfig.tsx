
import { useState, useEffect } from "react";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useObjectFields } from "@/hooks/useObjectFields";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface LookupFieldConfigProps {
  value: {
    target_object_type_id?: string;
    display_field_api_name?: string;
  };
  onChange: (value: any) => void;
}

export function LookupFieldConfig({ value, onChange }: LookupFieldConfigProps) {
  const { objectTypes } = useObjectTypes();
  const { fields } = useObjectFields(value.target_object_type_id);
  const [targetObjectId, setTargetObjectId] = useState<string>(value.target_object_type_id || '');
  const [displayField, setDisplayField] = useState<string>(value.display_field_api_name || '');

  useEffect(() => {
    onChange({
      ...value,
      target_object_type_id: targetObjectId,
      display_field_api_name: displayField
    });
  }, [targetObjectId, displayField]);

  const handleObjectChange = (selectedObjectId: string) => {
    setTargetObjectId(selectedObjectId);
    setDisplayField(''); // Reset display field when object changes
  };

  const handleFieldChange = (selectedFieldApiName: string) => {
    setDisplayField(selectedFieldApiName);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Target Object</Label>
        <Select value={targetObjectId} onValueChange={handleObjectChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select an object" />
          </SelectTrigger>
          <SelectContent>
            {objectTypes?.map(type => (
              <SelectItem key={type.id} value={type.id}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {targetObjectId && (
        <div className="space-y-2">
          <Label>Display Field</Label>
          <Select value={displayField} onValueChange={handleFieldChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a field to display" />
            </SelectTrigger>
            <SelectContent>
              {fields?.map(field => (
                <SelectItem key={field.id} value={field.api_name}>
                  {field.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
