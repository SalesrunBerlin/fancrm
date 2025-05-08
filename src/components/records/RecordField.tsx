
import React from 'react';
import { ObjectField } from '@/types/ObjectFieldTypes';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFieldPicklistValues } from '@/hooks/useFieldPicklistValues';
import { Loader2, X } from 'lucide-react';
import { LookupField } from './LookupField';
import { LookupValueDisplay } from './LookupValueDisplay';
import { Button } from '@/components/ui/button';

interface RecordFieldProps {
  field: ObjectField;
  value?: any;
  onChange?: (value: any) => void;
  register?: any;
  readOnly?: boolean;
  form?: ReturnType<typeof useForm>;
}

export function RecordField({ 
  field, 
  value, 
  onChange,
  register,
  readOnly = false,
  form
}: RecordFieldProps) {
  const { picklistValues, isLoading: loadingPicklist } = useFieldPicklistValues(
    field.data_type === 'picklist' ? field.id : ''
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    if (onChange) {
      onChange(checked);
    }
  };

  const handleSelectChange = (value: string) => {
    if (onChange) {
      onChange(value);
    }
  };

  const clearPicklistValue = () => {
    if (onChange) {
      onChange(null);
    }
  };

  const renderField = () => {
    switch (field.data_type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'url':
        return (
          <Input
            type={field.data_type === 'email' ? 'email' : 'text'}
            id={field.api_name}
            value={value || ''}
            onChange={handleChange}
            readOnly={readOnly}
            disabled={readOnly}
            {...(register && register(field.api_name))}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            id={field.api_name}
            value={value || ''}
            onChange={handleChange}
            readOnly={readOnly}
            disabled={readOnly}
            {...(register && register(field.api_name))}
          />
        );
      case 'picklist':
        if (readOnly) {
          const selectedOption = picklistValues?.find(option => option.value === value);
          return <div className="py-2">{selectedOption?.label || value || "-"}</div>;
        }
        
        if (loadingPicklist) {
          return <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading options...</span>
          </div>;
        }
        
        return (
          <div className="relative">
            <Select 
              value={value || ""}
              onValueChange={handleSelectChange}
              disabled={readOnly}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {picklistValues?.map(option => (
                  <SelectItem key={option.id} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {value && !readOnly && (
              <Button 
                type="button"
                variant="ghost" 
                size="icon" 
                className="absolute right-0 top-0 h-full"
                onClick={clearPicklistValue}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Clear selection</span>
              </Button>
            )}
          </div>
        );
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.api_name}
              checked={value === true}
              onCheckedChange={handleCheckboxChange}
              disabled={readOnly}
              {...(register && register(field.api_name))}
            />
          </div>
        );
      case 'date':
        return (
          <Input
            type="date"
            id={field.api_name}
            value={value || ''}
            onChange={handleChange}
            readOnly={readOnly}
            disabled={readOnly}
            {...(register && register(field.api_name))}
          />
        );
      case 'lookup':
        if (readOnly) {
          return (
            <div className="py-2">
              {value ? (
                <LookupValueDisplay 
                  value={value} 
                  fieldOptions={field.options || {
                    target_object_type_id: ''
                  }}
                />
              ) : "-"}
            </div>
          );
        }
        
        return (
          <LookupField
            value={value}
            onChange={onChange || (() => {})}
            targetObjectTypeId={field.options?.target_object_type_id || ''}
            disabled={readOnly}
          />
        );
      default:
        return (
          <Input
            type="text"
            id={field.api_name}
            value={value || ''}
            onChange={handleChange}
            readOnly={readOnly}
            disabled={readOnly}
            {...(register && register(field.api_name))}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={field.api_name} className="font-medium">
        {field.name} 
        {field.is_required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {renderField()}
    </div>
  );
}
