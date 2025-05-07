import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useObjectFields } from "@/hooks/useObjectFields";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { AlertCircle, ArrowRight, Check, FileSpreadsheet, Upload } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useImportRecords } from "@/hooks/useImportRecords";
import { findDuplicates } from "@/utils/importDuplicateUtils";
import { Separator } from "@/components/ui/separator";
import { useObjectRecords } from "@/hooks/useObjectRecords";
import { FieldType } from "@/types";

export default function ImportRecordsPage() {
  const { objectTypeId } = useParams();
  const navigate = useNavigate();
  const { objectTypes } = useObjectTypes();
  const { fields } = useObjectFields(objectTypeId);
  const { records } = useObjectRecords(objectTypeId);
  const { importRecords, isImporting, guessDataTypeForColumn } = useImportRecords();
  
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("upload");
  const [importProgress, setImportProgress] = useState(0);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [duplicateHandling, setDuplicateHandling] = useState<string>("skip");
  const [selectedDuplicates, setSelectedDuplicates] = useState<Record<string, boolean>>({});
  const [unmappedColumns, setUnmappedColumns] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Find the object type from the ID
  const objectType = objectTypes.find(obj => obj.id === objectTypeId);

  useEffect(() => {
    if (headers.length > 0 && fields) {
      // Auto-map columns that match field names or API names
      const autoMappings: Record<string, string> = {};
      headers.forEach((header) => {
        const normalizedHeader = header.toLowerCase().trim();
        // Try to find a matching field
        const matchingField = fields.find(
          (field) => field.name.toLowerCase() === normalizedHeader || field.api_name.toLowerCase() === normalizedHeader
        );
        if (matchingField) {
          autoMappings[header] = matchingField.api_name;
        }
      });
      setMappings(autoMappings);
    }
  }, [headers, fields]);

  useEffect(() => {
    // Identify unmapped columns
    if (headers.length > 0) {
      const unmapped = headers.filter((header) => !mappings[header]);
      setUnmappedColumns(unmapped);
    }
  }, [headers, mappings]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const rows = parseCSV(text);
        
        if (rows.length < 2) {
          toast.error("The CSV file appears to be empty or invalid");
          return;
        }
        
        const csvHeaders = rows[0];
        setHeaders(csvHeaders);
        setCsvData(rows.slice(1));
        setActiveTab("map");
        toast.success("CSV file loaded successfully");
      } catch (error) {
        console.error("Error parsing CSV:", error);
        toast.error("Failed to parse CSV file");
      }
    };
    
    reader.readAsText(selectedFile);
  };

  const parseCSV = (text: string): string[][] => {
    // Simple CSV parser - could be replaced with a more robust library
    const rows: string[][] = [];
    const lines = text.split(/\r?\n/);
    
    lines.forEach((line) => {
      if (line.trim()) {
        // Handle quoted values with commas inside
        const regex = /(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^,]*))/g;
        const row: string[] = [];
        let match;
        
        while ((match = regex.exec(line + ',')) !== null) {
          const value = match[1] !== undefined 
            ? match[1].replace(/""/g, '"') // Replace double quotes with single
            : match[2] || '';
          row.push(value);
        }
        
        rows.push(row);
      }
    });
    
    return rows;
  };

  const handleMapping = (columnName: string, fieldApiName: string) => {
    setMappings((prev) => ({
      ...prev,
      [columnName]: fieldApiName
    }));
  };

  const handleCreateField = (columnName: string) => {
    navigate(`/settings/objects/${objectTypeId}/fields/new?suggested_name=${columnName}&return_to=import`);
  };

  const checkForDuplicates = () => {
    if (!fields || !records) {
      toast.error("Cannot check for duplicates: fields or records are missing");
      return;
    }
    
    // Convert fields to the format expected by findDuplicates
    const fieldsForDuplicateCheck = fields.map(field => ({
      api_name: field.api_name,
      name: field.name,
      type: field.data_type as string
    }));
    
    const duplicatesFound = findDuplicates(
      csvData,
      headers,
      mappings,
      records,
      fieldsForDuplicateCheck
    );
    
    setDuplicates(duplicatesFound);
    
    if (duplicatesFound.length > 0) {
      toast.info(`Found ${duplicatesFound.length} potential duplicate records`);
      setActiveTab("duplicates");
    } else {
      toast.success("No duplicate records found");
      setActiveTab("import");
    }
  };

  const handleImport = async () => {
    if (!objectTypeId) {
      toast.error("No object type ID provided");
      return;
    }
    
    if (csvData.length === 0) {
      toast.error("No data to import");
      return;
    }
    
    if (Object.keys(mappings).length === 0) {
      toast.error("You must map at least one column to a field");
      return;
    }
    
    // Create records from CSV data and mappings
    const records = csvData.map(row => {
      const record: Record<string, any> = {};
      headers.forEach((header, index) => {
        const fieldApiName = mappings[header];
        if (fieldApiName) {
          record[fieldApiName] = row[index];
        }
      });
      return record;
    });
    
    // Filter out duplicates based on user selection
    let recordsToImport = records;
    if (duplicates.length > 0) {
      if (duplicateHandling === "skip") {
        const duplicateIndices = new Set(duplicates.map(d => d.rowIndex));
        recordsToImport = records.filter((_, index) => !duplicateIndices.has(index));
      } else if (duplicateHandling === "select") {
        const selectedIndices = Object.entries(selectedDuplicates)
          .filter(([_, selected]) => selected)
          .map(([index]) => parseInt(index));
          
        const duplicateIndices = duplicates
          .filter((_, index) => !selectedIndices.includes(index))
          .map(d => d.rowIndex);
          
        recordsToImport = records.filter((_, index) => !duplicateIndices.has(index));
      }
    }
    
    try {
      setActiveTab("progress");
      
      const result = await importRecords(
        objectTypeId,
        recordsToImport,
        (current, total) => {
          const progress = (current / total) * 100;
          setImportProgress(progress);
        }
      );
      
      if (result) {
        toast.success(`Successfully imported ${result.success} records`);
        if (result.failures > 0) {
          toast.warning(`Failed to import ${result.failures} records`);
        }
        
        // Navigate back to the object records list
        navigate(`/objects/${objectTypeId}`);
      }
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import records");
    }
  };

  const getFieldTypeTag = (columnName: string) => {
    const dataType = guessDataTypeForColumn(headers.indexOf(columnName));
    
    switch (dataType) {
      case "email":
        return <Badge className="ml-2 bg-blue-500">Email</Badge>;
      case "date":
        return <Badge className="ml-2 bg-purple-500">Date</Badge>;
      case "number":
        return <Badge className="ml-2 bg-green-500">Number</Badge>;
      case "boolean":
        return <Badge className="ml-2 bg-orange-500">Boolean</Badge>;
      default:
        return <Badge className="ml-2 bg-gray-500">Text</Badge>;
    }
  };

  return (
    <div>
      <PageHeader title={`Import Records for ${objectType?.name}`} description="Import records from a CSV file." />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="upload">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Upload CSV
          </TabsTrigger>
          <TabsTrigger value="map" disabled={csvData.length === 0}>
            <ArrowRight className="mr-2 h-4 w-4" />
            Map Columns
          </TabsTrigger>
          <TabsTrigger value="duplicates" disabled={duplicates.length === 0}>
            <AlertCircle className="mr-2 h-4 w-4" />
            Handle Duplicates
          </TabsTrigger>
          <TabsTrigger value="import" disabled={csvData.length === 0}>
            <Check className="mr-2 h-4 w-4" />
            Import
          </TabsTrigger>
          <TabsTrigger value="progress" disabled={!isImporting}>
            <Upload className="mr-2 h-4 w-4" />
            Progress
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload CSV File</CardTitle>
              <CardDescription>Select a CSV file to import records.</CardDescription>
            </CardHeader>
            <CardContent>
              <Input type="file" accept=".csv" onChange={handleFileChange} ref={fileInputRef} />
              {file && (
                <div className="mt-4">
                  <p>Selected file: {file.name}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="map" className="pt-4">
          {unmappedColumns.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Unmapped Columns</AlertTitle>
              <AlertDescription>
                There are {unmappedColumns.length} unmapped columns. You must map all columns to continue.
              </AlertDescription>
            </Alert>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Map Columns to Fields</CardTitle>
              <CardDescription>Map each column in the CSV file to a field in the object.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] w-full rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Column Name</TableHead>
                      <TableHead>Field</TableHead>
                      <TableHead>Data Type</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {headers.map((header) => (
                      <TableRow key={header}>
                        <TableCell className="font-medium">{header}</TableCell>
                        <TableCell>
                          <Select value={mappings[header]} onValueChange={(value) => handleMapping(header, value)}>
                            <SelectTrigger className="w-[300px]">
                              <SelectValue placeholder="Select a field" />
                            </SelectTrigger>
                            <SelectContent>
                              {fields?.map((field) => (
                                <SelectItem key={field.api_name} value={field.api_name}>
                                  {field.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {getFieldTypeTag(header)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="secondary" size="sm" onClick={() => handleCreateField(header)}>
                            Create Field
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button onClick={() => setActiveTab("upload")}>Back</Button>
              <Button onClick={checkForDuplicates} disabled={unmappedColumns.length > 0}>
                Check for Duplicates
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="duplicates" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Handle Duplicate Records</CardTitle>
              <CardDescription>
                {duplicates.length} potential duplicate records found. Choose how to handle them.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="duplicate-handling">Duplicate Handling</Label>
                  <Select value={duplicateHandling} onValueChange={setDuplicateHandling}>
                    <SelectTrigger className="w-[300px]">
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="skip">Skip duplicates</SelectItem>
                      <SelectItem value="select">Select duplicates to skip</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {duplicateHandling === "select" && (
                  <ScrollArea className="h-[400px] w-full rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">Select</TableHead>
                          <TableHead>Row</TableHead>
                          <TableHead>Match Type</TableHead>
                          <TableHead>Matching Fields</TableHead>
                          <TableHead>Existing Record</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {duplicates.map((duplicate, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Checkbox
                                checked={selectedDuplicates[index]}
                                onCheckedChange={(checked) => {
                                  setSelectedDuplicates((prev) => ({
                                    ...prev,
                                    [index]: checked,
                                  }));
                                }}
                              />
                            </TableCell>
                            <TableCell>{duplicate.rowIndex + 1}</TableCell>
                            <TableCell>{duplicate.matchType}</TableCell>
                            <TableCell>
                              {duplicate.matchingFields?.map((field, i) => (
                                <div key={i}>
                                  {field.fieldName}: {field.importValue} (Import) vs {field.existingValue} (Existing)
                                </div>
                              ))}
                            </TableCell>
                            <TableCell>{duplicate.existingRecord.name}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button onClick={() => setActiveTab("map")}>Back</Button>
              <Button onClick={() => setActiveTab("import")}>Continue to Import</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="import" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Import Records</CardTitle>
              <CardDescription>
                Ready to import records?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                {csvData.length} records will be imported.
              </p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button onClick={() => duplicates.length > 0 ? setActiveTab("duplicates") : setActiveTab("map")}>Back</Button>
              <Button onClick={handleImport} disabled={isImporting}>
                Import Records
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="progress" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Import Progress</CardTitle>
              <CardDescription>
                Importing records...
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={importProgress} />
              <p className="mt-2">
                {Math.round(importProgress)}%
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
