
import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useObjectRecords, FilterCondition } from "@/hooks/useObjectRecords";
import { useEnhancedFields } from "@/hooks/useEnhancedFields";
import { PageHeader } from "@/components/ui/page-header";
import { Loader2, Plus, Upload, Trash2, Filter, KanbanIcon, TableIcon } from "lucide-react";
import { RecordsTable } from "@/components/records/RecordsTable";
import { Card } from "@/components/ui/card";
import { FieldsConfigDialog } from "@/components/records/FieldsConfigDialog";
import { useUserFieldSettings } from "@/hooks/useUserFieldSettings";
import { ObjectField } from "@/hooks/useObjectTypes";
import { DeleteDialog } from "@/components/common/DeleteDialog";
import { toast } from "sonner";
import { EnhancedObjectField, toSafeObjectField } from "@/patches/FixObjectFieldType";
import { ObjectActionsSection } from "@/components/actions/ObjectActionsSection";
import { ThemedButton } from "@/components/ui/themed-button";
import { useAuth } from "@/contexts/AuthContext";
import { ActionColor } from "@/hooks/useActions";
import { ObjectRecordsFilter } from "@/components/records/ObjectRecordsFilter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toggle } from "@/components/ui/toggle";
import { KanbanView } from "@/components/records/KanbanView";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function ObjectRecordsList() {
  const { objectTypeId } = useParams<{ objectTypeId: string }>();
  const { objectTypes } = useObjectTypes();
  const [activeFilters, setActiveFilters] = useState<FilterCondition[]>([]);
  const { records, isLoading, deleteRecord } = useObjectRecords(objectTypeId, activeFilters);
  const { fields, isLoading: isLoadingFields } = useEnhancedFields(objectTypeId);
  const objectType = objectTypes?.find(type => type.id === objectTypeId);
  const [allRecords, setAllRecords] = useState<any[]>([]);
  const { visibleFields, updateVisibleFields } = useUserFieldSettings(objectTypeId);
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { favoriteColor } = useAuth();
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  
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

  const handleFilterChange = (filters: FilterCondition[]) => {
    console.log("Filters updated:", filters);
    setActiveFilters(filters);
  };

  const toggleFilterPanel = () => {
    setIsFilterExpanded(!isFilterExpanded);
  };

  const clearFilters = () => {
    setActiveFilters([]);
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

  // All available fields for filtering (both regular and system fields)
  const allFields = [...(fields || []), ...systemFields.map(field => toSafeObjectField(field))];

  return (
    <div className="space-y-6">
      <PageHeader
        title={objectType.name}
        description={objectType.description || `Manage your ${objectType.name.toLowerCase()}`}
        actions={
          <>
            {/* Toggle between Table and Kanban view */}
            <div className="flex items-center border rounded-md overflow-hidden">
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="rounded-none border-0"
              >
                <TableIcon className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Table</span>
              </Button>
              <Button
                variant={viewMode === "kanban" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("kanban")}
                className="rounded-none border-0"
              >
                <KanbanIcon className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Kanban</span>
              </Button>
            </div>
            
            {/* Filter button - icon only with tooltip */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleFilterPanel}
                    className="relative"
                  >
                    <Filter className="h-4 w-4" />
                    {activeFilters.length > 0 && (
                      <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                        {activeFilters.length}
                      </span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Filter records</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <FieldsConfigDialog
              objectTypeId={objectTypeId!}
              onVisibilityChange={handleVisibilityChange}
            />
            <ThemedButton 
              variant="outline"
              asChild
            >
              <Link to={`/objects/${objectTypeId}/import`}>
                <Upload className="mr-1.5 h-4 w-4" />
                Import
              </Link>
            </ThemedButton>
            {selectedRecords.length > 0 && (
              <ThemedButton 
                variant="destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                Delete Selected ({selectedRecords.length})
              </ThemedButton>
            )}
            <ThemedButton 
              variant={(favoriteColor as ActionColor) || "default"}
              asChild
            >
              <Link to={`/objects/${objectTypeId}/new`}>
                <Plus className="mr-1.5 h-4 w-4" />
                New {objectType.name}
              </Link>
            </ThemedButton>
          </>
        }
      />

      {/* Filter panel */}
      {isFilterExpanded && (
        <Card className="p-4">
          <ObjectRecordsFilter 
            objectTypeId={objectTypeId!} 
            fields={allFields} 
            onFilterChange={handleFilterChange}
            activeFilters={activeFilters}
          />
          {activeFilters.length > 0 && (
            <div className="flex justify-end mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
              >
                Clear All Filters
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Show active filters summary if any and panel is collapsed */}
      {activeFilters.length > 0 && !isFilterExpanded && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium">Active Filters:</span>
          {activeFilters.map(filter => {
            const fieldName = allFields.find(f => f.api_name === filter.fieldApiName)?.name || filter.fieldApiName;
            return (
              <span 
                key={filter.id} 
                className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-muted"
              >
                {fieldName} {filter.operator} {filter.value}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-4 w-4 p-0 ml-1" 
                  onClick={() => {
                    setActiveFilters(prev => prev.filter(f => f.id !== filter.id));
                  }}
                >
                  <span className="sr-only">Remove</span>
                  ×
                </Button>
              </span>
            );
          })}
          <Button 
            variant="link" 
            size="sm" 
            className="text-xs" 
            onClick={clearFilters}
          >
            Clear All
          </Button>
        </div>
      )}

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

      {/* Main content area with tabs for table and kanban views */}
      <Card className="overflow-hidden">
        {isLoading || isLoadingFields ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            {activeFilters.length > 0 && (
              <div className="bg-muted/30 p-2 px-4 border-b text-sm">
                Showing {allRecords.length} {allRecords.length === 1 ? 'result' : 'results'} with active filters
              </div>
            )}
            
            {viewMode === "table" ? (
              <RecordsTable 
                records={allRecords} 
                fields={getFieldsToDisplay()} 
                objectTypeId={objectTypeId!}
                selectable={true}
                onSelectionChange={handleRecordSelectionChange}
              />
            ) : (
              <div className="p-4">
                <KanbanView
                  records={allRecords}
                  fields={fields || []}
                  objectTypeId={objectTypeId!}
                />
              </div>
            )}
          </>
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
