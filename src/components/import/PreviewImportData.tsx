
import React, { useState, useMemo } from "react";
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
import { Info, CheckSquare, Square, AlertTriangle, Filter } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface PreviewImportDataProps {
  importData: { headers: string[]; rows: string[][] };
  columnMappings: any[];
  selectedRows: number[];
  duplicateRows?: number[];  // Array of duplicate row indices
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
  const [filterMode, setFilterMode] = useState<'all' | 'duplicates' | 'clean'>('all');
  
  // Compute mapped columns to display - memoize to prevent recalculation on every render
  const mappedColumns = useMemo(() => {
    return columnMappings
      .filter(mapping => mapping.targetField !== null)
      .sort((a, b) => {
        // Sort by original column order
        return a.sourceColumnIndex - b.sourceColumnIndex;
      });
  }, [columnMappings]);

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
  
  // Filter rows based on the selected filter mode - memoize to prevent recalculation on every render
  const filteredRowIndices = useMemo(() => {
    switch (filterMode) {
      case 'duplicates':
        return importData.rows.map((_, index) => index).filter(index => duplicateRows.includes(index));
      case 'clean':
        return importData.rows.map((_, index) => index).filter(index => !duplicateRows.includes(index));
      case 'all':
      default:
        return importData.rows.map((_, index) => index);
    }
  }, [importData.rows, duplicateRows, filterMode]);

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
          <CardTitle className="text-base flex items-center">
            Import Preview
            {duplicateCount > 0 && (
              <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-300">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {duplicateCount} Duplicates
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              {selectedRows.length} of {importData.rows.length} rows selected
              {duplicateCount > 0 && (
                <span className="ml-3 text-amber-500">
                  {duplicateCount} potential {duplicateCount === 1 ? 'duplicate' : 'duplicates'}
                </span>
              )}
            </div>
            
            {duplicateCount > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center">
                    <Filter className="h-3.5 w-3.5 mr-1.5" />
                    {filterMode === 'all' ? 'All Records' : 
                     filterMode === 'duplicates' ? 'Duplicates Only' : 'Clean Records'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setFilterMode('all')}>
                    Show All Records
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterMode('duplicates')}>
                    Show Duplicates Only
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterMode('clean')}>
                    Show Clean Records Only
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
                    <TableHead key={`header-${idx}`}>
                      {column.targetField?.name || column.sourceColumnName}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRowIndices.length > 0 ? (
                  filteredRowIndices.map(rowIndex => {
                    const isSelected = selectedRows.includes(rowIndex);
                    const isDuplicate = duplicateRows.includes(rowIndex);
                    
                    return (
                      <TableRow 
                        key={`row-${rowIndex}`}
                        className={`
                          ${isSelected ? "" : "opacity-60"} 
                          ${isDuplicate ? "bg-amber-50 dark:bg-amber-900/20 border-l-4 border-l-amber-500" : ""}
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
                          <TableCell 
                            key={`cell-${rowIndex}-${colIndex}`}
                            className={isDuplicate ? "relative" : ""}
                          >
                            {getCellValue(rowIndex, column)}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={mappedColumns.length + 2} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Filter className="h-8 w-8 mb-2 opacity-40" />
                        <p>No records match the current filter</p>
                        <Button 
                          variant="link" 
                          size="sm"
                          onClick={() => setFilterMode('all')}
                        >
                          Show all records
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
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
          {duplicateCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Deselect all duplicate rows
                duplicateRows.forEach(rowIndex => {
                  if (selectedRows.includes(rowIndex)) {
                    onSelectRow(rowIndex, false);
                  }
                });
              }}
            >
              <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" />
              Deselect Duplicates
            </Button>
          )}
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
