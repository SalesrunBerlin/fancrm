
import { useNavigate } from "react-router-dom";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { RelatedFieldValue } from "./RelatedFieldValue";
import { RelatedSection } from "@/hooks/useRelatedRecords";

interface RelatedRecordsTableProps {
  section: RelatedSection;
}

export function RelatedRecordsTable({ section }: RelatedRecordsTableProps) {
  const navigate = useNavigate();

  const handleRowClick = (recordId: string) => {
    navigate(`/objects/${section.objectType.id}/${recordId}`);
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {section.fields.map((field) => (
              <TableHead key={field.api_name} className="whitespace-nowrap">{field.name}</TableHead>
            ))}
            <TableHead className="whitespace-nowrap">Erstellt am</TableHead>
            <TableHead className="whitespace-nowrap">Zuletzt geändert</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {section.records.map((record) => (
            <TableRow 
              key={record.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleRowClick(record.id)}
            >
              {section.fields.map((field) => (
                <TableCell key={`${record.id}-${field.api_name}`} className="whitespace-nowrap">
                  <RelatedFieldValue 
                    field={field} 
                    value={record.field_values?.[field.api_name]} 
                  />
                </TableCell>
              ))}
              <TableCell className="whitespace-nowrap">{new Date(record.created_at).toLocaleDateString()}</TableCell>
              <TableCell className="whitespace-nowrap">{new Date(record.updated_at).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
