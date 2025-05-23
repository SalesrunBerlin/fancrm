
import React, { useEffect } from 'react';
import { ObjectField } from '@/types/ObjectFieldTypes';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm, Controller } from 'react-hook-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFieldPicklistValues } from '@/hooks/useFieldPicklistValues';
import { Loader2, X } from 'lucide-react';
import { LookupField } from './LookupField';
import { LookupValueDisplay } from './LookupValueDisplay';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { DatePickerField } from '@/components/ui/date-picker-field';

interface RecordFieldProps {
  field: ObjectField;
  value?: any;
  onChange?: (value: any) => void;
  register?: any;
  readOnly?: boolean;
  form?: ReturnType<typeof useForm>;
  onCustomChange?: (value: any) => void;
}

export function RecordField({ 
  field, 
  value, 
  onChange,
  register,
  readOnly = false,
  form,
  onCustomChange
}: RecordFieldProps) {
  const { picklistValues, isLoading: loadingPicklist } = useFieldPicklistValues(
    field.data_type === 'picklist' ? field.id : ''
  );
  
  // Determine which onChange handler to use
  const handleFieldChange = (newValue: any) => {
    console.log(`RecordField handleFieldChange - ${field.name}: `, newValue);
    
    // First priority: custom onChange handler provided by parent
    if (onCustomChange) {
      onCustomChange(newValue);
      return;
    }
    
    // Second priority: standard onChange handler
    if (onChange) {
      onChange(newValue);
      return;
    }
    
    // Third priority: if form is provided, set the value in the form
    if (form) {
      form.setValue(field.api_name, newValue, { 
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true 
      });
    }
  };

  // Debug output to monitor form values
  useEffect(() => {
    if (form) {
      const watchedValue = form.watch(field.api_name);
      console.log(`Field ${field.name} (${field.api_name}): watched value =`, watchedValue);
    }
  }, [form, field.api_name, field.name]);

  // Handle input field changes (text, number, email, etc.)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    handleFieldChange(e.target.value);
  };

  // Handle checkbox changes
  const handleCheckboxChange = (checked: boolean) => {
    handleFieldChange(checked);
  };

  // Handle select changes
  const handleSelectChange = (value: string) => {
    handleFieldChange(value);
  };

  // Handle rich text changes
  const handleRichTextChange = (value: string) => {
    handleFieldChange(value);
  };

  // Handle date changes
  const handleDateChange = (value: string | null) => {
    handleFieldChange(value);
  };

  // Clear picklist value
  const clearPicklistValue = () => {
    handleFieldChange(null);
  };
  
  // Debug logging to help track value updates
  useEffect(() => {
    console.log(`RecordField ${field.name} (${field.api_name}) initial value:`, value);
  }, [field.name, field.api_name]);

  // Register the field with react-hook-form if register is provided and form is not
  const registerField = register && !form ? register(field.api_name) : {};
  
  // Get current field value from form if available, otherwise use passed value
  const currentValue = form?.getValues?.(field.api_name) !== undefined ? 
                      form.getValues(field.api_name) : 
                      value;

  const renderField = () => {
    switch (field.data_type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'url':
        if (form) {
          return (
            <Controller
              name={field.api_name}
              control={form.control}
              render={({ field: controllerField }) => (
                <Input
                  type={field.data_type === 'email' ? 'email' : 'text'}
                  value={controllerField.value || ''}
                  onChange={(e) => controllerField.onChange(e.target.value)}
                  readOnly={readOnly}
                  disabled={readOnly}
                />
              )}
            />
          );
        }
        return (
          <Input
            type={field.data_type === 'email' ? 'email' : 'text'}
            id={field.api_name}
            value={currentValue || ''}
            onChange={handleInputChange}
            readOnly={readOnly}
            disabled={readOnly}
            {...registerField}
          />
        );
      case 'textarea':
        if (form) {
          return (
            <Controller
              name={field.api_name}
              control={form.control}
              render={({ field: controllerField }) => (
                <Textarea
                  value={controllerField.value || ''}
                  onChange={(e) => controllerField.onChange(e.target.value)}
                  className="min-h-[100px]"
                  readOnly={readOnly}
                  disabled={readOnly}
                />
              )}
            />
          );
        }
        return (
          <Textarea
            id={field.api_name}
            value={currentValue || ''}
            onChange={handleInputChange}
            readOnly={readOnly}
            disabled={readOnly}
            className="min-h-[100px]"
            {...registerField}
          />
        );
      case 'rich_text':
      case 'long_text':
        if (readOnly) {
          return (
            <div 
              className="p-3 border rounded-md bg-background text-black dark:text-white" 
              dangerouslySetInnerHTML={{ __html: currentValue || '' }}
            />
          );
        }
        if (form) {
          return (
            <Controller
              name={field.api_name}
              control={form.control}
              render={({ field: controllerField }) => (
                <RichTextEditor
                  value={controllerField.value || ''}
                  onChange={(content) => {
                    controllerField.onChange(content);
                  }}
                  placeholder={`Enter ${field.name}...`}
                />
              )}
            />
          );
        }
        return (
          <RichTextEditor
            value={currentValue || ''}
            onChange={handleRichTextChange}
            placeholder={`Enter ${field.name}...`}
          />
        );
      case 'number':
        if (form) {
          return (
            <Controller
              name={field.api_name}
              control={form.control}
              render={({ field: controllerField }) => (
                <Input
                  type="number"
                  value={controllerField.value || ''}
                  onChange={(e) => {
                    const numValue = e.target.value ? Number(e.target.value) : null;
                    controllerField.onChange(numValue);
                  }}
                  readOnly={readOnly}
                  disabled={readOnly}
                />
              )}
            />
          );
        }
        return (
          <Input
            type="number"
            id={field.api_name}
            value={currentValue || ''}
            onChange={(e) => {
              const numValue = e.target.value ? Number(e.target.value) : null;
              handleFieldChange(numValue);
            }}
            readOnly={readOnly}
            disabled={readOnly}
            {...registerField}
          />
        );
      case 'picklist':
        if (readOnly) {
          const selectedOption = picklistValues?.find(option => option.value === currentValue);
          return <div className="py-2 text-black dark:text-white">{selectedOption?.label || currentValue || "-"}</div>;
        }
        
        if (loadingPicklist) {
          return <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading options...</span>
          </div>;
        }
        
        if (form) {
          return (
            <div className="relative">
              <Controller
                name={field.api_name}
                control={form.control}
                render={({ field: controllerField }) => (
                  <>
                    <Select 
                      value={controllerField.value || ""}
                      onValueChange={(val) => {
                        console.log(`Picklist changed to: ${val}`);
                        controllerField.onChange(val);
                      }}
                      disabled={readOnly}
                    >
                      <SelectTrigger className="bg-white dark:bg-slate-900">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-900">
                        {picklistValues?.map(option => (
                          <SelectItem key={option.id} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {controllerField.value && !readOnly && (
                      <Button 
                        type="button"
                        variant="ghost" 
                        size="icon" 
                        className="absolute right-0 top-0 h-full"
                        onClick={() => controllerField.onChange(null)}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Clear selection</span>
                      </Button>
                    )}
                  </>
                )}
              />
            </div>
          );
        }
        
        return (
          <div className="relative">
            <Select 
              value={currentValue || ""}
              onValueChange={handleSelectChange}
              disabled={readOnly}
            >
              <SelectTrigger className="bg-white dark:bg-slate-900">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-900">
                {picklistValues?.map(option => (
                  <SelectItem key={option.id} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentValue && !readOnly && (
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
        if (form) {
          return (
            <div className="flex items-center space-x-2">
              <Controller
                name={field.api_name}
                control={form.control}
                render={({ field: controllerField }) => (
                  <Checkbox
                    id={field.api_name}
                    checked={controllerField.value === true}
                    onCheckedChange={controllerField.onChange}
                    disabled={readOnly}
                  />
                )}
              />
            </div>
          );
        }
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.api_name}
              checked={currentValue === true}
              onCheckedChange={handleCheckboxChange}
              disabled={readOnly}
              {...registerField}
            />
          </div>
        );
      case 'date':
        if (readOnly) {
          return <div className="py-2 text-black dark:text-white">{currentValue ? new Date(currentValue).toLocaleDateString() : "-"}</div>;
        }
        if (form) {
          return (
            <Controller
              name={field.api_name}
              control={form.control}
              render={({ field: controllerField }) => (
                <DatePickerField
                  value={controllerField.value}
                  onChange={(date) => controllerField.onChange(date)}
                  disabled={readOnly}
                  isDateTime={false}
                />
              )}
            />
          );
        }
        return (
          <DatePickerField
            value={currentValue}
            onChange={handleDateChange}
            disabled={readOnly}
            isDateTime={false}
          />
        );
      case 'datetime':
        if (readOnly) {
          return <div className="py-2 text-black dark:text-white">
            {currentValue ? new Date(currentValue).toLocaleString() : "-"}
          </div>;
        }
        if (form) {
          return (
            <Controller
              name={field.api_name}
              control={form.control}
              render={({ field: controllerField }) => (
                <DatePickerField
                  value={controllerField.value}
                  onChange={(date) => controllerField.onChange(date)}
                  disabled={readOnly}
                  isDateTime={true}
                />
              )}
            />
          );
        }
        return (
          <DatePickerField
            value={currentValue}
            onChange={handleDateChange}
            disabled={readOnly}
            isDateTime={true}
          />
        );
      case 'lookup':
        if (readOnly) {
          return (
            <div className="py-2 text-black dark:text-white">
              {currentValue ? (
                <LookupValueDisplay 
                  value={currentValue} 
                  fieldOptions={field.options || {
                    target_object_type_id: ''
                  }}
                />
              ) : "-"}
            </div>
          );
        }
        
        if (form) {
          return (
            <Controller
              name={field.api_name}
              control={form.control}
              render={({ field: controllerField }) => (
                <LookupField
                  value={controllerField.value}
                  onChange={controllerField.onChange}
                  targetObjectTypeId={field.options?.target_object_type_id || ''}
                  disabled={readOnly}
                />
              )}
            />
          );
        }
        
        return (
          <LookupField
            value={currentValue}
            onChange={handleFieldChange}
            targetObjectTypeId={field.options?.target_object_type_id || ''}
            disabled={readOnly}
          />
        );
      default:
        if (form) {
          return (
            <Controller
              name={field.api_name}
              control={form.control}
              render={({ field: controllerField }) => (
                <Input
                  type="text"
                  value={controllerField.value || ''}
                  onChange={(e) => controllerField.onChange(e.target.value)}
                  readOnly={readOnly}
                  disabled={readOnly}
                />
              )}
            />
          );
        }
        return (
          <Input
            type="text"
            id={field.api_name}
            value={currentValue || ''}
            onChange={handleInputChange}
            readOnly={readOnly}
            disabled={readOnly}
            {...registerField}
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
