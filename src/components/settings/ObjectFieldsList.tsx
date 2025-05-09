
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, List } from "lucide-react";
import { ObjectField } from "@/hooks/useObjectTypes";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

interface ObjectFieldsListProps {
  fields: ObjectField[];
  objectTypeId: string;
  isLoading?: boolean;
  showDragHandles?: boolean;
  onManagePicklistValues?: (fieldId: string) => void;
  onDeleteField?: (fieldId: string) => void;
}

export function ObjectFieldsList({
  fields,
  objectTypeId,
  isLoading = false,
  showDragHandles = false,
  onManagePicklistValues,
  onDeleteField,
}: ObjectFieldsListProps) {
  
  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </Card>
    );
  }

  if (fields.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground mb-4">No fields found</p>
        <Link to={`/settings/objects/${objectTypeId}/fields/new`}>
          <Button>Add your first field</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {showDragHandles && <TableHead className="w-8"></TableHead>}
            <TableHead>Field Name</TableHead>
            <TableHead>API Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Required</TableHead>
            <TableHead className="w-16"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.map((field) => (
            <TableRow 
              key={field.id}
              className="transition-colors"
              data-field-id={field.id}
            >
              <TableCell>
                <div className="font-medium">{field.name}</div>
                {field.is_system && <Badge variant="outline">System</Badge>}
              </TableCell>
              <TableCell className="font-mono text-sm text-muted-foreground">
                {field.api_name}
              </TableCell>
              <TableCell>{field.data_type}</TableCell>
              <TableCell>{field.is_required ? "Yes" : "No"}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-8 w-8 p-0 focus-visible:ring-0"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <Link to={`/settings/objects/${objectTypeId}/fields/${field.id}/edit`}>
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    </Link>
                    {field.data_type === "picklist" && onManagePicklistValues && (
                      <DropdownMenuItem onClick={() => onManagePicklistValues(field.id)}>
                        <List className="mr-2 h-4 w-4" />
                        Manage Values
                      </DropdownMenuItem>
                    )}
                    {onDeleteField && !field.is_system && (
                      <DropdownMenuItem
                        onClick={() => onDeleteField(field.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
