
import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useObjectRecords } from "@/hooks/useObjectRecords";
import { useRecordFields } from "@/hooks/useRecordFields";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Upload, Trash2, List, Kanban } from "lucide-react";
import { RecordsTable } from "@/components/records/RecordsTable";
import { RecordsKanban } from "@/components/records/RecordsKanban";
import { Card } from "@/components/ui/card";
import { FieldsConfigDialog } from "@/components/records/FieldsConfigDialog";
import { useUserFieldSettings } from "@/hooks/useUserFieldSettings";
import { useViewMode, ViewMode } from "@/hooks/useViewMode";
import { ObjectField } from "@/hooks/useObjectTypes";
import { DeleteDialog } from "@/components/common/DeleteDialog";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KanbanSkeleton } from "@/components/records/KanbanSkeleton";

export default function ObjectRecordsList() {
  const { objectTypeId } = useParams<{ objectTypeId: string }>();
  const { objectTypes } = useObjectTypes();
  const { records, isLoading, deleteRecord, refetch } = useObjectRecords(objectTypeId);
  const { fields, isLoading: isLoadingFields } = useRecordFields(objectTypeId);
  const objectType = objectTypes?.find(type => type.id === objectTypeId);
  const [allRecords, setAllRecords] = useState<any[]>([]);
  const { visibleFields, updateVisibleFields } = useUserFieldSettings(objectTypeId);
  const { viewMode, updateViewMode, groupingField, updateGroupingField } = useViewMode(objectTypeId);
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [picklistFields, setPicklistFields] = useState<ObjectField[]>([]);
  
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
      owner_id: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  // Find all picklist fields for Kanban grouping
  useEffect(() => {
    if (fields) {
      const picklistFieldsList = fields.filter(field => field.data_type === "picklist");
      setPicklistFields(picklistFieldsList);
      
      // If no grouping field is set yet but we have picklist fields, set the first one as default
      if ((!groupingField || groupingField === "") && picklistFieldsList.length > 0) {
        updateGroupingField(picklistFieldsList[0].api_name);
      }
    }
  }, [fields, groupingField, updateGroupingField]);
  
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

  const handleViewModeChange = (mode: string) => {
    updateViewMode(mode as ViewMode);
  };

  const handleGroupingFieldChange = (fieldApiName: string) => {
    updateGroupingField(fieldApiName);
  };

  // Handler for when a record is moved in Kanban view
  const handleRecordMoved = () => {
    // Refresh data after a short delay to allow the database update to complete
    setTimeout(() => {
      refetch();
    }, 500);
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

      <div className="flex justify-end mb-4">
        <Tabs value={viewMode} onValueChange={handleViewModeChange} className="w-auto">
          <TabsList>
            <TabsTrigger value="table" className="flex items-center gap-1">
              <List className="h-4 w-4" />
              <span>Table</span>
            </TabsTrigger>
            <TabsTrigger 
              value="kanban" 
              className="flex items-center gap-1"
              disabled={picklistFields.length === 0}
            >
              <Kanban className="h-4 w-4" />
              <span>Kanban</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card className="overflow-hidden">
        {isLoading || isLoadingFields ? (
          viewMode === "table" ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <KanbanSkeleton />
          )
        ) : viewMode === "table" ? (
          <RecordsTable 
            records={allRecords} 
            fields={getFieldsToDisplay()} 
            objectTypeId={objectTypeId!}
            selectable={true}
            onSelectionChange={handleRecordSelectionChange}
          />
        ) : (
          <RecordsKanban
            records={allRecords}
            fields={fields || []}
            objectTypeId={objectTypeId!}
            groupingField={groupingField}
            picklistFields={picklistFields}
            onGroupingFieldChange={handleGroupingFieldChange}
          />
        )}
      </Card>

      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleBatchDelete}
        title={`Delete ${selectedRecords.length} Records`}
        description={`Are you sure you want to delete ${selectedRecords.length} records? This action cannot be undone.`}
      />
    </div>
  );
}
