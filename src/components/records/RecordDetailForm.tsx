
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { RecordField } from './RecordField';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useObjectFields } from '@/hooks/useObjectFields';
import { useRecordDetail } from '@/hooks/useRecordDetail';
import { useRecordFields } from '@/hooks/useRecordFields';
import { ObjectField } from '@/types/ObjectFieldTypes';

interface RecordDetailFormProps {
  objectTypeId: string;
  recordId: string;
  onSave?: (record: any) => void;
  onCancel?: () => void;
  isEditMode?: boolean;
}

export function RecordDetailForm({
  objectTypeId,
  recordId,
  onSave,
  onCancel,
  isEditMode = false
}: RecordDetailFormProps) {
  const { toast } = useToast();
  const { fields, isLoading: isLoadingFields } = useObjectFields(objectTypeId);
  const { record, isLoading: isLoadingRecord, updateRecord } = useRecordDetail(objectTypeId, recordId);
  const [isSaving, setIsSaving] = useState(false);
  const methods = useForm();
  
  const { getFieldDisplayValue } = useRecordFields(objectTypeId);
  
  useEffect(() => {
    // Reset form when record data is loaded
    if (record && record.field_values) {
      const defaultValues = {}; 
      
      // Map record field values to form values
      Object.keys(record.field_values).forEach(fieldKey => {
        defaultValues[fieldKey] = record.field_values[fieldKey];
      });
      
      methods.reset(defaultValues);
    }
  }, [record, methods]);

  const onSubmit = async (data: any) => {
    try {
      setIsSaving(true);
      
      // Update record with form data
      await updateRecord(data);
      
      toast({
        description: "The record has been successfully updated.",
      });
      
      if (onSave && record) {
        onSave(record);
      }
    } catch (error) {
      console.error('Error updating record:', error);
      toast({
        variant: "destructive",
        description: "Failed to update the record. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading state while fetching data
  if (isLoadingFields || isLoadingRecord) {
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
          control={methods.control}
          register={methods.register}
          setValue={methods.setValue}
          readOnly={!isEditMode}
          getFieldDisplayValue={getFieldDisplayValue}
        />
      ))}
      
      {isEditMode && (
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
