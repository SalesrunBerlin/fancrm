
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { ObjectField, ObjectRecord } from '@/types/ObjectFieldTypes';
import { KanbanCard } from './KanbanCard';
import { Loader2, PlusCircle } from 'lucide-react';

interface KanbanViewProps {
  records: ObjectRecord[];
  fields: ObjectField[];
  objectTypeId: string;
  onUpdateRecord: (recordId: string, fieldValues: Record<string, any>) => Promise<void>;
}

export function KanbanView({ records, fields, objectTypeId, onUpdateRecord }: KanbanViewProps) {
  // Find a suitable status field for the Kanban view
  const statusField = fields.find(field => 
    field.api_name.toLowerCase().includes('status') && field.data_type === 'picklist'
  ) || fields.find(field => field.data_type === 'picklist');
  
  const [columns, setColumns] = useState<{[key: string]: ObjectRecord[]}>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [activeDroppable, setActiveDroppable] = useState<string | null>(null);
  const buttonsRef = useRef<{[key: string]: HTMLDivElement | null}>({});

  useEffect(() => {
    if (!statusField || records.length === 0) {
      setIsLoading(false);
      return;
    }

    // Organize records into columns based on status field
    const kanbanColumns: {[key: string]: ObjectRecord[]} = {};
    
    // First, create columns for all possible status values
    const statusValues = new Set<string>();
    records.forEach(record => {
      const status = record.field_values?.[statusField.api_name];
      if (status) {
        statusValues.add(status);
      }
    });
    
    // Create an "Uncategorized" column for records without a status
    kanbanColumns["uncategorized"] = [];
    
    // Create columns for each status value
    statusValues.forEach(status => {
      kanbanColumns[status] = [];
    });
    
    // Put records in their respective columns
    records.forEach(record => {
      const status = record.field_values?.[statusField.api_name];
      if (status && kanbanColumns[status]) {
        kanbanColumns[status].push(record);
      } else {
        kanbanColumns["uncategorized"].push(record);
      }
    });
    
    setColumns(kanbanColumns);
    setIsLoading(false);
  }, [records, statusField]);

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
    
    // Update the Kanban view immediately for a responsive feel
    const sourceColumn = [...(columns[source.droppableId] || [])];
    const destColumn = [...(columns[destination.droppableId] || [])];
    
    // Remove from source column
    const [movedRecord] = sourceColumn.splice(source.index, 1);
    
    // Add to destination column
    destColumn.splice(destination.index, 0, movedRecord);
    
    // Update UI
    setColumns({
      ...columns,
      [source.droppableId]: sourceColumn,
      [destination.droppableId]: destColumn
    });
    
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
    }
  };

  if (isLoading) {
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

  return (
    <div className="overflow-auto pb-4">
      <DragDropContext
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 min-h-[70vh]">
          {Object.keys(columns).map((columnId) => (
            <div 
              key={columnId}
              className={`flex-shrink-0 w-72 bg-card rounded-md border shadow-sm flex flex-col ${
                activeDroppable === columnId ? 'border-primary border-2' : ''
              }`}
              ref={(el) => {
                // Use a proper type assertion for the current element
                if (el) {
                  buttonsRef.current[columnId] = el;
                }
              }}
              onMouseEnter={() => draggedElement && handleDragEnterButton(columnId)}
              onMouseLeave={() => draggedElement && handleDragLeaveButton()}
            >
              <CardHeader className="py-3 px-4 border-b bg-muted/50">
                <h3 className="text-sm font-medium">{columnId === "uncategorized" ? "Uncategorized" : columnId}</h3>
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
                      <Draggable key={record.id} draggableId={record.id} index={index}>
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
  );
}
