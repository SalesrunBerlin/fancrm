
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

export default function ObjectRecordDetail() {
  const { objectTypeId, recordId } = useParams<{ objectTypeId: string; recordId: string }>();
  const { objectTypes } = useObjectTypes();
  const { getRecord, updateRecord } = useObjectRecords(objectTypeId);
  const { fields } = useObjectFields(objectTypeId);
  const navigate = useNavigate();
  
  const [record, setRecord] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<string, any>>({});
  
  const objectType = objectTypes?.find(type => type.id === objectTypeId);

  // Fetch record data
  useEffect(() => {
    const fetchRecord = async () => {
      if (!recordId) return;
      
      setIsLoading(true);
      try {
        const recordData = await getRecord(recordId);
        setRecord(recordData);
      } catch (error) {
        console.error("Error fetching record:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRecord();
  }, [recordId, getRecord]);

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
      await updateRecord.mutateAsync({
        id: recordId,
        field_values: editedValues
      });
      
      // Update local state with new values
      setRecord(prev => ({
        ...prev,
        field_values: {
          ...(prev?.field_values || {}),
          ...editedValues
        }
      }));
      
      // Exit edit mode and clear edited values
      setIsEditing(false);
      setEditedValues({});
    } catch (error) {
      console.error("Error updating record:", error);
    }
  };

  if (!objectType) {
    return <div>Object type not found</div>;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!record) {
    return <div>Record not found</div>;
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
              <Button variant="default" onClick={handleSave} disabled={updateRecord.isPending}>
                {updateRecord.isPending ? (
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
