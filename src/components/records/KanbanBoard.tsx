
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Eye, Loader2 } from "lucide-react";
import { useFieldPicklistValues } from "@/hooks/useFieldPicklistValues";
import { useObjectFields } from "@/hooks/useObjectFields";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { ObjectRecord } from "@/hooks/useObjectRecords";
import { ObjectField } from "@/hooks/useObjectTypes";
import { useLookupBatchLoader } from "@/hooks/useLookupBatchLoader";
import { toast } from "sonner";

interface KanbanBoardProps {
  records: ObjectRecord[];
  loading: boolean;
  objectTypeId: string;
  kanbanFieldApiName: string | undefined;
  visibleFields: string[];
  onUpdateRecord?: (id: string, updates: Record<string, any>) => Promise<void>;
}

export function KanbanBoard({
  records,
  loading,
  objectTypeId,
  kanbanFieldApiName,
  visibleFields,
  onUpdateRecord
}: KanbanBoardProps) {
  const [columns, setColumns] = useState<Record<string, ObjectRecord[]>>({});
  const [fieldDetails, setFieldDetails] = useState<ObjectField | null>(null);
  const { fields } = useObjectFields(objectTypeId);
  
  // Get picklist values for the kanban field
  const { picklistValues, isLoading: isLoadingPicklist } = useFieldPicklistValues(
    fieldDetails?.id || ''
  );
  
  // Get the kanban field details
  useEffect(() => {
    if (fields && kanbanFieldApiName) {
      const field = fields.find(f => f.api_name === kanbanFieldApiName);
      if (field) {
        setFieldDetails(field);
      }
    }
  }, [fields, kanbanFieldApiName]);
  
  // Organize records into columns
  useEffect(() => {
    if (!records || !kanbanFieldApiName) return;
    
    // Create Empty Column
    const emptyColumn: ObjectRecord[] = [];
    
    // Create initial columns structure based on picklist values
    const initialColumns: Record<string, ObjectRecord[]> = {};
    
    // Add "Empty" column for records with no value
    initialColumns["empty"] = [...emptyColumn];
    
    // Add columns for each picklist value
    if (picklistValues) {
      picklistValues.forEach(pv => {
        initialColumns[pv.value] = [];
      });
    }
    
    // Distribute records into columns
    records.forEach(record => {
      const value = record.field_values?.[kanbanFieldApiName];
      const columnKey = value || "empty";
      
      if (initialColumns[columnKey]) {
        initialColumns[columnKey].push(record);
      } else {
        // If column doesn't exist (custom value), create it
        initialColumns[columnKey] = [record];
      }
    });
    
    setColumns(initialColumns);
  }, [records, kanbanFieldApiName, picklistValues]);
  
  // Handle drag and drop
  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    
    // Dropped outside a valid droppable area
    if (!destination) return;
    
    // Dropped in the same column at the same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;
    
    // Get source and destination column
    const sourceColumn = columns[source.droppableId];
    const destinationColumn = columns[destination.droppableId];
    
    if (!sourceColumn || !destinationColumn) return;
    
    // Find the record that was moved
    const movedRecord = sourceColumn.find(record => record.id === draggableId);
    if (!movedRecord) return;
    
    // Create new columns state
    const newColumns = { ...columns };
    
    // Remove from source column
    newColumns[source.droppableId] = sourceColumn.filter(
      record => record.id !== draggableId
    );
    
    // Add to destination column
    const newDestinationColumn = [...destinationColumn];
    newDestinationColumn.splice(destination.index, 0, movedRecord);
    newColumns[destination.droppableId] = newDestinationColumn;
    
    // Update columns state optimistically
    setColumns(newColumns);
    
    // Only update record if column changed and handler provided
    if (
      source.droppableId !== destination.droppableId && 
      onUpdateRecord &&
      kanbanFieldApiName
    ) {
      try {
        // Update the record with the new column value
        // If "empty" column, set to null or empty string based on field type
        const newValue = destination.droppableId === "empty" ? "" : destination.droppableId;
        
        await onUpdateRecord(draggableId, {
          [kanbanFieldApiName]: newValue
        });
        
      } catch (error) {
        console.error("Failed to update record:", error);
        toast.error("Failed to move record", {
          description: "The record couldn't be moved. Please try again."
        });
        
        // Revert to original state if update fails
        setColumns(columns);
      }
    }
  };
  
  // Extract visible fields for card display
  const getVisibleFieldsForRecord = (record: ObjectRecord) => {
    if (!visibleFields || !fields) return [];
    
    return visibleFields
      .filter(apiName => apiName !== kanbanFieldApiName) // Don't show the kanban field itself
      .map(apiName => {
        const fieldDef = fields.find(f => f.api_name === apiName);
        if (!fieldDef) return null;
        
        const value = record.field_values?.[apiName];
        return {
          name: fieldDef.name,
          value: value !== undefined && value !== null ? String(value) : "—",
          apiName,
          isRequired: fieldDef.is_required
        };
      })
      .filter(Boolean); // Remove any null values
  };
  
  if (loading || isLoadingPicklist) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (!kanbanFieldApiName) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-2">
        <p className="text-muted-foreground">No picklist field selected for Kanban view</p>
        <Button asChild>
          <Link to={`/objects/${objectTypeId}/configure`}>
            Configure Kanban View
          </Link>
        </Button>
      </div>
    );
  }
  
  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max p-1">
          {Object.entries(columns).map(([columnId, columnRecords]) => (
            <div 
              key={columnId} 
              className="w-80 shrink-0 flex flex-col rounded-lg border"
            >
              <div className="p-3 border-b bg-muted/30">
                <h3 className="font-medium">
                  {columnId === "empty" ? (
                    "No Value"
                  ) : (
                    picklistValues?.find(pv => pv.value === columnId)?.label || columnId
                  )}
                  <Badge variant="outline" className="ml-2">
                    {columnRecords.length}
                  </Badge>
                </h3>
              </div>
              
              <Droppable droppableId={columnId}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[600px]"
                  >
                    {columnRecords.map((record, index) => (
                      <Draggable 
                        key={record.id} 
                        draggableId={record.id} 
                        index={index}
                      >
                        {(provided) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="mb-2 shadow-sm hover:shadow-md transition-shadow"
                          >
                            <CardContent className="p-3 space-y-2">
                              {getVisibleFieldsForRecord(record).map((field, i) => (
                                field && (
                                  <div key={field.apiName} className="space-y-1">
                                    <p className="text-xs text-muted-foreground">{field.name}</p>
                                    <p className="text-sm font-medium truncate">{field.value}</p>
                                  </div>
                                )
                              ))}
                            </CardContent>
                            <CardFooter className="p-2 pt-0 flex justify-end border-t">
                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                className="h-8 w-8 p-0"
                              >
                                <Link to={`/objects/${objectTypeId}/${record.id}`}>
                                  <Eye className="h-4 w-4" />
                                  <span className="sr-only">View</span>
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                className="h-8 w-8 p-0"
                              >
                                <Link to={`/objects/${objectTypeId}/${record.id}/edit`}>
                                  <Edit className="h-4 w-4" />
                                  <span className="sr-only">Edit</span>
                                </Link>
                              </Button>
                            </CardFooter>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </div>
    </DragDropContext>
  );
}
