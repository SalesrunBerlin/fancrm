
import { useState } from "react";
import { Link } from "react-router-dom";
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
import { Edit, Eye } from "lucide-react";
import { LookupValueDisplay } from "./LookupValueDisplay";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";

interface RecordsTableProps {
  records: ObjectRecord[];
  fields: ObjectField[];
  objectTypeId: string;
  selectable?: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
}

export function RecordsTable({ records, fields, objectTypeId, selectable = false, onSelectionChange }: RecordsTableProps) {
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);

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
            <TableRow key={record.id} className={selectedRecords.includes(record.id) ? "bg-muted/30" : undefined}>
              {selectable && (
                <TableCell>
                  <Checkbox
                    checked={selectedRecords.includes(record.id)}
                    onCheckedChange={(checked) => handleSelectRecord(record.id, !!checked)}
                    aria-label={`Select record ${record.id}`}
                  />
                </TableCell>
              )}
              
              {/* Actions cell */}
              <TableCell>
                <div className="flex items-center space-x-2">
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
                </div>
              </TableCell>
              
              {/* Fields cells */}
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
