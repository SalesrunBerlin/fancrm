import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useObjectTypes, ObjectType, ObjectField } from "@/hooks/useObjectTypes";
import { useObjectRecords } from "@/hooks/useObjectRecords";
import { useObjectFields } from "@/hooks/useObjectFields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { ArrowLeft, Upload, Loader2, Check, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Papa from "papaparse";
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
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CreateFieldForm } from "@/components/settings/CreateFieldForm";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";

interface ColumnMapping {
  columnName: string;
  fieldId: string | null;
  action: "map" | "create" | "ignore";
}

interface DuplicateRecord {
  recordId: string;
  fieldValues: Record<string, any>;
  matches: Record<string, number>;
  action: "update" | "ignore";
}

interface DuplicateRecordsResolverProps {
  duplicates: DuplicateRecord[];
  fields: ObjectField[];
  matchingFields: string[];
  columnMappings: Record<string, string>;
  importData: any[];
  onSetAction: (recordId: string, action: "update" | "ignore") => void;
  onUpdateMatchingFields: (fields: string[]) => void;
  onUpdateDuplicateCheckIntensity: (intensity: number) => void;
  duplicateCheckIntensity: number;
  onContinue: () => void;
  onBack: () => void;
  onRecheck: () => void;
}

function DuplicateRecordsResolver({
  duplicates,
  fields,
  matchingFields,
  columnMappings,
  importData,
  onSetAction,
  onUpdateMatchingFields,
  onUpdateDuplicateCheckIntensity,
  duplicateCheckIntensity,
  onContinue,
  onBack,
  onRecheck
}: DuplicateRecordsResolverProps) {
  const [showMatchingSettings, setShowMatchingSettings] = useState(false);

  const getFieldValue = (record: any, fieldApiName: string) => {
    const columnName = Object.keys(columnMappings).find(key => columnMappings[key] === fieldApiName);
    return columnName ? record[columnName] : "N/A";
  };

  const handleActionChange = (recordId: string, action: "update" | "ignore") => {
    onSetAction(recordId, action);
  };

  const handleMatchingFieldChange = (fieldApiName: string, checked: boolean) => {
    let newMatchingFields = [...matchingFields];
    if (checked) {
      newMatchingFields.push(fieldApiName);
    } else {
      newMatchingFields = newMatchingFields.filter(f => f !== fieldApiName);
    }
    onUpdateMatchingFields(newMatchingFields);
  };

  const handleDuplicateCheckIntensityChange = (value: number[]) => {
    onUpdateDuplicateCheckIntensity(value[0]);
  };

  const allFields = fields.filter(field => field.data_type !== "lookup");

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Resolve Duplicate Records</h2>
        <Popover open={showMatchingSettings} onOpenChange={setShowMatchingSettings}>
          <PopoverTrigger asChild>
            <Button variant="outline">
              Matching Settings
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Matching Fields</h3>
              <p className="text-sm text-muted-foreground">
                Select the fields to use for matching duplicate records.
              </p>
              <div className="grid gap-2">
                {allFields.map(field => (
                  <div key={field.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`match-${field.api_name}`}
                      checked={matchingFields.includes(field.api_name)}
                      onCheckedChange={(checked) => handleMatchingFieldChange(field.api_name, !!checked)}
                    />
                    <Label htmlFor={`match-${field.api_name}`}>{field.name}</Label>
                  </div>
                ))}
              </div>
              <h3 className="text-lg font-semibold mt-4">Duplicate Check Intensity</h3>
              <p className="text-sm text-muted-foreground">
                Adjust the intensity of the duplicate check. Higher intensity may result in more false positives.
              </p>
              <Slider
                defaultValue={[duplicateCheckIntensity]}
                max={100}
                step={1}
                onValueChange={handleDuplicateCheckIntensityChange}
              />
              <p className="text-sm text-muted-foreground">
                Current Intensity: {duplicateCheckIntensity}%
              </p>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <p>
        We found {duplicates.length} potential duplicate records. Please choose an action for each record.
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Record ID</TableHead>
            {fields.map(field => (
              <TableHead key={field.id}>{field.name}</TableHead>
            ))}
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {duplicates.map(duplicate => (
            <TableRow key={duplicate.recordId}>
              <TableCell>{duplicate.recordId}</TableCell>
              {fields.map(field => (
                <TableCell key={`${duplicate.recordId}-${field.id}`}>
                  {getFieldValue(importData.find(item => item.recordId === duplicate.recordId), field.api_name)}
                </TableCell>
              ))}
              <TableCell>
                <RadioGroup defaultValue={duplicate.action} onValueChange={(value) => handleActionChange(duplicate.recordId, value as "update" | "ignore")}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="update" id={`update-${duplicate.recordId}`} />
                    <Label htmlFor={`update-${duplicate.recordId}`}>Update</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ignore" id={`ignore-${duplicate.recordId}`} />
                    <Label htmlFor={`ignore-${duplicate.recordId}`}>Ignore</Label>
                  </div>
                </RadioGroup>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex justify-between">
        <Button variant="secondary" onClick={onBack}>Back to Mapping</Button>
        <div>
          <Button variant="outline" onClick={onRecheck}>Recheck Duplicates</Button>
          <Button onClick={onContinue}>Continue Import</Button>
        </div>
      </div>
    </div>
  );
}

export default function ImportRecordsPage() {
  const { objectTypeId } = useParams<{ objectTypeId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { objectTypes } = useObjectTypes();
  const { fields, isLoading: isLoadingFields } = useObjectFields(objectTypeId);
  const { createRecord } = useObjectRecords(objectTypeId);

  const [file, setFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<any[] | null>(null);
  const [header, setHeader] = useState<string[] | null>(null);
  const [step, setStep] = useState<"upload" | "mapping" | "duplicate-check" | "import">("upload");
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});
  const [duplicates, setDuplicates] = useState<DuplicateRecord[]>([]);
  const [duplicateCheckIntensity, setDuplicateCheckIntensity] = useState<number>(75);
  const [matchingFields, setMatchingFields] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const objectType = objectTypes?.find((obj) => obj.id === objectTypeId);

  useEffect(() => {
    if (objectType && fields) {
      const initialMatchingFields = fields
        .filter(field => field.data_type !== "lookup")
        .slice(0, 3)
        .map(field => field.api_name);
      setMatchingFields(initialMatchingFields);
    }
  }, [objectType, fields]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);

      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setImportData(results.data);
          setHeader(results.meta.fields || []);
          setStep("mapping");
        },
        error: (error) => {
          console.error("Error parsing CSV:", error);
          toast({
            title: "Error",
            description: "Failed to parse CSV file.",
            variant: "destructive",
          });
        },
      });
    }
  };

  const handleColumnMappingChange = (columnName: string, fieldId: string) => {
    setColumnMappings((prevMappings) => ({
      ...prevMappings,
      [columnName]: fieldId,
    }));
  };

  const handleNext = async () => {
    if (!importData || !fields) return;

    // Generate a unique recordId for each row
    const recordsWithIds = importData.map((record, index) => ({
      ...record,
      recordId: `temp-${index}`,
    }));
    setImportData(recordsWithIds);

    // Find potential duplicates
    const potentialDuplicates = await findPotentialDuplicates(recordsWithIds);
    setDuplicates(potentialDuplicates);

    setStep("duplicate-check");
  };

  const findPotentialDuplicates = async (records: any[]): Promise<DuplicateRecord[]> => {
    if (!fields) return [];

    const existingRecords = await fetchExistingRecords();

    const potentialDuplicates: DuplicateRecord[] = [];

    records.forEach(newRecord => {
      existingRecords.forEach(existingRecord => {
        let matchScore = 0;
        const matches: Record<string, number> = {};

        matchingFields.forEach(fieldApiName => {
          const columnName = Object.keys(columnMappings).find(key => columnMappings[key] === fieldApiName);
          if (!columnName) return;

          const newValue = newRecord[columnName];
          const existingValue = existingRecord.field_values[fieldApiName];

          if (newValue && existingValue && newValue.toLowerCase() === existingValue.toLowerCase()) {
            matchScore++;
            matches[fieldApiName] = 1;
          } else {
            matches[fieldApiName] = 0;
          }
        });

        const matchPercentage = (matchScore / matchingFields.length) * 100;

        if (matchPercentage >= duplicateCheckIntensity) {
          potentialDuplicates.push({
            recordId: newRecord.recordId,
            fieldValues: newRecord,
            matches: matches,
            action: "update"
          });
        }
      });
    });

    return potentialDuplicates;
  };

  const fetchExistingRecords = async () => {
    const { data, error } = await supabase
      .from("object_records")
      .select("id, field_values")
      .eq("object_type_id", objectTypeId);

    if (error) {
      console.error("Error fetching existing records:", error);
      return [];
    }

    return data || [];
  };

  const updateDuplicateAction = (recordId: string, action: "update" | "ignore") => {
    setDuplicates(prevDuplicates =>
      prevDuplicates.map(duplicate =>
        duplicate.recordId === recordId ? { ...duplicate, action } : duplicate
      )
    );
  };

  const updateMatchingFields = (fields: string[]) => {
    setMatchingFields(fields);
  };

  const updateDuplicateCheckIntensity = (intensity: number) => {
    setDuplicateCheckIntensity(intensity);
  };

  const handleDuplicateResolutionContinue = async () => {
    if (!importData) return;

    const recordsToImport = importData.map(record => {
      const duplicate = duplicates.find(d => d.recordId === record.recordId);
      if (duplicate && duplicate.action === "ignore") {
        return null;
      }
      return record;
    }).filter(record => record !== null);

    await handleImport(recordsToImport);
  };

  const handleRecheckDuplicates = async () => {
    if (!importData) return;
    const potentialDuplicates = await findPotentialDuplicates(importData);
    setDuplicates(potentialDuplicates);
  };

  const handleImport = async (recordsToImport: any[]) => {
    if (!fields) return;

    setIsImporting(true);
    try {
      for (const record of recordsToImport) {
        const fieldValues: Record<string, any> = {};
        for (const columnName in columnMappings) {
          const fieldId = columnMappings[columnName];
          if (fieldId) {
            const field = fields.find((f) => f.id === fieldId);
            if (field) {
              fieldValues[field.api_name] = record[columnName];
            }
          }
        }

        await createRecord.mutateAsync(fieldValues);
      }

      toast({
        title: "Success",
        description: "Records imported successfully!",
      });
      navigate(`/objects/${objectTypeId}`);
    } catch (error) {
      console.error("Error importing records:", error);
      toast({
        title: "Error",
        description: "Failed to import records.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const getFieldName = (fieldId: string) => {
    const field = fields?.find((f) => f.id === fieldId);
    return field ? field.name : "N/A";
  };

  const onCreateFieldComplete = () => {
    // Force refresh fields
  };

  if (!objectType) {
    return (
      <div className="p-4">
        <AlertTriangle className="h-4 w-4 mr-2 inline-block" />
        Object type not found.
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Button variant="outline" asChild>
        <Link to={`/objects/${objectTypeId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {objectType.name}
        </Link>
      </Button>
      <h1 className="text-2xl font-bold mt-4">Import Records for {objectType.name}</h1>

      {step === "upload" && (
        <Card className="mt-4">
          <CardHeader>
            <h2 className="text-lg font-semibold">Upload CSV File</h2>
          </CardHeader>
          <CardContent>
            <Input type="file" accept=".csv" onChange={handleFileChange} />
          </CardContent>
        </Card>
      )}

      {step === "mapping" && header && fields && (
        <Card className="mt-4">
          <CardHeader>
            <h2 className="text-lg font-semibold">Map Columns to Fields</h2>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Column Name</TableHead>
                  <TableHead>Field</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {header.map((columnName) => (
                  <TableRow key={columnName}>
                    <TableCell>{columnName}</TableCell>
                    <TableCell>
                      <Select onValueChange={(value) => handleColumnMappingChange(columnName, value)}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select a field" defaultValue={columnMappings[columnName]} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Ignore</SelectItem>
                          {fields.map((field) => (
                            <SelectItem key={field.id} value={field.id}>
                              {field.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            Create Field
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Create New Field</DialogTitle>
                          </DialogHeader>
                          <CreateFieldForm objectTypeId={objectTypeId!} apiNameSuggestion={columnName} onComplete={onCreateFieldComplete} />
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter>
            <Button onClick={handleNext}>Next: Check Duplicates</Button>
          </CardFooter>
        </Card>
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

      {step === "import" && (
        <Card className="mt-4">
          <CardHeader>
            <h2 className="text-lg font-semibold">Importing Records</h2>
          </CardHeader>
          <CardContent>
            {isImporting ? (
              <div className="flex items-center justify-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing records...
              </div>
            ) : (
              <p>Ready to import records. Please confirm.</p>
            )}
          </CardContent>
          <CardFooter>
            <Button disabled={isImporting} onClick={() => handleImport(importData || [])}>
              {isImporting ? "Importing..." : "Confirm Import"}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
