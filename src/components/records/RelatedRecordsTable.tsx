
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RelatedSection } from "@/hooks/useRelatedRecords";
import { Link } from "react-router-dom";
import { RelatedFieldValue } from "./RelatedFieldValue";

interface RelatedRecordsTableProps {
  section: RelatedSection;
}

export function RelatedRecordsTable({ section }: RelatedRecordsTableProps) {
  // Add null checking to handle potential undefined values
  if (!section || !section.objectType || !section.fields || !section.records) {
    return null; // Don't render anything if required data is missing
  }

  return (
    <div className="w-full overflow-auto">
      <Table className="w-full">
        <TableHeader>
          <TableRow>
            {section.fields.map((field) => (
              <TableHead key={field.api_name}>{field.name}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {section.records.map((record) => (
            <TableRow key={record.id}>
              {section.fields.map((field, fieldIndex) => (
                <TableCell key={`${record.id}-${field.api_name}`}>
                  {fieldIndex === 0 ? (
                    <Link 
                      to={`/objects/${section.objectType.id}/${record.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      <RelatedFieldValue field={field} record={record} />
                    </Link>
                  ) : (
                    <RelatedFieldValue field={field} record={record} />
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
