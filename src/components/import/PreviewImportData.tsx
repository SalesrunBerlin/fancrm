
import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, CheckSquare, Square, AlertTriangle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PreviewImportDataProps {
  importData: { headers: string[]; rows: string[][] };
  columnMappings: any[];
  selectedRows: number[];
  duplicateRows?: number[];  // New prop for duplicate row indices
  onSelectRow: (rowIndex: number, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function PreviewImportData({
  importData,
  columnMappings,
  selectedRows,
  duplicateRows = [],  // Default to empty array if not provided
  onSelectRow,
  onSelectAll,
  onContinue,
  onBack
}: PreviewImportDataProps) {
  // Compute mapped columns to display
  const mappedColumns = columnMappings
    .filter(mapping => mapping.targetField !== null)
    .sort((a, b) => {
      // Sort by original column order
      return a.sourceColumnIndex - b.sourceColumnIndex;
    });

  // Check if all rows are selected
  const allSelected = selectedRows.length === importData.rows.length;
  // Check if some (but not all) rows are selected
  const someSelected = selectedRows.length > 0 && selectedRows.length < importData.rows.length;

  const toggleSelectAll = () => {
    onSelectAll(!allSelected);
  };

  // Get cell value based on column mapping
  const getCellValue = (rowIndex: number, columnMapping: any) => {
    const value = importData.rows[rowIndex][columnMapping.sourceColumnIndex] || '';
    return value;
  };

  // Calculate counts for UI display
  const duplicateCount = duplicateRows.length;

  return (
    <div className="space-y-6">
      <Alert className="mb-4">
        <Info className="h-4 w-4" />
        <AlertDescription>
          Preview the data to be imported. You can deselect any rows you don't want to import.
          {duplicateCount > 0 && (
            <span className="ml-1 font-medium">
              {duplicateCount} potential {duplicateCount === 1 ? 'duplicate' : 'duplicates'} found.
            </span>
          )}
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Import Preview</CardTitle>
          <div className="text-sm">
            {selectedRows.length} of {importData.rows.length} rows selected
            {duplicateCount > 0 && (
              <span className="ml-3 text-amber-500">
                {duplicateCount} potential {duplicateCount === 1 ? 'duplicate' : 'duplicates'}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead className="w-[50px]">
                    <div className="flex items-center justify-center">
                      <Checkbox 
                        checked={allSelected}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all rows"
                        className={someSelected ? "opacity-70" : ""}
                      />
                    </div>
                  </TableHead>
                  <TableHead className="w-[70px] text-center">Row #</TableHead>
                  {mappedColumns.map((column, idx) => (
                    <TableHead key={idx}>
                      {column.targetField?.name || column.sourceColumnName}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {importData.rows.map((row, rowIndex) => {
                  const isSelected = selectedRows.includes(rowIndex);
                  const isDuplicate = duplicateRows.includes(rowIndex);
                  
                  return (
                    <TableRow 
                      key={rowIndex}
                      className={`
                        ${isSelected ? "" : "opacity-60"} 
                        ${isDuplicate ? "bg-amber-50 border-l-4 border-l-amber-500" : ""}
                      `}
                    >
                      <TableCell>
                        <div className="flex items-center justify-center">
                          <Checkbox 
                            checked={isSelected}
                            onCheckedChange={(checked) => onSelectRow(rowIndex, !!checked)}
                            aria-label={`Select row ${rowIndex + 1}`}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        <div className="flex items-center justify-center gap-2">
                          {isDuplicate && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>
                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Potential duplicate record</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          {rowIndex + 1}
                        </div>
                      </TableCell>
                      {mappedColumns.map((column, colIndex) => (
                        <TableCell key={colIndex}>
                          {getCellValue(rowIndex, column)}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelectAll(true)}
          >
            <CheckSquare className="mr-2 h-4 w-4" />
            Select All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelectAll(false)}
          >
            <Square className="mr-2 h-4 w-4" />
            Deselect All
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button 
            onClick={onContinue}
            disabled={selectedRows.length === 0}
          >
            Import {selectedRows.length} {selectedRows.length === 1 ? 'Record' : 'Records'}
          </Button>
        </div>
      </div>
    </div>
  );
}
