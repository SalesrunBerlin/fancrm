
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { RecordField } from './RecordField';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useObjectFields } from '@/hooks/useObjectFields';
import { useRecordDetail } from '@/hooks/useRecordDetail';
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
  const { fields, isLoading: isLoadingFields } = useObjectFields(objectTypeId);
  const { record, isLoading: isLoadingRecord } = useRecordDetail(objectTypeId, recordId);
  const [isSaving, setIsSaving] = useState(false);
  const methods = useForm();
  
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
      
      // We need to implement the update functionality
      // This is a simplified version just for the UI to work
      const { error } = await fetch(`/api/records/${recordId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(res => res.json());
      
      if (error) throw error;
      
      toast.success("The record has been successfully updated.");
      
      if (onSave && record) {
        onSave(record);
      }
    } catch (error) {
      console.error('Error updating record:', error);
      toast.error("Failed to update the record. Please try again.");
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
          value={record?.field_values?.[field.api_name]}
          onChange={(value) => methods.setValue(field.api_name, value)}
          register={methods.register}
          readOnly={!isEditMode}
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
