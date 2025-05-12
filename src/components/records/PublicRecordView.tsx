import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Edit, Save, ArrowLeft, X } from 'lucide-react';
import { ObjectRecord, ObjectField, ObjectFieldWithJson, convertToObjectFields } from '@/types/ObjectFieldTypes';
import { useParams, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { RelatedRecordsSection } from '../records/RelatedRecordsSection';

export function PublicRecordView() {
  const { token, recordId } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState<ObjectRecord | null>(null);
  const [objectType, setObjectType] = useState<any>(null);
  const [fields, setFields] = useState<ObjectField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [visibleFields, setVisibleFields] = useState<string[]>([]);
  const [visibleRelatedObjects, setVisibleRelatedObjects] = useState<{
    related_object_type_id: string;
    relationship_id: string;
  }[]>([]);

  const fetchRecordDetails = async () => {
    if (!recordId || !token) {
      setError('Record ID or token missing');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch record details using the token
      const { data: recordData, error: recordError } = await supabase
        .from('object_records')
        .select(`
          *,
          object_type (
            name,
            api_name
          ),
          object_field_values (
            value,
            field_api_name
          )
        `)
        .eq('id', recordId)
        .single();

      if (recordError) throw new Error(recordError.message);
      if (!recordData) throw new Error('Record not found');

      // Check if this token has access to this record
      const { data: shareData, error: shareError } = await supabase
        .from('public_record_shares')
        .select('visible_fields, visible_related_objects')
        .eq('token', token)
        .eq('record_id', recordId)
        .single();

      if (shareError) throw new Error('Failed to verify access');
      if (!shareData) throw new Error('You do not have access to this record');

      setVisibleFields(shareData.visible_fields || []);
      setVisibleRelatedObjects(shareData.visible_related_objects || []);

      setRecord(recordData as ObjectRecord);

      // Fetch object type details
      await fetchObjectType(recordData.object_type_id);

      // Convert object field values to a more usable format
      const convertedFields = convertToObjectFields(recordData);
      setFields(convertedFields);

      // Initialize form data with existing values
      const initialFormData: Record<string, any> = {};
      convertedFields.forEach(field => {
        initialFormData[field.api_name] = field.value;
      });
      setFormData(initialFormData);
    } catch (err) {
      console.error('Error fetching record details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load record');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchObjectType = async (objectTypeId: string) => {
    try {
      const { data, error } = await supabase
        .from('object_types')
        .select('*')
        .eq('id', objectTypeId)
        .single();

      if (error) throw new Error(error.message);
      setObjectType(data);
    } catch (error) {
      console.error('Error fetching object type:', error);
      setError('Failed to load object type');
    }
  };

  const fetchFields = async () => {
    if (!objectType) return;

    try {
      const { data, error } = await supabase
        .from('object_fields')
        .select('*')
        .eq('object_type_id', objectType.id);

      if (error) throw new Error(error.message);
      setFields(data as ObjectField[]);
    } catch (error) {
      console.error('Error fetching fields:', error);
      setError('Failed to load fields');
    }
  };

  useEffect(() => {
    fetchRecordDetails();
  }, [recordId, token]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!recordId || !token) return;
    
    try {
      setIsSaving(true);
      
      // Check if this token has edit permissions
      const { data: shareData, error: shareError } = await supabase
        .from('public_record_shares')
        .select('allow_edit')
        .eq('token', token)
        .eq('record_id', recordId)
        .single();
        
      if (shareError) throw new Error('Failed to verify edit permissions');
      if (!shareData.allow_edit) throw new Error('You do not have edit permissions for this record');
      
      // Only update fields that are visible to this token
      const updateData: Record<string, any> = {};
      
      visibleFields.forEach((field) => {
        if (formData[field] !== undefined) {
          updateData[field] = formData[field];
        }
      });
      
      // Update the record through object_field_values table
      for (const [field, value] of Object.entries(updateData)) {
        const { error: updateError } = await supabase
          .from('object_field_values')
          .update({ value })
          .eq('record_id', recordId)
          .eq('field_api_name', field);
          
        if (updateError) throw updateError;
      }
      
      toast({
        title: "Success",
        description: "Record updated successfully",
      });
      
      // Refresh data to show the latest values
      fetchRecordDetails();
      setEditing(false);
    } catch (err) {
      console.error('Error updating record:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update record",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderFieldValue = (field: ObjectField, value: any, isEditable: boolean) => {
    if (!visibleFields.includes(field.api_name)) {
      return null;
    }

    if (isEditable) {
      if (field.data_type === 'text') {
        return (
          <Input
            type="text"
            value={formData[field.api_name] || ''}
            onChange={(e) => handleChange(field.api_name, e.target.value)}
            className="w-full"
          />
        );
      } else if (field.data_type === 'longtext') {
        return (
          <Textarea
            value={formData[field.api_name] || ''}
            onChange={(e) => handleChange(field.api_name, e.target.value)}
            className="w-full"
          />
        );
      } else {
        return (
          <Input
            type="text"
            value={formData[field.api_name] || ''}
            onChange={(e) => handleChange(field.api_name, e.target.value)}
            className="w-full"
          />
        );
      }
    } else {
      return (
        <p className="text-gray-700">
          {value !== null && value !== undefined ? value.toString() : 'N/A'}
        </p>
      );
    }
  };

  const renderFields = () => {
    if (!fields) return null;

    return fields.map((field) => (
      <div key={field.id} className="mb-4">
        <label className="block text-sm font-medium text-gray-700">{field.name}</label>
        {renderFieldValue(field, formData[field.api_name] || field.value, editing)}
      </div>
    ));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          <h2 className="text-lg font-medium">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <PageHeader
        title={objectType?.name || 'Record Details'}
        description={`View details for this ${objectType?.name || 'record'}`}
      />

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>{record?.name || 'Unnamed Record'}</CardTitle>
          <div className="flex items-center space-x-2">
            {editing ? (
              <>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditing(false);
                    // Revert form data to original values
                    const initialFormData: Record<string, any> = {};
                    fields.forEach(field => {
                      initialFormData[field.api_name] = field.value;
                    });
                    setFormData(initialFormData);
                  }}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button onClick={() => setEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {renderFields()}
        </CardContent>
      </Card>

      {visibleRelatedObjects.length > 0 && record ? (
        <RelatedRecordsSection
          recordId={record.id}
          visibleRelatedObjects={visibleRelatedObjects}
        />
      ) : null}
    </div>
  );
}
