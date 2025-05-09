
import { useState, useEffect } from "react";
import { ObjectRecord } from "@/types/ObjectFieldTypes";
import { ObjectField } from "@/hooks/useObjectTypes";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useLocalStorage } from "@/hooks/useLocalStorage";
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
import { ChevronDown, ChevronUp, MoveVertical } from "lucide-react";

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
  
  // State for selected picklist field
  const [selectedFieldApiName, setSelectedFieldApiName] = useLocalStorage<string>(
    `kanban-field-${objectTypeId}`,
    picklistFields.length > 0 ? picklistFields[0].api_name : ""
  );

  // Selected field object
  const selectedField = fields.find(field => field.api_name === selectedFieldApiName);
  
  // Get possible values for the selected field
  const [picklistOptions, setPicklistOptions] = useState<{label: string, value: string}[]>([]);
  
  // Group records by picklist value
  const [groupedRecords, setGroupedRecords] = useState<Record<string, ObjectRecord[]>>({});

  // Active accordion item for mobile view
  const [activeColumn, setActiveColumn] = useState<string | null>(null);
  
  // Get field values from our hook
  const { updateRecord } = useObjectRecords(objectTypeId);

  // Load picklist values for the selected field
  useEffect(() => {
    if (selectedField?.data_type !== "picklist") return;

    // Try to parse options from the field
    try {
      if (selectedField.options) {
        const options = typeof selectedField.options === 'string' 
          ? JSON.parse(selectedField.options)
          : selectedField.options;
        
        if (Array.isArray(options)) {
          setPicklistOptions(options.map(opt => ({
            label: opt.label || opt.value,
            value: opt.value
          })));
        }
      }
    } catch (e) {
      console.error("Error parsing picklist options:", e);
      setPicklistOptions([]);
    }
  }, [selectedField]);

  // Group records by the selected picklist value
  useEffect(() => {
    if (!selectedFieldApiName || !records.length) {
      setGroupedRecords({});
      return;
    }

    const grouped: Record<string, ObjectRecord[]> = {};
    
    // Initialize groups for all picklist options
    picklistOptions.forEach(option => {
      grouped[option.value] = [];
    });
    
    // Add a group for empty/null values
    grouped["none"] = [];

    // Group records
    records.forEach(record => {
      const fieldValue = record.field_values?.[selectedFieldApiName] || "none";
      
      if (grouped[fieldValue]) {
        grouped[fieldValue].push(record);
      } else {
        // If the value doesn't match a known option, put in "none" group
        grouped["none"].push(record);
      }
    });
    
    setGroupedRecords(grouped);
    
    // Set first column as active on mobile if none is active yet
    if (isMobile && !activeColumn && Object.keys(grouped).length > 0) {
      // Find first column with records
      const firstColumnWithRecords = Object.keys(grouped).find(key => grouped[key].length > 0) || Object.keys(grouped)[0];
      setActiveColumn(firstColumnWithRecords);
    }
  }, [records, selectedFieldApiName, picklistOptions, isMobile, activeColumn]);

  // Handle drag end - update record with new status
  const handleDragEnd = async (result: any) => {
    if (!result.destination || !selectedFieldApiName || !onUpdateRecord) return;
    
    const { draggableId, destination } = result;
    const recordId = draggableId;
    const newValue = destination.droppableId === "none" ? null : destination.droppableId;
    
    // Update record
    try {
      // Optimistically update UI
      const recordToUpdate = records.find(r => r.id === recordId);
      if (recordToUpdate) {
        const updatedRecord = {
          ...recordToUpdate,
          field_values: {
            ...recordToUpdate.field_values,
            [selectedFieldApiName]: newValue,
          }
        };
        
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
        }
      }
    } catch (error) {
      console.error("Error updating record:", error);
    }
  };

  // Calculate total records across all columns
  const totalRecords = Object.values(groupedRecords).reduce(
    (total, records) => total + records.length, 
    0
  );

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
            onValueChange={setSelectedFieldApiName}
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
              // Get the display label for this column
              const columnOption = picklistOptions.find(opt => opt.value === columnValue);
              const columnLabel = columnValue === "none" ? "Not assigned" : (columnOption?.label || columnValue);
              
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

      {/* Mobile view - Accordion layout for vertical scrolling */}
      {isMobile && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Accordion 
            type="single" 
            collapsible 
            value={activeColumn || undefined}
            onValueChange={(value) => value && setActiveColumn(value)}
            className="w-full space-y-2"
          >
            {Object.entries(groupedRecords).map(([columnValue, columnRecords]) => {
              // Get the display label for this column
              const columnOption = picklistOptions.find(opt => opt.value === columnValue);
              const columnLabel = columnValue === "none" ? "Not assigned" : (columnOption?.label || columnValue);
              const recordCount = columnRecords.length;
              const countPercentage = totalRecords > 0 ? (recordCount / totalRecords) * 100 : 0;
              
              return (
                <Card key={columnValue} className="border shadow-sm">
                  <AccordionItem value={columnValue} className="border-none">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <div className="flex flex-1 justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{columnLabel}</span>
                          <Badge variant="outline">{columnRecords.length}</Badge>
                        </div>
                        <div className="flex items-center space-x-1">
                          {activeColumn === columnValue ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="px-1 pb-2">
                        <Droppable droppableId={columnValue}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`rounded-md min-h-[100px] flex flex-col gap-2 ${
                                snapshot.isDraggingOver ? 'bg-muted/60' : ''
                              }`}
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
                                        className="relative"
                                      >
                                        <div
                                          className="absolute top-1/2 -translate-y-1/2 left-1 p-1 rounded-md z-10"
                                          {...provided.dragHandleProps}
                                        >
                                          <MoveVertical className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div className="pl-6">
                                          <KanbanCard
                                            record={record}
                                            objectTypeId={objectTypeId}
                                            isDragging={snapshot.isDragging}
                                          />
                                        </div>
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
                    </AccordionContent>
                  </AccordionItem>
                  <div className="px-4 pb-1">
                    <Progress value={countPercentage} className="h-1" />
                  </div>
                </Card>
              );
            })}
          </Accordion>
          <div className="text-xs text-center text-muted-foreground mt-2">
            Drag cards vertically to change status
          </div>
        </DragDropContext>
      )}
    </div>
  );
}
