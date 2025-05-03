
import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useObjectRecords } from "@/hooks/useObjectRecords";
import { useEnhancedFields } from "@/hooks/useEnhancedFields";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Upload, Trash2 } from "lucide-react";
import { RecordsTable } from "@/components/records/RecordsTable";
import { Card } from "@/components/ui/card";
import { FieldsConfigDialog } from "@/components/records/FieldsConfigDialog";
import { useUserFieldSettings } from "@/hooks/useUserFieldSettings";
import { ObjectField } from "@/hooks/useObjectTypes";
import { DeleteDialog } from "@/components/common/DeleteDialog";
import { toast } from "sonner";
import { EnhancedObjectField, toSafeObjectField } from "@/patches/FixObjectFieldType";
import { ObjectActionsSection } from "@/components/actions/ObjectActionsSection";

export default function ObjectRecordsList() {
  const { objectTypeId } = useParams<{ objectTypeId: string }>();
  const { objectTypes } = useObjectTypes();
  const { records, isLoading, deleteRecord } = useObjectRecords(objectTypeId);
  const { fields, isLoading: isLoadingFields } = useEnhancedFields(objectTypeId);
  const objectType = objectTypes?.find(type => type.id === objectTypeId);
  const [allRecords, setAllRecords] = useState<any[]>([]);
  const { visibleFields, updateVisibleFields } = useUserFieldSettings(objectTypeId);
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // System fields definition
  const systemFields: EnhancedObjectField[] = [
    { 
      id: "sys_created_at", 
      api_name: "created_at", 
      name: "Created At", 
      is_required: true, 
      is_system: true,
      data_type: "datetime",
      object_type_id: objectTypeId || "",
      display_order: 1000,
      owner_id: "",
      created_at: new Date().toISOString()
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
      owner_id: "",
      created_at: new Date().toISOString()
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
      owner_id: "",
      created_at: new Date().toISOString()
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

  const handleRecordSelectionChange = (selectedIds: string[]) => {
    setSelectedRecords(selectedIds);
  };

  const handleBatchDelete = async () => {
    if (selectedRecords.length === 0) return;
    
    try {
      // Process deletion of each selected record
      await Promise.all(selectedRecords.map(id => deleteRecord.mutateAsync(id)));
      
      // Show success message
      toast.success(`${selectedRecords.length} record(s) deleted successfully`);
      
      // Clear selection
      setSelectedRecords([]);
    } catch (error) {
      console.error("Error deleting records:", error);
      toast.error("Failed to delete some records");
    }
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
    
    // Convert enhanced fields to standard fields for display
    return [
      ...displayFields, 
      ...selectedSystemFields.map(field => toSafeObjectField(field))
    ];
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
            {selectedRecords.length > 0 && (
              <Button 
                variant="destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                Delete Selected ({selectedRecords.length})
              </Button>
            )}
            <Button asChild>
              <Link to={`/objects/${objectTypeId}/new`}>
                <Plus className="mr-1.5 h-4 w-4" />
                New {objectType.name}
              </Link>
            </Button>
          </>
        }
      />

      {/* Regular actions section - will only show new record actions when no records are selected */}
      <ObjectActionsSection 
        objectTypeId={objectTypeId!} 
        objectTypeName={objectType.name}
      />

      {/* Mass actions section - only visible when records are selected */}
      {selectedRecords.length > 0 && (
        <div className="bg-muted/30 p-4 rounded-md">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-sm">
              {selectedRecords.length} {objectType.name} selected
            </h3>
          </div>
          <ObjectActionsSection 
            objectTypeId={objectTypeId!} 
            objectTypeName={objectType.name}
            selectedRecordIds={selectedRecords}
          />
        </div>
      )}

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
            selectable={true}
            onSelectionChange={handleRecordSelectionChange}
          />
        )}
      </Card>

      <DeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleBatchDelete}
        title={`Delete ${selectedRecords.length} Records`}
        description={`Are you sure you want to delete ${selectedRecords.length} records? This action cannot be undone.`}
      />
    </div>
  );
}
