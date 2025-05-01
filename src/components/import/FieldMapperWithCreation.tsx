
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { AlertCircle, Plus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ObjectField } from "@/hooks/useObjectTypes";

interface FieldMapperWithCreationProps {
  objectTypeId: string;
  columnMappings: {
    sourceColumnIndex: number;
    sourceColumnName: string;
    targetField: ObjectField | null;
  }[];
  fields: ObjectField[];
  onUpdateMapping: (columnIndex: number, fieldId: string | null) => void;
}

export function FieldMapperWithCreation({
  objectTypeId,
  columnMappings,
  fields,
  onUpdateMapping,
}: FieldMapperWithCreationProps) {
  const [unmappedColumns, setUnmappedColumns] = useState<number[]>([]);

  // Find columns that have no mapping
  useEffect(() => {
    const notMapped = columnMappings
      .map((mapping, index) => (mapping.targetField === null ? index : -1))
      .filter(index => index !== -1);
    
    setUnmappedColumns(notMapped);
  }, [columnMappings]);

  const handleFieldSelect = (columnIndex: number, fieldId: string | null) => {
    onUpdateMapping(columnIndex, fieldId);
  };

  return (
    <div className="space-y-4">
      {unmappedColumns.length > 0 && (
        <Alert variant="warning" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {unmappedColumns.length} {unmappedColumns.length === 1 ? 'column' : 'columns'} could not be mapped to existing fields.
            You can manually map them or create new fields.
          </AlertDescription>
        </Alert>
      )}

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Column Name</TableHead>
              <TableHead>Map to Field</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {columnMappings.map((mapping, index) => (
              <TableRow key={index} className={!mapping.targetField ? "bg-muted/30" : ""}>
                <TableCell>{mapping.sourceColumnName}</TableCell>
                <TableCell>
                  <Select
                    value={mapping.targetField?.id || ""}
                    onValueChange={(value) => handleFieldSelect(index, value || null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a field" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">-- None --</SelectItem>
                      {fields.map((field) => (
                        <SelectItem key={field.id} value={field.id}>
                          {field.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {!mapping.targetField && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center"
                      asChild
                    >
                      <Link to={`/objects/${objectTypeId}/import/create-field/${encodeURIComponent(mapping.sourceColumnName)}`}>
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Create Field
                      </Link>
                    </Button>
                  )}
                  {mapping.targetField && (
                    <Badge variant="outline">Mapped</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
