
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Edit, List, Trash2 } from "lucide-react";
import { ObjectField } from "@/hooks/useObjectTypes";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { DeleteDialog } from "@/components/common/DeleteDialog";

export interface ObjectFieldsListProps {
  fields: ObjectField[];
  objectTypeId: string;
  isLoading: boolean;
  onManagePicklistValues: (fieldId: string) => void;
  onDeleteField?: (fieldId: string) => Promise<void>;
}

export function ObjectFieldsList({ fields, objectTypeId, isLoading, onManagePicklistValues, onDeleteField }: ObjectFieldsListProps) {
  const [deleteFieldId, setDeleteFieldId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const fieldToDelete = fields.find(field => field.id === deleteFieldId);

  const handleDeleteField = async () => {
    if (deleteFieldId && onDeleteField) {
      await onDeleteField(deleteFieldId);
      setDeleteFieldId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>API Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="w-[100px]">Required</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No fields found
                </TableCell>
              </TableRow>
            ) : (
              fields.map((field) => (
                <TableRow key={field.id}>
                  <TableCell className="font-medium whitespace-nowrap">{field.name}</TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">{field.api_name}</TableCell>
                  <TableCell className="whitespace-nowrap">{field.data_type}</TableCell>
                  <TableCell className="whitespace-nowrap">{field.is_required ? "Yes" : "No"}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <div className="flex justify-end items-center gap-2">
                      {field.data_type === "picklist" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onManagePicklistValues(field.id)}
                        >
                          <List className="h-4 w-4" />
                          <span className="sr-only">Manage Values</span>
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        asChild
                      >
                        <Link to={`/settings/objects/${objectTypeId}/fields/${field.id}/edit`}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Link>
                      </Button>
                      {!field.is_system && onDeleteField && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setDeleteFieldId(field.id);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteField}
        title={`Delete Field: ${fieldToDelete?.name}`}
        description={`Are you sure you want to delete the field "${fieldToDelete?.name}"? This action cannot be undone and may affect existing records.`}
      />
    </Card>
  );
}
