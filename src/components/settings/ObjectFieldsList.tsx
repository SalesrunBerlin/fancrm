
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Edit, List } from "lucide-react";
import { ObjectField } from "@/hooks/useObjectTypes";
import { Link } from "react-router-dom";

interface ObjectFieldsListProps {
  fields: ObjectField[];
  objectTypeId: string;
  isLoading: boolean;
  onManagePicklistValues: (fieldId: string) => void;
}

export function ObjectFieldsList({ fields, objectTypeId, isLoading, onManagePicklistValues }: ObjectFieldsListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
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
              <TableCell className="font-medium">{field.name}</TableCell>
              <TableCell className="text-muted-foreground">{field.api_name}</TableCell>
              <TableCell>{field.data_type}</TableCell>
              <TableCell>{field.is_required ? "Yes" : "No"}</TableCell>
              <TableCell className="text-right space-x-2">
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
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
