
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Edit, Save, ArrowLeft, X } from 'lucide-react';
import { ObjectRecord, ObjectField, ObjectFieldWithJson, convertToObjectFields } from '@/types/ObjectFieldTypes';
import { RecordField } from './RecordField';
import { useForm } from 'react-hook-form';

interface PublicRecordViewProps {
  token: string;
  recordId: string;
}

export function PublicRecordView({ token, recordId }: PublicRecordViewProps) {
  const { toast } = useToast();
  const [record, setRecord] = useState<ObjectRecord | null>(null);
  const [fields, setFields] = useState<ObjectField[]>([]);
  const [objectType, setObjectType] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);
  const [visibleFields, setVisibleFields] = useState<string[]>([]);
  const form = useForm();

  useEffect(() => {
    fetchPublicRecord();
  }, [token, recordId]);

  const fetchPublicRecord = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate token and get visible fields
      const { data: fieldsData, error: fieldsError } = await supabase
        .rpc('get_public_visible_fields', { 
          p_token: token,
          p_record_id: recordId
        });

      if (fieldsError) throw fieldsError;
      
      setVisibleFields(fieldsData.map((f: {field_api_name: string}) => f.field_api_name));

      // Get record
      const { data: recordData, error: recordError } = await supabase
        .from('object_records')
        .select('*, object_field_values:object_field_values(*)')
        .eq('id', recordId)
        .single();

      if (recordError) throw recordError;
      
      // Get object type
      const { data: objectTypeData, error: objectTypeError } = await supabase
        .from('object_types')
        .select('*')
        .eq('id', recordData.object_type_id)
        .single();

      if (objectTypeError) throw objectTypeError;
      
      // Get fields
      const { data: fieldsListData, error: fieldsListError } = await supabase
        .from('object_fields')
        .select('*')
        .eq('object_type_id', recordData.object_type_id)
        .order('display_order');

      if (fieldsListError) throw fieldsListError;

      // Convert fields to proper type and filter them
      const convertedFields = convertToObjectFields(fieldsListData);
      const filteredFields = convertedFields.filter(field => 
        visibleFields.includes(field.api_name));
      
      // Format record with field values
      const formattedRecord: ObjectRecord = {
        ...recordData,
        field_values: {},
      };

      // Add field values to record
      if (recordData.object_field_values) {
        recordData.object_field_values.forEach((fieldValue: any) => {
          if (visibleFields.includes(fieldValue.field_api_name)) {
            formattedRecord.field_values![fieldValue.field_api_name] = fieldValue.value;
          }
        });
      }

      setObjectType(objectTypeData);
      setFields(filteredFields);
      setRecord(formattedRecord);
      setEditedValues({}); // Reset edited values when loading new record

      // Set form default values
      if (formattedRecord.field_values) {
        const defaultValues = { ...formattedRecord.field_values };
        form.reset(defaultValues);
      }

    } catch (error: any) {
      console.error('Error fetching public record:', error);
      setError('Record not found or you do not have permission to view it.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    console.log(`Field changed: ${fieldName} => `, value);
    setEditedValues((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
    
    // Update the form control value
    form.setValue(fieldName, value, {
      shouldTouch: true,
      shouldDirty: true,
      shouldValidate: true
    });
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);

      if (!record) return;

      // Check if record allows editing
      const { data: shareData, error: shareError } = await supabase
        .from('public_record_shares')
        .select('allow_edit')
        .eq('token', token)
        .eq('record_id', recordId)
        .single();

      if (shareError) throw shareError;
      
      if (!shareData.allow_edit) {
        toast({
          title: "Permission Denied",
          description: 'You do not have permission to edit this record.'
        });
        setIsSubmitting(false);
        setIsEditing(false);
        return;
      }

      // Get all changed values
      const changedValues = Object.keys(editedValues).length > 0 
        ? editedValues 
        : form.getValues();
      
      console.log("Saving changes:", changedValues);

      // For each edited field, update the corresponding field value
      const updates = Object.entries(changedValues).map(async ([field_api_name, value]) => {
        // Process the value based on type
        const processedValue = value === null ? null : String(value);
        
        console.log(`Processing update for ${field_api_name}:`, processedValue);
        
        // Check if field value exists
        const { data, error: checkError } = await supabase
          .from('object_field_values')
          .select('*')
          .eq('record_id', record.id)
          .eq('field_api_name', field_api_name);

        if (checkError) throw checkError;

        if (data && data.length > 0) {
          // Update existing field value
          return supabase
            .from('object_field_values')
            .update({ value: processedValue })
            .eq('record_id', record.id)
            .eq('field_api_name', field_api_name);
        } else {
          // Insert new field value
          return supabase
            .from('object_field_values')
            .insert([{ record_id: record.id, field_api_name, value: processedValue }]);
        }
      });

      await Promise.all(updates);

      toast({
        title: "Success",
        description: 'Record updated successfully.'
      });

      // Refresh data
      fetchPublicRecord();
      setIsEditing(false);
      setEditedValues({});
    } catch (error: any) {
      console.error('Error updating record:', error);
      toast({
        title: "Error",
        description: 'Error updating record: ' + error.message,
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="text-destructive text-lg mb-4">
              {error || 'Record not found.'}
            </div>
            <Button asChild variant="outline">
              <a href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl">
          {objectType?.name || 'Record Details'}
        </CardTitle>
        {isEditing ? (
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleSave}
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setIsEditing(false);
                setEditedValues({});
                // Reset form to original values
                if (record.field_values) {
                  form.reset(record.field_values);
                }
              }}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => setIsEditing(true)}
            variant="outline"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {fields.map((field) => {
            const currentValue = editedValues[field.api_name] !== undefined
              ? editedValues[field.api_name]
              : record.field_values && record.field_values[field.api_name];
          
            return (
              <div key={field.id}>
                <RecordField 
                  field={field}
                  value={currentValue}
                  onChange={(value) => handleFieldChange(field.api_name, value)}
                  readOnly={!isEditing}
                  form={form}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Add a default export that re-exports the named export
export default PublicRecordView;
