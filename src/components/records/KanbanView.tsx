
import { useState, useEffect, useRef } from "react";
import { ObjectRecord } from "@/types/ObjectFieldTypes";
import { ObjectField } from "@/hooks/useObjectTypes";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DragDropContext, Droppable, Draggable, DropResult, DragStart, DragUpdate } from "@hello-pangea/dnd";
import { KanbanCard } from "./KanbanCard";
import { useObjectRecords } from "@/hooks/useObjectRecords";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Accordion, 
  AccordionItem, 
  AccordionTrigger, 
  AccordionContent 
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChevronDown, ChevronUp, MoveVertical, MoveHorizontal, ArrowLeft, ArrowRight } from "lucide-react";
import { useFieldPicklistValues } from "@/hooks/useFieldPicklistValues";
import { useKanbanViewSettings } from "@/hooks/useKanbanViewSettings";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface KanbanViewProps {
  records: ObjectRecord[];
  fields: ObjectField[];
  objectTypeId: string;
  onUpdateRecord?: (recordId: string, fieldValues: Record<string, any>) => Promise<void>;
}

export function KanbanView({ records, fields, objectTypeId, onUpdateRecord }: KanbanViewProps) {
  // Check if we're on mobile
  const isMobile = useIsMobile();
  
  // Find all picklist fields
  const picklistFields = fields.filter(field => field.data_type === "picklist");
  
  // Use the kanban view settings hook to persist state
  const { settings, updateFieldApiName, toggleColumnExpansion } = useKanbanViewSettings(objectTypeId);
  
  // State for selected picklist field
  const [selectedFieldApiName, setSelectedFieldApiName] = useState<string>(
    settings.fieldApiName || (picklistFields.length > 0 ? picklistFields[0].api_name : "")
  );

  // Update the persisted settings when field changes
  useEffect(() => {
    if (selectedFieldApiName) {
      updateFieldApiName(selectedFieldApiName);
    }
  }, [selectedFieldApiName, updateFieldApiName]);

  // Selected field object
  const selectedField = fields.find(field => field.api_name === selectedFieldApiName);
  
  // Get field ID for picklist values query
  const selectedFieldId = selectedField?.id || "";
  
  // Get picklist values from database using the hook
  const { picklistValues, isLoading: isLoadingPicklistValues } = useFieldPicklistValues(selectedFieldId);
  
  // Group records by picklist value
  const [groupedRecords, setGroupedRecords] = useState<Record<string, ObjectRecord[]>>({});

  // Active accordion item for mobile view
  const [activeColumn, setActiveColumn] = useState<string | null>(settings.expandedColumns[0] || null);
  
  // Get field values from our hook
  const { updateRecord } = useObjectRecords(objectTypeId);

  // Refs for auto-scrolling during drag
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const scrolling = useRef<boolean>(false);
  const scrollSpeed = useRef<number>(0);
  const scrollDirection = useRef<'left' | 'right' | null>(null);
  const autoScrollIntervalRef = useRef<number | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  // Group records by the selected picklist value
  useEffect(() => {
    if (!selectedFieldApiName || !records.length) {
      setGroupedRecords({});
      return;
    }

    const grouped: Record<string, ObjectRecord[]> = {};
    
    // Initialize groups for all picklist values from database
    if (picklistValues && picklistValues.length > 0) {
      picklistValues.forEach(option => {
        grouped[option.value] = [];
      });
    } else {
      // If no picklist values, create a default "none" group
      grouped["none"] = [];
    }

    // Group records
    records.forEach(record => {
      const fieldValue = record.field_values?.[selectedFieldApiName];
      
      if (fieldValue && grouped[fieldValue]) {
        grouped[fieldValue].push(record);
      } else {
        // If the value doesn't match a known option, create a group for it
        // This ensures data integrity when values exist in records but not in picklist options
        if (fieldValue) {
          if (!grouped[fieldValue]) {
            grouped[fieldValue] = [];
          }
          grouped[fieldValue].push(record);
        } else {
          // If no value, put in "none" group
          if (!grouped["none"]) {
            grouped["none"] = [];
          }
          grouped["none"].push(record);
        }
      }
    });
    
    setGroupedRecords(grouped);
    
    // Set first column as active on mobile if none is active yet
    if (isMobile && !activeColumn && Object.keys(grouped).length > 0) {
      // Find first column with records
      const firstColumnWithRecords = Object.keys(grouped).find(key => grouped[key].length > 0) || Object.keys(grouped)[0];
      setActiveColumn(firstColumnWithRecords);
      toggleColumnExpansion(firstColumnWithRecords, true);
    }
  }, [records, selectedFieldApiName, picklistValues, isMobile, activeColumn, toggleColumnExpansion]);

  // Auto-scroll function that runs during drag operations
  const autoScroll = () => {
    if (!scrolling.current || !scrollAreaRef.current || !scrollDirection.current) return;
    
    const scrollContainer = scrollAreaRef.current;
    const currentScrollLeft = scrollContainer.scrollLeft;
    
    if (scrollDirection.current === 'right') {
      scrollContainer.scrollTo({
        left: currentScrollLeft + scrollSpeed.current,
        behavior: 'auto'  // Use 'auto' for smoother continuous scrolling
      });
    } else if (scrollDirection.current === 'left') {
      scrollContainer.scrollTo({
        left: currentScrollLeft - scrollSpeed.current,
        behavior: 'auto'
      });
    }
  };

  // Setup auto-scroll interval when dragging starts
  useEffect(() => {
    if (isDraggingRef.current && !autoScrollIntervalRef.current) {
      autoScrollIntervalRef.current = window.setInterval(autoScroll, 16); // ~60fps
    }
    
    return () => {
      if (autoScrollIntervalRef.current) {
        window.clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
    };
  }, [isDraggingRef.current]);

  // Handle drag start event
  const handleDragStart = (initial: DragStart) => {
    isDraggingRef.current = true;
  };

  // Handle drag update to detect if we need to auto-scroll
  const handleDragUpdate = (update: DragUpdate) => {
    if (!isMobile || !scrollAreaRef.current) return;

    const scrollContainer = scrollAreaRef.current;
    const containerRect = scrollContainer.getBoundingClientRect();
    
    // If no client coordinates in the update, return
    if (!update.clientX) return;
    
    // Define scroll hotspots (30% of container width on each edge)
    const scrollThreshold = containerRect.width * 0.3;
    const leftEdge = containerRect.left + scrollThreshold;
    const rightEdge = containerRect.right - scrollThreshold;
    
    // Check if cursor is in the scrolling hotspot areas
    if (update.clientX < leftEdge) {
      const distance = leftEdge - update.clientX;
      scrollDirection.current = 'left';
      scrollSpeed.current = Math.min(15, distance / 10 + 5); // Dynamic speed based on distance
      scrolling.current = true;
    } else if (update.clientX > rightEdge) {
      const distance = update.clientX - rightEdge;
      scrollDirection.current = 'right';
      scrollSpeed.current = Math.min(15, distance / 10 + 5);
      scrolling.current = true;
    } else {
      scrolling.current = false;
      scrollDirection.current = null;
    }
  };

  // Handle drag end - update record with new status
  const handleDragEnd = async (result: DropResult) => {
    // Reset drag-related refs
    isDraggingRef.current = false;
    scrolling.current = false;
    scrollDirection.current = null;
    
    if (!result.destination || !selectedFieldApiName || !onUpdateRecord) return;
    
    const { draggableId, destination } = result;
    const recordId = draggableId;
    const newValue = destination.droppableId === "none" ? null : destination.droppableId;
    
    // Update record
    try {
      // Call the update function
      await updateRecord.mutateAsync({
        id: recordId,
        field_values: {
          [selectedFieldApiName]: newValue
        }
      });

      // When on mobile, activate the destination column
      if (isMobile) {
        setActiveColumn(destination.droppableId);
        toggleColumnExpansion(destination.droppableId, true);
      }
    } catch (error) {
      console.error("Error updating record:", error);
    }
  };

  // Function to get the display label for a column value
  const getColumnLabel = (columnValue: string) => {
    if (columnValue === "none") return "Not assigned";
    
    // Find the matching picklist value for this column
    const picklistOption = picklistValues?.find(pv => pv.value === columnValue);
    return picklistOption?.label || columnValue;
  };

  // Calculate total records across all columns
  const totalRecords = Object.values(groupedRecords).reduce(
    (total, records) => total + records.length, 
    0
  );

  // Helper function to scroll container to a column
  const scrollToColumn = (columnId: string) => {
    if (!scrollAreaRef.current) return;
    
    const columnElement = document.getElementById(`kanban-column-${columnId}`);
    if (columnElement) {
      const containerLeft = scrollAreaRef.current.getBoundingClientRect().left;
      const columnLeft = columnElement.getBoundingClientRect().left;
      const offset = columnLeft - containerLeft - 16; // 16px padding
      
      scrollAreaRef.current.scrollTo({
        left: scrollAreaRef.current.scrollLeft + offset,
        behavior: 'smooth'
      });
    }
  };

  if (isLoadingPicklistValues) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Loading Kanban columns...
      </div>
    );
  }

  if (picklistFields.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No picklist fields available for Kanban view. Please create a picklist field for this object.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4 mb-4">
        <div className="grid gap-2 w-64">
          <Label htmlFor="kanban-field">Group by</Label>
          <Select
            value={selectedFieldApiName}
            onValueChange={(value) => {
              setSelectedFieldApiName(value);
              setActiveColumn(null); // Reset active column when changing field
            }}
          >
            <SelectTrigger id="kanban-field">
              <SelectValue placeholder="Select field" />
            </SelectTrigger>
            <SelectContent>
              {picklistFields.map((field) => (
                <SelectItem key={field.id} value={field.api_name}>
                  {field.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Kanban Board - Desktop view (horizontal columns) */}
      {!isMobile && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-x-auto pb-4">
            {Object.entries(groupedRecords).map(([columnValue, columnRecords]) => {
              const columnLabel = getColumnLabel(columnValue);
              
              return (
                <div key={columnValue} className="flex flex-col min-w-[250px]">
                  <div className="flex justify-between items-center mb-2 px-2">
                    <h3 className="font-medium text-sm">{columnLabel}</h3>
                    <span className="text-xs text-muted-foreground">{columnRecords.length}</span>
                  </div>
                  <Droppable droppableId={columnValue}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`p-2 rounded-md min-h-[200px] flex flex-col gap-2 ${snapshot.isDraggingOver ? 'bg-muted/80' : 'bg-muted/40'}`}
                      >
                        {columnRecords.map((record, index) => (
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
                        {columnRecords.length === 0 && (
                          <div className="text-center py-4 text-sm text-muted-foreground">
                            No records
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      )}

      {/* Mobile view - Horizontal scrollable Kanban board */}
      {isMobile && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2 mb-3">
            {Object.entries(groupedRecords).map(([columnValue, columnRecords]) => {
              const columnLabel = getColumnLabel(columnValue);
              const isActive = activeColumn === columnValue;
              
              return (
                <Button
                  key={columnValue}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setActiveColumn(columnValue);
                    toggleColumnExpansion(columnValue, true);
                    scrollToColumn(columnValue);
                  }}
                  className="flex items-center gap-1"
                >
                  {columnLabel} 
                  <Badge variant="outline" className="ml-1">
                    {columnRecords.length}
                  </Badge>
                </Button>
              );
            })}
          </div>
          
          <div className="flex items-center justify-center space-x-2 mb-3 text-xs text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
            <span>Swipe horizontally to see all statuses</span>
            <ArrowRight className="h-4 w-4" />
          </div>
          
          <DragDropContext 
            onDragStart={handleDragStart}
            onDragUpdate={handleDragUpdate}
            onDragEnd={handleDragEnd}
          >
            <div 
              ref={scrollAreaRef} 
              className="w-full overflow-x-auto pb-6 touch-pan-y" 
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <div className="flex gap-3 min-w-full pb-4 px-1">
                {Object.entries(groupedRecords).map(([columnValue, columnRecords]) => {
                  const columnLabel = getColumnLabel(columnValue);
                  const recordCount = columnRecords.length;
                  
                  return (
                    <div 
                      key={columnValue}
                      id={`kanban-column-${columnValue}`}
                      className="flex-shrink-0 w-[85%] max-w-[300px] min-w-[250px]"
                    >
                      <Card className="h-full border shadow-sm flex flex-col">
                        <div 
                          className={`px-3 py-2 border-b flex justify-between items-center ${
                            activeColumn === columnValue ? 'bg-primary/10' : 'bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center">
                            <span className="font-medium text-sm mr-2">{columnLabel}</span>
                            <Badge variant="outline">{recordCount}</Badge>
                          </div>
                          <MoveHorizontal className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-grow overflow-hidden">
                          <Droppable droppableId={columnValue}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`h-full p-2 rounded-md min-h-[300px] flex flex-col gap-2 overflow-y-auto ${
                                  snapshot.isDraggingOver ? 'bg-primary/5 border-primary/20 border-dashed border-2' : ''
                                }`}
                                style={{ touchAction: 'pan-y' }}
                              >
                                {columnRecords.length === 0 ? (
                                  <div className="text-center py-8 text-sm text-muted-foreground">
                                    No records in this status
                                  </div>
                                ) : (
                                  columnRecords.map((record, index) => (
                                    <Draggable key={record.id} draggableId={record.id} index={index}>
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          style={{
                                            ...provided.draggableProps.style,
                                            opacity: snapshot.isDragging ? 0.8 : 1,
                                          }}
                                          className={snapshot.isDragging ? 'z-50' : ''}
                                        >
                                          <KanbanCard
                                            record={record}
                                            objectTypeId={objectTypeId}
                                            isDragging={snapshot.isDragging}
                                          />
                                        </div>
                                      )}
                                    </Draggable>
                                  ))
                                )}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        </div>
                      </Card>
                    </div>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </div>
          </DragDropContext>
          
          <div className="flex items-center justify-center mt-3 text-xs text-muted-foreground">
            <MoveHorizontal className="h-4 w-4 mr-2" />
            <span>Drag cards between columns to change status</span>
          </div>
        </div>
      )}
    </div>
  );
}
