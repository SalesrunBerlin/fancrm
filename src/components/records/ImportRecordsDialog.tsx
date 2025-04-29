
import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertCircle, CheckCircle, Download } from "lucide-react";
import { ObjectField } from "@/hooks/useObjectTypes";
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

interface ImportRecordsDialogProps {
  objectTypeId: string;
  fields: ObjectField[];
  isOpen: boolean;
  onClose: () => void;
}

export function ImportRecordsDialog({ 
  objectTypeId, 
  fields, 
  isOpen, 
  onClose 
}: ImportRecordsDialogProps) {
  const [pastedText, setPastedText] = useState("");
  const [step, setStep] = useState<"paste" | "mapping" | "importing">("paste");
  const [activeTab, setActiveTab] = useState<"paste" | "example">("paste");

  const { 
    importData, 
    columnMappings, 
    isImporting, 
    parseImportText, 
    updateColumnMapping, 
    importRecords 
  } = useImportRecords(objectTypeId, fields);

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
    await importRecords();
    handleClose();
  };

  const handleClose = () => {
    setPastedText("");
    setStep("paste");
    setActiveTab("paste");
    onClose();
  };

  const getMappedCount = () => {
    return columnMappings.filter(m => m.targetField !== null).length;
  };

  const getExampleData = () => {
    // Create example data based on fields
    const exampleFields = fields.slice(0, 3);
    const headers = exampleFields.map(f => f.name).join("\t");
    const rows = [
      exampleFields.map(f => `[${f.name} value]`).join("\t"),
      exampleFields.map(f => `[${f.name} value]`).join("\t")
    ];
    
    return `${headers}\n${rows.join("\n")}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Import Records</DialogTitle>
          <DialogDescription>
            Import data from a spreadsheet by copying and pasting table data
          </DialogDescription>
        </DialogHeader>

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
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleParseData} disabled={!pastedText.trim()}>
                Continue
              </Button>
            </DialogFooter>
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
                    Some columns couldn't be matched automatically. Please map them manually.
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
                          onValueChange={(value) => updateColumnMapping(index, value === "none" ? null : value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a field" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">-- Not mapped --</SelectItem>
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

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("paste")}>
                Back
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={getMappedCount() === 0}
              >
                Import Records
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "importing" && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p>Importing your records...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
