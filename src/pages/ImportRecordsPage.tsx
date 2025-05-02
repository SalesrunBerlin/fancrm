import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useRecordFields } from "@/hooks/useRecordFields";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertCircle, CheckCircle, ArrowLeft, Plus, AlertTriangle } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

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
  
  // State flags to prevent race conditions and infinite render loops
  const [isRestoringState, setIsRestoringState] = useState(false);
  const [isApplyingUrlParams, setIsApplyingUrlParams] = useState(false);
  const [isUpdatingMappings, setIsUpdatingMappings] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  
  const isInitialMount = useRef(true);
  const mappingUpdateTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateUpdateLock = useRef(false);
  const selectUpdateCounter = useRef(0);
  
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

  // Safe update function with debouncing to prevent race conditions
  const safeUpdateStorage = useCallback((data: any) => {
    if (stateUpdateLock.current) return;
    
    if (mappingUpdateTimeout.current) {
      clearTimeout(mappingUpdateTimeout.current);
    }
    
    mappingUpdateTimeout.current = setTimeout(() => {
      storeImportData(data);
      console.log("Storage updated with debounce");
    }, 500);
  }, [storeImportData]);
  
  // Modified: Only clear import data on initial page load if we're not returning from field creation
  useEffect(() => {
    // Check if we're in the middle of a field creation workflow
    const isReturningFromFieldCreation = searchParams.get('newFieldId') && searchParams.get('columnName');
    
    // Only clear data on initial mount if we're not returning from field creation
    if (isInitialMount.current && objectTypeId && !isReturningFromFieldCreation && !storedData?.processingNewField) {
      clearStoredImportData();
      clearImportData();
      console.log("Import data cleared on new import session");
      isInitialMount.current = false;
    } else if (isInitialMount.current) {
      // Just mark initial mount as done without clearing if we're returning from field creation
      console.log("Preserving import data for field creation workflow");
      isInitialMount.current = false;
    }
  }, [objectTypeId, clearStoredImportData, clearImportData, searchParams, storedData]);
  
  // Check for URL parameters - with improved safety
  useEffect(() => {
    const newFieldId = searchParams.get('newFieldId');
    const columnName = searchParams.get('columnName');

    if (newFieldId && columnName && fields) {
      // Find the index of the column that matches the column name
      const columnIndex = hookColumnMappings.findIndex(
        mapping => mapping.sourceColumnName === columnName
      );

      if (columnIndex >= 0) {
        // Update the column mapping with the new field ID
        const field = fields.find(f => f.id === newFieldId);
        if (field) {
          updateColumnMapping(columnIndex, field.id);
          updateStorageColumnMapping(columnIndex, field.id);
        }
      }

      // Remove the URL parameters to avoid infinite loops
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete('newFieldId');
      newSearchParams.delete('columnName');
      navigate(`${window.location.pathname}?${newSearchParams.toString()}`, { replace: true });
    } else if (storedData && storedData.columnMappings && fields && !isApplyingUrlParams) {
      setIsApplyingUrlParams(true);
      stateUpdateLock.current = true;

      // Restore column mappings from stored data
      storedData.columnMappings.forEach((mapping, index) => {
        if (mapping.targetField?.id) {
          const field = fields.find(f => f.id === mapping.targetField?.id);
          if (field) {
            updateColumnMapping(index, field.id);
          }
        }
      });

      setTimeout(() => {
        setIsApplyingUrlParams(false);
        stateUpdateLock.current = false;
      }, 500);
    }
  }, [searchParams, fields, navigate, objectTypeId, updateStorageColumnMapping, storedData, updateProcessingState, updateColumnMapping]);

  // NEW: Selective state restoration effect - only restore when returning from field creation
  useEffect(() => {
    // Only restore state if we have stored data and it indicates we're processing a new field
    if (!objectTypeId || !fields || fields.length === 0) return;
    
    // Check if we have URL parameters indicating we're returning from field creation
    const isReturningFromFieldCreation = searchParams.get('newFieldId') && searchParams.get('columnName');
    
    // Restore state if either the stored data shows we're in field creation process
    // or we have URL params indicating we've returned from field creation
    if (storedData && fields && !isRestoringState && !isProcessingAction &&
        (storedData.processingNewField || isReturningFromFieldCreation)) {
      
      setIsRestoringState(true);
      setIsProcessingAction(true);
      stateUpdateLock.current = true;
      
      console.log("Restoring import state for field creation workflow");
      
      // Restore import data
      if (storedData.rawText) {
        parseImportText(storedData.rawText);
      }
      
      // Restore step - always return to mapping step after field creation
      setStep(storedData.step || "mapping");
      
      // Restore pastedText
      setPastedText(storedData.rawText || "");
      
      // After a delay to ensure importData is parsed
      setTimeout(() => {
        if (storedData.columnMappings && storedData.columnMappings.length > 0) {
          // Only restore mappings that aren't affected by the newly created field
          storedData.columnMappings.forEach((mapping, index) => {
            if (mapping.targetField?.id) {
              const field = fields.find(f => f.id === mapping.targetField?.id);
              if (field) {
                updateColumnMapping(index, field.id);
              }
            }
          });
        }
        
        // Release locks after restoration is complete
        setTimeout(() => {
          setIsRestoringState(false);
          setIsProcessingAction(false);
          stateUpdateLock.current = false;
          
          // Reset the processing new field flag after state is restored
          if (storedData.processingNewField) {
            updateProcessingState(false);
          }
        }, 500);
      }, 500);
    }
  }, [storedData, fields, parseImportText, isProcessingAction, objectTypeId, updateColumnMapping, updateProcessingState, searchParams, storedData?.processingNewField]);

  // Store current state whenever important values change - with improved safety
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    if (importData && !isRestoringState && !isApplyingUrlParams && !isProcessingAction && !stateUpdateLock.current) {
      safeUpdateStorage({
        rawText: pastedText,
        headers: importData.headers,
        rows: importData.rows,
        columnMappings: hookColumnMappings,
        step: step,
        processingNewField: false
      });
    }
  }, [
    importData, 
    hookColumnMappings, 
    step, 
    pastedText, 
    safeUpdateStorage, 
    isRestoringState, 
    isApplyingUrlParams,
    isProcessingAction
  ]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (mappingUpdateTimeout.current) {
        clearTimeout(mappingUpdateTimeout.current);
      }
      stateUpdateLock.current = false;
    };
  }, []);

  // For use in the component without conversion
  const columnMappings = hookColumnMappings;
  const duplicateCheckIntensity = mapIntensity(rawIntensity);
  
  const updateDuplicateCheckIntensity = useCallback((intensity: "lenient" | "moderate" | "strict") => {
    rawUpdateIntensity(mapReverseIntensity(intensity));
  }, [rawUpdateIntensity]);

  // Process the fields that need to be created when continuing - with improved safety
  useEffect(() => {
    if (!objectTypeId || !fields || fields.length === 0) return;
    
    if (hookColumnMappings.length > 0 && fields && !isRestoringState && 
        !isApplyingUrlParams && !isUpdatingMappings && !isProcessingAction) {
      // Identify unmapped columns and prepare them for potential field creation
      const unmapped = hookColumnMappings
        .filter(mapping => !mapping.targetField)
        .map(mapping => ({
          columnName: mapping.sourceColumnName,
          columnIndex: mapping.sourceColumnIndex,
          defaultType: guessDataTypeForColumn(mapping.sourceColumnIndex) // Enhanced data type detection
        }));
      
      setFieldsToCreate(unmapped);
      setUnmappedColumns(unmapped.map(item => item.columnName));
      
      // Show notification if there are unmapped columns
      setShowUnmappedAlert(unmapped.length > 0);
      
      // Collect sample data for each column to help with field type suggestions
      if (importData) {
        const data: { [columnName: string]: string[] } = {};
        
        hookColumnMappings.forEach(mapping => {
          const values = importData.rows
            .map(row => row[mapping.sourceColumnIndex])
            .filter(val => val !== null && val !== undefined && val.trim() !== '');
          
          data[mapping.sourceColumnName] = values;
        });
        
        setColumnData(data);
      }
    }
  }, [hookColumnMappings, fields, importData, isRestoringState, isApplyingUrlParams, isUpdatingMappings, isProcessingAction, objectTypeId]);

  // Enhanced function to guess data type based on column content
  const guessDataTypeForColumn = (columnIndex: number): string => {
    if (!importData) return "text";
    
    // Get the column name
    const columnName = hookColumnMappings[columnIndex]?.sourceColumnName || "";
    const lowercaseColumnName = columnName.toLowerCase();
    
    // Get sample data from the column (up to 20 rows)
    const sampleValues = importData.rows
      .slice(0, 20)
      .map(row => row[columnIndex])
      .filter(val => val !== null && val !== undefined && val.trim() !== '');
    
    // First check name patterns
    if (lowercaseColumnName.includes('email')) return 'email';
    if (lowercaseColumnName.includes('phone')) return 'phone';
    if (lowercaseColumnName.includes('date')) return 'date';
    if (lowercaseColumnName.includes('url') || lowercaseColumnName.includes('website')) return 'url';
    if (lowercaseColumnName.includes('description') || lowercaseColumnName.includes('note')) return 'textarea';
    
    // Check data patterns
    if (sampleValues.length > 0) {
      // Check if all values are numbers
      if (sampleValues.every(val => !isNaN(Number(val)) && val.trim() !== '')) {
        return 'number';
      }
      
      // Check if it looks like an email pattern
      if (sampleValues.some(val => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))) {
        return 'email';
      }
      
      // Check if it looks like a URL pattern
      if (sampleValues.some(val => /^https?:\/\//.test(val))) {
        return 'url';
      }
      
      // Check if it could be a picklist (few unique values compared to total)
      if (sampleValues.length >= 5) {
        const uniqueValues = new Set(sampleValues);
        if (uniqueValues.size <= Math.min(10, sampleValues.length * 0.5)) {
          return 'picklist';
        }
      }
    }
    
    // Default to text
    return 'text';
  };

  const handleCheckForDuplicates = async (): Promise<boolean> => {
    // Don't proceed if we're in the middle of an operation
    if (isProcessingAction) return false;
    
    setIsProcessingAction(true);
    toast.info("Checking for duplicates...");
    
    try {
      // Check if there are unmapped columns that need field creation
      if (fieldsToCreate.length > 0) {
        setStep("batch-field-creation");
        setIsProcessingAction(false);
        return false; // Don't proceed to duplicate check yet
      }
      
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
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handlePreviewContinue = () => {
    if (isProcessingAction) return;
    setIsProcessingAction(true);
    
    setStep("importing");
    importSelectedRecords();
  };

  const handleRecheckDuplicates = async () => {
    // Don't proceed if we're in the middle of an operation
    if (isProcessingAction) return;
    
    setIsProcessingAction(true);
    
    // Run duplicate check again with updated settings
    toast.promise(
      checkForDuplicates(),
      {
        loading: 'Rechecking with new settings...',
        success: (hasDuplicates) => {
          if (hasDuplicates) {
            setIsProcessingAction(false);
            return `Found ${duplicates.length} potential duplicate records with new settings`;
          } else {
            setStep("preview");
            setIsProcessingAction(false);
            return 'No duplicate records found with new settings';
          }
        },
        error: (err) => {
          setIsProcessingAction(false);
          return 'Failed to recheck for duplicates';
        }
      }
    );
  };

  const importSelectedRecords = async () => {
    // Make sure we have rows selected, defaulting to all rows if none selected
    if (selectedRows.length === 0 && importData) {
      setSelectedRows(Array.from({ length: importData.rows.length }, (_, i) => i));
    }
    
    toast.promise(
      importRecords(selectedRows.length > 0 ? selectedRows : Array.from({ length: importData?.rows.length || 0 }, (_, i) => i)),
      {
        loading: 'Importing records...',
        success: (result) => {
          if (result) {
            // Clear stored import data when import is complete
            clearStoredImportData();
            navigate(`/objects/${objectTypeId}`);
            setIsProcessingAction(false);
            return `Successfully imported ${result.success} records`;
          }
          setIsProcessingAction(false);
          return 'Import completed';
        },
        error: (err) => {
          setIsProcessingAction(false);
          return 'Failed to import records';
        }
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
    if (isProcessingAction) return;
    setIsProcessingAction(true);
    
    if (unmappedColumns.length > 0) {
      setStep("batch-field-creation");
      
      // Update stored data to preserve state during field creation
      if (importData) {
        storeImportData({
          rawText: pastedText,
          headers: importData.headers,
          rows: importData.rows,
          columnMappings: hookColumnMappings,
          step: "batch-field-creation",
          processingNewField: true
        });
      }
    }
    
    setIsProcessingAction(false);
  };

  const handleBatchFieldCreationComplete = (createdFields: { columnName: string; fieldId: string }[]) => {
    // Don't proceed if we're in the middle of an operation
    if (isProcessingAction) return;
    
    setIsProcessingAction(true);
    setIsUpdatingMappings(true);
    
    // Block any other updates while we're processing batch field creation
    stateUpdateLock.current = true;
    
    // Show creation success message
    toast.success(`${createdFields.length} fields created successfully!`);
    
    // Update mappings for each created field
    const updatePromises = createdFields.map(({ columnName, fieldId }, index) => {
      return new Promise<void>(resolve => {
        setTimeout(() => {
          const columnIndex = hookColumnMappings.findIndex(
            mapping => mapping.sourceColumnName === columnName
          );
          
          if (columnIndex >= 0) {
            updateColumnMapping(columnIndex, fieldId);
            // Also update storage
            updateStorageColumnMapping(columnIndex, fieldId);
          }
          resolve();
        }, index * 100); // Stagger updates to prevent race conditions
      });
    });
    
    // Process all updates before proceeding
    Promise.all(updatePromises).then(() => {
      // Clear unmapped alert after successful field creation
      setShowUnmappedAlert(false);
      
      // Proceed to mapping step after creating all fields
      setStep("mapping");
      
      // Reset fields to create list since they've been processed
      setFieldsToCreate([]);
      
      // Allow other updates after a delay
      setTimeout(() => {
        stateUpdateLock.current = false;
        setIsUpdatingMappings(false);
        setIsProcessingAction(false);
      }, 500);
    });
  };

  const handleBatchFieldCreationCancel = () => {
    if (isProcessingAction) return;
    
    setStep("mapping");
  };

  const handleDuplicateResolutionContinue = () => {
    if (isProcessingAction) return;
    
    // Move to preview step after duplicate resolution
    setStep("preview");
  };

  // Modified handleCreateNewField function to properly set the processing flag
  const handleCreateNewField = (columnIndex: number) => {
    // Don't proceed if we're in the middle of an operation
    if (isProcessingAction) return;
    
    setIsProcessingAction(true);
    
    // Store the current state before navigating
    if (importData) {
      // Set the flag that we're about to create a new field
      const updatedStoredData = {
        rawText: pastedText,
        headers: importData.headers,
        rows: importData.rows,
        columnMappings: hookColumnMappings,
        step: step, // Preserve the current step instead of hardcoding
        processingNewField: true
      };
      
      // Update storage with processing flag set to true
      storeImportData(updatedStoredData);
      console.log("Setting processingNewField flag before navigating to field creation");
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
    // Don't proceed if we're in the middle of an operation
    if (isProcessingAction) return;
    
    setIsProcessingAction(true);
    
    clearImportData();
    clearStoredImportData();
    setStep("paste");
    setPastedText("");
    
    setIsProcessingAction(false);
  };

  // Generate unique stable key for select components
  const getSelectKey = (mapping: any) => {
    const targetId = mapping.targetField?.id || 'none';
    const counter = selectUpdateCounter.current;
    return `select-${mapping.sourceColumnName}-${targetId}-${counter}`;
  };

  // Handle select change
  const handleFieldSelect = (value: string, index: number) => {
    if (isProcessingAction || isUpdatingMappings) return;
    
    setIsProcessingAction(true);
    
    if (value === "create_new") {
      handleCreateNewField(index);
      return;
    }
    
    const fieldId = value === "none" ? null : value;
    updateColumnMapping(index, fieldId);
    // Also update in storage to keep them in sync
    updateStorageColumnMapping(index, fieldId);
    
    // Increment counter to force new keys on next render
    selectUpdateCounter.current += 1;
    
    setTimeout(() => {
      setIsProcessingAction(false);
    }, 300);
  };

  // Add a prominent notification state for unmapped columns
  const [showUnmappedAlert, setShowUnmappedAlert] = useState(false);

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
                        if (pastedText.trim() && !isProcessingAction) {
                          setIsProcessingAction(true);
                          parseImportText(pastedText);
                          setStep("mapping");
                          setIsProcessingAction(false);
                        }
                      }} 
                      disabled={!pastedText.trim() || isProcessingAction}
                    >
                      Continue
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="example">
                  <Alert>
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
                
                {/* Enhanced batch field creation button */}
                {unmappedColumns.length > 0 && (
                  <Button 
                    variant="default" 
                    onClick={handleCreateBatchFields}
                    disabled={isProcessingAction || isRestoringState || isUpdatingMappings}
                    className="bg-primary"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create {unmappedColumns.length} Missing Fields
                  </Button>
                )}
              </div>

              {/* Enhanced unmapped columns alert */}
              {showUnmappedAlert && (
                <Alert className="py-3">
                  <AlertTriangle className="h-5 w-5" />
                  <div className="ml-2">
                    <AlertDescription className="font-medium">
                      {unmappedColumns.length} columns need to be mapped
                    </AlertDescription>
                    <p className="text-sm mt-1">
                      Create all missing fields at once by clicking "Create Missing Fields" 
                      or map them manually to existing fields.
                    </p>
                  </div>
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
                      <TableRow key={`row-${mapping.sourceColumnName}-${index}-${selectUpdateCounter.current}`}>
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
                            key={getSelectKey(mapping)}
                            value={mapping.targetField?.id || "none"}
                            onValueChange={(value) => handleFieldSelect(value, index)}
                            disabled={isProcessingAction || isUpdatingMappings || isRestoringState || isApplyingUrlParams}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a field" />
                            </SelectTrigger>
                            <SelectContent className="z-50 bg-background">
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
                              <div key={`preview-${index}-${rowIndex}`} className="text-sm py-0.5">
                                {row[mapping.sourceColumnIndex] || <span className="text-muted-foreground italic">Empty</span>}
                              </div>
                            ))}
                            {importData.rows.length > 3 && (
                              <Badge className="mt-1">+{importData.rows.length - 3} more rows</Badge>
                            )}
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
