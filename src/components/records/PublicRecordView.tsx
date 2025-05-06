
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RecordDetailForm } from "@/components/records/RecordDetailForm";
import { usePublicRecord } from "@/hooks/usePublicRecord";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { getAlertVariantClass } from "@/patches/FixAlertVariants";
import { PublicRecordHeader } from "./PublicRecordHeader";
import { RelatedRecordsTab } from "./RelatedRecordsTab";
import { Skeleton } from "@/components/ui/skeleton";

interface PublicRecordViewProps {
  token: string;
  recordId: string;
}

export default function PublicRecordView({ token, recordId }: PublicRecordViewProps) {
  const { 
    record, 
    fields, 
    relatedObjectTypes,
    isLoading, 
    error,
    allowEdit 
  } = usePublicRecord(token, recordId);
  const [editMode, setEditMode] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("details");

  // Reset edit mode when record changes
  useEffect(() => {
    setEditMode(false);
    setEditedValues({});
  }, [record]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-20" />
          </div>
          <div className="mt-4">
            <Skeleton className="h-8 w-1/3 mb-2" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </div>
        <Skeleton className="h-12 w-full mb-6" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div className="grid gap-2" key={i}>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !record) {
    return (
      <Alert className={`${getAlertVariantClass("destructive")} max-w-lg mx-auto my-8`}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error?.message || "This record is not available or access has been revoked."}
        </AlertDescription>
      </Alert>
    );
  }

  const handleBackClick = () => {
    // Handle going back if there's history, otherwise do nothing
    if (window.history.length > 1) {
      window.history.back();
    }
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setEditedValues(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleSaveChanges = async () => {
    if (!allowEdit || !editMode || Object.keys(editedValues).length === 0) return;

    try {
      setIsSaving(true);

      // Update field values
      for (const [field_api_name, value] of Object.entries(editedValues)) {
        const { error } = await supabase
          .from("object_field_values")
          .upsert({
            record_id: recordId,
            field_api_name,
            value: value === null ? null : String(value)
          }, {
            onConflict: 'record_id,field_api_name'
          });

        if (error) throw error;
      }

      // Reset state and refresh the data
      setEditMode(false);
      setEditedValues({});
      
      // Reload the page to show updated data
      window.location.reload();
    } catch (err: any) {
      console.error("Error updating record:", err);
      // We should add toast notifications here
      alert(`Failed to update record: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <PublicRecordHeader 
        record={record}
        allowEdit={allowEdit}
        editMode={editMode}
        isSaving={isSaving}
        onBackClick={handleBackClick}
        onEditClick={() => setEditMode(true)}
        onCancelEdit={() => {
          setEditMode(false);
          setEditedValues({});
        }}
        onSaveChanges={handleSaveChanges}
        hasChanges={Object.keys(editedValues).length > 0}
      />

      <Alert className={`${getAlertVariantClass("default")} mb-6`}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          You're viewing a publicly shared record. {allowEdit ? "You can edit this record." : "This record is read-only."}
        </AlertDescription>
      </Alert>

      {relatedObjectTypes && relatedObjectTypes.length > 0 ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            {relatedObjectTypes.map((relType) => (
              <TabsTrigger key={relType.id} value={`related-${relType.id}`}>
                {relType.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Record Details</CardTitle>
              </CardHeader>
              <CardContent>
                <RecordDetailForm
                  record={record}
                  fields={fields}
                  onFieldChange={handleFieldChange}
                  editedValues={editedValues}
                  isEditing={editMode && allowEdit}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {relatedObjectTypes.map((relType) => (
            <TabsContent key={relType.id} value={`related-${relType.id}`}>
              <RelatedRecordsTab
                token={token}
                recordId={recordId}
                relatedObjectTypeId={relType.id}
                relationshipId={relType.relationship_id}
                objectTypeName={relType.name}
              />
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Record Details</CardTitle>
          </CardHeader>
          <CardContent>
            <RecordDetailForm
              record={record}
              fields={fields}
              onFieldChange={handleFieldChange}
              editedValues={editedValues}
              isEditing={editMode && allowEdit}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
