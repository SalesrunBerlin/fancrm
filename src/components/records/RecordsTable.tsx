
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ObjectField } from "@/hooks/useObjectTypes";
import { ObjectRecord } from "@/hooks/useObjectRecords";
import { Edit, Play } from "lucide-react";
import { LookupValueDisplay } from "./LookupValueDisplay";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { useActions, Action } from "@/hooks/useActions";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface RecordsTableProps {
  records: ObjectRecord[];
  fields: ObjectField[];
  objectTypeId: string;
  selectable?: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
}

export function RecordsTable({ records, fields, objectTypeId, selectable = false, onSelectionChange }: RecordsTableProps) {
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [expandedAction, setExpandedAction] = useState<string | null>(null);
  const [recordActions, setRecordActions] = useState<{[key: string]: Action[]}>({});
  const navigate = useNavigate();
  const { getActionsByObjectId } = useActions();

  if (records.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No records found
      </div>
    );
  }
  
  // Function to get field value, handling both system and custom fields
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
    if (record.field_values && record.field_values[field.api_name] !== null) {
      return String(record.field_values[field.api_name]);
    }
    
    return "—";
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = records.map(record => record.id);
      setSelectedRecords(allIds);
      if (onSelectionChange) onSelectionChange(allIds);
    } else {
      setSelectedRecords([]);
      if (onSelectionChange) onSelectionChange([]);
    }
  };

  const handleSelectRecord = (recordId: string, checked: boolean, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click navigation
    let newSelectedRecords = [...selectedRecords];
    
    if (checked) {
      newSelectedRecords.push(recordId);
    } else {
      newSelectedRecords = newSelectedRecords.filter(id => id !== recordId);
    }
    
    setSelectedRecords(newSelectedRecords);
    if (onSelectionChange) onSelectionChange(newSelectedRecords);
  };

  // Function to toggle the action dropdown for a specific record
  const toggleActionDropdown = async (recordId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click navigation
    
    if (expandedAction === recordId) {
      setExpandedAction(null);
      return;
    }
    
    setExpandedAction(recordId);
    
    // Load actions for this record if not already loaded
    if (!recordActions[recordId]) {
      try {
        const actions = await getActionsByObjectId(objectTypeId);
        setRecordActions(prev => ({
          ...prev,
          [recordId]: actions
        }));
      } catch (error) {
        console.error("Error loading actions:", error);
      }
    }
  };

  const handleExecuteAction = (action: Action, recordId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click navigation
    
    if (action.action_type === "linked_record" && recordId) {
      // For linked records actions
      navigate(`/actions/execute/${action.id}/from/${recordId}`);
    } else {
      // For global actions
      navigate(`/actions/execute/${action.id}`);
    }
    setExpandedAction(null); // Close dropdown after action is selected
  };

  const handleRowClick = (recordId: string) => {
    navigate(`/objects/${objectTypeId}/${recordId}`);
  };

  const handleEditClick = (recordId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click navigation
    navigate(`/objects/${objectTypeId}/${recordId}/edit`);
  };

  const allSelected = records.length > 0 && selectedRecords.length === records.length;

  return (
    <div className="rounded-md border overflow-hidden overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead className="w-[50px]">
                <Checkbox 
                  checked={allSelected} 
                  onCheckedChange={handleSelectAll} 
                  aria-label="Select all records"
                />
              </TableHead>
            )}
            {/* Actions column as first column */}
            <TableHead>Actions</TableHead>
            
            {fields.map((field) => (
              <TableHead key={field.id}>{field.name}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow 
              key={record.id} 
              className={`${selectedRecords.includes(record.id) ? "bg-muted/30" : ""} cursor-pointer hover:bg-muted/50`}
              onClick={() => handleRowClick(record.id)}
            >
              {selectable && (
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedRecords.includes(record.id)}
                    onCheckedChange={(checked) => handleSelectRecord(record.id, !!checked, event)}
                    aria-label={`Select record ${record.id}`}
                  />
                </TableCell>
              )}
              
              {/* Actions cell */}
              <TableCell onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => handleEditClick(record.id, e)}
                  >
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  
                  <DropdownMenu 
                    open={expandedAction === record.id} 
                    onOpenChange={(open) => {
                      if (open) toggleActionDropdown(record.id, event);
                      else setExpandedAction(null);
                    }}
                  >
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-blue-500 hover:text-blue-600"
                        onClick={(e) => toggleActionDropdown(record.id, e)}
                      >
                        <Play className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      align="start" 
                      className="w-48 bg-white" 
                      sideOffset={5}
                    >
                      {recordActions[record.id]?.length ? (
                        recordActions[record.id].map((action) => (
                          <DropdownMenuItem 
                            key={action.id}
                            onClick={(e) => handleExecuteAction(action, record.id, e)}
                          >
                            {action.name}
                          </DropdownMenuItem>
                        ))
                      ) : (
                        <DropdownMenuItem disabled>No actions available</DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
              
              {/* Fields cells - now all are clickable, no need for extra view button */}
              {fields.map((field) => (
                <TableCell key={`${record.id}-${field.id}`}>
                  {getFieldValue(record, field)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
