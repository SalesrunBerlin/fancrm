
import { useQuery } from "@tanstack/react-query";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useObjectFields } from "@/hooks/useObjectFields";
import { LookupValueDisplay } from "./LookupValueDisplay";

interface RelatedRecordsListProps {
  objectTypeId: string;
  recordId: string;
}

export function RelatedRecordsList({ objectTypeId, recordId }: RelatedRecordsListProps) {
  const { fields } = useObjectFields(objectTypeId);

  // Find lookup fields that reference this object type
  const { data: referencingFields, isLoading: isFieldsLoading } = useQuery({
    queryKey: ["referencing-fields", objectTypeId],
    queryFn: async () => {
      const { data: fields, error } = await supabase
        .from("object_fields")
        .select(`
          id,
          name,
          api_name,
          object_type_id,
          options
        `)
        .eq("data_type", "lookup")
        .filter("options->target_object_type_id", "eq", objectTypeId);

      if (error) throw error;
      return fields;
    }
  });

  // For each referencing field, fetch records that reference the current record
  const { data: relatedSections, isLoading: isRecordsLoading } = useQuery({
    queryKey: ["related-records", objectTypeId, recordId, referencingFields],
    queryFn: async () => {
      if (!referencingFields) return [];

      const sections = await Promise.all(referencingFields.map(async (field) => {
        // Fetch records where this field references the current record
        const { data: fieldValues } = await supabase
          .from("object_field_values")
          .select("record_id")
          .eq("field_api_name", field.api_name)
          .eq("value", recordId);

        if (!fieldValues || fieldValues.length === 0) return null;

        const recordIds = fieldValues.map(fv => fv.record_id);

        // Get the actual records
        const { data: records } = await supabase
          .from("object_records")
          .select("*")
          .in("id", recordIds);

        if (!records) return null;

        // Get field values for these records
        const { data: values } = await supabase
          .from("object_field_values")
          .select("*")
          .in("record_id", records.map(r => r.id));

        const recordsWithValues = records.map(record => ({
          ...record,
          field_values: values
            ?.filter(v => v.record_id === record.id)
            .reduce((acc, v) => ({
              ...acc,
              [v.field_api_name]: v.value
            }), {})
        }));

        // Get the object type info for these records
        const { data: objectType } = await supabase
          .from("object_types")
          .select("*")
          .eq("id", field.object_type_id)
          .single();

        return {
          objectType,
          field,
          records: recordsWithValues
        };
      }));

      return sections.filter(Boolean);
    },
    enabled: !!referencingFields
  });

  if (isFieldsLoading || isRecordsLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!relatedSections || relatedSections.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No related records found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {relatedSections.map((section) => (
        <Card key={section.field.id}>
          <CardHeader>
            <CardTitle>{section.objectType.name}</CardTitle>
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
                {section.records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <Link 
                        to={`/objects/${section.objectType.id}/${record.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {record.field_values?.name || record.record_id}
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
      ))}
    </div>
  );
}
