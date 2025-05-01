
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { DuplicateRecord } from "@/types";
import { ObjectField } from "@/hooks/useObjectTypes";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

interface ImportData {
  headers: string[];
  rows: string[][];
}

interface ColumnMapping {
  sourceColumnIndex: number;
  sourceColumnName: string;
  targetField: ObjectField | null;
}

interface DuplicateRecordsResolverProps {
  duplicates: DuplicateRecord[];
  fields: ObjectField[];
  matchingFields: string[];
  columnMappings: ColumnMapping[];
  importData: ImportData;
  onSetAction: (rowIndex: number, action: 'create' | 'update') => void;
  onUpdateMatchingFields: (fields: string[]) => void;
  onUpdateDuplicateCheckIntensity: (intensity: 'strict' | 'moderate' | 'lenient') => void;
  duplicateCheckIntensity: 'strict' | 'moderate' | 'lenient';
  onContinue: () => void;
  onBack: () => void;
  onRecheck: () => Promise<boolean>;
}

const formSchema = z.object({
  resolutionStrategy: z.enum(["skip", "overwrite", "merge"]),
  primaryKeyHeader: z.string().min(1, {
    message: "Please select a primary key header.",
  }),
});

export function DuplicateRecordsResolver({
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
  onRecheck,
}: DuplicateRecordsResolverProps) {
  const [isResolving, setIsResolving] = useState(false);
  const [selectedHeader, setSelectedHeader] = useState('');
  const [isPrimaryKeySelectionOpen, setIsPrimaryKeySelectionOpen] = useState(true);
  const { toast } = useToast();
  const { objectTypes, isLoading: isLoadingObjectTypes } = useObjectTypes();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      resolutionStrategy: "skip",
      primaryKeyHeader: "",
    },
  });

  useEffect(() => {
    if (matchingFields.length > 0 && fields.length > 0) {
      // Find a field name from matchingFields
      const matchingField = fields.find(f => matchingFields.includes(f.api_name));
      if (matchingField) {
        form.setValue("primaryKeyHeader", matchingField.name);
        setSelectedHeader(matchingField.name);
      }
    } else if (fields.length > 0) {
      const firstField = fields[0];
      form.setValue("primaryKeyHeader", firstField.name);
      setSelectedHeader(firstField.name);
    }
  }, [matchingFields, fields, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsResolving(true);
    try {
      // Apply the resolution strategy to all duplicates
      const action = values.resolutionStrategy === "skip" ? "create" : 
                    values.resolutionStrategy === "overwrite" ? "update" : "create";
      
      duplicates.forEach(duplicate => {
        onSetAction(duplicate.importRowIndex, action);
      });
      
      onContinue();
      toast({
        title: "Success",
        description: "Duplicate records resolved successfully.",
      });
    } catch (error: any) {
      console.error("Error resolving duplicates:", error);
      toast({
        title: "Error",
        description:
          error?.message || "Failed to resolve duplicate records. Try again.",
        variant: "destructive",
      });
    } finally {
      setIsResolving(false);
    }
  };

  const handleIntensityChange = (intensity: 'strict' | 'moderate' | 'lenient') => {
    onUpdateDuplicateCheckIntensity(intensity);
  };

  const handleUpdateMatchingFields = (fields: string[]) => {
    onUpdateMatchingFields(fields);
  };

  return (
    <div className="space-y-4">
      <AlertDialogHeader>
        <AlertDialogTitle>Resolve Duplicate Records</AlertDialogTitle>
        <AlertDialogDescription>
          We found {duplicates.length} potential duplicate records in your data. Please select how to handle these duplicates.
        </AlertDialogDescription>
      </AlertDialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Duplicate Check Settings</CardTitle>
              <CardDescription>
                Adjust how strictly we check for duplicates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Matching Fields</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {fields.map((field) => (
                    <div key={field.api_name} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={field.api_name}
                        checked={matchingFields.includes(field.api_name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleUpdateMatchingFields([...matchingFields, field.api_name]);
                          } else {
                            handleUpdateMatchingFields(
                              matchingFields.filter((f) => f !== field.api_name)
                            );
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <label htmlFor={field.api_name} className="text-sm font-medium">
                        {field.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Matching Strictness</Label>
                <RadioGroup
                  defaultValue={duplicateCheckIntensity}
                  onValueChange={(value) => handleIntensityChange(value as any)}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="strict" id="strict" />
                    <Label htmlFor="strict">Strict (exact matches only)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="moderate" id="moderate" />
                    <Label htmlFor="moderate">Moderate (substring matches)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="lenient" id="lenient" />
                    <Label htmlFor="lenient">Lenient (fuzzy matching)</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onRecheck}
                  className="mr-2"
                >
                  Recheck with New Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resolution Strategy</CardTitle>
              <CardDescription>
                Choose how to handle duplicate records.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="resolutionStrategy"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <RadioGroupItem value="skip" id="skip" />
                          <FormLabel htmlFor="skip">
                            Skip Duplicates{" "}
                            <Badge variant="secondary">Recommended</Badge>
                            <p className="text-sm text-muted-foreground">
                              Ignore the new record if a record with the same
                              primary key already exists.
                            </p>
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <RadioGroupItem value="overwrite" id="overwrite" />
                          <FormLabel htmlFor="overwrite">
                            Overwrite Existing
                            <p className="text-sm text-muted-foreground">
                              Replace the existing record with the new record.
                            </p>
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <RadioGroupItem value="merge" id="merge" />
                          <FormLabel htmlFor="merge">
                            Merge Records
                            <p className="text-sm text-muted-foreground">
                              Combine the data from the new record with the
                              existing record.
                            </p>
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Duplicate Records Preview</CardTitle>
              <CardDescription>
                Found {duplicates.length} potential duplicate records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] w-full rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Matching Fields</TableHead>
                      <TableHead>Existing Record Values</TableHead>
                      <TableHead>Import Values</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {duplicates.map((duplicate) => {
                      const row = importData.rows[duplicate.importRowIndex];
                      return (
                        <TableRow key={duplicate.importRowIndex}>
                          <TableCell className="font-medium">
                            {duplicate.importRowIndex + 1}
                          </TableCell>
                          <TableCell>
                            {duplicate.matchingFields.map((fieldName) => {
                              const field = fields.find(f => f.api_name === fieldName);
                              return (
                                <div key={fieldName} className="mb-1">
                                  {field?.name || fieldName}
                                </div>
                              );
                            })}
                          </TableCell>
                          <TableCell>
                            {duplicate.matchingFields.map((fieldName) => {
                              const value = duplicate.existingRecord.field_values?.[fieldName];
                              return (
                                <div key={fieldName} className="mb-1">
                                  {value || "N/A"}
                                </div>
                              );
                            })}
                          </TableCell>
                          <TableCell>
                            {duplicate.matchingFields.map((fieldName) => {
                              const field = fields.find(f => f.api_name === fieldName);
                              const mapping = columnMappings.find(m => m.targetField?.api_name === fieldName);
                              const value = mapping && row ? row[mapping.sourceColumnIndex] : "N/A";
                              return (
                                <div key={fieldName} className="mb-1">
                                  {value || "N/A"}
                                </div>
                              );
                            })}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button type="submit" disabled={isResolving}>
              {isResolving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Continue
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
