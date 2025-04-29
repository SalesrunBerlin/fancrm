
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
import { ObjectField } from "@/hooks/useObjectTypes";

export default function ObjectRecordsList() {
  const { objectTypeId } = useParams<{ objectTypeId: string }>();
  const { objectTypes } = useObjectTypes();
  const { records, isLoading } = useObjectRecords(objectTypeId);
  const { fields, isLoading: isLoadingFields } = useRecordFields(objectTypeId);
  const objectType = objectTypes?.find(type => type.id === objectTypeId);
  const [allRecords, setAllRecords] = useState<any[]>([]);
  const { visibleFields, updateVisibleFields } = useUserFieldSettings(objectTypeId);
  
  // System fields definition
  const systemFields: ObjectField[] = [
    { 
      id: "sys_created_at", 
      api_name: "created_at", 
      name: "Created At", 
      is_required: true, 
      is_system: true,
      data_type: "datetime",
      object_type_id: objectTypeId || "",
      display_order: 1000,
      owner_id: ""
    },
    { 
      id: "sys_updated_at", 
      api_name: "updated_at", 
      name: "Last Modified", 
      is_required: true, 
      is_system: true,
      data_type: "datetime",
      object_type_id: objectTypeId || "",
      display_order: 1001,
      owner_id: ""
    },
    { 
      id: "sys_record_id", 
      api_name: "record_id", 
      name: "Record ID", 
      is_required: true, 
      is_system: true,
      data_type: "text",
      object_type_id: objectTypeId || "",
      display_order: 1002,
      owner_id: ""
    }
  ];
  
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
  
  // Generate fields to display including system fields if selected
  const getFieldsToDisplay = () => {
    // Start with regular fields
    const displayFields = fields?.filter(field => visibleFields.includes(field.api_name)) || [];
    
    // Add selected system fields
    const selectedSystemFields = systemFields.filter(
      field => visibleFields.includes(field.api_name)
    );
    
    return [...displayFields, ...selectedSystemFields];
  };

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
              asChild
            >
              <Link to={`/objects/${objectTypeId}/import`}>
                <Upload className="mr-1.5 h-4 w-4" />
                Import
              </Link>
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
            fields={getFieldsToDisplay()} 
            objectTypeId={objectTypeId!}
          />
        )}
      </Card>
    </div>
  );
}
