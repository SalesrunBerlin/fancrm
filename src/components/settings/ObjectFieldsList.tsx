
import { useState } from "react";
import { ObjectField } from "@/hooks/useObjectTypes";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ObjectFieldEdit } from "./ObjectFieldEdit";
import { useObjectFields } from "@/hooks/useObjectFields";
import { Loader2, MoreHorizontal, Pencil, Trash2, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";

interface ObjectFieldsListProps {
  fields: ObjectField[];
  isLoading?: boolean;
  objectTypeId: string;
  onManagePicklistValues?: (fieldId: string) => void;
}

export function ObjectFieldsList({ fields, isLoading, objectTypeId, onManagePicklistValues }: ObjectFieldsListProps) {
  const [editingField, setEditingField] = useState<ObjectField | null>(null);
  const [deletingField, setDeletingField] = useState<ObjectField | null>(null);
  const { deleteField } = useObjectFields(objectTypeId);

  const handleDeleteField = async () => {
    if (!deletingField) return;
    
    try {
      await deleteField.mutateAsync(deletingField.id);
      setDeletingField(null);
      toast.success("Field deleted successfully");
    } catch (error) {
      console.error("Error deleting field:", error);
      toast.error("Could not delete field");
    }
  };

  const getFieldTypeLabel = (dataType: string) => {
    switch (dataType) {
      case "text": return "Text";
      case "textarea": return "Text Area";
      case "number": return "Number";
      case "email": return "Email";
      case "url": return "URL";
      case "date": return "Date";
      case "datetime": return "Date & Time";
      case "boolean": return "True/False";
      case "picklist": return "Picklist";
      case "lookup": return "Lookup";
      case "currency": return "Currency";
      default: return dataType;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (fields.length === 0) {
    return (
      <div className="text-center p-4">
        <p className="text-muted-foreground">No fields found.</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Field Name</TableHead>
            <TableHead>API Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Required</TableHead>
            <TableHead className="w-20">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.map((field) => (
            <TableRow key={field.id}>
              <TableCell>{field.name}</TableCell>
              <TableCell>{field.api_name}</TableCell>
              <TableCell>{getFieldTypeLabel(field.data_type)}</TableCell>
              <TableCell>
                {field.is_required ? (
                  <Badge>Required</Badge>
                ) : (
                  <Badge variant="outline">Optional</Badge>
                )}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => setEditingField(field)}
                      disabled={field.is_system}
                    >
                      <Pencil className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    
                    {field.data_type === "picklist" && onManagePicklistValues && (
                      <DropdownMenuItem 
                        onClick={() => onManagePicklistValues(field.id)}
                      >
                        <ListChecks className="mr-2 h-4 w-4" /> Manage Values
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuItem 
                      onClick={() => setDeletingField(field)}
                      disabled={field.is_system}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Edit Field Dialog */}
      {editingField && (
        <ObjectFieldEdit 
          field={editingField}
          isOpen={!!editingField}
          onClose={() => setEditingField(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingField} onOpenChange={(open) => {
        if (!open) setDeletingField(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the field "{deletingField?.name}"? 
              This action cannot be undone and may result in data loss.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteField}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteField.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
