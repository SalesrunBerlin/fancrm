
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";

interface TableData {
  tableIndex: number;
  headers: string[];
  rows: string[][];
}

interface TableSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tables: TableData[];
  isLoading: boolean;
  onSelectTable: (index: number) => void;
  selectedTableIndex: number | null;
}

export function TableSelectionDialog({
  isOpen,
  onClose,
  tables,
  isLoading,
  onSelectTable,
  selectedTableIndex,
}: TableSelectionDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] max-h-[800px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select a Table to Import</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <ScrollArea className="flex-1 overflow-y-auto">
            <div className="space-y-6 p-2">
              {tables.map((table, index) => (
                <div
                  key={index}
                  className={`border rounded-lg overflow-hidden ${
                    selectedTableIndex === index ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <div className="bg-muted p-2 flex justify-between items-center">
                    <h3 className="font-medium">Table {index + 1}</h3>
                    <div className="text-sm text-muted-foreground">
                      {table.rows.length} rows × {table.headers.length} columns
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto max-h-[300px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {table.headers.map((header, i) => (
                            <TableHead key={i} className="whitespace-nowrap">
                              {header}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {table.rows.slice(0, 3).map((row, rowIndex) => (
                          <TableRow key={rowIndex}>
                            {row.map((cell, cellIndex) => (
                              <TableCell key={cellIndex}>
                                {cell}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  <div className="p-2 flex justify-end bg-muted/50">
                    <Button 
                      variant={selectedTableIndex === index ? "default" : "outline"}
                      onClick={() => onSelectTable(index)}
                    >
                      {selectedTableIndex === index ? "Selected" : "Select Table"}
                    </Button>
                  </div>
                </div>
              ))}
              
              {tables.length === 0 && (
                <div className="text-center p-10 text-muted-foreground">
                  No tables found on this page.
                </div>
              )}
            </div>
          </ScrollArea>
        )}
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={onClose}
            disabled={selectedTableIndex === null || isLoading}
          >
            Continue with Selected Table
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
