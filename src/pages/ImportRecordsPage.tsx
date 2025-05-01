import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { useObjectTypes, ObjectType, ObjectField } from "@/hooks/useObjectTypes";
import { useObjectFields } from "@/hooks/useObjectFields";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ColumnMapping,
  RecordFormData,
  DuplicateRecord,
} from "@/types/index";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface HeaderMappingProps {
  header: string;
  index: number;
  fields: ObjectField[];
  onColumnMappingChange: (index: number, fieldId: string) => void;
  onCreateNewField: (columnName: string) => void;
}

function HeaderMapping({
  header,
  index,
  fields,
  onColumnMappingChange,
  onCreateNewField,
}: HeaderMappingProps) {
  const [selectedField, setSelectedField] = useState("");

  const handleFieldChange = (fieldId: string) => {
    setSelectedField(fieldId);
    onColumnMappingChange(index, fieldId);
  };

  return (
    <TableRow>
      <TableCell className="font-medium">{header}</TableCell>
      <TableCell>
        <Select onValueChange={handleFieldChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Map to Field" />
          </SelectTrigger>
          <SelectContent>
            {fields.map((field) => (
              <SelectItem key={field.id} value={field.id}>
                {field.name}
              </SelectItem>
            ))}
            <SelectItem value="new" onClick={() => onCreateNewField(header)}>
              + Create New Field
            </SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
    </TableRow>
  );
}

export default function ImportRecordsPage() {
  const { objectTypeId } = useParams<{ objectTypeId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [selectedHeaders, setSelectedHeaders] = useState<boolean[]>([]);
  const [isMatchingColumns, setIsMatchingColumns] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isCreatingBatchFields, setIsCreatingBatchFields] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [batchSize, setBatchSize] = useState<number>(50);
  const [skipFirstRow, setSkipFirstRow] = useState(true);
  const [duplicateHandling, setDuplicateHandling] = useState<
    "skip" | "update"
  >("skip");
  const [potentialDuplicates, setPotentialDuplicates] = useState<
    DuplicateRecord[]
  >([]);
  const [confirmedUpdates, setConfirmedUpdates] = useState<
    Record<string, boolean>
  >({});
  const [totalRecords, setTotalRecords] = useState(0);

  const { objectTypes } = useObjectTypes();
  const { fields, isLoading: isLoadingFields } = useObjectFields(objectTypeId);

  const currentObjectType = objectTypes?.find((obj) => obj.id === objectTypeId);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data && Array.isArray(results.data)) {
            const data = results.data as string[][];
            setCsvData(data);
            if (data.length > 0) {
              setHeaders(data[0]);
              setSelectedHeaders(data[0].map(() => true));
            }
          } else {
            toast({
              title: "Error",
              description: "Failed to parse CSV file.",
              variant: "destructive",
            });
          }
        },
        error: () => {
          toast({
            title: "Error",
            description: "An error occurred while parsing the CSV file.",
            variant: "destructive",
          });
        },
      });
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  useEffect(() => {
    if (fields && headers.length > 0) {
      const initialMappings: ColumnMapping[] = headers.map((header) => ({
        sourceColumn: header,
        targetField: { id: "", name: "", api_name: "" },
        isMatched: false,
      }));
      setColumnMappings(initialMappings);
    }
  }, [fields, headers]);

  // Modified function for checked change
  const handleHeaderSelection = (index: number) => {
    const newSelectedHeaders = [...selectedHeaders];
    newSelectedHeaders[index] = !newSelectedHeaders[index];
    setSelectedHeaders(newSelectedHeaders);
  };

  // Modified function to handle duplicate check state changes
  const handleDuplicateStateChange = (duplicateId: string, checked: boolean | string) => {
    setConfirmedUpdates((prev) => ({
      ...prev,
      [duplicateId]: !!checked, // Convert to boolean to fix type error
    }));
  };

  const handleMatchColumns = () => {
    setIsMatchingColumns(true);
  };

  const handleColumnMappingChange = (index: number, fieldId: string) => {
    const newMappings = [...columnMappings];
    const field = fields?.find((f) => f.id === fieldId);

    if (field) {
      newMappings[index] = {
        ...newMappings[index],
        targetField: field,
        isMatched: true,
      };
    } else {
      newMappings[index] = {
        ...newMappings[index],
        targetField: { id: "", name: "", api_name: "" },
        isMatched: false,
      };
    }

    setColumnMappings(newMappings);
  };

  const handleCreateBatchFields = async (): Promise<boolean> => {
    if (!objectTypeId) {
      toast({
        title: "Error",
        description: "Object Type ID is missing.",
        variant: "destructive",
      });
      return false;
    }

    const unmappedHeaders = columnMappings
      .filter((mapping) => !mapping.isMatched)
      .map((mapping) => mapping.sourceColumn);

    if (unmappedHeaders.length === 0) {
      toast({
        title: "Info",
        description: "All columns are already mapped.",
      });
      return true;
    }

    setIsCreatingBatchFields(true);

    try {
      for (const header of unmappedHeaders) {
        const newField = {
          object_type_id: objectTypeId,
          name: header,
          api_name: header.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
          data_type: "text",
          is_required: false,
          is_system: false,
          display_order: fields ? fields.length + 1 : 1,
        };

        const { error } = await supabase.from("object_fields").insert([
          newField,
        ]);

        if (error) {
          throw new Error(`Failed to create field ${header}: ${error.message}`);
        }
      }

      toast({
        title: "Success",
        description: "All new fields created successfully.",
      });

      // Refresh fields
      return true;
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to create fields: ${error.message}`,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsCreatingBatchFields(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!objectTypeId) {
      toast({
        title: "Error",
        description: "Object Type ID is missing.",
        variant: "destructive",
      });
      return;
    }

    setIsConfirming(true);

    // Prepare data for import
    const headersToImport = headers.filter(
      (_, index) => selectedHeaders[index]
    );
    const validRows = csvData.slice(skipFirstRow ? 1 : 0);
    const totalRecordsToImport = validRows.length;
    setTotalRecords(totalRecordsToImport);

    // Check for potential duplicates
    if (duplicateHandling === "update") {
      const potentialDupes: DuplicateRecord[] = [];
      for (let rowIndex = 0; rowIndex < validRows.length; rowIndex++) {
        const row = validRows[rowIndex];
        const recordData: RecordFormData = {};

        headersToImport.forEach((header, index) => {
          const mapping = columnMappings.find(
            (m) => m.sourceColumn === header
          );
          if (mapping && mapping.targetField && "api_name" in mapping.targetField) {
            recordData[mapping.targetField.api_name] = row[index];
          }
        });

        // Basic duplicate check (e.g., by email)
        if (recordData["email"]) {
          const { data, error } = await supabase
            .from("object_records")
            .select("id")
            .eq("object_type_id", objectTypeId)
            .eq("email", recordData["email"]);

          if (error) {
            console.error("Error checking for duplicates:", error);
            continue;
          }

          if (data && data.length > 0) {
            potentialDupes.push({
              id: data[0].id,
              values: recordData,
              sourceRowIndex: rowIndex,
            });
          }
        }
      }

      setPotentialDuplicates(potentialDupes);
      setIsConfirming(false);
      return;
    }

    setIsConfirming(false);
    setIsImporting(true);

    // Proceed with import
    try {
      let importedCount = 0;
      for (let i = 0; i < totalRecordsToImport; i += batchSize) {
        const batch = validRows.slice(i, i + batchSize);
        const batchData = batch.map((row) => {
          const recordData: RecordFormData = {};
          headersToImport.forEach((header, index) => {
            const mapping = columnMappings.find(
              (m) => m.sourceColumn === header
            );
            if (mapping && mapping.targetField && "api_name" in mapping.targetField) {
              recordData[mapping.targetField.api_name] = row[index];
            }
          });
          return recordData;
        });

        const { error } = await supabase
          .from("object_records")
          .insert(
            batchData.map((recordData) => ({
              object_type_id: objectTypeId,
              ...recordData,
            }))
          );

        if (error) {
          throw new Error(`Batch import failed: ${error.message}`);
        }

        importedCount += batch.length;
      }

      toast({
        title: "Success",
        description: `Successfully imported ${importedCount} records.`,
      });
      navigate(`/objects/${objectTypeId}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Import failed: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleUpdateDuplicates = async () => {
    if (!objectTypeId) {
      toast({
        title: "Error",
        description: "Object Type ID is missing.",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);

    try {
      let updatedCount = 0;
      for (const recordId in confirmedUpdates) {
        if (confirmedUpdates[recordId]) {
          const duplicate = potentialDuplicates.find((d) => d.id === recordId);
          if (duplicate) {
            const { error } = await supabase
              .from("object_records")
              .update(duplicate.values)
              .eq("id", recordId);

            if (error) {
              throw new Error(`Failed to update record ${recordId}: ${error.message}`);
            }
            updatedCount++;
          }
        }
      }

      toast({
        title: "Success",
        description: `Successfully updated ${updatedCount} duplicate records.`,
      });
      navigate(`/objects/${objectTypeId}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Update failed: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleCreateNewField = (columnName: string) => {
    navigate(`/objects/${objectTypeId}/import/create-field/${columnName}`);
  };

  const handleColumnsMatched = (mappings: ColumnMapping[]) => {
    setColumnMappings(mappings);
  };

  return (
    <div className="container mx-auto py-10">
      <PageHeader
        title="Import Records"
        description="Import records from a CSV file"
        actions={
          <Button variant="outline" asChild>
            <Link to={`/objects/${objectTypeId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Records
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>CSV Upload</CardTitle>
          <CardDescription>
            Upload a CSV file to import records into this object.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className="border-2 border-dashed rounded-md p-4 cursor-pointer"
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <p>Drop the files here ...</p>
            ) : (
              <p>
                Drag 'n' drop some files here, or click to select files
              </p>
            )}
          </div>

          {csvData.length > 0 && (
            <div className="mt-4">
              <CardTitle>Data Preview</CardTitle>
              <Table>
                <TableHeader>
                  <TableRow>
                    <th>Select</th>
                    {headers.map((header, index) => (
                      <TableHead key={index}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvData.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      <TableCell>
                        {rowIndex === 0 ? (
                          <div></div>
                        ) : (
                          <Checkbox
                            checked={selectedHeaders[0]}
                            onCheckedChange={() => handleHeaderSelection(0)}
                          />
                        )}
                      </TableCell>
                      {row.map((cell, cellIndex) => (
                        <TableCell key={cellIndex}>{cell}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4 flex items-center space-x-2">
                <Checkbox
                  id="skip-first-row"
                  checked={skipFirstRow}
                  onCheckedChange={(checked) => setSkipFirstRow(!!checked)}
                />
                <Label htmlFor="skip-first-row" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed">
                  Skip First Row
                </Label>
              </div>

              <Button onClick={handleMatchColumns} className="mt-4">
                Match Columns
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {isMatchingColumns && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Match Columns to Fields</CardTitle>
            <CardDescription>
              Map each column in the CSV to a field in the object.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingFields ? (
              <div className="flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : fields && fields.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Header</TableHead>
                    <TableHead>Target Field</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {headers.map((header, index) => (
                    <HeaderMapping
                      key={index}
                      header={header}
                      index={index}
                      fields={fields}
                      onColumnMappingChange={handleColumnMappingChange}
                      onCreateNewField={handleCreateNewField}
                    />
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p>No fields available. Please create fields for this object.</p>
            )}

            <div className="mt-4 flex justify-between">
              <Button
                variant="secondary"
                onClick={async () => {
                  const success = await handleCreateBatchFields();
                  if (success) {
                    setIsMatchingColumns(false);
                  }
                }}
                disabled={isCreatingBatchFields}
              >
                {isCreatingBatchFields ? (
                  <>
                    Creating Fields <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  </>
                ) : (
                  "Create Batch Fields"
                )}
              </Button>
              <Button onClick={() => setIsMatchingColumns(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {csvData.length > 0 && !isMatchingColumns && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Import Settings</CardTitle>
            <CardDescription>
              Configure settings for the import process.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="batch-size">Batch Size</Label>
                <Input
                  id="batch-size"
                  type="number"
                  defaultValue={batchSize.toString()}
                  onChange={(e) => setBatchSize(Number(e.target.value))}
                />
              </div>

              <div>
                <Label htmlFor="duplicate-handling">Duplicate Handling</Label>
                <Select onValueChange={(value) => setDuplicateHandling(value as "skip" | "update")}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="skip">Skip Duplicates</SelectItem>
                    <SelectItem value="update">Update Duplicates</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={() => setIsConfirming(true)} disabled={isImporting}>
                Confirm Import
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={isConfirming} onOpenChange={setIsConfirming}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Import</DialogTitle>
            <DialogDescription>
              {duplicateHandling === "skip"
                ? `Are you sure you want to import ${
                    csvData.length - 1
                  } records?`
                : "Potential duplicates found. Review and confirm updates."}
            </DialogDescription>
          </DialogHeader>

          {duplicateHandling === "update" && potentialDuplicates.length > 0 ? (
            <ScrollArea className="max-h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Select</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {potentialDuplicates.map((duplicate) => (
                    <TableRow key={duplicate.id}>
                      <TableCell>
                        <Checkbox
                          checked={confirmedUpdates[duplicate.id] || false}
                          onCheckedChange={(checked) =>
                            handleDuplicateStateChange(duplicate.id, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell>{duplicate.values.email}</TableCell>
                      <TableCell>{duplicate.values.name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <p>No duplicates found.</p>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={() => setIsConfirming(false)}>
              Cancel
            </Button>
            <Button
              onClick={
                duplicateHandling === "skip"
                  ? handleConfirmImport
                  : handleUpdateDuplicates
              }
              disabled={isImporting}
            >
              {isImporting ? (
                <>
                  Importing <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
