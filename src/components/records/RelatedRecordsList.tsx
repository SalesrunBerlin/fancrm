
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useObjectFields } from "@/hooks/useObjectFields";
import { useObjectRecords } from "@/hooks/useObjectRecords";
import { useObjectLookup } from "@/hooks/useObjectLookup";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

interface RelatedRecordsListProps {
  objectTypeId: string;
  recordId: string;
}

export function RelatedRecordsList({ objectTypeId, recordId }: RelatedRecordsListProps) {
  const { fields } = useObjectFields(objectTypeId);
  const lookupFields = fields?.filter(f => f.data_type === 'lookup') || [];
  
  // Group records by their target object type
  const relatedRecordSections = lookupFields.map(field => {
    const targetObjectTypeId = field.options?.target_object_type_id;
    if (!targetObjectTypeId) return null;

    return (
      <RelatedRecordsSection 
        key={field.id}
        fieldName={field.name}
        targetObjectTypeId={targetObjectTypeId}
        recordId={recordId}
      />
    );
  });

  return (
    <div className="space-y-6">
      {relatedRecordSections}
    </div>
  );
}

function RelatedRecordsSection({ fieldName, targetObjectTypeId, recordId }: { 
  fieldName: string;
  targetObjectTypeId: string;
  recordId: string;
}) {
  const { records, isLoading } = useObjectRecords(targetObjectTypeId);
  const { fields } = useObjectFields(targetObjectTypeId);
  const nameField = fields?.find(f => f.api_name === 'name');

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{fieldName}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records?.map((record) => (
              <TableRow key={record.id}>
                <TableCell>
                  <Link 
                    to={`/objects/${targetObjectTypeId}/${record.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {record.field_values?.[nameField?.api_name || 'name'] || record.record_id}
                  </Link>
                </TableCell>
                <TableCell>
                  {new Date(record.created_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
