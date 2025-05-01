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
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

interface DuplicateRecordsResolverProps {
  headers: string[];
  data: any[];
  onResolve: (resolvedData: any[]) => void;
  onCancel: () => void;
  objectTypeId: string;
}

const formSchema = z.object({
  resolutionStrategy: z.enum(["skip", "overwrite", "merge"]),
  primaryKeyHeader: z.string().min(1, {
    message: "Please select a primary key header.",
  }),
});

export function DuplicateRecordsResolver({
  headers,
  data,
  onResolve,
  onCancel,
  objectTypeId,
}: DuplicateRecordsResolverProps) {
  const [isResolving, setIsResolving] = useState(false);
  const [selectedHeader, setSelectedHeader] = useState(headers[0]);
  const [isPrimaryKeySelectionOpen, setIsPrimaryKeySelectionOpen] =
    useState(true);
  const { toast } = useToast();
  const { objectTypes, isLoading: isLoadingObjectTypes } = useObjectTypes();
  const objectType = objectTypes?.find((type) => type.id === objectTypeId);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      resolutionStrategy: "skip",
      primaryKeyHeader: selectedHeader,
    },
  });

  useEffect(() => {
    if (headers.length > 0) {
      form.setValue("primaryKeyHeader", headers[0]);
      setSelectedHeader(headers[0]);
    }
  }, [headers, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsResolving(true);
    try {
      const primaryKeyHeader = values.primaryKeyHeader;
      const resolutionStrategy = values.resolutionStrategy;

      // Group the new records by the primary key
      const groupedNewRecords = data.reduce((acc: any, record: any) => {
        const primaryKeyValue = record[primaryKeyHeader];
        if (!acc[primaryKeyValue]) {
          acc[primaryKeyValue] = [];
        }
        acc[primaryKeyValue].push(record);
        return acc;
      }, {});

      // Fetch existing records based on the selected primary key
      const existingRecords = await fetch(
        `/api/objects/${objectTypeId}?field=${primaryKeyHeader}&values=${Object.keys(
          groupedNewRecords
        ).join(",")}`
      ).then((res) => res.json());

      // Create a map of existing records for easier lookup
      const existingRecordsMap = existingRecords.reduce((acc: any, record: any) => {
        acc[record[primaryKeyHeader]] = record;
        return acc;
      }, {});

      let resolvedData = [];

      switch (resolutionStrategy) {
        case "skip":
          // Skip duplicates, only add new records that don't exist
          resolvedData = data.filter((record) => {
            const primaryKeyValue = record[primaryKeyHeader];
            return !existingRecordsMap[primaryKeyValue];
          });
          break;

        case "overwrite":
          // Overwrite existing records with new ones, add new records that don't exist
          resolvedData = data.map((record) => {
            const primaryKeyValue = record[primaryKeyHeader];
            if (existingRecordsMap[primaryKeyValue]) {
              return { ...existingRecordsMap[primaryKeyValue], ...record }; // Overwrite
            } else {
              return record; // Add new
            }
          });
          break;

        case "merge":
          // Merge new records with existing ones, add new records that don't exist
          resolvedData = data.map((record) => {
            const primaryKeyValue = record[primaryKeyHeader];
            if (existingRecordsMap[primaryKeyValue]) {
              return { ...record, ...existingRecordsMap[primaryKeyValue] }; // Merge
            } else {
              return record; // Add new
            }
          });
          break;
      }

      onResolve(resolvedData);
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

  return (
    <AlertDialog open={true} onOpenChange={() => {}}>
      <AlertDialogContent className="max-w-5xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Resolve Duplicate Records</AlertDialogTitle>
          <AlertDialogDescription>
            We found potential duplicate records in your data. Please select a
            resolution strategy to handle these duplicates.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Primary Key Selection</CardTitle>
                <CardDescription>
                  Select the header that uniquely identifies each record.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="primaryKeyHeader"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Key Header</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedHeader(value);
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a header" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {headers.map((header) => (
                            <SelectItem key={header} value={header}>
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resolution Strategy</CardTitle>
                <CardDescription>
                  Choose how to handle duplicate records based on the primary
                  key.
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
                <CardTitle>Data Preview</CardTitle>
                <CardDescription>
                  Preview of the data with potential duplicates highlighted.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] w-full rounded-md border">
                  <Table>
                    <TableHeader>
                      {headers.map((header) => (
                        <TableHead key={header}>{header}</TableHead>
                      ))}
                      <TableHead className="w-[100px]">Status</TableHead>
                    </TableHeader>
                    <TableBody>
                      {data.map((record, index) => {
                        const primaryKeyValue = record[selectedHeader];
                        return (
                          <TableRow key={index}>
                            {headers.map((header) => (
                              <TableCell key={header}>
                                {record[header] || "N/A"}
                              </TableCell>
                            ))}
                            <TableCell className="w-[100px] font-medium">
                              {/* <Alert variant="default">
                                Duplicate Value
                              </Alert> */}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
              <AlertDialogAction disabled={isResolving}>
                {isResolving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Resolve Duplicates
              </AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
