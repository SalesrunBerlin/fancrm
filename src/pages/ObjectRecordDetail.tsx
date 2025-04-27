
import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useObjectRecords } from "@/hooks/useObjectRecords";
import { useObjectFields } from "@/hooks/useObjectFields";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Save, Loader2, X, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { RecordDetailForm } from "@/components/records/RecordDetailForm";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RelatedRecordsList } from "@/components/records/RelatedRecordsList";
import { RecordDeleteDialog } from "@/components/records/RecordDeleteDialog";
import { toast } from "sonner";
import { LookupValueDisplay } from "@/components/records/LookupValueDisplay";

export default function ObjectRecordDetail() {
  const { objectTypeId, recordId } = useParams<{ objectTypeId: string; recordId: string }>();
  const { objectTypes } = useObjectTypes();
  const { fields } = useObjectFields(objectTypeId);
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<string, any>>({});
  const navigate = useNavigate();

  // Enhanced record fetching with React Query
  const { data: record, isLoading, error } = useQuery({
    queryKey: ["object-record", recordId],
    queryFn: async () => {
      if (!recordId) throw new Error("Record ID is required");
      
      console.log("Fetching record:", recordId);
      
      // Get the record
      const { data: record, error: recordError } = await supabase
        .from("object_records")
        .select("*")
        .eq("id", recordId)
        .single();

      if (recordError) throw recordError;

      // Get field values
      const { data: fieldValues, error: fieldValuesError } = await supabase
        .from("object_field_values")
        .select("field_api_name, value")
        .eq("record_id", recordId);

      if (fieldValuesError) throw fieldValuesError;

      console.log("Record loaded:", record);
      console.log("Field values:", fieldValues);

      // Convert field values array to object
      const valuesObject = fieldValues.reduce((acc, curr) => {
        acc[curr.field_api_name] = curr.value;
        return acc;
      }, {} as { [key: string]: string | null });

      return {
        ...record,
        field_values: valuesObject
      };
    },
    enabled: !!recordId,
  });
  
  const objectType = objectTypes?.find(type => type.id === objectTypeId);

  // Mutation for updating records
  const updateRecordMutation = useMutation({
    mutationFn: async ({ id, field_values }: { id: string, field_values: Record<string, any> }) => {
      // Update the object_field_values for each changed field
      const updates = Object.entries(field_values).map(async ([fieldApiName, value]) => {
        // Check if the field value exists
        const { data: existingValue } = await supabase
          .from("object_field_values")
          .select("*")
          .eq("record_id", id)
          .eq("field_api_name", fieldApiName)
          .maybeSingle();

        const stringValue = value !== null && value !== undefined ? String(value) : null;

        if (existingValue) {
          // Update existing field value
          const { error } = await supabase
            .from("object_field_values")
            .update({ value: stringValue })
            .eq("record_id", id)
            .eq("field_api_name", fieldApiName);

          if (error) throw error;
        } else {
          // Insert new field value
          const { error } = await supabase
            .from("object_field_values")
            .insert({
              record_id: id,
              field_api_name: fieldApiName,
              value: stringValue
            });

          if (error) throw error;
        }
      });

      // Wait for all updates to complete
      await Promise.all(updates);

      // Update the last_modified timestamp on the record
      const { error: recordUpdateError } = await supabase
        .from("object_records")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", id);

      if (recordUpdateError) throw recordUpdateError;

      return { id, field_values };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["object-record", recordId] });
      toast.success("Record updated successfully");
      setIsEditing(false);
      setEditedValues({});
    },
    onError: (error) => {
      console.error("Error updating record:", error);
      toast.error("Failed to update record");
    },
  });

  const handleEditToggle = () => {
    if (isEditing) {
      // Discard changes when canceling edit
      setEditedValues({});
    }
    setIsEditing(!isEditing);
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setEditedValues(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleSave = async () => {
    if (!recordId || Object.keys(editedValues).length === 0) return;
    
    updateRecordMutation.mutate({
      id: recordId,
      field_values: editedValues
    });
  };

  const handleDelete = async () => {
    if (!recordId) return;
    
    try {
      const { error } = await supabase
        .from('object_records')
        .delete()
        .eq('id', recordId);
      
      if (error) throw error;
      
      toast.success("Record deleted successfully");
      navigate(`/objects/${objectTypeId}`);
    } catch (error) {
      console.error("Error deleting record:", error);
      toast.error("Failed to delete record");
    }
  };

  if (!objectType) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Object type not found</AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !record) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error ? `Error loading record: ${error.message}` : 'Record not found'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link to={`/objects/${objectTypeId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to {objectType.name}
            </Link>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button 
                variant="default" 
                onClick={handleSave}
                disabled={updateRecordMutation.isPending}
              >
                {updateRecordMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save
              </Button>
              <Button variant="outline" onClick={handleEditToggle}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleEditToggle}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="related">Related</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardContent className="pt-6">
              {isEditing ? (
                <RecordDetailForm
                  record={record}
                  fields={fields || []}
                  onFieldChange={handleFieldChange}
                  editedValues={editedValues}
                  isEditing={true}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Record ID</label>
                    <p>{record.record_id}</p>
                  </div>
                  
                  {fields?.map(field => (
                    <div key={field.api_name}>
                      <label className="text-sm font-medium text-muted-foreground">
                        {field.name}
                        {field.is_required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {field.data_type === 'lookup' && field.options?.target_object_type_id ? (
                        <LookupValueDisplay
                          value={record.field_values?.[field.api_name] || null}
                          fieldOptions={field.options}
                        />
                      ) : (
                        <p>{record.field_values?.[field.api_name] || "-"}</p>
                      )}
                    </div>
                  ))}
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created At</label>
                    <p>{formatDate(record.created_at)}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Last Modified</label>
                    <p>{formatDate(record.updated_at)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="related">
          <RelatedRecordsList objectTypeId={objectTypeId!} recordId={recordId!} />
        </TabsContent>
      </Tabs>

      <RecordDeleteDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
