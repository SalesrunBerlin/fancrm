import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { FilterCondition } from "@/hooks/useObjectRecords";
import { useEnhancedFields } from "@/hooks/useEnhancedFields";
import { PageHeader } from "@/components/ui/page-header";
import { Loader2, Plus, Upload, Trash2, Filter, KanbanIcon, TableIcon, Copy, X } from "lucide-react";
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
import { KanbanView } from "@/components/records/KanbanView";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useUserFilterSettings } from "@/hooks/useUserFilterSettings";
import { useLayoutViewSettings } from "@/hooks/useLayoutViewSettings";
import { usePaginatedObjectRecords } from "@/hooks/usePaginatedObjectRecords";
import { useUserPaginationSettings } from "@/hooks/useUserPaginationSettings";
import { DataPagination } from "@/components/ui/data-pagination";
import { isArchived } from "@/patches/ObjectTypePatches";

export default function OptimizedRecordsList() {
  const { objectTypeId, filterId } = useParams<{ objectTypeId: string; filterId?: string }>();
  const navigate = useNavigate();
  const { objectTypes } = useObjectTypes();
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const { user } = useAuth();
  
  // Use our user settings hooks for filters, layout, and pagination
  const { 
    filters: activeFilters, 
    updateFilters: setActiveFilters, 
    settings,
    savedFilters,
    getFilterById,
    isLoading: isLoadingFilterSettings 
  } = useUserFilterSettings(objectTypeId);
  
  const { viewMode, updateViewMode } = useLayoutViewSettings(objectTypeId);
  const { pageSize, currentPage, setPageSize, setCurrentPage } = useUserPaginationSettings(objectTypeId);
  
  // Filter loading state
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [isApplyingFilterFromUrl, setIsApplyingFilterFromUrl] = useState(false);
  
  // Use our new paginated records hook
  const { 
    records, 
    totalCount, 
    totalPages, 
    isLoading, 
    deleteRecord, 
    updateRecord, 
    cloneRecord,
    error
  } = usePaginatedObjectRecords(objectTypeId, activeFilters, currentPage, pageSize);
  
  // Calculate filtered count based on active filters
  const filteredCount = activeFilters.length > 0 ? records.length : totalCount;
  // Calculate filtered pages
  const filteredPages = Math.ceil(filteredCount / pageSize);

  // Show error if records failed to load
  useEffect(() => {
    if (error) {
      console.error("Error loading records:", error);
      toast.error("Failed to load records. Please try again.");
    }
  }, [error]);

  const { fields, isLoading: isLoadingFields } = useEnhancedFields(objectTypeId);
  const objectType = objectTypes?.find(type => type.id === objectTypeId);
  
  // Apply filter from URL if filterId is provided
  // This will run only after the page has loaded and filter settings are available
  useEffect(() => {
    const applyFilterFromUrl = async () => {
      if (filterId && !isApplyingFilterFromUrl && !isLoadingFilterSettings) {
        try {
          console.log("Attempting to apply filter from URL with ID:", filterId);
          setIsApplyingFilterFromUrl(true);
          
          // Find the filter with matching ID
          const filterToApply = getFilterById(filterId);
          
          if (filterToApply && filterToApply.conditions && Array.isArray(filterToApply.conditions)) {
            console.log("Found filter to apply:", filterToApply);
            
            // Show toast notification
            toast.success(`Anwenden des Filters "${filterToApply.name}"...`);
            
            // Add a small delay to ensure the UI is updated
            setTimeout(() => {
              // Apply the filter conditions
              setActiveFilters(filterToApply.conditions);
              
              // Remove the filterId from the URL without navigating
              navigate(`/objects/${objectTypeId}/optimized`, { replace: true });
              
              // Show success message
              toast.success(`Filter "${filterToApply.name}" angewendet`);
              setIsApplyingFilterFromUrl(false);
            }, 500);
          } else {
            console.error("Filter not found with ID:", filterId);
            toast.error("Der angegebene Filter konnte nicht gefunden werden.");
            setIsApplyingFilterFromUrl(false);
            navigate(`/objects/${objectTypeId}/optimized`, { replace: true });
          }
        } catch (error) {
          console.error("Error applying filter from URL:", error);
          toast.error("Fehler beim Laden des Filters. Bitte versuchen Sie es erneut.");
          setIsApplyingFilterFromUrl(false);
          navigate(`/objects/${objectTypeId}/optimized`, { replace: true });
        }
      }
    };
    
    // Try to apply the filter if we have filters loaded and we're not already applying one
    if (!isLoadingFilterSettings && savedFilters && filterId) {
      applyFilterFromUrl();
    }
  }, [filterId, savedFilters, objectTypeId, navigate, setActiveFilters, isLoadingFilterSettings, getFilterById]);
  
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCloneDialogOpen, setIsCloneDialogOpen] = useState(false);
  const { visibleFields, updateVisibleFields } = useUserFieldSettings(objectTypeId);
  const { favoriteColor } = useAuth();
  
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

  const handleViewModeChange = (newMode: "table" | "kanban") => {
    updateViewMode(newMode);
  };

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

  const handleBatchClone = async () => {
    if (selectedRecords.length === 0) return;
    
    try {
      toast.loading(`Cloning ${selectedRecords.length} record(s)...`);
      
      // Clone each selected record
      await Promise.all(selectedRecords.map(id => cloneRecord.mutateAsync(id)));
      
      // Show success message
      toast.dismiss();
      toast.success(`${selectedRecords.length} record(s) cloned successfully`);
      
      // Clear selection
      setSelectedRecords([]);
      setIsCloneDialogOpen(false);
    } catch (error) {
      console.error("Error cloning records:", error);
      toast.dismiss();
      toast.error("Failed to clone some records");
    }
  };

  const handleFilterChange = (filters: FilterCondition[]) => {
    console.log("OptimizedRecordsList - Filters updated:", filters);
    setIsFilterLoading(true);
    setActiveFilters(filters);
    // Reset to first page when filters change
    setCurrentPage(1);
    
    // Add a small delay to show loading state
    setTimeout(() => {
      setIsFilterLoading(false);
    }, 500);
  };

  const toggleFilterPanel = () => {
    setIsFilterExpanded(!isFilterExpanded);
  };

  const clearFilters = () => {
    setIsFilterLoading(true);
    setActiveFilters([]);
    // Reset to first page when clearing filters
    setCurrentPage(1);
    
    // Add a small delay to show loading state
    setTimeout(() => {
      setIsFilterLoading(false);
    }, 300);
  };

  // Show loading state while applying filter from URL
  if (isApplyingFilterFromUrl) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin mb-4 text-primary" />
        <h2 className="text-xl font-medium">Lade Filter...</h2>
        <p className="text-muted-foreground mt-2">Bitte warten, während der Filter angewendet wird.</p>
      </div>
    );
  }

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

  // Determine if we should show loading state
  const showLoadingState = isLoading || isLoadingFields || isFilterLoading;

  return (
    <div className="space-y-6">
      <PageHeader
        title={objectType?.name || "Records"}
        description={objectType?.description || `Manage your records`}
        actions={
          <>
            {/* Toggle between Table and Kanban view */}
            <div className="flex items-center border rounded-md overflow-hidden">
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                onClick={() => handleViewModeChange("table")}
                className="rounded-none border-0"
              >
                <TableIcon className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Table</span>
              </Button>
              <Button
                variant={viewMode === "kanban" ? "default" : "ghost"}
                size="sm"
                onClick={() => handleViewModeChange("kanban")}
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
              <>
                <ThemedButton 
                  variant="outline"
                  onClick={() => setIsCloneDialogOpen(true)}
                >
                  <Copy className="mr-1.5 h-4 w-4" />
                  Clone ({selectedRecords.length})
                </ThemedButton>
                <ThemedButton 
                  variant="destructive"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-1.5 h-4 w-4" />
                  Delete ({selectedRecords.length})
                </ThemedButton>
              </>
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
            onClose={toggleFilterPanel}
          />
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
                    setActiveFilters(activeFilters.filter(f => f.id !== filter.id));
                    // Reset to first page
                    setCurrentPage(1);
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
        objectTypeName={objectType?.name || ""}
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

      {/* Main content area */}
      <Card className="overflow-hidden">
        {showLoadingState ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : records.length === 0 && activeFilters.length > 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Filter className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No records match your filters</h3>
            <p className="text-muted-foreground mt-2 mb-6">
              Try adjusting your filter criteria or creating a new record.
            </p>
            <div className="flex gap-4">
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
              <Button asChild>
                <Link to={`/objects/${objectTypeId}/new`}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  New {objectType.name}
                </Link>
              </Button>
            </div>
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <TableIcon className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No records found</h3>
            <p className="text-muted-foreground mt-2 mb-6">
              Get started by creating your first record.
            </p>
            <Button asChild>
              <Link to={`/objects/${objectTypeId}/new`}>
                <Plus className="mr-1.5 h-4 w-4" />
                New {objectType.name}
              </Link>
            </Button>
          </div>
        ) : (
          <>
            {activeFilters.length > 0 && (
              <div className="bg-muted/30 p-2 px-4 border-b text-sm">
                Showing {records.length} {records.length === 1 ? 'result' : 'results'} with active filters
              </div>
            )}
            
            {viewMode === "table" ? (
              <>
                <RecordsTable 
                  records={records} 
                  fields={getFieldsToDisplay()} 
                  objectTypeId={objectTypeId!}
                  selectable={true}
                  onSelectionChange={handleRecordSelectionChange}
                />
                <div className="border-t p-2">
                  <DataPagination
                    currentPage={currentPage}
                    totalPages={filteredPages}
                    pageSize={pageSize}
                    totalItems={totalCount}
                    filteredItemsCount={records.length}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                    showFilterStatus={activeFilters.length > 0}
                  />
                </div>
              </>
            ) : (
              <div className="p-4">
                <KanbanView
                  records={records}
                  fields={fields || []}
                  objectTypeId={objectTypeId!}
                  onUpdateRecord={async (recordId, fieldValues) => {
                    try {
                      await updateRecord.mutateAsync({
                        id: recordId,
                        field_values: fieldValues
                      });
                    } catch (error) {
                      console.error("Error updating record:", error);
                      throw error;
                    }
                  }}
                />
                <div className="mt-4">
                  <DataPagination
                    currentPage={currentPage}
                    totalPages={filteredPages}
                    pageSize={pageSize}
                    totalItems={totalCount}
                    filteredItemsCount={records.length}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                    showFilterStatus={activeFilters.length > 0}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Delete Dialog */}
      <DeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleBatchDelete}
        title={`Delete ${selectedRecords.length} Records`}
        description={`Are you sure you want to delete ${selectedRecords.length} records? This action cannot be undone.`}
      />

      {/* Clone Dialog */}
      <DeleteDialog
        open={isCloneDialogOpen}
        onOpenChange={setIsCloneDialogOpen}
        onConfirm={handleBatchClone}
        title={`Clone ${selectedRecords.length} Records`}
        description={`Are you sure you want to clone the selected ${selectedRecords.length} record(s)? This will create new copies with "_copy" added to their name fields.`}
        confirmText="Clone"
        confirmVariant="success"
        icon={<Copy className="h-6 w-6 text-primary" />}
      />
    </div>
  );
}
