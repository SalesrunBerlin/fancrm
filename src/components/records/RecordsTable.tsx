
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ObjectField } from "@/hooks/useObjectTypes";
import { ObjectRecord } from "@/hooks/useObjectRecords";
import { Edit, Trash2, Eye } from "lucide-react";
import { LookupValueDisplay } from "./LookupValueDisplay";

interface RecordsTableProps {
  records: ObjectRecord[];
  fields: ObjectField[];
  objectTypeId: string;
}

export function RecordsTable({ records, fields, objectTypeId }: RecordsTableProps) {
  if (records.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No records found
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {fields.map((field) => (
              <TableHead key={field.id}>{field.name}</TableHead>
            ))}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              {fields.map((field) => (
                <TableCell key={`${record.id}-${field.id}`}>
                  {field.data_type === "lookup" && field.options && record.field_values && record.field_values[field.api_name] ? (
                    <LookupValueDisplay
                      value={record.field_values[field.api_name]}
                      fieldOptions={field.options as { target_object_type_id: string }}
                    />
                  ) : (
                    record.field_values && record.field_values[field.api_name] !== null 
                    ? String(record.field_values[field.api_name]) 
                    : "—"
                  )}
                </TableCell>
              ))}
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="h-8 w-8 p-0"
                  >
                    <Link to={`/objects/${objectTypeId}/${record.id}`}>
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">View</span>
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="h-8 w-8 p-0"
                  >
                    <Link to={`/objects/${objectTypeId}/${record.id}/edit`}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Link>
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
