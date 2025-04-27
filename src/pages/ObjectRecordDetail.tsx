import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useObjectRecords } from "@/hooks/useObjectRecords";
import { useObjectFields } from "@/hooks/useObjectFields";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Save, Loader2, X } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { RecordDetailForm } from "@/components/records/RecordDetailForm";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ObjectRecordDetail() {
  const { objectTypeId, recordId } = useParams<{ objectTypeId: string; recordId: string }>();
  const { objectTypes } = useObjectTypes();
  const { fields } = useObjectFields(objectTypeId);
  const [isEditing, setIsEditing] = useState(false);
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
    
    try {
      // TODO: Replace with react query mutation
      // await updateRecord.mutateAsync({
      //   id: recordId,
      //   field_values: editedValues
      // });
      
      // // Update local state with new values
      // setRecord(prev => ({
      //   ...prev,
      //   field_values: {
      //     ...(prev?.field_values || {}),
      //     ...editedValues
      //   }
      // }));
      
      // Exit edit mode and clear edited values
      setIsEditing(false);
      setEditedValues({});
    } catch (error) {
      console.error("Error updating record:", error);
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
              <Button variant="default" onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" onClick={handleEditToggle}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={handleEditToggle}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-2xl font-semibold">Record Details</h2>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <RecordDetailForm
              record={record}
              fields={fields || []}
              onFieldChange={handleFieldChange}
              editedValues={editedValues}
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
                  <p>{record.field_values?.[field.api_name] || "-"}</p>
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
    </div>
  );
}
