import { useState } from "react";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Save, X, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { EditableCell } from "./EditableCell";
import { ObjectField } from "@/hooks/useObjectTypes";
import { InlineFieldCreator } from "./InlineFieldCreator";

interface RecordsTableProps {
  records: any[];
  fields: ObjectField[];
  objectTypeId: string;
  selectable?: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
}

export function RecordsTable({ 
  records, 
  fields, 
  objectTypeId,
  selectable = false,
  onSelectionChange
}: RecordsTableProps) {
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  const isAllSelected = records.length > 0 && selectedRecords.length === records.length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allRecordIds = records.map(record => record.id);
      setSelectedRecords(allRecordIds);
    } else {
      setSelectedRecords([]);
    }
  };

  const handleSelectionChange = (recordId: string) => {
    if (selectedRecords.includes(recordId)) {
      setSelectedRecords(selectedRecords.filter(id => id !== recordId));
    } else {
      setSelectedRecords([...selectedRecords, recordId]);
    }
  };

  // Notify parent component about selection changes
  useState(() => {
    onSelectionChange?.(selectedRecords);
  }, [selectedRecords, onSelectionChange]);

  const handleCellValueChange = (recordId: string, fieldApiName: string, newValue: any) => {
    console.log(`Value changed for record ${recordId}, field ${fieldApiName} to ${newValue}`);
    // TODO: Implement value change handling (e.g., update state or call an API)
  };

  const handleSaveRecord = (recordId: string) => {
    console.log(`Saving record ${recordId}`);
    // TODO: Implement save record functionality (e.g., call an API)
    setEditingRecordId(null);
    setEditMode(false);
    toast.success("Record saved successfully!");
  };

  const handleCancelEdit = () => {
    setEditingRecordId(null);
    setEditMode(false);
  };

  const handleDeleteRecord = (recordId: string) => {
    console.log(`Deleting record ${recordId}`);
    // TODO: Implement delete record functionality (e.g., call an API)
    toast.success("Record deleted successfully!");
  };

  return (
    <div>
      <div className="border-b">
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-10">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all records"
                  />
                </TableHead>
              )}
              
              {fields.map((field) => (
                <TableHead 
                  key={field.id || field.api_name} 
                  className="font-medium"
                >
                  <div className="flex items-center gap-1">
                    <span>{field.name}</span>
                    {field.is_required && (
                      <span className="text-red-500 text-xs">*</span>
                    )}
                  </div>
                </TableHead>
              ))}
              
              {/* Actions column */}
              <TableHead className="w-[100px] text-right">
                <div className="flex justify-end items-center gap-2">
                  <InlineFieldCreator
                    objectTypeId={objectTypeId}
                    variant="icon"
                    className="opacity-70 hover:opacity-100"
                    onFieldCreated={() => {
                      // This will be handled by parent component's data refresh
                      toast.success("Field created. Refreshing data...");
                    }}
                  />
                  Actions
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={fields.length + (selectable ? 2 : 1)}
                  className="h-32 text-center"
                >
                  No records found
                </TableCell>
              </TableRow>
            )}
            {records.map((record) => (
              <TableRow key={record.id}>
                {selectable && (
                  <TableCell className="w-10">
                    <Checkbox
                      checked={selectedRecords.includes(record.id)}
                      onCheckedChange={() => handleSelectionChange(record.id)}
                    />
                  </TableCell>
                )}
                
                {fields.map((field) => {
                  // Try to get value first from field_values, then from the record itself
                  const value = record.field_values?.[field.api_name] ?? 
                                record[field.api_name as keyof typeof record] ??
                                null;
                  
                  return (
                    <EditableCell
                      key={`${record.id}-${field.id || field.api_name}`}
                      value={value}
                      onChange={(newValue) => handleCellValueChange(record.id, field.api_name, newValue)}
                      editMode={editMode && record.id === editingRecordId}
                      fieldType={field.data_type}
                      isRequired={field.is_required}
                      fieldOptions={field.options}
                      fieldId={field.id}
                      objectTypeId={objectTypeId}
                    />
                  );
                })}
                
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      asChild
                    >
                      <Link to={`/objects/${objectTypeId}/${record.id}`}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View</span>
                      </Link>
                    </Button>
                    
                    {editMode && record.id !== editingRecordId ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setEditingRecordId(record.id)}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                    ) : record.id === editingRecordId ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleSaveRecord(record.id)}
                        >
                          <Save className="h-4 w-4" />
                          <span className="sr-only">Save</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleCancelEdit()}
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Cancel</span>
                        </Button>
                      </>
                    ) : null}
                    
                    {!editMode && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                        onClick={() => handleDeleteRecord(record.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
