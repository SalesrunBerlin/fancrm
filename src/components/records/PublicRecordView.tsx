
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ChevronLeft, AlertTriangle, Loader2, Save, Eye, Edit, ExternalLink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { RecordDetailForm } from "@/components/records/RecordDetailForm";
import { usePublicRecord, usePublicRelatedRecords } from "@/hooks/usePublicRecord";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { getAlertVariantClass } from "@/patches/FixAlertVariants";
import { Separator } from "@/components/ui/separator";

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
  const navigate = useNavigate();

  // Reset edit mode when record changes
  useEffect(() => {
    setEditMode(false);
    setEditedValues({});
  }, [record]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !record) {
    return (
      <Alert className={getAlertVariantClass("destructive")} className="max-w-lg mx-auto my-8">
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

      toast.success("Record updated successfully");
      setEditMode(false);
      setEditedValues({});
      
      // Refresh the page to show updated data
      window.location.reload();
    } catch (err: any) {
      console.error("Error updating record:", err);
      toast.error("Failed to update record", { description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const recordName = record.displayName || `${record.objectName} Record`;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={handleBackClick}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </div>
          
          {allowEdit && (
            <div>
              {editMode ? (
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setEditMode(false);
                      setEditedValues({});
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleSaveChanges}
                    disabled={isSaving || Object.keys(editedValues).length === 0}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setEditMode(true)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              )}
            </div>
          )}
        </div>
        
        <div className="mt-4">
          <h1 className="text-2xl font-bold">{recordName}</h1>
          <p className="text-muted-foreground">
            {record.objectName}
          </p>
        </div>
      </header>

      <Alert className={getAlertVariantClass("default")} className="mb-6">
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

interface RelatedRecordsTabProps {
  token: string;
  recordId: string;
  relatedObjectTypeId: string;
  relationshipId: string;
  objectTypeName: string;
}

function RelatedRecordsTab({
  token,
  recordId,
  relatedObjectTypeId,
  relationshipId,
  objectTypeName
}: RelatedRecordsTabProps) {
  const { data: relatedRecords, isLoading, error } = usePublicRelatedRecords(
    token,
    recordId,
    relatedObjectTypeId,
    relationshipId
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert className={getAlertVariantClass("destructive")} className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load related {objectTypeName} records.
        </AlertDescription>
      </Alert>
    );
  }

  if (!relatedRecords || relatedRecords.length === 0) {
    return (
      <div className="bg-muted/30 rounded-lg p-8 text-center">
        <p className="text-muted-foreground">No related {objectTypeName} records found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Related {objectTypeName} ({relatedRecords.length})</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {relatedRecords.map((record) => {
          // Find a good display value for the record card
          let displayName = record.id;
          if (record.fieldValues) {
            // Try to find a reasonable display field
            const nameField = 
              record.fieldValues.name || 
              record.fieldValues.title || 
              record.fieldValues.subject ||
              record.fieldValues.first_name && record.fieldValues.last_name 
                ? `${record.fieldValues.first_name} ${record.fieldValues.last_name}`
                : null;
                
            if (nameField) displayName = nameField;
          }
          
          return (
            <Card key={record.id} className="overflow-hidden">
              <CardHeader className="p-4">
                <CardTitle className="text-base truncate">{displayName}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-2">
                  {Object.entries(record.fieldValues || {}).slice(0, 3).map(([field, value]) => (
                    <div key={field} className="grid grid-cols-3 gap-1">
                      <div className="text-sm text-muted-foreground">{field}:</div>
                      <div className="text-sm col-span-2 truncate">{value || "-"}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
