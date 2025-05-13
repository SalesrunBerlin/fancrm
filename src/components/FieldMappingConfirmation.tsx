import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DuplicateRecord } from "@/types";
import { useState } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FieldMappingConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columnMappings: { sourceColumn: string; targetField: string; fieldType: string }[];
  duplicateRecords: DuplicateRecord[];
  onCreateCustomField: (fieldName: string, fieldType: string) => void;
}

const customFieldSchema = z.object({
  fieldName: z.string().min(1, { message: "Field name is required." }),
  fieldType: z.enum(["text", "number", "date", "boolean"]),
});

export function FieldMappingConfirmation({
  open,
  onOpenChange,
  columnMappings,
  duplicateRecords,
  onCreateCustomField,
}: FieldMappingConfirmationProps) {
  const [selectedDuplicate, setSelectedDuplicate] = useState<DuplicateRecord | null>(null);
  const [isCreatingCustomField, setIsCreatingCustomField] = useState(false);

  const customFieldForm = useForm<z.infer<typeof customFieldSchema>>({
    resolver: zodResolver(customFieldSchema),
    defaultValues: {
      fieldName: "",
      fieldType: "text",
    },
  });

  const handleCreateCustomField = async (values: z.infer<typeof customFieldSchema>) => {
    try {
      onCreateCustomField(values.fieldName, values.fieldType);
      customFieldForm.reset();
      setIsCreatingCustomField(false);
      toast.success("Custom field created successfully!");
    } catch (error) {
      toast.error("Failed to create custom field.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Confirm Your Field Mappings
          </DialogTitle>
          <DialogDescription>
            Please review the field mappings below to ensure your data will be imported correctly.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Table>
            <TableCaption>
              These are the field mappings that will be used to import your data.
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Source Column</TableHead>
                <TableHead>Target Field</TableHead>
                <TableHead>Field Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {columnMappings.map((mapping, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{mapping.sourceColumn}</TableCell>
                  <TableCell>{mapping.targetField}</TableCell>
                  <TableCell>{mapping.fieldType}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {duplicateRecords.length > 0 && (
            <div>
              <DialogTitle className="text-lg">
                Duplicate Records Found
              </DialogTitle>
              <DialogDescription>
                The following records appear to be duplicates. Please review them to ensure data
                integrity.
              </DialogDescription>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Fields</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {duplicateRecords.map((record) => (
                    <TableRow
                      key={record.id}
                      onClick={() => setSelectedDuplicate(record)}
                      className="cursor-pointer hover:bg-accent"
                    >
                      <TableCell className="font-medium">{record.name}</TableCell>
                      <TableCell>
                        {Object.entries(record.fields).map(([key, value]) => (
                          <div key={key}>
                            {key}: {value}
                          </div>
                        ))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {isCreatingCustomField && (
            <div>
              <DialogTitle className="text-lg">
                Create Custom Fields
              </DialogTitle>
              <DialogDescription>
                Create a new custom field to map columns to.
              </DialogDescription>
              <Form {...customFieldForm}>
                <form
                  onSubmit={customFieldForm.handleSubmit(handleCreateCustomField)}
                  className="space-y-4"
                >
                  <FormField
                    control={customFieldForm.control}
                    name="fieldName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Field Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Field Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={customFieldForm.control}
                    name="fieldType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Field Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a field type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                            <SelectItem value="boolean">Boolean</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit">Create Field</Button>
                </form>
              </Form>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" onClick={() => setIsCreatingCustomField(true)}>
            Create Custom Field
          </Button>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
