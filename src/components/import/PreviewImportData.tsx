
import React, { useState } from "react";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ColumnMapping } from "@/hooks/useImportRecords";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ImportDataType {
  headers: string[];
  rows: string[][];
}

interface PreviewImportDataProps {
  importData: ImportDataType;
  columnMappings: ColumnMapping[];
  selectedRows: number[];
  duplicateRows: number[];
  onSelectRow: (rowIndex: number, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function PreviewImportData({ 
  importData, 
  columnMappings, 
  selectedRows, 
  duplicateRows,
  onSelectRow,
  onSelectAll,
  onContinue,
  onBack
}: PreviewImportDataProps) {
  const [selectAll, setSelectAll] = useState(selectedRows.length === importData.rows.length);
  
  // Get mapped columns only
  const mappedColumns = columnMappings.filter(mapping => mapping.targetField !== null);
  
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    onSelectAll(checked);
  };
  
  const isRowSelected = (rowIndex: number) => {
    return selectedRows.includes(rowIndex);
  };
  
  const isRowDuplicate = (rowIndex: number) => {
    return duplicateRows.includes(rowIndex);
  };
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Preview Import Data</h2>
      
      <div className="bg-muted/50 p-4 rounded-md">
        <p className="text-sm font-medium">
          {selectedRows.length} of {importData.rows.length} rows selected for import.
        </p>
      </div>
      
      <div className="border rounded-md overflow-hidden">
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-[50px] sticky left-0 bg-background z-20">
                  <Checkbox 
                    checked={selectAll} 
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                {mappedColumns.map((mapping, index) => (
                  <TableHead key={`header-${index}`}>
                    {mapping.targetField?.name}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {importData.rows.map((row, rowIndex) => (
                <TableRow 
                  key={`row-${rowIndex}`}
                  className={isRowDuplicate(rowIndex) ? "bg-orange-50 dark:bg-orange-950/20" : ""}
                >
                  <TableCell className="sticky left-0 bg-inherit z-20">
                    <Checkbox 
                      checked={isRowSelected(rowIndex)} 
                      onCheckedChange={(checked) => onSelectRow(rowIndex, !!checked)}
                    />
                  </TableCell>
                  {mappedColumns.map((mapping, cellIndex) => (
                    <TableCell key={`cell-${rowIndex}-${cellIndex}`}>
                      {row[mapping.sourceColumnIndex]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
      
      <div className="flex justify-end gap-2">
        <Button 
          variant="outline" 
          onClick={onBack}
        >
          Back
        </Button>
        <Button 
          onClick={onContinue}
          disabled={selectedRows.length === 0}
        >
          Import {selectedRows.length} Records
        </Button>
      </div>
    </div>
  );
}
