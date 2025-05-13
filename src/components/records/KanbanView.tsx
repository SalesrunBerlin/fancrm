
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { ObjectField, ObjectRecord } from '@/types/ObjectFieldTypes';
import { KanbanCard } from './KanbanCard';
import { Loader2, PlusCircle, Check, Settings, PenLine } from 'lucide-react'; 
import { useKanbanViewSettings } from "@/hooks/useKanbanViewSettings";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { KanbanFieldsDialog } from './KanbanFieldsDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFieldPicklistValues } from "@/hooks/useFieldPicklistValues";

interface KanbanViewProps {
  records: ObjectRecord[];
  fields: ObjectField[];
  objectTypeId: string;
  onUpdateRecord: (recordId: string, fieldValues: Record<string, any>) => Promise<void>;
}

export function KanbanView({ records, fields, objectTypeId, onUpdateRecord }: KanbanViewProps) {
  // Find all suitable picklist fields for the Kanban view
  const picklistFields = fields.filter(field => field.data_type === 'picklist');
  
  const { 
    settings, 
    updateFieldApiName, 
    updateVisibleCardFields, 
    getVisibleCardFields,
    isLoading: isKanbanSettingsLoading
  } = useKanbanViewSettings(objectTypeId);
  
  const isMobile = useIsMobile();
  
  // Get visible card fields from settings
  const visibleCardFields = getVisibleCardFields();
  
  // State for field editor dialog
  const [showFieldEditor, setShowFieldEditor] = useState(false);
  
  // State for selected records (for batch operations)
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  
  // Find the status field based on settings or default to first picklist field
  const statusField = fields.find(field => 
    field.api_name === settings.fieldApiName
  ) || picklistFields[0] || fields.find(field => field.data_type === 'picklist');
  
  // Get all available picklist values for the selected field
  const { picklistValues, isLoading: isLoadingPicklistValues } = useFieldPicklistValues(
    statusField?.id || ''
  );
  
  const [columns, setColumns] = useState<{[key: string]: ObjectRecord[]}>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [activeDroppable, setActiveDroppable] = useState<string | null>(null);
  const buttonsRef = useRef<{[key: string]: HTMLDivElement | null}>({});

  // Set initial field API name if none is saved
  useEffect(() => {
    if (statusField && (!settings.fieldApiName || !fields.some(f => f.api_name === settings.fieldApiName))) {
      console.log("Setting initial field API name:", statusField.api_name);
      updateFieldApiName(statusField.api_name);
    }
  }, [statusField, settings.fieldApiName, updateFieldApiName, fields]);

  useEffect(() => {
    if (!statusField || records.length === 0 && !picklistValues?.length) {
      setIsLoading(false);
      return;
    }

    // Organize records into columns based on status field and all available picklist values
    const kanbanColumns: {[key: string]: ObjectRecord[]} = {};
    
    // First, create an "Uncategorized" column for records without a status
    kanbanColumns["uncategorized"] = [];
    
    // Create columns for all available picklist values from the database
    if (picklistValues && picklistValues.length > 0) {
      picklistValues.forEach(option => {
        kanbanColumns[option.value] = [];
      });
    } else {
      // If no picklist values are defined yet, create columns from record values
      const statusValues = new Set<string>();
      records.forEach(record => {
        const status = record.field_values?.[statusField.api_name];
        if (status) {
          statusValues.add(status);
        }
      });
      
      statusValues.forEach(status => {
        kanbanColumns[status] = [];
      });
    }
    
    // Put records in their respective columns
    records.forEach(record => {
      // Add the category field name to each record for reference
      const recordWithCategory = {
        ...record,
        kanbanCategoryField: statusField.api_name
      };
      
      const status = record.field_values?.[statusField.api_name];
      if (status && kanbanColumns[status]) {
        kanbanColumns[status].push(recordWithCategory);
      } else {
        kanbanColumns["uncategorized"].push(recordWithCategory);
      }
    });
    
    setColumns(kanbanColumns);
    setIsLoading(false);
  }, [records, statusField, picklistValues]);

  const handleDragStart = (result: any) => {
    setDraggedElement(result.draggableId);
  };

  const handleDragEnterButton = (columnId: string) => {
    setActiveDroppable(columnId);
  };

  const handleDragLeaveButton = () => {
    // We don't reset here since we want the highlight to persist
    // until another column is entered or drag ends
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    
    setDraggedElement(null);
    setActiveDroppable(null);
    
    // If dropped outside a droppable area or in the same column
    if (
      !destination || 
      (source.droppableId === destination.droppableId && 
       source.index === destination.index)
    ) {
      return;
    }
    
    // Find the record being moved
    const record = records.find(r => r.id === draggableId);
    if (!record || !statusField) return;
    
    // Create updated record data
    const newStatus = destination.droppableId === "uncategorized" ? null : destination.droppableId;
    const updatedFieldValues = {
      [statusField.api_name]: newStatus
    };
    
    // Create a deep copy of the columns to avoid direct state mutation
    const newColumns = {...columns};
    
    // Create copies of the source and destination columns
    const sourceColumn = [...(newColumns[source.droppableId] || [])];
    const destColumn = [...(newColumns[destination.droppableId] || [])];
    
    // Remove from source column
    const [movedRecord] = sourceColumn.splice(source.index, 1);
    
    // Create a copy of the moved record with updated field values
    // but PRESERVE the original display name and other properties
    const updatedRecord = {
      ...movedRecord,
      field_values: {
        ...movedRecord.field_values,
        [statusField.api_name]: newStatus
      }
    };
    
    // Add to destination column
    destColumn.splice(destination.index, 0, updatedRecord);
    
    // Update columns in state
    newColumns[source.droppableId] = sourceColumn;
    newColumns[destination.droppableId] = destColumn;
    setColumns(newColumns);
    
    try {
      // Update the record in the database
      await onUpdateRecord(draggableId, updatedFieldValues);
    } catch (error) {
      console.error("Failed to update record status:", error);
      
      // Revert the UI change on error
      setColumns({
        ...columns,
        [source.droppableId]: columns[source.droppableId] || [],
        [destination.droppableId]: columns[destination.droppableId] || []
      });
      
      toast.error("Failed to update record status");
    }
  };

  // Handle changing the selected field for Kanban view
  const handleFieldChange = (fieldApiName: string) => {
    console.log("Updating field API name to:", fieldApiName);
    updateFieldApiName(fieldApiName);
  };

  // Handle toggling selection mode
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    // Clear selections when exiting selection mode
    if (selectionMode) {
      setSelectedRecords([]);
    }
  };

  // Handle selection of a record
  const handleRecordSelection = (recordId: string, selected: boolean) => {
    if (selected) {
      setSelectedRecords(prev => [...prev, recordId]);
    } else {
      setSelectedRecords(prev => prev.filter(id => id !== recordId));
    }
  };

  // Handle saving selected fields for card display
  const handleSaveVisibleFields = (selectedFields: string[]) => {
    console.log("Saving visible fields:", selectedFields);
    updateVisibleCardFields(selectedFields);
  };

  // Handle batch update of selected records
  const handleBatchUpdate = async (newStatus: string) => {
    if (selectedRecords.length === 0 || !statusField) return;

    try {
      toast.loading(`Updating ${selectedRecords.length} records...`);
      
      // Update each selected record with the new status
      await Promise.all(selectedRecords.map(recordId => 
        onUpdateRecord(recordId, { [statusField.api_name]: newStatus })
      ));
      
      toast.dismiss();
      toast.success(`Updated ${selectedRecords.length} records to "${newStatus}"`);
      
      // Clear selections after successful update
      setSelectedRecords([]);
      setSelectionMode(false);
    } catch (error) {
      console.error("Failed to update records:", error);
      toast.dismiss();
      toast.error("Failed to update some records");
    }
  };

  if (isLoading || isLoadingPicklistValues || isKanbanSettingsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!statusField) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          No picklist field found for Kanban view. Please create a status or picklist field.
        </p>
      </div>
    );
  }

  // Get all column IDs for display
  const allColumnIds = Object.keys(columns);
  
  // Move "uncategorized" to the end
  const sortedColumnIds = allColumnIds.filter(id => id !== "uncategorized");
  if (allColumnIds.includes("uncategorized")) {
    sortedColumnIds.push("uncategorized");
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Kanban view controls for mobile and desktop */}
      <div className="flex flex-col sm:flex-row justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Select 
            value={statusField.api_name} 
            onValueChange={handleFieldChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select field" />
            </SelectTrigger>
            <SelectContent>
              {picklistFields.map(field => (
                <SelectItem key={field.api_name} value={field.api_name}>
                  {field.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant={selectionMode ? "default" : "outline"}
            size="sm"
            onClick={toggleSelectionMode}
            className="ml-2"
          >
            {selectionMode ? "Cancel Selection" : "Select Items"}
          </Button>

          {/* Add Edit button for fields selection */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowFieldEditor(true)}
            className="ml-1"
            title="Edit card fields"
          >
            <PenLine className="h-4 w-4" />
          </Button>
        </div>

        {/* Batch update dropdown - only visible when records are selected */}
        {selectedRecords.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {selectedRecords.length} selected
            </span>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm">
                  Move To...
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {/* Show "uncategorized" option */}
                <DropdownMenuItem 
                  onClick={() => handleBatchUpdate("")}
                >
                  Uncategorized
                </DropdownMenuItem>
                
                {/* Show all picklist values from the database, not just those with records */}
                {picklistValues && picklistValues.map((option) => (
                  <DropdownMenuItem 
                    key={option.id}
                    onClick={() => handleBatchUpdate(option.value)}
                  >
                    {option.label}
                    {option.value === statusField.api_name && <Check className="ml-2 h-4 w-4" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
        
      {/* Fields selection dialog */}
      <KanbanFieldsDialog
        isOpen={showFieldEditor}
        onOpenChange={setShowFieldEditor}
        fields={fields}
        selectedFields={visibleCardFields}
        onSave={handleSaveVisibleFields}
      />

      {/* Kanban board */}
      <div className="overflow-auto pb-4">
        <DragDropContext
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4 min-h-[70vh]">
            {sortedColumnIds.map((columnId) => (
              <div 
                key={columnId}
                className={`flex-shrink-0 w-72 bg-card rounded-md border shadow-sm flex flex-col ${
                  activeDroppable === columnId ? 'border-primary border-2' : ''
                }`}
                ref={(el) => {
                  if (el) {
                    buttonsRef.current[columnId] = el;
                  }
                }}
                onMouseEnter={() => draggedElement && handleDragEnterButton(columnId)}
                onMouseLeave={() => draggedElement && handleDragLeaveButton()}
              >
                <CardHeader className="py-3 px-4 border-b bg-muted/50">
                  <h3 className="text-sm font-medium">
                    {columnId === "uncategorized" ? "Uncategorized" : 
                     picklistValues?.find(pv => pv.value === columnId)?.label || columnId}
                  </h3>
                  <div className="text-xs text-muted-foreground">{columns[columnId].length} records</div>
                </CardHeader>
                <Droppable droppableId={columnId}>
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="flex-1 p-2 overflow-y-auto"
                      style={{ minHeight: '200px' }}
                    >
                      {columns[columnId].map((record, index) => (
                        <Draggable 
                          key={record.id} 
                          draggableId={record.id} 
                          index={index}
                          isDragDisabled={selectionMode}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <KanbanCard
                                record={record}
                                objectTypeId={objectTypeId}
                                isDragging={snapshot.isDragging}
                                isSelected={selectedRecords.includes(record.id)}
                                onSelect={handleRecordSelection}
                                selectionMode={selectionMode}
                                visibleFields={visibleCardFields}
                                fields={fields}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
                <div className="p-2 border-t">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start text-muted-foreground"
                    onClick={() => {
                      // Implement add new record functionality
                    }}
                  >
                    <PlusCircle className="mr-1 h-4 w-4" />
                    Add Record
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}
