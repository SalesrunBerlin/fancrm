import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { RecordField } from './RecordField';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useObjectFields } from '@/hooks/useObjectFields';
import { useRecordDetail } from '@/hooks/useRecordDetail';
import { ObjectField } from '@/types/ObjectFieldTypes';
import { useObjectRecords } from '@/hooks/useObjectRecords';
import { useObjectLayout } from '@/hooks/useObjectLayout';

interface RecordDetailFormProps {
  objectTypeId: string;
  recordId: string;
  onSave?: (record: any) => void;
  onCancel?: () => void;
  isEditMode?: boolean;
  record?: any;
  fields?: ObjectField[];
  onFieldChange?: (fieldName: string, value: any) => void;
  editedValues?: Record<string, any>;
  isEditing?: boolean;
  selectedLayoutId?: string;
  hideEmptyFields?: boolean;
}

export function RecordDetailForm({
  objectTypeId,
  recordId,
  onSave,
  onCancel,
  isEditMode = false,
  record: providedRecord,
  fields: providedFields,
  onFieldChange,
  editedValues = {},
  isEditing,
  selectedLayoutId,
  hideEmptyFields = false
}: RecordDetailFormProps) {
  const shouldFetchData = !providedRecord || !providedFields;
  const { fields: fetchedFields, isLoading: isLoadingFields } = useObjectFields(
    shouldFetchData ? objectTypeId : undefined
  );
  const { record: fetchedRecord, isLoading: isLoadingRecord } = useRecordDetail(
    shouldFetchData ? objectTypeId : undefined,
    shouldFetchData ? recordId : undefined
  );
  
  const [isSaving, setIsSaving] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const methods = useForm();
  const { updateRecord } = useObjectRecords(objectTypeId);
  
  // Get layout configuration for this object type
  const { applyLayout, isLoading: isLoadingLayout } = useObjectLayout(objectTypeId, selectedLayoutId);
  
  // Make sure to cast the fields to the proper ObjectField type
  const unsortedFields = (providedFields || fetchedFields || []) as ObjectField[];
  
  // Apply layout configuration to the fields
  const fields = applyLayout(unsortedFields);
  
  const record = providedRecord || fetchedRecord;
  const isLoading = shouldFetchData && (isLoadingFields || isLoadingRecord || isLoadingLayout);
  
  // Determines if we're in edit mode based on either prop
  const actualEditMode = isEditMode || isEditing || false;

  // Filter out empty fields if hideEmptyFields is true and we're not in edit mode
  const displayFields = useMemo(() => {
    if (!hideEmptyFields || actualEditMode || !record || !record.field_values) {
      return fields;
    }
    
    return fields.filter(field => {
      const fieldValue = record.field_values[field.api_name];
      // Keep fields that have a non-null, non-empty value
      return fieldValue !== null && 
             fieldValue !== undefined && 
             fieldValue !== '' &&
             fieldValue !== false;
    });
  }, [fields, hideEmptyFields, actualEditMode, record]);
  
  useEffect(() => {
    // Reset form when record data is loaded or edit mode changes
    if (record && record.field_values) {
      const defaultValues = {}; 
      
      // Map record field values to form values
      Object.keys(record.field_values).forEach(fieldKey => {
        defaultValues[fieldKey] = record.field_values[fieldKey];
      });
      
      console.log("Setting form values from record:", defaultValues);
      setFormValues(defaultValues);
      methods.reset(defaultValues);
    }
  }, [record, methods, actualEditMode]);

  // Handle field change
  const handleFieldChange = (fieldName: string, value: any) => {
    console.log(`Field changed: ${fieldName} => `, value);
    
    if (onFieldChange) {
      onFieldChange(fieldName, value);
    } else {
      setFormValues(prev => {
        const newValues = {
          ...prev,
          [fieldName]: value
        };
        console.log("Updated form values:", newValues);
        return newValues;
      });
      
      // Also update the form values through react-hook-form
      methods.setValue(fieldName, value, {
        shouldValidate: true, 
        shouldDirty: true,
        shouldTouch: true
      });
    }
  };

  const onSubmit = async () => {
    try {
      setIsSaving(true);
      
      // If we're using our own state, use that instead of the form data
      const dataToSubmit = onFieldChange ? editedValues : formValues;
      
      console.log("Submitting record data:", dataToSubmit);
      
      // Filter out undefined values
      const cleanedData = Object.entries(dataToSubmit).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);
      
      console.log("Cleaned data for submission:", cleanedData);
      
      // Update the record using the useObjectRecords hook
      const result = await updateRecord.mutateAsync({
        id: recordId,
        field_values: cleanedData
      });
      
      toast.success("Record updated successfully");
      
      if (onSave) {
        onSave({
          ...record,
          field_values: { ...record.field_values, ...cleanedData }
        });
      }
    } catch (error) {
      console.error('Error updating record:', error);
      toast.error("Failed to update the record. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading state while fetching data
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {displayFields && displayFields.map((field) => (
        <RecordField
          key={field.id}
          field={field}
          value={editedValues?.[field.api_name] !== undefined 
            ? editedValues[field.api_name] 
            : formValues[field.api_name]}
          onCustomChange={(value) => handleFieldChange(field.api_name, value)}
          readOnly={!actualEditMode}
          form={methods}
        />
      ))}
      
      {actualEditMode && (
        <div className="flex justify-end space-x-2 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="button" onClick={onSubmit} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
}
