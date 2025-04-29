
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

export default function ImportRecordsPage() {
  const { objectTypeId } = useParams<{ objectTypeId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [pastedText, setPastedText] = useState("");
  const [step, setStep] = useState<"paste" | "mapping" | "importing">("paste");
  const [activeTab, setActiveTab] = useState<"paste" | "example">("paste");
  
  const { objectTypes } = useObjectTypes();
  const { fields, isLoading: isLoadingFields } = useRecordFields(objectTypeId);
  const objectType = objectTypes?.find(type => type.id === objectTypeId);

  const { 
    importData, 
    columnMappings, 
    isImporting, 
    parseImportText, 
    updateColumnMapping, 
    importRecords 
  } = useImportRecords(objectTypeId!, fields || []);

  // Check for newly created field from URL parameters
  useEffect(() => {
    const newFieldId = searchParams.get('newFieldId');
    const columnName = searchParams.get('columnName');
    
    if (newFieldId && columnName && fields) {
      // Find the column index that matches the column name
      const columnIndex = columnMappings.findIndex(
        mapping => mapping.sourceColumnName === columnName
      );
      
      // Find the newly created field
      const newField = fields.find(field => field.id === newFieldId);
      
      if (columnIndex >= 0 && newField) {
        // Update the mapping with the new field
        updateColumnMapping(columnIndex, newFieldId);
      }
    }
  }, [searchParams, fields, columnMappings, updateColumnMapping]);

  const handleTextPaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPastedText(e.target.value);
  };

  const handleParseData = () => {
    const data = parseImportText(pastedText);
    if (data) {
      setStep("mapping");
    }
  };

  const handleImport = async () => {
    setStep("importing");
    const result = await importRecords();
    if (result) {
      navigate(`/objects/${objectTypeId}`);
    }
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

  const handleCreateNewField = (columnIndex: number) => {
    const columnName = columnMappings[columnIndex]?.sourceColumnName || "";
    // Navigate to the field creation page, passing the column name as a URL parameter
    navigate(`/objects/${objectTypeId}/import/create-field/${encodeURIComponent(columnName)}`);
  };

  if (!objectType || isLoadingFields) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

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
                {getMappedCount() < columnMappings.length && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Some columns couldn't be matched automatically. Please map them manually or create new fields.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

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
                <Button variant="outline" onClick={() => setStep("paste")}>
                  Back
                </Button>
                <Button 
                  onClick={handleImport} 
                  disabled={getMappedCount() === 0}
                >
                  Import Records
                </Button>
              </div>
            </div>
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
