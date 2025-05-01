
import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useRecordFields } from "@/hooks/useRecordFields";
import { useImportRecords } from "@/hooks/useImportRecords";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, FileText, ClipboardPaste, AlertCircle } from "lucide-react";
import * as XLSX from 'xlsx';
import { supabase } from "@/integrations/supabase/client";
import { FieldMapperWithCreation } from "@/components/import/FieldMapperWithCreation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BatchFieldCreation } from "@/components/import/BatchFieldCreation";

export default function ImportRecordsPage() {
  const { objectTypeId } = useParams<{ objectTypeId: string }>();
  const [searchParams] = useSearchParams();
  const { objectTypes } = useObjectTypes();
  const { fields } = useRecordFields(objectTypeId);
  const { parseImportText, columnMappings, updateColumnMapping, importData, clearImportData } = useImportRecords(objectTypeId!, fields || []);
  const objectType = objectTypes?.find(type => type.id === objectTypeId);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [importData, setImportData] = useState<any[]>([]);
  const [uniqueKeyField, setUniqueKeyField] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [fetchingRecords, setFetchingRecords] = useState(false);
  const [importMethod, setImportMethod] = useState<string>("excel");
  const [pastedText, setPastedText] = useState<string>("");
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [needsFieldCreation, setNeedsFieldCreation] = useState(false);
  const [showBatchFieldCreation, setShowBatchFieldCreation] = useState(false);
  const navigate = useNavigate();

  // Check for params from create field page
  useEffect(() => {
    const newFieldId = searchParams.get('newFieldId');
    const columnName = searchParams.get('columnName');
    
    if (newFieldId && columnName && columnMappings) {
      // Find the column index for this column name
      const columnIndex = columnMappings.findIndex(
        mapping => mapping.sourceColumnName === decodeURIComponent(columnName)
      );
      
      if (columnIndex !== -1) {
        // Update the mapping with the new field
        updateColumnMapping(columnIndex, newFieldId);
        toast.success("Field created and mapped successfully");
      }
    }
  }, [searchParams, columnMappings, updateColumnMapping]);

  useEffect(() => {
    if (fields && fields.length > 0) {
      setUniqueKeyField(fields[0].api_name);
    }
  }, [fields]);

  // Check if any mappings have no target field
  useEffect(() => {
    if (columnMappings && columnMappings.length > 0) {
      const hasUnmappedColumns = columnMappings.some(mapping => mapping.targetField === null);
      setNeedsFieldCreation(hasUnmappedColumns);
    } else {
      setNeedsFieldCreation(false);
    }
  }, [columnMappings]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files && event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      readExcel(selectedFile);
    }
  };

  const readExcel = (file: File) => {
    const fileReader = new FileReader();
    fileReader.onload = (e) => {
      const data = e.target?.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);
      setExcelData(json);
    };
    fileReader.readAsBinaryString(file);
  };

  const handlePastedTextImport = () => {
    if (!pastedText.trim()) {
      toast.error("Please paste some data first");
      return;
    }

    // Use the parseImportText function from useImportRecords hook
    const parsedData = parseImportText(pastedText);
    if (parsedData && parsedData.rows.length > 0) {
      // Convert the parsed data to a format similar to what excelData uses
      const convertedData = parsedData.rows.map(row => {
        const rowData: { [key: string]: string } = {};
        parsedData.headers.forEach((header, index) => {
          rowData[header] = row[index] || "";
        });
        return rowData;
      });
      
      setExcelData(convertedData);
      toast.success(`Successfully parsed ${convertedData.length} rows of data`);
    } else {
      toast.error("Could not parse the pasted data. Please check the format.");
    }
  };

  const prepareImportData = () => {
    if (!fields) return;

    const preparedData = excelData.map(item => {
      const record: { [key: string]: any } = {};
      fields.forEach(field => {
        const headerName = Object.keys(item).find(key => key.toLowerCase() === field.name.toLowerCase());
        if (headerName) {
          record[field.api_name] = item[headerName];
        }
      });
      return record;
    });

    setImportData(preparedData);
  };

  useEffect(() => {
    if (excelData.length > 0) {
      prepareImportData();
    }
  }, [excelData, fields]);

  const handleUniqueKeyFieldChange = (value: string) => {
    setUniqueKeyField(value);
  };

  const handleColumnMappingChange = (columnIndex: number, fieldId: string | null) => {
    updateColumnMapping(columnIndex, fieldId);
  };

  const processImportData = async () => {
    if (!importData || !objectTypeId) return;
    
    setFetchingRecords(true);
    
    try {
      // Check for existing records first
      const existingIds = new Set<string>();
      const { data: existingRecords, error } = await supabase
        .from('object_records')
        .select('id, record_id, created_at')
        .eq('object_type_id', objectTypeId);
      
      if (error) {
        throw error;
      }
      
      // If we have existing records, check for duplicates
      if (existingRecords && existingRecords.length > 0) {
        // Instead of trying to access field_values directly, get them separately
        for (const record of existingRecords) {
          const { data: fieldValues } = await supabase
            .from('object_field_values')
            .select('field_api_name, value')
            .eq('record_id', record.id);
            
          // Now build the field_values object
          if (fieldValues) {
            const valuesObject = fieldValues.reduce((acc, curr) => {
              acc[curr.field_api_name] = curr.value;
              return acc;
            }, {} as { [key: string]: string | null });
            
            // Now we can access the field values
            if (valuesObject[uniqueKeyField]) {
              existingIds.add(valuesObject[uniqueKeyField]);
            }
          }
        }
      }

      let createdCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;

      for (const record of importData) {
        if (!record[uniqueKeyField]) {
          skippedCount++;
          continue;
        }

        if (existingIds.has(record[uniqueKeyField])) {
          updatedCount++;
          continue;
        }

        const { error: insertError } = await supabase
          .from('object_records')
          .insert([
            {
              object_type_id: objectTypeId,
            },
          ])
          .select()
          .single();

        if (insertError) {
          console.error("Error inserting record:", insertError);
          continue;
        }

        createdCount++;
      }

      toast.success(`${createdCount} records created, ${updatedCount} records updated, ${skippedCount} records skipped`);
      navigate(`/objects/${objectTypeId}`);
    } catch (error) {
      console.error("Error processing import data:", error);
      toast.error("Failed to import records");
    } finally {
      setFetchingRecords(false);
    }
  };

  const handleBatchFieldCreationComplete = (createdFields: { columnName: string; fieldId: string }[]) => {
    // Update each mapping based on the created fields
    createdFields.forEach(created => {
      const columnIndex = columnMappings.findIndex(
        mapping => mapping.sourceColumnName === created.columnName
      );
      
      if (columnIndex !== -1) {
        updateColumnMapping(columnIndex, created.fieldId);
      }
    });
    
    setShowBatchFieldCreation(false);
    toast.success(`${createdFields.length} fields created and mapped successfully`);
  };

  const handleBatchFieldCreationCancel = () => {
    setShowBatchFieldCreation(false);
  };

  // Get column data for batch field creation
  const getColumnData = () => {
    if (!excelData || excelData.length === 0) return {};
    
    const columnData: { [columnName: string]: string[] } = {};
    
    // Get unmapped columns
    const unmappedColumns = columnMappings
      .filter(mapping => mapping.targetField === null)
      .map(mapping => mapping.sourceColumnName);
    
    // For each unmapped column, collect all values
    unmappedColumns.forEach(columnName => {
      columnData[columnName] = excelData.map(row => {
        return row[columnName] || '';
      });
    });
    
    return columnData;
  };

  // Handle creating fields for all unmapped columns at once
  const handleCreateFieldsForAll = () => {
    if (!needsFieldCreation) return;
    
    const unmappedColumns = columnMappings
      .filter(mapping => mapping.targetField === null)
      .map(mapping => mapping.sourceColumnName);
    
    if (unmappedColumns.length === 0) return;
    
    setSelectedColumns(unmappedColumns);
    setShowBatchFieldCreation(true);
  };

  if (!objectType) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If batch field creation is active, show that component
  if (showBatchFieldCreation) {
    return (
      <BatchFieldCreation
        objectTypeId={objectTypeId!}
        columnNames={selectedColumns}
        columnData={getColumnData()}
        onComplete={handleBatchFieldCreationComplete}
        onCancel={handleBatchFieldCreationCancel}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Import ${objectType.name} Records`}
        description={`Import records into your ${objectType.name.toLowerCase()} object`}
        actions={
          <>
            {needsFieldCreation && (
              <Button onClick={handleCreateFieldsForAll} variant="secondary">
                Create Fields for All Columns
              </Button>
            )}
            <Button onClick={processImportData} disabled={fetchingRecords || importData.length === 0 || needsFieldCreation}>
              {fetchingRecords ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                "Import"
              )}
            </Button>
          </>
        }
      />

      <Card>
        <CardContent className="pt-6 space-y-4">
          <Tabs defaultValue="excel" value={importMethod} onValueChange={setImportMethod}>
            <TabsList className="mb-4">
              <TabsTrigger value="excel" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Excel File
              </TabsTrigger>
              <TabsTrigger value="paste" className="flex items-center gap-2">
                <ClipboardPaste className="h-4 w-4" />
                Paste Data
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="excel" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file">Choose Excel File</Label>
                <Input type="file" id="file" accept=".xlsx, .xls" onChange={handleFileChange} />
              </div>
            </TabsContent>
            
            <TabsContent value="paste" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pastedText">Paste Data (Tab or Comma Separated)</Label>
                <Textarea 
                  id="pastedText" 
                  placeholder="Paste your data here. First row should contain headers."
                  className="min-h-[200px] font-mono text-sm"
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                />
                <div className="text-sm text-muted-foreground mt-2">
                  <p>Format: First row should be column headers, subsequent rows should be data.</p>
                  <p>Example: Name[tab]Email[tab]Phone</p>
                </div>
                <Button 
                  onClick={handlePastedTextImport} 
                  disabled={!pastedText.trim()}
                  variant="secondary"
                >
                  Parse Pasted Data
                </Button>
              </div>
            </TabsContent>
          </Tabs>
          
          {fields && fields.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="uniqueKeyField">Unique Key Field</Label>
              <Select value={uniqueKeyField} onValueChange={handleUniqueKeyFieldChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  {fields.map(field => (
                    <SelectItem key={field.id} value={field.api_name}>
                      {field.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {columnMappings && columnMappings.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-medium mb-4">Map Columns to Fields</h2>
            {needsFieldCreation && (
              <Alert variant="warning" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Some columns couldn't be mapped to existing fields. Please map them or create new fields.
                </AlertDescription>
              </Alert>
            )}
            <FieldMapperWithCreation
              objectTypeId={objectTypeId!}
              columnMappings={columnMappings}
              fields={fields || []}
              onUpdateMapping={handleColumnMappingChange}
            />
          </CardContent>
        </Card>
      )}

      {importData.length > 0 && !needsFieldCreation && (
        <Card>
          <CardContent className="overflow-x-auto pt-6">
            <Table>
              <TableCaption>Preview of data to be imported</TableCaption>
              <TableHeader>
                <TableRow>
                  {fields?.map(field => (
                    <TableHead key={field.id}>{field.name}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {importData.map((record, index) => (
                  <TableRow key={index}>
                    {fields?.map(field => (
                      <TableCell key={field.id}>{record[field.api_name] || "—"}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
