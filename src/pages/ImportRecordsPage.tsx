import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DuplicateRecordsResolver } from "@/components/import/DuplicateRecordsResolver";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface ColumnMapping {
  header: string;
  fieldApiName: string | null;
  action: "create" | "ignore" | "update" | "merge" | null;
}

export default function ImportRecordsPage() {
  const { objectTypeId } = useParams<{ objectTypeId: string }>();
  const { objectTypes, isLoading: isLoadingObjectTypes } = useObjectTypes();
  const navigate = useNavigate();

  const [csvData, setCsvData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [keyFieldNames, setKeyFieldNames] = useState<string[]>([]);
  const [importData, setImportData] = useState<any[]>([]);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [duplicateAction, setDuplicateAction] = useState<"create" | "ignore" | "update" | "merge">("create");
  const [selectedDuplicateAction, setSelectedDuplicateAction] = useState<{ [rowIndex: number]: "create" | "ignore" | "update" | "merge" }>({});
  const [allDuplicatesAction, setAllDuplicatesAction] = useState<"create" | "ignore" | "update" | "merge" | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isDuplicateCheckComplete, setIsDuplicateCheckComplete] = useState(false);

  const objectType = objectTypes?.find((ot) => ot.id === objectTypeId);

  useEffect(() => {
    if (!objectType) {
      toast.error("Object type not found");
      navigate("/dashboard");
    }
  }, [objectType, navigate]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsAnalyzing(true);
    const file = acceptedFiles[0];
    const reader = new FileReader();

    reader.onload = async (e: any) => {
      const text = e.target.result;
      const parsedData = parseCSV(text);
      setCsvData(parsedData);
      setHeaders(parsedData[0]);

      // Initialize column mappings
      const initialMappings = parsedData[0].map((header) => ({
        header: header,
        fieldApiName: null,
        action: null,
      }));
      setColumnMappings(initialMappings);
      setIsAnalyzing(false);
    };

    reader.readAsText(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: {
    'text/csv': ['.csv'],
    'text/plain': ['.txt'],
    'application/vnd.ms-excel': ['.xls'],
  } })

  const parseCSV = (text: string): string[][] => {
    const lines = text.split("\n");
    return lines.map((line) => {
      const values = line.split(",").map((value) => value.trim());
      return values;
    });
  };

  const handleColumnMappingChange = (index: number, fieldApiName: string | null) => {
    const newMappings = [...columnMappings];
    newMappings[index] = { ...newMappings[index], fieldApiName };
    setColumnMappings(newMappings);
  };

  const handleKeyFieldChange = (fieldName: string, checked: boolean) => {
    if (checked) {
      setKeyFieldNames([...keyFieldNames, fieldName]);
    } else {
      setKeyFieldNames(keyFieldNames.filter((name) => name !== fieldName));
    }
  };

  const analyzeData = async () => {
    setIsLoading(true);
    try {
      const data = csvData.slice(1).map((row) => {
        const obj: { [key: string]: string } = {};
        row.forEach((value, index) => {
          const fieldApiName = columnMappings[index].fieldApiName;
          if (fieldApiName) {
            obj[fieldApiName] = value;
          }
        });
        return obj;
      });
      setImportData(data);

      // Find duplicates
      const duplicateRows = await findDuplicateRecords(data, keyFieldNames);
      setDuplicates(duplicateRows);
      setIsDuplicateCheckComplete(true);
    } catch (error) {
      console.error("Error analyzing data:", error);
      toast.error("Error analyzing data");
    } finally {
      setIsLoading(false);
    }
  };

  const findDuplicateRecords = async (data: any[], keyFields: string[]) => {
    if (!keyFields || keyFields.length === 0) {
      toast.error("Please select at least one key field for duplicate checking.");
      return [];
    }

    const duplicates: any[] = [];
    for (let i = 0; i < data.length; i++) {
      const record = data[i];
      const query = { object_type_id: objectTypeId, field_values: {} };

      // Build the query for matching key fields
      keyFields.forEach(field => {
        query.field_values[field] = record[field];
      });

      // Check if a record with the same key fields already exists
      const { data: existingRecords, error } = await supabase
        .from('object_records')
        .select('id, field_values')
        .eq('object_type_id', objectTypeId)
        .contains('field_values', query.field_values);

      if (error) {
        console.error("Error checking for duplicates:", error);
        toast.error("Error checking for duplicates");
        continue;
      }

      if (existingRecords && existingRecords.length > 0) {
        duplicates.push({
          rowIndex: i,
          record: record,
          existingRecords: existingRecords
        });
      }
    }
    return duplicates;
  };

  const handleSetDuplicateAction = (rowIndex: number, action: "create" | "ignore" | "update" | "merge") => {
    setSelectedDuplicateAction({ ...selectedDuplicateAction, [rowIndex]: action });
  };

  const handleIgnoreAllDuplicates = () => {
    setAllDuplicatesAction("ignore");
  };

  const handleCreateAllDuplicates = () => {
    setAllDuplicatesAction("create");
  };

  const handleUpdateAllDuplicates = () => {
    setAllDuplicatesAction("update");
  };

  const handleMergeAllDuplicates = () => {
    setAllDuplicatesAction("merge");
  };

  const recheckDuplicates = async () => {
    setIsLoading(true);
    try {
      const duplicateRows = await findDuplicateRecords(importData, keyFieldNames);
      setDuplicates(duplicateRows);
    } catch (error) {
      console.error("Error rechecking duplicates:", error);
      toast.error("Error rechecking duplicates");
    } finally {
      setIsLoading(false);
    }
  };

  const importRecords = async () => {
    setIsImporting(true);
    try {
      for (let i = 0; i < importData.length; i++) {
        const record = importData[i];
        const duplicate = duplicates.find(d => d.rowIndex === i);
        const selectedAction = selectedDuplicateAction[i] || allDuplicatesAction || "create";

        if (duplicate) {
          if (selectedAction === "ignore") {
            continue; // Skip this record
          }

          if (selectedAction === "update") {
            // Update existing record
            const existingRecord = duplicate.existingRecords[0]; // Assuming only one existing record
            await updateRecord(existingRecord.id, record);
            continue;
          }

          if (selectedAction === "merge") {
            // Merge data into existing record
            const existingRecord = duplicate.existingRecords[0]; // Assuming only one existing record
            const mergedData = { ...existingRecord.field_values, ...record };
            await updateRecord(existingRecord.id, mergedData);
            continue;
          }
        }

        // Create new record if no duplicate or action is "create"
        await createRecord(record);
      }

      toast.success("Records imported successfully!");
      navigate(`/objects/${objectTypeId}`);
    } catch (error) {
      console.error("Error importing records:", error);
      toast.error("Error importing records");
    } finally {
      setIsImporting(false);
    }
  };

  const createRecord = async (record: any) => {
    const { data: recordData, error: recordError } = await supabase
      .from('object_records')
      .insert({
        object_type_id: objectTypeId,
        owner_id: objectType?.owner_id,
        field_values: record
      })
      .select()
      .single();

    if (recordError) {
      throw recordError;
    }
  };

  const updateRecord = async (recordId: string, record: any) => {
    const { data: updatedRecord, error: updateError } = await supabase
      .from('object_records')
      .update({
        field_values: record
      })
      .eq('id', recordId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }
  };

  if (isLoadingObjectTypes) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Import Records for {objectType?.name}</CardTitle>
          <CardDescription>Upload a CSV file to import records into this object type.</CardDescription>
        </CardHeader>
        <CardContent>
          {!csvData.length ? (
            <div {...getRootProps()} className={cn("border-2 border-dashed rounded-md p-8 flex flex-col items-center justify-center", isDragActive ? "border-primary" : "border-muted-foreground")}>
              <input {...getInputProps()} />
              {isAnalyzing ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                  Analyzing file...
                </div>
              ) : (
                <>
                  <p>Drag 'n' drop some files here, or click to select files</p>
                  <Button variant="outline" size="sm" className="mt-4">Select files</Button>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Column Mappings</h3>
                <p className="text-sm text-muted-foreground">Map each column in your CSV to a field in the object type.</p>
                <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">CSV Header</TableHead>
                        <TableHead>Field Mapping</TableHead>
                        <TableHead className="w-[150px]">Key Field</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {headers.map((header, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{header}</TableCell>
                          <TableCell>
                            <Input
                              type="select"
                              value={columnMappings[index].fieldApiName || ""}
                              onChange={(e) => handleColumnMappingChange(index, e.target.value === "" ? null : e.target.value)}
                              asChild
                            >
                              <select className="w-full">
                                <option value="">Select Field</option>
                                {objectType?.fields?.map((field) => (
                                  <option key={field.id} value={field.api_name}>
                                    {field.name} ({field.api_name})
                                  </option>
                                ))}
                              </select>
                            </Input>
                          </TableCell>
                          <TableCell>
                            <Checkbox
                              id={`key-field-${index}`}
                              checked={keyFieldNames.includes(header)}
                              onCheckedChange={(checked) => handleKeyFieldChange(header, !!checked)}
                            />
                            <Label htmlFor={`key-field-${index}`} className="sr-only">
                              Key Field
                            </Label>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>

              <Button onClick={analyzeData} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Analyze Data"
                )}
              </Button>
              
              {importData.length > 0 && isDuplicateCheckComplete && (
                <>
                  {duplicates.length > 0 ? (
                    <>
                      <h3 className="text-lg font-semibold mt-4">Duplicate Records Found</h3>
                      <p className="text-sm text-muted-foreground">Resolve duplicate records before importing.</p>
                      
                      <DuplicateRecordsResolver
                        duplicates={duplicates}
                        fields={objectType?.fields}
                        columnMappings={columnMappings}
                        matchingFields={keyFieldNames}
                        importData={importData}
                        onSetAction={handleSetDuplicateAction}
                        onIgnoreAll={handleIgnoreAllDuplicates}
                        onCreateAll={handleCreateAllDuplicates}
                        onUpdateAll={handleUpdateAllDuplicates}
                        onMergeAll={handleMergeAllDuplicates}
                        onRecheck={recheckDuplicates}
                      />
                    </>
                  ) : (
                    <div className="mt-4">
                      <Badge variant="outline">No duplicate records found.</Badge>
                    </div>
                  )}
                  
                  <Button
                    variant="primary"
                    onClick={importRecords}
                    disabled={isImporting}
                    className="mt-4"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      "Import Records"
                    )}
                  </Button>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
