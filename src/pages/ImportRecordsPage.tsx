
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useRecordFields } from "@/hooks/useRecordFields";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Loader2, FileSpreadsheet, Globe } from "lucide-react";
import * as XLSX from 'xlsx';
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUrlTableImport } from "@/hooks/useUrlTableImport";
import { TableSelectionDialog } from "@/components/import/TableSelectionDialog";

export default function ImportRecordsPage() {
  const { objectTypeId } = useParams<{ objectTypeId: string }>();
  const { objectTypes } = useObjectTypes();
  const { fields } = useRecordFields(objectTypeId);
  const objectType = objectTypes?.find(type => type.id === objectTypeId);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [importData, setImportData] = useState<any[]>([]);
  const [uniqueKeyField, setUniqueKeyField] = useState<string>("");
	const [file, setFile] = useState<File | null>(null);
  const [fetchingRecords, setFetchingRecords] = useState(false);
  const [importType, setImportType] = useState<string>("excel");
  const [isTableDialogOpen, setIsTableDialogOpen] = useState(false);
  const navigate = useNavigate();
  
  const { 
    url, 
    setUrl, 
    isLoading: isLoadingTables, 
    tables, 
    error: urlError, 
    selectedTableIndex,
    fetchTablesFromUrl, 
    selectTable,
    getSelectedTable,
    convertToImportData
  } = useUrlTableImport();

  useEffect(() => {
    if (fields && fields.length > 0) {
      setUniqueKeyField(fields[0].api_name);
    }
  }, [fields]);

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

  const prepareImportData = (data: any[]) => {
    if (!fields || !data.length) return;

    const preparedData = data.map(item => {
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
      prepareImportData(excelData);
    }
  }, [excelData, fields]);

  const handleFetchTables = async () => {
    const success = await fetchTablesFromUrl(url);
    if (success) {
      setIsTableDialogOpen(true);
    }
  };

  const handleTableSelection = (index: number) => {
    selectTable(index);
  };

  const handleTableDialogClose = () => {
    setIsTableDialogOpen(false);
    
    // If a table was selected, convert it to import data
    const selectedTable = getSelectedTable();
    if (selectedTable) {
      const tableData = selectedTable.rows.map((row, rowIndex) => {
        const rowObj: { [key: string]: any } = {};
        selectedTable.headers.forEach((header, colIndex) => {
          rowObj[header] = row[colIndex] || "";
        });
        return rowObj;
      });
      
      setExcelData(tableData);
      prepareImportData(tableData);
    }
  };

  const handleUniqueKeyFieldChange = (value: string) => {
    setUniqueKeyField(value);
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

  if (!objectType) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Import ${objectType.name} Records`}
        description={`Import records into your ${objectType.name.toLowerCase()} object`}
        actions={
          <Button onClick={processImportData} disabled={fetchingRecords || importData.length === 0}>
            {fetchingRecords ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              "Import"
            )}
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6 space-y-4">
          <Tabs value={importType} onValueChange={setImportType}>
            <TabsList className="mb-4">
              <TabsTrigger value="excel" className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Excel File
              </TabsTrigger>
              <TabsTrigger value="url" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Import from URL
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="excel" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file">Choose Excel File</Label>
                <Input type="file" id="file" accept=".xlsx, .xls" onChange={handleFileChange} />
              </div>
            </TabsContent>
            
            <TabsContent value="url" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">Enter Website URL</Label>
                <div className="flex space-x-2">
                  <Input 
                    type="url" 
                    id="url" 
                    placeholder="https://example.com/page-with-table" 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                  <Button 
                    type="button" 
                    onClick={handleFetchTables}
                    disabled={isLoadingTables || !url}
                  >
                    {isLoadingTables ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Fetch Tables"
                    )}
                  </Button>
                </div>
                {urlError && (
                  <p className="text-sm text-destructive mt-1">{urlError}</p>
                )}
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

      {importData.length > 0 && (
        <Card>
          <CardContent className="overflow-x-auto">
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

      <TableSelectionDialog
        isOpen={isTableDialogOpen}
        onClose={handleTableDialogClose}
        tables={tables}
        isLoading={isLoadingTables}
        onSelectTable={handleTableSelection}
        selectedTableIndex={selectedTableIndex}
      />
    </div>
  );
}
