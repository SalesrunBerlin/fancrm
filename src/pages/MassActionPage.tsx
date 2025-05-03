import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Save, Users } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { RecordsTable } from '@/components/records/RecordsTable';
import { ObjectField } from '@/hooks/useObjectTypes';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LookupField } from '@/components/records/LookupField';

// Define a type that's compatible with what RecordsTable expects
interface ObjectRecordSimplified {
  id: string;
  record_id?: string;
  created_at: string;
  updated_at: string;
  field_values: Record<string, any>;
  displayName?: string;
  object_type_id: string;
  owner_id?: string | null;
  created_by?: string | null;
  last_modified_by?: string | null;
}

export default function MassActionPage() {
  const { actionId } = useParams<{ actionId: string }>();
  const navigate = useNavigate();
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [lookupValue, setLookupValue] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('select');

  // Fetch action details
  const { data: action, isLoading: isLoadingAction } = useQuery({
    queryKey: ['action', actionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('actions')
        .select('*, object_fields(*), object_types(*)')
        .eq('id', actionId)
        .single();

      if (error) {
        toast.error('Error fetching action details');
        throw error;
      }

      return data;
    }
  });

  // Fetch records from the object type and lookup field metadata
  const { data: objectDetails, isLoading: isLoadingObjectDetails } = useQuery({
    queryKey: ['object-details', action?.object_types?.id],
    queryFn: async () => {
      if (!action?.object_types?.id) return null;

      const targetObjectId = action.object_types.id;

      // 1. Get fields for the target object
      const { data: fields, error: fieldsError } = await supabase
        .from('object_fields')
        .select('*')
        .eq('object_type_id', targetObjectId)
        .order('display_order', { ascending: true });

      if (fieldsError) throw fieldsError;
      
      // Convert fields to expected ObjectField type
      const typedFields: ObjectField[] = fields.map(field => ({
        ...field,
        default_value: field.default_value ? String(field.default_value) : '',
        options: field.options || null
      }));
      
      // 2. Get records from the target object
      const { data: records, error: recordsError } = await supabase
        .from('object_records')
        .select('*, field_values:record_field_values(*)')
        .eq('object_type_id', targetObjectId)
        .order('created_at', { ascending: false });

      if (recordsError) throw recordsError;

      // 3. Get lookup field details
      let lookupField = null;
      if (action.lookup_field_id) {
        const { data: lookupFieldData, error: lookupFieldError } = await supabase
          .from('object_fields')
          .select('*')
          .eq('id', action.lookup_field_id)
          .single();
          
        if (lookupFieldError) throw lookupFieldError;
        lookupField = lookupFieldData;
      }

      // Process and format the records
      const formattedRecords: ObjectRecordSimplified[] = records.map(record => {
        const fieldValues: Record<string, any> = {};
        
        // Extract field values from the record_field_values
        if (record.field_values) {
          record.field_values.forEach((fv: any) => {
            if (fv.field_api_name && fv.value !== null) {
              fieldValues[fv.field_api_name] = fv.value;
            }
          });
        }
        
        return {
          id: record.id,
          record_id: record.record_id,
          created_at: record.created_at,
          updated_at: record.updated_at,
          field_values: fieldValues,
          displayName: getDisplayName(record, typedFields),
          object_type_id: record.object_type_id,
          owner_id: record.owner_id,
          created_by: record.created_by,
          last_modified_by: record.last_modified_by
        };
      });

      return {
        fields: typedFields,
        records: formattedRecords,
        lookupField
      };
    },
    enabled: !!action?.object_types?.id
  });

  // Helper function to get a display name for records
  function getDisplayName(record: any, fields: ObjectField[]) {
    // Try to find a name field
    const nameField = fields.find(f => 
      f.api_name === 'name' || 
      f.api_name.includes('name') ||
      f.name.toLowerCase().includes('name')
    );
    
    if (nameField && record.field_values && record.field_values[nameField.api_name]) {
      return record.field_values[nameField.api_name];
    }
    
    // If no name field with value, return the record ID
    return record.record_id || `Record ${record.id.slice(0, 8)}`;
  }

  const handleSelectionChange = (ids: string[]) => {
    setSelectedRecords(ids);
  };

  const handleSubmit = async () => {
    if (!action?.lookup_field_id || !lookupValue || selectedRecords.length === 0) {
      toast.error('Please select records and a value to assign');
      return;
    }

    setIsSubmitting(true);

    try {
      // Begin update operations - update each record's lookup field value
      const promises = selectedRecords.map(async (recordId) => {
        // Find if the field value already exists
        const { data: existingValues, error: fetchError } = await supabase
          .from('record_field_values')
          .select('*')
          .eq('record_id', recordId)
          .eq('field_id', action.lookup_field_id);

        if (fetchError) throw fetchError;

        if (existingValues && existingValues.length > 0) {
          // Update existing value
          const { error: updateError } = await supabase
            .from('record_field_values')
            .update({ value: lookupValue })
            .eq('id', existingValues[0].id);

          if (updateError) throw updateError;
        } else {
          // Insert new value
          const { error: insertError } = await supabase
            .from('record_field_values')
            .insert({
              record_id: recordId,
              field_id: action.lookup_field_id,
              value: lookupValue
            });

          if (insertError) throw insertError;
        }

        // Also update the object_field_values table for consistency
        const { data: lookupField } = await supabase
          .from('object_fields')
          .select('api_name')
          .eq('id', action.lookup_field_id)
          .single();

        if (lookupField?.api_name) {
          const { data: existingFieldValues, error: fetchFieldValueError } = await supabase
            .from('object_field_values')
            .select('*')
            .eq('record_id', recordId)
            .eq('field_api_name', lookupField.api_name);

          if (fetchFieldValueError) throw fetchFieldValueError;

          if (existingFieldValues && existingFieldValues.length > 0) {
            // Update existing entry
            const { error: updateFieldValueError } = await supabase
              .from('object_field_values')
              .update({ value: lookupValue })
              .eq('id', existingFieldValues[0].id);

            if (updateFieldValueError) throw updateFieldValueError;
          } else {
            // Insert new entry
            const { error: insertFieldValueError } = await supabase
              .from('object_field_values')
              .insert({
                record_id: recordId,
                field_api_name: lookupField.api_name,
                value: lookupValue
              });

            if (insertFieldValueError) throw insertFieldValueError;
          }
        }
      });

      await Promise.all(promises);

      toast.success('Mass update completed successfully', {
        description: `Updated ${selectedRecords.length} records`
      });

      // Navigate back or to the target object
      navigate(`/objects/${action.target_object_id}`);
    } catch (error) {
      console.error('Error during mass update:', error);
      toast.error('Failed to complete mass update');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingAction || isLoadingObjectDetails) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!action) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto">
        <PageHeader
          title="Action not found"
          actions={
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          }
        />
      </div>
    );
  }

  // Type-safe rendering of RecordsTable
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title={`${action.name}`}
        description={action.description || 'Mass Update Records'}
        actions={
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            {activeTab === 'assign' && (
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting || !lookupValue || selectedRecords.length === 0}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Update {selectedRecords.length} Records
              </Button>
            )}
          </div>
        }
      />

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <Users className="h-10 w-10 text-primary p-2 bg-primary/10 rounded-full" />
            <div>
              <h2 className="text-xl font-semibold">Mass Update: {action.object_types?.name || 'Records'}</h2>
              <p className="text-muted-foreground">
                {selectedRecords.length} records selected for update
              </p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
            <TabsList className="w-full sm:w-auto mb-4">
              <TabsTrigger value="select" className="flex-1 sm:flex-none">
                1. Select Records
              </TabsTrigger>
              <TabsTrigger 
                value="assign" 
                className="flex-1 sm:flex-none"
                disabled={selectedRecords.length === 0}
              >
                2. Assign Value
              </TabsTrigger>
            </TabsList>

            <TabsContent value="select" className="space-y-4">
              {!objectDetails?.records || objectDetails.records.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No records found to update</p>
              ) : (
                <RecordsTable
                  records={objectDetails.records}
                  fields={objectDetails.fields}
                  objectTypeId={action.target_object_id}
                  selectable={true}
                  onSelectionChange={handleSelectionChange}
                />
              )}

              {selectedRecords.length > 0 && (
                <div className="flex justify-end mt-4">
                  <Button onClick={() => setActiveTab('assign')}>
                    Continue to Assign Value
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="assign" className="space-y-4">
              <div className="max-w-md mx-auto p-4">
                <h3 className="text-lg font-medium mb-4">Choose value to assign</h3>
                
                {objectDetails?.lookupField && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      You are about to update the "{objectDetails.lookupField.name}" field for {selectedRecords.length} records.
                    </p>
                    
                    <div className="space-y-2">
                      <label htmlFor="lookup-value" className="block text-sm font-medium">
                        Select value for {objectDetails.lookupField.name}
                      </label>
                      
                      {objectDetails.lookupField.options && typeof objectDetails.lookupField.options === 'object' && 
                       'target_object_type_id' in objectDetails.lookupField.options && (
                        <LookupField
                          value={lookupValue}
                          onChange={setLookupValue}
                          targetObjectTypeId={String(objectDetails.lookupField.options.target_object_type_id)}
                          disabled={false}
                        />
                      )}
                    </div>

                    <div className="border p-4 rounded-md bg-muted/30 mt-6">
                      <h4 className="text-sm font-medium mb-2">Summary</h4>
                      <ul className="text-sm space-y-1">
                        <li>Records to update: {selectedRecords.length}</li>
                        <li>Field to update: {objectDetails.lookupField.name}</li>
                        <li>Value: {lookupValue ? 'Selected' : 'Not selected yet'}</li>
                      </ul>
                    </div>
                    
                    <Button
                      className="w-full mt-6"
                      onClick={handleSubmit}
                      disabled={isSubmitting || !lookupValue}
                    >
                      {isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Update {selectedRecords.length} Records
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
