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
import { Edit, ArrowUp, ArrowDown } from "lucide-react";
import { LookupValueDisplay } from "./LookupValueDisplay";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { ObjectActionsSection } from "../actions/ObjectActionsSection";
import { formatWithLineBreaks } from "@/lib/utils/textFormatUtils";
import { Badge } from "@/components/ui/badge";

interface RecordsTableProps {
  records: ObjectRecord[];
  fields: ObjectField[];
  objectTypeId: string;
  selectable?: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
}

export function RecordsTable({ records, fields, objectTypeId, selectable = false, onSelectionChange }: RecordsTableProps) {
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const navigate = useNavigate();

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
      const rawValue = String(record.field_values[field.api_name]);
      return formatWithLineBreaks(rawValue);
    }
    
    return "—";
  };

  // Get raw field value for sorting
  const getRawFieldValue = (record: ObjectRecord, fieldApiName: string): any => {
    if (fieldApiName === "created_at") {
      return record.created_at;
    }
    if (fieldApiName === "updated_at") {
      return record.updated_at;
    }
    if (fieldApiName === "record_id") {
      return record.record_id;
    }
    
    if (record.field_values && record.field_values[fieldApiName] !== null) {
      return record.field_values[fieldApiName];
    }
    
    return null;
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

  const handleSelectRecord = (recordId: string, checked: boolean) => {
    let newSelectedRecords = [...selectedRecords];
    
    if (checked) {
      newSelectedRecords.push(recordId);
    } else {
      newSelectedRecords = newSelectedRecords.filter(id => id !== recordId);
    }
    
    setSelectedRecords(newSelectedRecords);
    if (onSelectionChange) onSelectionChange(newSelectedRecords);
  };

  const handleRowClick = (recordId: string) => {
    navigate(`/objects/${objectTypeId}/${recordId}`);
  };

  const handleSort = (fieldApiName: string) => {
    if (sortField === fieldApiName) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(fieldApiName);
      setSortDirection('asc');
    }
  };

  // Sort records
  let sortedRecords = [...records];
  if (sortField) {
    sortedRecords.sort((a, b) => {
      const aValue = getRawFieldValue(a, sortField);
      const bValue = getRawFieldValue(b, sortField);
      
      // Handle null/undefined values
      if (aValue === null || aValue === undefined) return sortDirection === 'asc' ? 1 : -1;
      if (bValue === null || bValue === undefined) return sortDirection === 'asc' ? -1 : 1;
      
      // Compare based on data type
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      // Date comparison
      if (aValue instanceof Date && bValue instanceof Date) {
        return sortDirection === 'asc' ? aValue.getTime() - bValue.getTime() : bValue.getTime() - aValue.getTime();
      }
      
      // Convert to string for comparison
      const aString = String(aValue).toLowerCase();
      const bString = String(bValue).toLowerCase();
      
      return sortDirection === 'asc' ? aString.localeCompare(bString) : bString.localeCompare(aString);
    });
  }

  const allSelected = records.length > 0 && selectedRecords.length === records.length;

  return (
    <div className="rounded-md border overflow-hidden overflow-x-auto relative">
      {/* Add badge showing the total record count in top right */}
      <Badge 
        variant="outline" 
        className="absolute top-2 right-2 z-10 bg-primary/10 text-primary"
      >
        {records.length}
      </Badge>
      
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
              <TableHead 
                key={field.id}
                onClick={() => handleSort(field.api_name)}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center">
                  <span>{field.name}</span>
                  {sortField === field.api_name && (
                    <span className="ml-1">
                      {sortDirection === 'asc' ? (
                        <ArrowUp className="h-4 w-4" />
                      ) : (
                        <ArrowDown className="h-4 w-4" />
                      )}
                    </span>
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRecords.map((record) => (
            <TableRow 
              key={record.id} 
              className={`${selectedRecords.includes(record.id) ? "bg-muted/30" : ""} hover:bg-muted/50 cursor-pointer transition-colors`}
            >
              {selectable && (
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedRecords.includes(record.id)}
                    onCheckedChange={(checked) => handleSelectRecord(record.id, !!checked)}
                    aria-label={`Select record ${record.id}`}
                  />
                </TableCell>
              )}
              
              {/* Actions cell */}
              <TableCell onClick={(e) => e.stopPropagation()} className="whitespace-nowrap">
                <div className="flex items-center space-x-2">
                  {/* Edit button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => navigate(`/objects/${objectTypeId}/${record.id}/edit`)}
                  >
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  
                  {/* Single play button for record actions */}
                  <ObjectActionsSection 
                    objectTypeId={objectTypeId}
                    recordId={record.id}
                    inTable={true}
                  />
                </div>
              </TableCell>
              
              {/* Fields cells */}
              {fields.map((field) => (
                <TableCell 
                  key={`${record.id}-${field.id}`}
                  onClick={() => handleRowClick(record.id)}
                  className="whitespace-pre-line"  // Important for line breaks
                >
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
