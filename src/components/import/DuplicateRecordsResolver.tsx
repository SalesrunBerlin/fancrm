import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Check, ChevronsUpDown, Copy, PlusCircle, Trash2 } from 'lucide-react';
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

export interface DuplicateRecordsResolverProps {
  duplicates: any[];
  fields?: any[]; // Add this field to fix the type error
  matchingFields: string[];
  columnMappings: any[];
  importData: any;
  onSetAction: (rowIndex: number, action: "create" | "ignore" | "update") => void;
  onIgnoreAll: () => void;
  onCreateAll: () => void;
  onUpdateAll: () => void;
  onMergeAll: () => void;
  onRecheck: () => Promise<void>;
}

export const DuplicateRecordsResolver: React.FC<DuplicateRecordsResolverProps> = ({
  duplicates,
  fields,
  matchingFields,
  columnMappings,
  importData,
  onSetAction,
  onIgnoreAll,
  onCreateAll,
  onUpdateAll,
  onMergeAll,
  onRecheck,
}) => {
  const [selectedActions, setSelectedActions] = useState<("create" | "ignore" | "update")[]>(
    Array(duplicates.length).fill("create")
  );

  const handleActionChange = (index: number, action: "create" | "ignore" | "update") => {
    const newActions = [...selectedActions];
    newActions[index] = action;
    setSelectedActions(newActions);
    onSetAction(index, action);
  };

  return (
    <div className="w-full">
      {duplicates.length > 0 ? (
        <>
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              We found {duplicates.length} records that might be duplicates. Please select an action for each record.
            </p>
          </div>

          <ScrollArea>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Action</TableHead>
                  {matchingFields.map((field) => (
                    <TableHead key={field}>{field}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {duplicates.map((duplicate, index) => {
                  const importRow = importData[duplicate.rowIndex];
                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full justify-start">
                              {selectedActions[index] === "create" && "Create New"}
                              {selectedActions[index] === "ignore" && "Ignore"}
                              {selectedActions[index] === "update" && "Update Existing"}
                              <ChevronsUpDown className="ml-auto h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Select Action</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleActionChange(index, "create")}>
                              <Check
                                className={`mr-2 h-4 w-4 ${selectedActions[index] === "create" ? "opacity-100" : "opacity-0"
                                  }`}
                              />
                              Create New
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleActionChange(index, "ignore")}>
                              <Check
                                className={`mr-2 h-4 w-4 ${selectedActions[index] === "ignore" ? "opacity-100" : "opacity-0"
                                  }`}
                              />
                              Ignore
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleActionChange(index, "update")}>
                              <Check
                                className={`mr-2 h-4 w-4 ${selectedActions[index] === "update" ? "opacity-100" : "opacity-0"
                                  }`}
                              />
                              Update Existing
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      {matchingFields.map((field) => {
                        const mappedColumn = columnMappings.find((mapping) => mapping.target === field)?.source;
                        const cellValue = mappedColumn ? importRow[mappedColumn] : '';

                        return (
                          <TableCell key={`${index}-${field}`}>
                            {cellValue}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>

          <div className="mt-4 flex justify-end space-x-2">
            <Button variant="ghost" size="sm" onClick={onIgnoreAll}>
              Ignore All
            </Button>
            <Button variant="ghost" size="sm" onClick={onCreateAll}>
              Create All
            </Button>
            <Button variant="ghost" size="sm" onClick={onUpdateAll}>
              Update All
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center py-4">No duplicates found.</div>
      )}
    </div>
  );
};
