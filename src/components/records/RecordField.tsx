
import React from 'react';
import { ObjectField } from '@/types/ObjectFieldTypes';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';

interface RecordFieldProps {
  field: ObjectField;
  value?: any;
  onChange?: (value: any) => void;
  register?: any;
  readOnly?: boolean;
}

export function RecordField({ 
  field, 
  value, 
  onChange,
  register,
  readOnly = false 
}: RecordFieldProps) {
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
            {...(register && register(field.api_name))}
          />
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
            {...(register && register(field.api_name))}
          />
        );
      // Add more field types as needed
      default:
        return (
          <Input
            type="text"
            id={field.api_name}
            value={value || ''}
            onChange={handleChange}
            readOnly={readOnly}
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
