
import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useObjectRecords } from "@/hooks/useObjectRecords";
import { useRecordFields } from "@/hooks/useRecordFields";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Upload } from "lucide-react";
import { RecordsTable } from "@/components/records/RecordsTable";
import { Card } from "@/components/ui/card";
import { FieldsConfigDialog } from "@/components/records/FieldsConfigDialog";
import { useUserFieldSettings } from "@/hooks/useUserFieldSettings";
import { ImportRecordsDialog } from "@/components/records/ImportRecordsDialog";

export default function ObjectRecordsList() {
  const { objectTypeId } = useParams<{ objectTypeId: string }>();
  const { objectTypes } = useObjectTypes();
  const { records, isLoading } = useObjectRecords(objectTypeId);
  const { fields, isLoading: isLoadingFields } = useRecordFields(objectTypeId);
  const objectType = objectTypes?.find(type => type.id === objectTypeId);
  const [allRecords, setAllRecords] = useState<any[]>([]);
  const { visibleFields, updateVisibleFields } = useUserFieldSettings(objectTypeId);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  
  // Initialize visible fields if none are saved yet
  useEffect(() => {
    if (fields && fields.length > 0 && (!visibleFields || visibleFields.length === 0)) {
      updateVisibleFields(fields.slice(0, 5).map(field => field.api_name));
    }
  }, [fields, visibleFields, updateVisibleFields]);

  useEffect(() => {
    if (records) {
      setAllRecords(records);
    }
  }, [records]);

  const handleVisibilityChange = (fieldApiNames: string[]) => {
    updateVisibleFields(fieldApiNames);
  };

  if (!objectType) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={objectType.name}
        description={objectType.description || `Manage your ${objectType.name.toLowerCase()}`}
        actions={
          <>
            <FieldsConfigDialog
              objectTypeId={objectTypeId!}
              onVisibilityChange={handleVisibilityChange}
            />
            <Button 
              variant="outline"
              onClick={() => setIsImportDialogOpen(true)}
            >
              <Upload className="mr-1.5 h-4 w-4" />
              Import
            </Button>
            <Button asChild>
              <Link to={`/objects/${objectTypeId}/new`}>
                <Plus className="mr-1.5 h-4 w-4" />
                New {objectType.name}
              </Link>
            </Button>
          </>
        }
      />

      <Card className="overflow-hidden">
        {isLoading || isLoadingFields ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <RecordsTable 
            records={allRecords} 
            fields={fields?.filter(field => visibleFields.includes(field.api_name)) || []} 
            objectTypeId={objectTypeId!}
          />
        )}
      </Card>

      {fields && (
        <ImportRecordsDialog
          objectTypeId={objectTypeId!}
          fields={fields}
          isOpen={isImportDialogOpen}
          onClose={() => setIsImportDialogOpen(false)}
        />
      )}
    </div>
  );
}
