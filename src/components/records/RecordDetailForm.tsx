
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { RecordField } from './RecordField';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useObjectFields } from '@/hooks/useObjectFields';
import { useRecordDetail } from '@/hooks/useRecordDetail';
import { ObjectField } from '@/types/ObjectFieldTypes';
import { useObjectRecords } from '@/hooks/useObjectRecords';

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
  isEditing
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
  
  // Make sure to cast the fields to the proper ObjectField type
  const fields = (providedFields || fetchedFields || []) as ObjectField[];
  const record = providedRecord || fetchedRecord;
  const isLoading = shouldFetchData && (isLoadingFields || isLoadingRecord);
  
  // Determines if we're in edit mode based on either prop
  const actualEditMode = isEditMode || isEditing || false;
  
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
      methods.setValue(fieldName, value);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      setIsSaving(true);
      
      // If we're using our own state, use that instead of the form data
      const dataToSubmit = onFieldChange ? editedValues : formValues;
      
      console.log("Submitting record data:", dataToSubmit);
      
      // Update the record using the useObjectRecords hook
      await updateRecord.mutateAsync({
        id: recordId,
        field_values: dataToSubmit
      });
      
      toast.success("Record updated successfully");
      
      if (onSave && record) {
        onSave({
          ...record,
          field_values: { ...record.field_values, ...dataToSubmit }
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
    <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4 p-4">
      {fields && fields.map((field) => (
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
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      )}
    </form>
  );
}
