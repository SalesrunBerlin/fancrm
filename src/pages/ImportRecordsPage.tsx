import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useRecordFields } from "@/hooks/useRecordFields";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertCircle, CheckCircle, ArrowLeft, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useImportRecords } from "@/hooks/useImportRecords";
import { useImportStorage } from "@/hooks/useImportStorage";
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

// Map intensity values between different naming conventions
const mapIntensity = (intensity: "low" | "medium" | "high"): "lenient" | "moderate" | "strict" => {
  const map: Record<string, "lenient" | "moderate" | "strict"> = {
    "low": "lenient",
    "medium": "moderate",
    "high": "strict"
  };
  return map[intensity];
};

// Map intensity values in reverse direction
const mapReverseIntensity = (intensity: "lenient" | "moderate" | "strict"): "low" | "medium" | "high" => {
  const map: Record<string, "low" | "medium" | "high"> = {
    "lenient": "low",
    "moderate": "medium",
    "strict": "high"
  };
  return map[intensity];
};

interface FieldToCreate {
  columnName: string;
  columnIndex: number;
  defaultType: string;
}

export default function ImportRecordsPage() {
  const { objectTypeId } = useParams<{ objectTypeId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [pastedText, setPastedText] = useState("");
  const [step, setStep] = useState<"paste" | "mapping" | "duplicate-check" | "preview" | "batch-field-creation" | "importing">("paste");
  const [activeTab, setActiveTab] = useState<"paste" | "example">("paste");
  const [unmappedColumns, setUnmappedColumns] = useState<string[]>([]);
  const [columnData, setColumnData] = useState<{ [columnName: string]: string[] }>({});
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [fieldsToCreate, setFieldsToCreate] = useState<FieldToCreate[]>([]);
  const [isRestoringState, setIsRestoringState] = useState(false);
  const [isApplyingUrlParams, setIsApplyingUrlParams] = useState(false);
  const [isUpdatingMappings, setIsUpdatingMappings] = useState(false);
  const isInitialMount = useRef(true);
  const mappingUpdateTimeout = useRef<NodeJS.Timeout | null>(null);
  
  const { objectTypes } = useObjectTypes();
  const { fields, isLoading: isLoadingFields } = useRecordFields(objectTypeId);
  const objectType = objectTypes?.find(type => type.id === objectTypeId);

  // Get import storage to persist state across navigation
  const { 
    storedData, 
    storeImportData, 
    clearImportData: clearStoredImportData,
    updateProcessingState,
    updateColumnMapping: updateStorageColumnMapping
  } = useImportStorage(objectTypeId!);

  const { 
    importData, 
    columnMappings: hookColumnMappings, 
    isImporting,
    duplicates,
    matchingFields,
    isDuplicateCheckCompleted,
    duplicateCheckIntensity: rawIntensity,
    parseImportText, 
    updateColumnMapping, 
    importRecords,
    clearImportData,
    checkForDuplicates,
    updateMatchingFields,
    updateDuplicateAction,
    updateDuplicateCheckIntensity: rawUpdateIntensity
  } = useImportRecords(objectTypeId!, fields || []);

  // Check for URL parameters first - with added stabilization
  useEffect(() => {
    const newFieldId = searchParams.get('newFieldId');
    const columnName = searchParams.get('columnName');
    
    if (newFieldId && columnName && fields && !isUpdatingMappings) {
      setIsApplyingUrlParams(true);
      
      // Find the new field
      const newField = fields.find(field => field.id === newFieldId);
      
      if (newField && storedData) {
        // Flag in storage that we're processing a new field to prevent flicker
        updateProcessingState(true);
        
        // Find the mapping index for this column
        const columnIndex = storedData.columnMappings.findIndex(
          mapping => mapping.sourceColumnName === decodeURIComponent(columnName)
        );
        
        if (columnIndex >= 0) {
          console.log(`Mapping column ${columnName} to new field:`, newField);
          
          // Update the storage first
          updateStorageColumnMapping(columnIndex, newFieldId);
          
          // Then update the hook state
          updateColumnMapping(columnIndex, newFieldId);
          
          // Show success message
          toast.success(`Field "${newField.name}" mapped to column "${decodeURIComponent(columnName)}"`);
        }
        
        // Clear URL params after applying them
        setTimeout(() => {
          navigate(`/objects/${objectTypeId}/import`, { replace: true });
          setIsApplyingUrlParams(false);
          updateProcessingState(false);
        }, 100);
      }
    }
  }, [searchParams, fields, navigate, objectTypeId, updateStorageColumnMapping, storedData, updateProcessingState]);

  // Restore state from storage when component mounts - with added stabilization
  useEffect(() => {
    if (storedData && fields && !isRestoringState && !isApplyingUrlParams && !isUpdatingMappings) {
      setIsRestoringState(true);
      
      // Restore import data
      parseImportText(storedData.rawText);
      
      // Restore step
      setStep(storedData.step);
      
      // Restore pastedText
      setPastedText(storedData.rawText);
      
      // We'll handle column mappings after importData is restored in the next useEffect
    }
  }, [storedData, fields, parseImportText, isApplyingUrlParams, isUpdatingMappings]);

  // Restore column mappings after importData is loaded - with debouncing to prevent flickering
  useEffect(() => {
    if (importData && storedData && fields && isRestoringState && !isApplyingUrlParams) {
      // Only restore mappings if we're not in the middle of processing a new field
      if (!storedData.processingNewField && !isUpdatingMappings) {
        setIsUpdatingMappings(true);
        
        // Clear any pending timeout
        if (mappingUpdateTimeout.current) {
          clearTimeout(mappingUpdateTimeout.current);
        }
        
        // Use timeout to debounce multiple rapid mapping updates
        mappingUpdateTimeout.current = setTimeout(() => {
          // Restore column mappings
          if (storedData.columnMappings && storedData.columnMappings.length > 0) {
            storedData.columnMappings.forEach((mapping, index) => {
              if (mapping.targetField?.id) {
                const field = fields.find(f => f.id === mapping.targetField?.id);
                if (field) {
                  updateColumnMapping(index, field.id);
                }
              }
            });
          }
          
          setIsRestoringState(false);
          setIsUpdatingMappings(false);
        }, 300);
      }
    }
  }, [importData, storedData, fields, updateColumnMapping, isRestoringState, isApplyingUrlParams, isUpdatingMappings]);

  // Store current state whenever important values change - with stabilization
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    if (importData && !isRestoringState && !isApplyingUrlParams && !isUpdatingMappings) {
      // Clear any pending timeout to avoid multiple rapid updates
      if (mappingUpdateTimeout.current) {
        clearTimeout(mappingUpdateTimeout.current);
      }
      
      mappingUpdateTimeout.current = setTimeout(() => {
        storeImportData({
          rawText: pastedText,
          headers: importData.headers,
          rows: importData.rows,
          columnMappings: hookColumnMappings,
          step: step,
          processingNewField: false
        });
      }, 200);
    }
  }, [importData, hookColumnMappings, step, pastedText, storeImportData, isRestoringState, isApplyingUrlParams, isUpdatingMappings]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (mappingUpdateTimeout.current) {
        clearTimeout(mappingUpdateTimeout.current);
      }
    };
  }, []);

  // Directly use the columnMappings from the hook without conversion
  const columnMappings = hookColumnMappings;

  const duplicateCheckIntensity = mapIntensity(rawIntensity);
  
  const updateDuplicateCheckIntensity = (intensity: "lenient" | "moderate" | "strict") => {
    rawUpdateIntensity(mapReverseIntensity(intensity));
  };

  // Process the fields that need to be created when continuing
  useEffect(() => {
    if (hookColumnMappings.length > 0 && fields && !isRestoringState && !isApplyingUrlParams && !isUpdatingMappings) {
      // Identify unmapped columns and prepare them for potential field creation
      const unmapped = hookColumnMappings
        .filter(mapping => !mapping.targetField)
        .map(mapping => ({
          columnName: mapping.sourceColumnName,
          columnIndex: mapping.sourceColumnIndex,
          defaultType: "text" // Default to text type
        }));
      
      setFieldsToCreate(unmapped);
      setUnmappedColumns(unmapped.map(item => item.columnName));
      
      // Also collect sample data for each column to help with field type suggestions
      if (importData) {
        const data: { [columnName: string]: string[] } = {};
        
        hookColumnMappings.forEach(mapping => {
          const values = importData.rows
            .slice(0, 10) // Take up to 10 sample values
            .map(row => row[mapping.sourceColumnIndex])
            .filter(val => val !== null && val !== undefined && val.trim() !== '');
          
          data[mapping.sourceColumnName] = values;
        });
        
        setColumnData(data);
      }
    }
  }, [hookColumnMappings, fields, importData, isRestoringState, isApplyingUrlParams, isUpdatingMappings]);

  const handleCheckForDuplicates = async (): Promise<boolean> => {
    // Check if there are unmapped columns that need field creation
    if (fieldsToCreate.length > 0) {
      setStep("batch-field-creation");
      return false; // Don't proceed to duplicate check yet
    }
    
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
    try {
      const hasDuplicates = await checkForDuplicates();
      
      // Move to appropriate step based on result
      if (hasDuplicates) {
        setStep("duplicate-check");
        toast.info(`Found ${duplicates.length} potential duplicate records`);
      } else {
        setStep("preview");
        toast.info('No duplicate records found');
      }
      return hasDuplicates;
    } catch (error) {
      toast.error('Failed to check for duplicates');
      console.error(error);
      return false;
    }
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
            // Clear stored import data when import is complete
            clearStoredImportData();
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
    return hookColumnMappings.filter(m => m.targetField !== null).length;
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

  // Handle creating new fields in batch
  const handleCreateBatchFields = () => {
    setStep("batch-field-creation");
  };

  const handleBatchFieldCreationComplete = (createdFields: { columnName: string; fieldId: string }[]) => {
    // Block any other updates while we're processing batch field creation
    setIsUpdatingMappings(true);
    
    // Update mappings for each created field
    createdFields.forEach(({ columnName, fieldId }) => {
      const columnIndex = hookColumnMappings.findIndex(
        mapping => mapping.sourceColumnName === columnName
      );
      
      if (columnIndex >= 0) {
        updateColumnMapping(columnIndex, fieldId);
        // Also update storage
        updateStorageColumnMapping(columnIndex, fieldId);
      }
    });
    
    // Proceed to duplicate check after creating all fields
    setStep("mapping");
    toast.success(`Created ${createdFields.length} fields successfully`);
    
    // Reset fields to create list since they've been processed
    setFieldsToCreate([]);
    
    // Allow other updates after a short delay
    setTimeout(() => {
      setIsUpdatingMappings(false);
    }, 300);
  };

  const handleBatchFieldCreationCancel = () => {
    setStep("mapping");
  };

  const handleDuplicateResolutionContinue = () => {
    // Move to preview step after duplicate resolution
    setStep("preview");
  };

  const handleCreateNewField = (columnIndex: number) => {
    // Store the current state before navigating
    if (importData) {
      // Set the flag that we're about to create a new field
      const updatedStoredData = {
        rawText: pastedText,
        headers: importData.headers,
        rows: importData.rows,
        columnMappings: hookColumnMappings,
        step: "mapping" as const, // Always return to mapping step
        processingNewField: true
      };
      
      storeImportData(updatedStoredData);
    }
    
    const columnName = hookColumnMappings[columnIndex]?.sourceColumnName || "";
    // Navigate to the field creation page, passing the column name as a URL parameter
    navigate(`/objects/${objectTypeId}/import/create-field/${encodeURIComponent(columnName)}`);
  };

  // Row selection handlers for preview
  const handleSelectRow = (rowIndex: number, selected: boolean) => {
    if (selected) {
      setSelectedRows(prev => [...prev, rowIndex]);
    } else {
      setSelectedRows(prev => prev.filter(idx => idx !== rowIndex));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected && importData) {
      setSelectedRows(Array.from({ length: importData.rows.length }, (_, i) => i));
    } else {
      setSelectedRows([]);
    }
  };

  // Handle clearing import data (both in state and storage)
  const handleClearImportData = () => {
    clearImportData();
    clearStoredImportData();
    setStep("paste");
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
                    onChange={(e) => setPastedText(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <Button 
                      onClick={() => {
                        if (pastedText.trim()) {
                          parseImportText(pastedText);
                          setStep("mapping");
                        }
                      }} 
                      disabled={!pastedText.trim()}
                    >
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
                  {getMappedCount()} of {hookColumnMappings.length} columns mapped
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

              {getMappedCount() < hookColumnMappings.length && (
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
                    {hookColumnMappings.map((mapping, index) => (
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
                            key={`${mapping.sourceColumnName}-${mapping.targetField?.id || 'none'}`}
                            value={mapping.targetField?.id || "none"}
                            onValueChange={(value) => {
                              if (value === "create_new") {
                                handleCreateNewField(index);
                              } else {
                                updateColumnMapping(index, value === "none" ? null : value);
                                // Also update in storage to keep them in sync
                                updateStorageColumnMapping(index, value === "none" ? null : value);
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
                              {fields?.map((field) => (
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
                <Button variant="outline" onClick={handleClearImportData}>
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
