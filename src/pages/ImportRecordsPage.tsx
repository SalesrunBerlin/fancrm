
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useObjectTypes, ObjectType, ObjectField } from "@/hooks/useObjectTypes";
import { useObjectFields } from "@/hooks/useObjectFields";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useImportRecords } from "@/hooks/useImportRecords";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

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
    {
      id: string;
      values: Record<string, any>;
      sourceRowIndex?: number;
    }[]
  >([]);
  const [confirmedUpdates, setConfirmedUpdates] = useState<
    Record<string, boolean>
  >({});
  const [totalRecords, setTotalRecords] = useState(0);
  const [importMethod, setImportMethod] = useState<"file" | "text">("text");
  const [importText, setImportText] = useState<string>("");

  const { objectTypes } = useObjectTypes();
  const { fields, isLoading: isLoadingFields } = useObjectFields(objectTypeId);
  const { 
    parseImportText, 
    columnMappings, 
    updateColumnMapping,
    importData,
    importRecords
  } = useImportRecords(objectTypeId || "", fields || []);

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

  const handleTextImport = () => {
    if (importText.trim()) {
      const result = parseImportText(importText);
      if (result) {
        setCsvData(result.rows);
        setHeaders(result.headers);
        setSelectedHeaders(result.headers.map(() => true));
      } else {
        toast({
          title: "Error",
          description: "Failed to parse the import data.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Error",
        description: "Please enter some data to import.",
        variant: "destructive",
      });
    }
  };

  // Modified function for checked change - Fixed type issue
  const handleHeaderSelection = (index: number) => {
    const newSelectedHeaders = [...selectedHeaders];
    newSelectedHeaders[index] = !newSelectedHeaders[index];
    setSelectedHeaders(newSelectedHeaders);
  };

  // Fixed function to handle duplicate check state changes
  const handleDuplicateStateChange = (duplicateId: string, checked: boolean) => {
    setConfirmedUpdates((prev) => ({
      ...prev,
      [duplicateId]: checked,
    }));
  };

  const handleMatchColumns = () => {
    setIsMatchingColumns(true);
  };

  const handleColumnMappingChange = (index: number, fieldId: string) => {
    updateColumnMapping(index, fieldId);
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

    // Use columnMappings from useImportRecords hook
    const unmappedHeaders = columnMappings
      .filter((mapping) => !mapping.targetField)
      .map((mapping) => mapping.sourceColumnName);

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
    if (!objectTypeId || !importData) {
      toast({
        title: "Error",
        description: "Object Type ID is missing or no data to import.",
        variant: "destructive",
      });
      return;
    }

    setIsConfirming(true);

    // Prepare selected rows for import
    const selectedRows = [];
    for (let i = skipFirstRow ? 1 : 0; i < csvData.length; i++) {
      selectedRows.push(i);
    }

    try {
      setIsImporting(true);
      
      const result = await importRecords(selectedRows);
      
      if (result) {
        toast({
          title: "Success",
          description: `Successfully imported ${result.success} records (${result.failures} failed)`,
        });
        navigate(`/objects/${objectTypeId}`);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Import failed: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      setIsConfirming(false);
    }
  };

  const handleCreateNewField = (columnName: string) => {
    navigate(`/objects/${objectTypeId}/import/create-field/${columnName}`);
  };

  return (
    <div className="container mx-auto py-10">
      <PageHeader
        title="Import Records"
        description="Import records from a CSV file or paste data directly"
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
          <CardTitle>Import Data</CardTitle>
          <CardDescription>
            Upload a CSV file or paste data directly to import records into this object.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="text" onValueChange={(value) => setImportMethod(value as "file" | "text")}>
            <TabsList className="mb-4">
              <TabsTrigger value="text">Paste Data</TabsTrigger>
              <TabsTrigger value="file">Upload File</TabsTrigger>
            </TabsList>
            <TabsContent value="text">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="import-text">Paste your CSV or Tab-separated data here</Label>
                  <Textarea
                    id="import-text"
                    className="h-48 font-mono"
                    placeholder="name,email,phone&#10;John Doe,john@example.com,123456789&#10;Jane Smith,jane@example.com,987654321"
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                  />
                  <p className="mt-2 text-sm text-muted-foreground">
                    First row should contain column headers. Values can be comma or tab separated.
                  </p>
                </div>
                <Button onClick={handleTextImport}>
                  Parse Data
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="file">
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
            </TabsContent>
          </Tabs>

          {csvData.length > 0 && (
            <div className="mt-4">
              <CardTitle>Data Preview</CardTitle>
              <ScrollArea className="h-64">
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
                    {csvData.slice(0, 10).map((row, rowIndex) => (
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
              </ScrollArea>

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
                ? `Are you sure you want to import ${csvData.length - (skipFirstRow ? 1 : 0)} records?`
                : "Potential duplicates found. Review and confirm updates."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={() => setIsConfirming(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmImport}
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
