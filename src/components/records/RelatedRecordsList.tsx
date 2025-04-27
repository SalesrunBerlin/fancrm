
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useObjectFields } from "@/hooks/useObjectFields";
import { useObjectRecords } from "@/hooks/useObjectRecords";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
        sourceFieldApi={field.api_name}
        recordId={recordId}
      />
    );
  });

  return (
    <div className="space-y-6">
      {relatedRecordSections.length > 0 ? relatedRecordSections : (
        <div className="text-center text-muted-foreground py-8">
          No related records found
        </div>
      )}
    </div>
  );
}

function RelatedRecordsSection({ 
  fieldName, 
  targetObjectTypeId, 
  sourceFieldApi,
  recordId 
}: { 
  fieldName: string;
  targetObjectTypeId: string;
  sourceFieldApi: string;
  recordId: string;
}) {
  // Fetch records from the target object type that reference this record
  const { data: relatedRecords, isLoading } = useQuery({
    queryKey: ["related-records", targetObjectTypeId, recordId, sourceFieldApi],
    queryFn: async () => {
      // Find all field values that reference this record
      const { data: fieldValues, error: fieldValuesError } = await supabase
        .from("object_field_values")
        .select("record_id")
        .eq("value", recordId)
        .eq("field_api_name", sourceFieldApi);

      if (fieldValuesError) throw fieldValuesError;
      
      if (!fieldValues || fieldValues.length === 0) {
        return [];
      }
      
      // Get the record IDs that reference this record
      const relatedRecordIds = fieldValues.map(fv => fv.record_id);
      
      // Fetch the actual records
      const { data: records, error: recordsError } = await supabase
        .from("object_records")
        .select("*")
        .in("id", relatedRecordIds)
        .eq("object_type_id", targetObjectTypeId);

      if (recordsError) throw recordsError;

      // For each record, get its field values
      const recordsWithValues = await Promise.all(records.map(async (record) => {
        const { data: values, error: valuesError } = await supabase
          .from("object_field_values")
          .select("field_api_name, value")
          .eq("record_id", record.id);

        if (valuesError) throw valuesError;

        // Convert to map for easier access
        const valuesMap = values.reduce((map, val) => {
          map[val.field_api_name] = val.value;
          return map;
        }, {} as Record<string, string | null>);

        return {
          ...record,
          field_values: valuesMap
        };
      }));

      return recordsWithValues;
    },
    enabled: !!targetObjectTypeId && !!recordId,
  });

  const { fields: targetFields } = useObjectFields(targetObjectTypeId);
  const nameField = targetFields?.find(f => f.api_name === 'name');

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!relatedRecords || relatedRecords.length === 0) {
    return null;
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
            {relatedRecords.map((record) => (
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
