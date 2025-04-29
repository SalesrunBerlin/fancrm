
import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useObjectRecords } from "@/hooks/useObjectRecords";
import { useRecordFields } from "@/hooks/useRecordFields";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { RecordsTable } from "@/components/records/RecordsTable";
import { Card } from "@/components/ui/card";
import { FieldsConfigDialog } from "@/components/records/FieldsConfigDialog";
import { useLocalStorage } from "@/hooks/useLocalStorage";

export default function ObjectRecordsList() {
  const { objectTypeId } = useParams<{ objectTypeId: string }>();
  const { objectTypes } = useObjectTypes();
  const { records, isLoading } = useObjectRecords(objectTypeId);
  const { fields, isLoading: isLoadingFields } = useRecordFields(objectTypeId);
  const objectType = objectTypes?.find(type => type.id === objectTypeId);
  const [allRecords, setAllRecords] = useState<any[]>([]);
  
  // Add column visibility management
  const storageKey = objectTypeId ? `visible-fields-${objectTypeId}` : '';
  const [visibleFields, setVisibleFields] = useLocalStorage<string[]>(
    storageKey,
    fields ? fields.slice(0, 5).map(field => field.api_name) : []
  );

  // Update visible fields when fields are loaded
  useEffect(() => {
    if (fields && fields.length > 0 && (!visibleFields || visibleFields.length === 0)) {
      setVisibleFields(fields.slice(0, 5).map(field => field.api_name));
    }
  }, [fields]);

  useEffect(() => {
    if (records) {
      setAllRecords(records);
    }
  }, [records]);

  const handleLoadMore = () => {
    // Functionality removed since pagination is not implemented in the useObjectRecords hook
    console.log("Load more functionality would go here");
  };

  const handleVisibilityChange = (fieldApiNames: string[]) => {
    setVisibleFields(fieldApiNames);
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
              defaultVisibleFields={visibleFields}
            />
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
    </div>
  );
}
