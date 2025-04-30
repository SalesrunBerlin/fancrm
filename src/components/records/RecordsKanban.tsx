
import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { ObjectField } from "@/hooks/useObjectTypes";
import { ObjectRecord } from "@/hooks/useObjectRecords";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { Eye, Edit } from "lucide-react";
import { useFieldPicklistValues } from "@/hooks/useFieldPicklistValues";
import { format } from "date-fns";
import { LookupValueDisplay } from "./LookupValueDisplay";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RecordsKanbanProps {
  records: ObjectRecord[];
  fields: ObjectField[];
  objectTypeId: string;
  groupingField: string;
  picklistFields: ObjectField[];
  onGroupingFieldChange: (fieldApiName: string) => void;
}

interface KanbanColumn {
  id: string;
  title: string;
  records: ObjectRecord[];
}

export function RecordsKanban({ 
  records, 
  fields, 
  objectTypeId, 
  groupingField, 
  picklistFields,
  onGroupingFieldChange 
}: RecordsKanbanProps) {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [selectedField, setSelectedField] = useState<ObjectField | null>(null);
  const { picklistValues, isLoading: loadingPicklistValues } = useFieldPicklistValues(
    selectedField?.id || ''
  );
  const [isUpdating, setIsUpdating] = useState(false);

  // Find the selected field based on groupingField
  useEffect(() => {
    if (picklistFields.length > 0) {
      const field = picklistFields.find(f => f.api_name === groupingField) || picklistFields[0];
      setSelectedField(field);
      if (!groupingField) {
        onGroupingFieldChange(field.api_name);
      }
    }
  }, [groupingField, picklistFields, onGroupingFieldChange]);

  // Group records into columns based on the selected picklist field
  useEffect(() => {
    if (!selectedField || !records.length || loadingPicklistValues) return;

    const fieldApiName = selectedField.api_name;
    
    // Create columns based on picklist values
    const columnMap = new Map<string, KanbanColumn>();
    
    // Add a column for each picklist value
    if (picklistValues) {
      picklistValues.forEach(value => {
        columnMap.set(value.value, {
          id: value.value,
          title: value.label,
          records: []
        });
      });
    }
    
    // Add "Other" column for records without a matching value
    columnMap.set("other", {
      id: "other", 
      title: "Other",
      records: []
    });

    // Group records into columns
    records.forEach(record => {
      const recordValue = record.field_values?.[fieldApiName] || "other";
      if (columnMap.has(recordValue)) {
        columnMap.get(recordValue)?.records.push(record);
      } else {
        columnMap.get("other")?.records.push(record);
      }
    });

    setColumns(Array.from(columnMap.values()));
  }, [records, selectedField, picklistValues, loadingPicklistValues]);

  // Handle changing the grouping field
  const handleFieldChange = (fieldApiName: string) => {
    const field = picklistFields.find(f => f.api_name === fieldApiName);
    if (field) {
      setSelectedField(field);
      onGroupingFieldChange(fieldApiName);
    }
  };

  // Get field value for display
  const getFieldValue = (record: ObjectRecord, field: ObjectField) => {
    if (field.is_system) {
      // Handle system fields
      switch (field.api_name) {
        case "created_at":
          return record.created_at ? format(new Date(record.created_at), "yyyy-MM-dd HH:mm") : "—";
        case "updated_at":
          return record.updated_at ? format(new Date(record.updated_at), "yyyy-MM-dd HH:mm") : "—";
        case "record_id":
          return record.record_id || "—";
        default:
          return "—";
      }
    }
    
    // Handle lookup fields
    if (field.data_type === "lookup" && field.options && record.field_values && record.field_values[field.api_name]) {
      return (
        <LookupValueDisplay
          value={record.field_values[field.api_name]}
          fieldOptions={field.options as { target_object_type_id: string }}
        />
      );
    }
    
    // Handle regular fields
    if (record.field_values && record.field_values[field.api_name] !== undefined) {
      return String(record.field_values[field.api_name] || "—");
    }
    
    return "—";
  };

  // Update record field value in database
  const updateRecordFieldValue = async (recordId: string, fieldApiName: string, value: string) => {
    setIsUpdating(true);
    
    try {
      // First check if the record already has field_values data
      const { data: recordData } = await supabase
        .from("object_records")
        .select("id")
        .eq("id", recordId)
        .single();
        
      if (!recordData) {
        throw new Error("Record not found");
      }

      // Update the field value in record_field_values table
      const { data, error } = await supabase
        .from("record_field_values")
        .upsert([
          {
            record_id: recordId,
            field_id: selectedField!.id,
            value: JSON.stringify(value)
          }
        ]);

      if (error) throw error;
      
      toast.success(`Record updated successfully`);
      return true;
    } catch (error) {
      console.error("Error updating record:", error);
      toast.error("Failed to update record");
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;
    
    // If dropped outside of any droppable area or dropped in the same place
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }
    
    const sourceColumnId = source.droppableId;
    const destinationColumnId = destination.droppableId;
    const recordId = draggableId;
    
    if (selectedField && destinationColumnId !== sourceColumnId) {
      // Create a new array of columns with the dragged card moved
      const updatedColumns = columns.map(column => {
        // Remove the record from the source column
        if (column.id === sourceColumnId) {
          return {
            ...column,
            records: column.records.filter(record => record.id !== recordId)
          };
        }
        
        // Add the record to the destination column
        if (column.id === destinationColumnId) {
          const recordToMove = records.find(record => record.id === recordId);
          if (recordToMove) {
            // Update the record with the new value (column id)
            const newRecord = {
              ...recordToMove,
              field_values: {
                ...recordToMove.field_values,
                [selectedField.api_name]: destinationColumnId === "other" ? null : destinationColumnId
              }
            };
            
            return {
              ...column,
              records: [...column.records, newRecord]
            };
          }
        }
        
        return column;
      });
      
      // Optimistically update the UI
      setColumns(updatedColumns);
      
      // Save the change to the database
      const success = await updateRecordFieldValue(
        recordId, 
        selectedField.api_name, 
        destinationColumnId === "other" ? "" : destinationColumnId
      );
      
      // If the update fails, revert the UI change by re-fetching data
      // This part is handled by the query invalidation in the parent component
    }
  };

  if (!selectedField) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        No picklist fields available for Kanban view
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Kanban View</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Group by:</span>
          <Select value={selectedField.api_name} onValueChange={handleFieldChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select field" />
            </SelectTrigger>
            <SelectContent>
              {picklistFields.map(field => (
                <SelectItem key={field.id} value={field.api_name}>
                  {field.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: "70vh" }}>
          {columns.map(column => (
            <Droppable key={column.id} droppableId={column.id}>
              {(provided) => (
                <div
                  className="flex-shrink-0 w-80 bg-muted/30 rounded-md p-2"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  <div className="font-medium p-2 text-center sticky top-0 bg-muted/80">
                    {column.title} ({column.records.length})
                  </div>
                  
                  <div className="space-y-3 mt-2">
                    {column.records.map((record, index) => (
                      <Draggable
                        key={record.id}
                        draggableId={record.id}
                        index={index}
                        isDragDisabled={isUpdating}
                      >
                        {(provided) => (
                          <Card
                            className="bg-background shadow-sm hover:shadow-md transition-shadow"
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <CardHeader className="p-3 pb-1">
                              <CardTitle className="text-sm font-medium">
                                {getFieldValue(record, fields[0])}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-3 pt-1 space-y-1">
                              {fields.slice(1, 3).map(field => (
                                <div key={field.id} className="text-xs">
                                  <span className="font-medium">{field.name}:</span>{" "}
                                  {getFieldValue(record, field)}
                                </div>
                              ))}
                            </CardContent>
                            <CardFooter className="p-2 flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                className="h-7 w-7 p-0"
                              >
                                <Link to={`/objects/${objectTypeId}/${record.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                className="h-7 w-7 p-0"
                              >
                                <Link to={`/objects/${objectTypeId}/${record.id}/edit`}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                            </CardFooter>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
