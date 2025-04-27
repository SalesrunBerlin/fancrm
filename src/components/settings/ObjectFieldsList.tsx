
import { useState } from "react";
import { useObjectFields } from "@/hooks/useObjectFields";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ObjectField } from "@/hooks/useObjectTypes";
import { DeleteDialog } from "@/components/common/DeleteDialog";

interface ObjectFieldsListProps {
  fields: ObjectField[];
  isLoading: boolean;
  objectTypeId: string;
}

export function ObjectFieldsList({ fields, isLoading, objectTypeId }: ObjectFieldsListProps) {
  const { deleteField } = useObjectFields(objectTypeId);
  const { toast } = useToast();
  const [editingField, setEditingField] = useState<ObjectField | null>(null);
  const [fieldToDelete, setFieldToDelete] = useState<ObjectField | null>(null);

  const handleDeleteField = async () => {
    if (!fieldToDelete) return;

    try {
      await deleteField.mutateAsync(fieldToDelete.id);
      toast({
        title: "Success",
        description: "Field deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting field:", error);
      toast({
        title: "Error",
        description: "Failed to delete field",
        variant: "destructive",
      });
    } finally {
      setFieldToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (fields.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No fields found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DeleteDialog
        isOpen={!!fieldToDelete}
        onClose={() => setFieldToDelete(null)}
        onConfirm={handleDeleteField}
        title="Delete Field"
        description={`Are you sure you want to delete the field "${fieldToDelete?.name}"? This action cannot be undone.`}
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Field Name</TableHead>
            <TableHead>API Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Required</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.map((field) => (
            <TableRow key={field.id}>
              <TableCell className="font-medium">
                {field.name}
                {field.is_system && (
                  <Badge variant="outline" className="ml-2">
                    System
                  </Badge>
                )}
              </TableCell>
              <TableCell>{field.api_name}</TableCell>
              <TableCell>{field.data_type}</TableCell>
              <TableCell>{field.is_required ? "Yes" : "No"}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingField(field)}
                    disabled={field.is_system}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setFieldToDelete(field)}
                    disabled={field.is_system}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
