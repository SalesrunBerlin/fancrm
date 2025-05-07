
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
import { AlertCircle, ArrowRight, Check, FileSpreadsheet, Upload, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useImportRecords } from "@/hooks/useImportRecords";
import { findDuplicates } from "@/utils/importDuplicateUtils";
import { Separator } from "@/components/ui/separator";
import { useObjectRecords } from "@/hooks/useObjectRecords";
import { FieldType, DuplicateRecord } from "@/types";

export default function ImportRecordsPage() {
  const { objectTypeId } = useParams<{ objectTypeId: string }>();
  const navigate = useNavigate();
  const { objectTypes, getObjectTypeById } = useObjectTypes();
  const { fields } = useObjectFields(objectTypeId);
  const { records } = useObjectRecords(objectTypeId);
  const { importRecords, isImporting } = useImportRecords();
  
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("upload");
  const [importProgress, setImportProgress] = useState(0);
  const [duplicates, setDuplicates] = useState<DuplicateRecord[]>([]);
  const [duplicateHandling, setDuplicateHandling] = useState<"skip" | "update" | "create">("skip");
  const [selectedDuplicates, setSelectedDuplicates] = useState<Record<string, boolean>>({});
  const [unmappedColumns, setUnmappedColumns] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const objectType = getObjectTypeById(objectTypeId || "");
  
  useEffect(() => {
    if (headers.length > 0 && fields) {
      // Auto-map columns that match field names or API names
      const autoMappings: Record<string, string> = {};
      
      headers.forEach(header => {
        const normalizedHeader = header.toLowerCase().trim();
        
        // Try to find a matching field
        const matchingField = fields.find(field => 
          field.name.toLowerCase() === normalizedHeader || 
          field.api_name.toLowerCase() === normalizedHeader
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
      const unmapped = headers.filter(header => !mappings[header]);
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
    
    lines.forEach(line => {
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
    setMappings(prev => ({
      ...prev,
      [columnName]: fieldApiName
    }));
  };
  
  const handleCreateField = (columnName: string) => {
    navigate(`/settings/objects/${objectTypeId}/fields/new?name=${encodeURIComponent(columnName)}`);
  };
  
  const handleReview = async () => {
    if (!objectTypeId || !records) return;
    
    // Check for duplicates
    const potentialDuplicates = findDuplicates(
      csvData,
      headers,
      mappings,
      records,
      fields || []
    );
    
    setDuplicates(potentialDuplicates);
    
    // Initialize selected duplicates (all selected by default)
    const initialSelected: Record<string, boolean> = {};
    potentialDuplicates.forEach(dup => {
      initialSelected[dup.rowIndex.toString()] = true;
    });
    setSelectedDuplicates(initialSelected);
    
    setActiveTab("review");
  };
  
  const handleImport = async () => {
    if (!objectTypeId || !csvData.length || !headers.length) {
      toast.error("No data to import");
      return;
    }
    
    try {
      setActiveTab("importing");
      setImportProgress(0);
      
      // Prepare records for import
      const recordsToImport = csvData.map((row, rowIndex) => {
        const record: Record<string, any> = {};
        
        // Skip rows that are duplicates if handling is set to "skip"
        if (duplicateHandling === "skip") {
          const isDuplicate = duplicates.some(d => 
            d.rowIndex === rowIndex && selectedDuplicates[rowIndex.toString()]
          );
          if (isDuplicate) return null;
        }
        
        // Map fields according to mappings
        headers.forEach((header, colIndex) => {
          const fieldApiName = mappings[header];
          if (fieldApiName) {
            // Find field type to handle special conversions
            const field = fields?.find(f => f.api_name === fieldApiName);
            
            if (field) {
              let value = row[colIndex];
              
              // Convert values based on field type
              if (field.type === FieldType.NUMBER) {
                value = value ? parseFloat(value) : null;
              } else if (field.type === FieldType.BOOLEAN) {
                value = value?.toLowerCase() === "true" || value === "1" || value?.toLowerCase() === "yes";
              } else if (field.type === FieldType.DATE) {
                // Try to parse as date if not empty
                value = value ? new Date(value).toISOString() : null;
              }
              
              record[fieldApiName] = value;
            }
          }
        });
        
        return record;
      }).filter(Boolean); // Remove null records (skipped duplicates)
      
      // Handle progress updates
      const updateProgress = (current: number, total: number) => {
        const percentage = Math.round((current / total) * 100);
        setImportProgress(percentage);
      };
      
      // Perform the import
      await importRecords(objectTypeId, recordsToImport as Record<string, any>[], updateProgress);
      
      toast.success(`Successfully imported ${recordsToImport.length} records`);
      setActiveTab("complete");
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import records");
      setActiveTab("review");
    }
  };
  
  const handleToggleAllDuplicates = (checked: boolean) => {
    const newSelected: Record<string, boolean> = {};
    duplicates.forEach(dup => {
      newSelected[dup.rowIndex.toString()] = checked;
    });
    setSelectedDuplicates(newSelected);
  };
  
  const handleToggleDuplicate = (rowIndex: number, checked: boolean) => {
    setSelectedDuplicates(prev => ({
      ...prev,
      [rowIndex.toString()]: checked
    }));
  };
  
  const resetImport = () => {
    setFile(null);
    setCsvData([]);
    setHeaders([]);
    setMappings({});
    setDuplicates([]);
    setActiveTab("upload");
    setImportProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const viewRecords = () => {
    navigate(`/objects/${objectTypeId}`);
  };
  
  return (
    <div className="space-y-6">
      <PageHeader
        title={`Import Records: ${objectType?.name || "Object"}`}
        description="Import records from a CSV file"
        backTo={`/objects/${objectTypeId}`}
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="upload" disabled={activeTab === "importing" || activeTab === "complete"}>
            Upload File
          </TabsTrigger>
          <TabsTrigger value="map" disabled={!file || activeTab === "importing" || activeTab === "complete"}>
            Map Fields
          </TabsTrigger>
          <TabsTrigger value="review" disabled={!file || Object.keys(mappings).length === 0 || activeTab === "importing" || activeTab === "complete"}>
            Review
          </TabsTrigger>
          <TabsTrigger value="importing" disabled={activeTab !== "importing" && activeTab !== "complete"}>
            Import
          </TabsTrigger>
          <TabsTrigger value="complete" disabled={activeTab !== "complete"}>
            Complete
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload CSV File</CardTitle>
              <CardDescription>
                Select a CSV file containing the records you want to import
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center">
                <FileSpreadsheet className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Upload your CSV file</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Drag and drop your file here or click to browse
                </p>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="max-w-sm"
                />
              </div>
            </CardContent>
          </Card>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>CSV Format Requirements</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>The first row should contain column headers</li>
                <li>Each column should map to a field in your object</li>
                <li>Text fields should be properly escaped if they contain commas or quotes</li>
              </ul>
            </AlertDescription>
          </Alert>
        </TabsContent>
        
        <TabsContent value="map" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Map CSV Columns to Fields</CardTitle>
              <CardDescription>
                Match each column from your CSV file to a field in the {objectType?.name} object
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 font-medium text-sm text-muted-foreground mb-2">
                  <div>CSV Column</div>
                  <div>Sample Data</div>
                  <div>Object Field</div>
                </div>
                
                <Separator />
                
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {headers.map((header, index) => {
                      const sampleData = csvData.slice(0, 3).map(row => row[index]);
                      
                      return (
                        <div key={header} className="grid grid-cols-3 gap-4 items-center">
                          <div className="font-medium">{header}</div>
                          <div className="text-sm text-muted-foreground">
                            {sampleData.map((sample, i) => (
                              <div key={i} className="truncate">
                                {sample || <span className="italic text-muted-foreground/50">empty</span>}
                              </div>
                            ))}
                          </div>
                          <div>
                            <Select
                              value={mappings[header] || ""}
                              onValueChange={(value) => handleMapping(header, value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a field" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">-- Skip this column --</SelectItem>
                                {fields?.map(field => (
                                  <SelectItem key={field.id} value={field.api_name}>
                                    {field.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={resetImport}>
                Cancel
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setActiveTab("upload")}>
                  Back
                </Button>
                <Button onClick={handleReview} disabled={Object.keys(mappings).length === 0}>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
          
          {unmappedColumns.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Unmapped Columns</AlertTitle>
              <AlertDescription>
                <p className="mb-2">
                  The following columns from your CSV file don't have a matching field:
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {unmappedColumns.map(column => (
                    <Badge key={column} variant="outline" className="flex items-center gap-1">
                      {column}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 rounded-full"
                        onClick={() => handleCreateField(column)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
                <p className="mt-2 text-sm">
                  Click the + icon to create a new field for an unmapped column.
                </p>
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
        
        <TabsContent value="review" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Review Import</CardTitle>
              <CardDescription>
                Review your data before importing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Import Summary</h3>
                    <p className="text-sm text-muted-foreground">
                      Total records: {csvData.length}
                    </p>
                  </div>
                  <Button onClick={handleImport}>
                    <Upload className="mr-2 h-4 w-4" />
                    Start Import
                  </Button>
                </div>
                
                <Separator />
                
                {duplicates.length > 0 && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium">Potential Duplicates</h3>
                      <p className="text-sm text-muted-foreground">
                        {duplicates.length} potential duplicate records were found
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <Label>Duplicate handling:</Label>
                      <Select
                        value={duplicateHandling}
                        onValueChange={(value) => setDuplicateHandling(value as any)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="skip">Skip duplicates</SelectItem>
                          <SelectItem value="update">Update existing records</SelectItem>
                          <SelectItem value="create">Create new records anyway</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50px]">
                              <Checkbox 
                                checked={Object.values(selectedDuplicates).every(Boolean)}
                                onCheckedChange={handleToggleAllDuplicates}
                              />
                            </TableHead>
                            <TableHead>Row</TableHead>
                            <TableHead>CSV Data</TableHead>
                            <TableHead>Matching Record</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {duplicates.map(duplicate => (
                            <TableRow key={duplicate.rowIndex}>
                              <TableCell>
                                <Checkbox 
                                  checked={selectedDuplicates[duplicate.rowIndex.toString()]}
                                  onCheckedChange={(checked) => 
                                    handleToggleDuplicate(duplicate.rowIndex, !!checked)
                                  }
                                />
                              </TableCell>
                              <TableCell>{duplicate.rowIndex + 1}</TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  {duplicate.matchingFields && duplicate.matchingFields.map((field, i) => (
                                    <div key={i} className="text-sm">
                                      <span className="font-medium">{field}:</span>{" "}
                                      {duplicate.sourceRecord && duplicate.sourceRecord[field]}
                                    </div>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  {duplicate.matchingFields && duplicate.matchingFields.map((field, i) => (
                                    <div key={i} className="text-sm">
                                      <span className="font-medium">{field}:</span>{" "}
                                      {duplicate.existingRecord && duplicate.existingRecord[field]}
                                    </div>
                                  ))}
                                  <Button 
                                    variant="link" 
                                    className="p-0 h-auto text-xs"
                                    onClick={() => navigate(`/objects/${objectTypeId}/${duplicate.existingRecordId}`)}
                                  >
                                    View Record
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Field Mappings</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>CSV Column</TableHead>
                        <TableHead>Object Field</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(mappings).map(([csvColumn, fieldApiName]) => {
                        if (!fieldApiName) return null;
                        const field = fields?.find(f => f.api_name === fieldApiName);
                        return (
                          <TableRow key={csvColumn}>
                            <TableCell>{csvColumn}</TableCell>
                            <TableCell>{field?.name || fieldApiName}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={resetImport}>
                Cancel
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setActiveTab("map")}>
                  Back
                </Button>
                <Button onClick={handleImport}>
                  <Upload className="mr-2 h-4 w-4" />
                  Start Import
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="importing">
          <Card>
            <CardHeader>
              <CardTitle>Importing Records</CardTitle>
              <CardDescription>
                Please wait while your records are being imported
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={importProgress} className="h-2" />
              <p className="text-center text-sm text-muted-foreground">
                {importProgress}% complete
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="complete">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="p-2 bg-green-100 rounded-full">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle>Import Complete</CardTitle>
                  <CardDescription>
                    Your records have been successfully imported
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center justify-center py-6">
                <p className="text-center mb-6">
                  {csvData.length - duplicates.length} records were imported successfully.
                  {duplicates.length > 0 && duplicateHandling === "skip" && (
                    <span> {duplicates.length} duplicate records were skipped.</span>
                  )}
                </p>
                
                <div className="flex gap-4">
                  <Button variant="outline" onClick={resetImport}>
                    Import More Records
                  </Button>
                  <Button onClick={viewRecords}>
                    View Records
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Plus({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
