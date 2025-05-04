
import { useEffect, useState } from 'react';
import { ObjectField } from '@/hooks/useObjectTypes';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface FieldSelectionListProps {
  fields: ObjectField[];
  selectedFields: string[];
  onChange: (selectedFields: string[]) => void;
  defaultSelectAll?: boolean;
}

export function FieldSelectionList({
  fields,
  selectedFields,
  onChange,
  defaultSelectAll = true
}: FieldSelectionListProps) {
  const [initialized, setInitialized] = useState(false);

  // Initialize with all fields selected if requested
  useEffect(() => {
    if (!initialized && defaultSelectAll && fields.length > 0 && selectedFields.length === 0) {
      const allFieldApiNames = fields.map(field => field.api_name);
      onChange(allFieldApiNames);
      setInitialized(true);
    }
  }, [fields, selectedFields, onChange, defaultSelectAll, initialized]);

  const toggleField = (fieldApiName: string, isChecked: boolean) => {
    const newSelectedFields = isChecked
      ? [...selectedFields, fieldApiName]
      : selectedFields.filter(name => name !== fieldApiName);
    
    onChange(newSelectedFields);
  };
  
  const toggleAllFields = (isChecked: boolean) => {
    if (isChecked) {
      // Select all fields
      const allFieldApiNames = fields.map(field => field.api_name);
      onChange(allFieldApiNames);
    } else {
      // Clear selection
      onChange([]);
    }
  };
  
  const areAllSelected = fields.length > 0 && selectedFields.length === fields.length;

  return (
    <div className="space-y-4">
      <div className="pb-2 border-b">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="select-all-fields"
            checked={areAllSelected}
            onCheckedChange={toggleAllFields}
          />
          <Label htmlFor="select-all-fields" className="font-medium">
            Select All Fields
          </Label>
        </div>
      </div>
      
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
        {fields.map(field => (
          <div key={field.id} className="flex items-center space-x-2">
            <Checkbox 
              id={`field-${field.id}`}
              checked={selectedFields.includes(field.api_name)}
              onCheckedChange={(isChecked) => toggleField(field.api_name, !!isChecked)}
              disabled={field.is_system && field.api_name === 'id'} // Prevent unselecting id field
            />
            <Label htmlFor={`field-${field.id}`} className="flex-1">
              {field.name}
              {field.is_system && (
                <span className="ml-2 text-xs text-muted-foreground">(System)</span>
              )}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}
