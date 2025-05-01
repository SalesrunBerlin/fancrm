import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useRecordFields } from "@/hooks/useRecordFields";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { ArrowLeft, Loader2, FileUp, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import Papa from 'papaparse';
import { DuplicateRecordsResolver } from "@/components/records/DuplicateRecordsResolver";

interface ColumnMapping {
  [columnName: string]: string | null;
}

export default function ImportRecordsPage() {
  const { objectTypeId } = useParams<{ objectTypeId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { objectTypes } = useObjectTypes();
  const { fields } = useRecordFields(objectTypeId);
  const objectType = objectTypes?.find(type => type.id === objectTypeId);

  const [file, setFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<any[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping>({});
  const [matchingFields, setMatchingFields] = useState<string[]>([]);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [importStrategy, setImportStrategy] = useState<'update' | 'skip'>('update');
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [column: string]: string }>({});

  useEffect(() => {
    if (objectType) {
      document.title = `Import ${objectType.name} | CRM`;
    }
  }, [objectType]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleParse = () => {
    if (!file) return;

    setIsLoading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setImportData(results.data);
        setStep(1);
        setIsLoading(false);
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        toast({
          title: "Error parsing CSV",
          description: error.message,
          variant: "destructive",
        });
        setIsLoading(false);
      },
    });
  };

  const handleColumnMappingChange = (columnName: string, fieldApiName: string | null) => {
    setColumnMappings(prevMappings => ({
      ...prevMappings,
      [columnName]: fieldApiName,
    }));
  };

  const validateData = (): boolean => {
    const errors: { [column: string]: string } = {};

    importData.forEach((record, index) => {
      Object.entries(columnMappings).forEach(([columnName, fieldApiName]) => {
        if (!fieldApiName) return;

        const field = fields?.find(f => f.api_name === fieldApiName);
        if (!field) return;

        const value = record[columnName];

        if (field.is_required && !value) {
          errors[columnName] = `Row ${index + 1}: ${field.name} is required.`;
        } else {
          // Clear previous errors for this column
          delete errors[columnName];
        }
      });
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const checkForDuplicates = () => {
    if (!selectedField) {
      toast({
        title: "Missing Field",
        description: "Please select a field to match records.",
        variant: "destructive",
      });
      return;
    }

    const newMatchingFields = Object.entries(columnMappings)
      .filter(([, apiName]) => apiName === selectedField)
      .map(([columnName]) => columnName);

    if (newMatchingFields.length === 0) {
      toast({
        title: "Missing Column",
        description: "Please map a column to the selected field.",
        variant: "destructive",
      });
      return;
    }

    setMatchingFields(newMatchingFields);

    const newDuplicates = findDuplicateRecords(importData, selectedField, newMatchingFields);
    setDuplicates(newDuplicates);
    setStep(2);
  };

  const findDuplicateRecords = (data: any[], selectedField: string, matchingFields: string[]) => {
    const grouped = new Map<string, any[]>();

    data.forEach(record => {
      let key = '';
      matchingFields.forEach(field => {
        key += record[field]?.toString().toLowerCase() || '';
      });

      if (key) {
        if (!grouped.has(key)) {
          grouped.set(key, []);
        }
        grouped.get(key)!.push(record);
      }
    });

    const duplicates = Array.from(grouped.values()).filter(group => group.length > 1).flat();
    return duplicates;
  };

  const handleSubmit = async () => {
    if (!validateData()) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Map CSV columns to field API names
      const recordsToImport = importData.map(record => {
        const newRecord: { [key: string]: any } = {};
        Object.entries(columnMappings).forEach(([columnName, fieldApiName]) => {
          if (fieldApiName) {
            newRecord[fieldApiName] = record[columnName];
          }
        });
        return newRecord;
      });

      // Handle duplicates based on the selected strategy
      let recordsToCreate = recordsToImport;
      if (duplicates.length > 0 && importStrategy === 'skip') {
        // Filter out duplicate records
        recordsToCreate = recordsToImport.filter(record => !duplicates.includes(record));
      }

      // Create records
      // TODO: Use useObjectRecords hook to create records
      console.log("Records to create:", recordsToCreate);

      toast({
        title: "Import Complete",
        description: `Successfully imported ${recordsToCreate.length} records.`,
      });
      setStep(3);
    } catch (error) {
      console.error("Error importing records:", error);
      toast({
        title: "Error importing records",
        description: "Please check the console for more details.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!objectType || !objectTypeId || !fields) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" asChild>
        <Link to={`/objects/${objectTypeId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {objectType.name} List
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Import {objectType.name}</CardTitle>
          <CardDescription>Upload a CSV file to create multiple {objectType.name.toLowerCase()} records.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 && (
            <div className="space-y-2">
              <Label htmlFor="file">CSV File</Label>
              <Input type="file" id="file" onChange={handleFileChange} />
              <Button onClick={handleParse} disabled={!file || isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Parse CSV
              </Button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Map Columns to Fields</h3>
              <Table>
                <TableCaption>Map each column in your CSV to a field in the {objectType.name} object.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">CSV Column</TableHead>
                    <TableHead>Field</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importData[0] && Object.keys(importData[0]).map(columnName => (
                    <TableRow key={columnName}>
                      <TableCell className="font-medium">{columnName}</TableCell>
                      <TableCell>
                        <Select onValueChange={(value) => handleColumnMappingChange(columnName, value === "none" ? null : value)}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select a field" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">-- Ignore --</SelectItem>
                            {fields.map(field => (
                              <SelectItem key={field.id} value={field.api_name}>{field.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {validationErrors[columnName] && (
                          <p className="text-sm text-red-500 mt-1">{validationErrors[columnName]}</p>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(0)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={checkForDuplicates}>
                  Next: Resolve Duplicates
                </Button>
              </div>
            </div>
          )}

          {step === 2 && duplicates.length > 0 && (
            <DuplicateRecordsResolver
              fields={fields}
              matchingFields={matchingFields}
              columnMappings={columnMappings}
              importData={importData}
              selectedField={selectedField}
              onFieldSelect={setSelectedField}
              onImportStrategyChange={setImportStrategy}
              onRecheck={checkForDuplicates}
            />
          )}

          {step === 3 && (
            <div className="flex flex-col items-center justify-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <h3 className="text-lg font-semibold">Import Complete!</h3>
              <p>Successfully imported {importData.length} records.</p>
              <Button asChild>
                <Link to={`/objects/${objectTypeId}`}>
                  Go to {objectType.name} List
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
        {step < 2 && (
          <CardFooter className="flex justify-end space-x-2">
            {step === 1 && (
              <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Import Records
              </Button>
            )}
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
