
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { RelatedFieldValue } from "./RelatedFieldValue";
import { RelatedSection } from "@/hooks/useRelatedRecords";
import { format } from "date-fns";

interface RelatedRecordsTableProps {
  section: RelatedSection;
}

export function RelatedRecordsTable({ section }: RelatedRecordsTableProps) {
  return (
    <div className="overflow-hidden rounded-md border">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {section.fields.map((field) => (
                <TableHead key={field.api_name} className="whitespace-nowrap font-medium">{field.name}</TableHead>
              ))}
              <TableHead className="whitespace-nowrap font-medium">Erstellt am</TableHead>
              <TableHead className="whitespace-nowrap font-medium">Zuletzt geändert</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {section.records.map((record) => (
              <TableRow 
                key={record.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => window.location.href = `/objects/${section.objectType.id}/${record.id}`}
              >
                {section.fields.map((field) => (
                  <TableCell key={`${record.id}-${field.api_name}`} className="whitespace-nowrap">
                    <RelatedFieldValue 
                      field={field} 
                      value={record.field_values?.[field.api_name]} 
                    />
                  </TableCell>
                ))}
                <TableCell className="whitespace-nowrap text-muted-foreground text-sm">
                  {format(new Date(record.created_at), "dd.MM.yyyy")}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground text-sm">
                  {format(new Date(record.updated_at), "dd.MM.yyyy")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
