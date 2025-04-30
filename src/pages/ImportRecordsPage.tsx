import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useRecordFields } from "@/hooks/useRecordFields";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertCircle, CheckCircle, ArrowLeft, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useImportRecords } from "@/hooks/useImportRecords";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ObjectField } from "@/hooks/useObjectTypes";
import { BatchFieldCreation } from "@/components/import/BatchFieldCreation";
import { DuplicateRecordsResolver } from "@/components/import/DuplicateRecordsResolver";
import { PreviewImportData } from "@/components/import/PreviewImportData";
import { toast } from "sonner";

export default function ImportRecordsPage() {
  const { objectTypeId } = useParams<{ objectTypeId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [pastedText, setPastedText] = useState("");
  const [step, setStep<"paste" | "mapping" | "duplicate-check" | "preview" | "batch-field-creation" | "importing">("paste");
  const [activeTab, setActiveTab<"paste" | "example">("paste");
  const [unmappedColumns, setUnmappedColumns<string[]>([]);
  const [columnData, setColumnData<{ [columnName: string]: string[] }>({});
  const [selectedRows, setSelectedRows<number[]>([]);
  
  const { objectTypes } = useObjectTypes();
  const { fields, isLoading: isLoadingFields } = useRecordFields(objectTypeId);
  const objectType = objectTypes?.find(type => type.id === objectTypeId);

  const { 
    importData, 
    columnMappings, 
    isImporting,
    duplicates,
    matchingFields,
    isDuplicateCheckCompleted,
    duplicateCheckIntensity,
    parseImportText, 
    updateColumnMapping, 
    importRecords,
    clearImportData,
    checkForDuplicates,
    updateMatchingFields,
    updateDuplicateAction,
    updateDuplicateCheckIntensity
  } = useImportRecords(objectTypeId!, fields || []);

  // Check if we have import data and move to mapping step
  useEffect(() => {
    if (importData && step === "paste") {
      setStep("mapping");
      
      // Extract column data for use in field creation
      if (importData.headers && importData.rows) {
        const extractedData: { [columnName: string]: string[] } = {};
        
        importData.headers.forEach((header, columnIndex) => {
          // Get all values from this column
          extractedData[header] = importData.rows.map(row => row[columnIndex] || '');
        });
        
        setColumnData(extractedData);
        
        // Initially select all rows
        setSelectedRows(Array.from({ length: importData.rows.length }, (_, i) => i));
      }
    }
  }, [importData]);

  // Check for newly created field from URL parameters
  useEffect(() => {
    const newFieldId = searchParams.get('newFieldId');
    const columnName = searchParams.get('columnName');
    
    if (newFieldId && columnName && fields) {
      // Find the column index that matches the column name
      const columnIndex = columnMappings.findIndex(
        mapping => mapping.sourceColumnName === decodeURIComponent(columnName)
      );
      
      // Find the newly created field
      const newField = fields.find(field => field.id === newFieldId);
      
      if (columnIndex >= 0 && newField) {
        console.log("Updating mapping for new field:", newField.name, "at index", columnIndex);
        // Update the mapping with the new field
        updateColumnMapping(columnIndex, newFieldId);
      } else {
        console.warn("Could not map new field:", { 
          newFieldId, columnName, 
          columnFound: columnIndex >= 0, 
          fieldFound: !!newField,
          mappingsLength: columnMappings.length,
          fieldsLength: fields.length
        });
      }
    }
  }, [searchParams, fields, columnMappings, updateColumnMapping]);

  // Function to identify unmapped columns
  useEffect(() => {
    if (columnMappings && columnMappings.length > 0) {
      const unmapped = columnMappings
        .filter(mapping => mapping.targetField === null)
        .map(mapping => mapping.sourceColumnName);
      setUnmappedColumns(unmapped);
    } else {
      setUnmappedColumns([]);
    }
  }, [columnMappings]);

  const handleTextPaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPastedText(e.target.value);
  };

  const handleParseData = () => {
    const data = parseImportText(pastedText);
    if (data) {
      setStep("mapping");
    }
  };

  const handleCheckForDuplicates = async () => {
    // Clear any previous duplicate check results
    // Reset selected matching fields if none are selected
    if (matchingFields.length === 0 && fields) {
      // Find potential matching fields - prioritize text and email fields
      const potentialMatchFields = fields.filter(f => 
        ["text", "email"].includes(f.data_type)
      ).slice(0, 2); // Take up to 2 fields for initial matching
      
      if (potentialMatchFields.length > 0) {
        const fieldApiNames = potentialMatchFields.map(field => field.api_name);
        toast.info(`Selected ${potentialMatchFields.map(f => f.name).join(", ")} as default fields for duplicate checking`);
        updateMatchingFields(fieldApiNames);
      }
    }
    
    // Run duplicate check
    toast.promise(
      checkForDuplicates(),
      {
        loading: 'Checking for potential duplicates...',
        success: (hasDuplicates) => {
          // Move to appropriate step based on result
          if (hasDuplicates) {
            setStep("duplicate-check");
            return `Found ${duplicates.length} potential duplicate records`;
          } else {
            setStep("preview");
            return 'No duplicate records found';
          }
        },
        error: 'Failed to check for duplicates'
      }
    );
  };

  const handlePreviewContinue = () => {
    setStep("importing");
    importSelectedRecords();
  };

  const handleRecheckDuplicates = async () => {
    // Run duplicate check again with updated settings
    toast.promise(
      checkForDuplicates(),
      {
        loading: 'Rechecking with new settings...',
        success: (hasDuplicates) => {
          if (hasDuplicates) {
            return `Found ${duplicates.length} potential duplicate records with new settings`;
          } else {
            setStep("preview");
            return 'No duplicate records found with new settings';
          }
        },
        error: 'Failed to recheck for duplicates'
      }
    );
  };

  const importSelectedRecords = async () => {
    toast.promise(
      importRecords(selectedRows),
      {
        loading: 'Importing records...',
        success: (result) => {
          if (result) {
            navigate(`/objects/${objectTypeId}`);
            return `Successfully imported ${result.success} records`;
          }
          return 'Import completed';
        },
        error: 'Failed to import records'
      }
    );
  };

  const getMappedCount = () => {
    return columnMappings.filter(m => m.targetField !== null).length;
  };

  const getExampleData = () => {
    // Create example data based on fields
    if (!fields || fields.length === 0) return "Loading...";
    
    const exampleFields = fields.slice(0, 3);
    const headers = exampleFields.map(f => f.name).join("\t");
    const rows = [
      exampleFields.map(f => `[${f.name} value]`).join("\t"),
      exampleFields.map(f => `[${f.name} value]`).join("\t")
    ];
    
    return `${headers}\n${rows.join("\n")}`;
  };

  const handleCreateBatchFields = () => {
    setStep("batch-field-creation");
  };

  const handleBatchFieldCreationComplete = (createdFields: { columnName: string; fieldId: string }[]) => {
    // Update mappings for each created field
    createdFields.forEach(({ columnName, fieldId }) => {
      const columnIndex = columnMappings.findIndex(
        mapping => mapping.sourceColumnName === columnName
      );
      
      if (columnIndex >= 0) {
        updateColumnMapping(columnIndex, fieldId);
      }
    });
    
    // Return to mapping step
    setStep("mapping");
  };

  const handleBatchFieldCreationCancel = () => {
    setStep("mapping");
  };

  const handleDuplicateResolutionContinue = () => {
    // Move to preview step after duplicate resolution
    setStep("preview");
  };

  const handleCreateNewField = (columnIndex: number) => {
    const columnName = columnMappings[columnIndex]?.sourceColumnName || "";
    // Navigate to the field creation page, passing the column name as a URL parameter
    navigate(`/objects/${objectTypeId}/import/create-field/${encodeURIComponent(columnName)}`);
  };

  // Row selection handlers for preview
  const handleSelectRow = (rowIndex: number, selected: boolean) => {
    if (selected) {
      setSelectedRows(prev => [...prev, rowIndex]);
    } else {
      setSelectedRows(prev => prev.filter(idx => idx !== rowIndex]);
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected && importData) {
      setSelectedRows(Array.from({ length: importData.rows.length }, (_, i) => i));
    } else {
      setSelectedRows([]);
    }
  };

  if (!objectType || isLoadingFields) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Extract duplicate row indices from the duplicates array
  const duplicateRowIndices = duplicates.map(duplicate => duplicate.importRowIndex);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Import ${objectType.name}`}
        description={`Import data into ${objectType.name} from a spreadsheet`}
        actions={
          <Button variant="outline" onClick={() => navigate(`/objects/${objectTypeId}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {objectType.name}
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6">
          {step === "paste" && (
            <div className="space-y-4">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                <TabsList>
                  <TabsTrigger value="paste">Paste Data</TabsTrigger>
                  <TabsTrigger value="example">Example Format</TabsTrigger>
                </TabsList>
                <TabsContent value="paste" className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Copy data from Excel or Google Sheets and paste it below. 
                      The first row should contain column headers.
                    </AlertDescription>
                  </Alert>
                  <Textarea 
                    placeholder="Paste your data here..." 
                    className="h-[200px] font-mono"
                    value={pastedText} 
                    onChange={handleTextPaste}
                  />
                  <div className="flex justify-end">
                    <Button onClick={handleParseData} disabled={!pastedText.trim()}>
                      Continue
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="example">
                  <Alert variant="default">
                    <AlertDescription>
                      Your data should be in a format similar to this example (tab or comma separated):
                    </AlertDescription>
                  </Alert>
                  <div className="bg-muted p-4 rounded-md font-mono text-sm mt-2 whitespace-pre overflow-x-auto">
                    {getExampleData()}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {step === "mapping" && importData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {getMappedCount()} of {columnMappings.length} columns mapped
                </p>
                {unmappedColumns.length > 0 && (
                  <div className="flex items-center">
                    <Button 
                      variant="secondary" 
                      onClick={handleCreateBatchFields}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create {unmappedColumns.length} Missing Fields
                    </Button>
                  </div>
                )}
              </div>

              {getMappedCount() < columnMappings.length && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Some columns couldn't be matched automatically. Please map them manually or create new fields.
                  </AlertDescription>
                </Alert>
              )}

              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Column from data</TableHead>
                      <TableHead>Field mapping</TableHead>
                      <TableHead>Preview (first 3 rows)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {columnMappings.map((mapping, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {mapping.sourceColumnName}
                            {mapping.targetField ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={mapping.targetField?.id || "none"}
                            onValueChange={(value) => {
                              if (value === "create_new") {
                                handleCreateNewField(index);
                              } else {
                                updateColumnMapping(index, value === "none" ? null : value);
                              }
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a field" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">-- Not mapped --</SelectItem>
                              <SelectItem value="create_new" className="font-medium text-primary">
                                <div className="flex items-center">
                                  <Plus className="mr-2 h-4 w-4" />
                                  Create New Field
                                </div>
                              </SelectItem>
                              <SelectItem value="divider" disabled>
                                ───────────────────
                              </SelectItem>
                              {fields.map((field) => (
                                <SelectItem key={field.id} value={field.id}>
                                  {field.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="max-h-20 overflow-y-auto">
                            {importData.rows.slice(0, 3).map((row, rowIndex) => (
                              <div key={rowIndex} className="text-sm py-0.5">
                                {row[mapping.sourceColumnIndex] || <span className="text-muted-foreground italic">Empty</span>}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {importData.rows.length} records will be imported
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  clearImportData();
                  setStep("paste");
                }}>
                  Back
                </Button>
                <Button 
                  onClick={handleCheckForDuplicates} 
                  disabled={getMappedCount() === 0}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === "duplicate-check" && duplicates.length > 0 && importData && (
            <DuplicateRecordsResolver 
              duplicates={duplicates}
              fields={fields || []}
              matchingFields={matchingFields}
              columnMappings={columnMappings}
              importData={importData}
              onSetAction={updateDuplicateAction}
              onUpdateMatchingFields={updateMatchingFields}
              onUpdateDuplicateCheckIntensity={updateDuplicateCheckIntensity}
              duplicateCheckIntensity={duplicateCheckIntensity}
              onContinue={handleDuplicateResolutionContinue}
              onBack={() => setStep("mapping")}
              onRecheck={handleRecheckDuplicates}
            />
          )}

          {step === "preview" && importData && (
            <PreviewImportData 
              importData={importData}
              columnMappings={columnMappings}
              selectedRows={selectedRows}
              duplicateRows={duplicateRowIndices}
              onSelectRow={handleSelectRow}
              onSelectAll={handleSelectAll}
              onContinue={handlePreviewContinue}
              onBack={() => setStep(duplicates.length > 0 ? "duplicate-check" : "mapping")}
            />
          )}

          {step === "batch-field-creation" && unmappedColumns.length > 0 && (
            <BatchFieldCreation
              objectTypeId={objectTypeId!}
              columnNames={unmappedColumns}
              columnData={columnData}
              onComplete={handleBatchFieldCreationComplete}
              onCancel={handleBatchFieldCreationCancel}
            />
          )}

          {step === "importing" && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p>Importing your records...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
