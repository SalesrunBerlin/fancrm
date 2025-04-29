
import { useQuery } from "@tanstack/react-query";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useObjectFields } from "@/hooks/useObjectFields";
import { EditableCell } from "./EditableCell";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { FieldsConfigDialog } from "./FieldsConfigDialog";
import { useIsMobile } from "@/hooks/use-mobile";

interface RelatedRecordsListProps {
  objectTypeId: string;
  recordId: string;
}

interface RelatedSection {
  objectType: {
    id: string;
    name: string;
  };
  relationship: {
    name: string;
    relationship_type: string;
  };
  records: any[];
  fields: any[];
  displayField: any;
}

export function RelatedRecordsList({ objectTypeId, recordId }: RelatedRecordsListProps) {
  const isMobile = useIsMobile();
  
  const { data: relatedSections, isLoading } = useQuery({
    queryKey: ["related-records", objectTypeId, recordId],
    queryFn: async () => {
      // Get all relationships where this object type is involved
      const { data: relationships, error: relError } = await supabase
        .from("object_relationships")
        .select(`
          id,
          name,
          relationship_type,
          from_object_id,
          to_object_id
        `)
        .or(`from_object_id.eq.${objectTypeId},to_object_id.eq.${objectTypeId}`);

      if (relError) throw relError;
      if (!relationships) return [];

      const sections = await Promise.all(relationships.map(async (relationship) => {
        // Determine if this is a forward or reverse relationship
        const isForward = relationship.from_object_id === objectTypeId;
        const relatedObjectTypeId = isForward ? relationship.to_object_id : relationship.from_object_id;
        
        // Get the fields for the related object type
        const { data: fields } = await supabase
          .from("object_fields")
          .select("*")
          .eq("object_type_id", relatedObjectTypeId)
          .order("display_order");

        if (!fields) return null;

        // Get records that reference this record
        let records;
        const lookupField = fields.find(f => 
          f.data_type === "lookup" && 
          f.options && 
          typeof f.options === 'object' &&
          'target_object_type_id' in f.options
        );

        if (isForward && lookupField) {
          // For forward relationships, get records from field values
          const { data: fieldValues } = await supabase
            .from("object_field_values")
            .select("record_id")
            .eq("field_api_name", lookupField.api_name)
            .eq("value", recordId);

          if (!fieldValues || fieldValues.length === 0) return null;

          const recordIds = fieldValues.map(fv => fv.record_id);

          const { data: relatedRecords } = await supabase
            .from("object_records")
            .select("*")
            .in("id", recordIds);

          records = relatedRecords;
        } else if (!isForward && lookupField) {
          // For reverse relationships, find records that this record references
          const { data: fieldValues } = await supabase
            .from("object_field_values")
            .select("value")
            .eq("record_id", recordId)
            .eq("field_api_name", lookupField.api_name);

          if (!fieldValues || fieldValues.length === 0) return null;

          const relatedRecordIds = fieldValues.map(fv => fv.value).filter(Boolean);
          
          if (relatedRecordIds.length === 0) return null;

          const { data: relatedRecords } = await supabase
            .from("object_records")
            .select("*")
            .in("id", relatedRecordIds);

          records = relatedRecords;
        }

        if (!records || records.length === 0) return null;

        // Get values for these records
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

        // Get the object type info
        const { data: objectType } = await supabase
          .from("object_types")
          .select("*")
          .eq("id", relatedObjectTypeId)
          .single();

        if (!objectType) return null;

        // Get stored visible fields from localStorage
        const storedFields = localStorage.getItem(`visible-fields-${relatedObjectTypeId}`);
        const visibleFields = storedFields ? JSON.parse(storedFields) : fields.map(f => f.api_name);

        // On mobile, limit the number of fields to avoid horizontal scrolling issues
        const filteredFields = fields.filter(f => visibleFields.includes(f.api_name));
        const displayFields = isMobile ? filteredFields.slice(0, 2) : filteredFields;

        return {
          objectType,
          relationship,
          records: recordsWithValues,
          fields: displayFields,
          displayField: fields.find(f => f.api_name === objectType.default_field_api_name) || fields[0]
        };
      }));

      return sections.filter(Boolean);
    }
  });

  if (isLoading) {
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
    <div className="space-y-6 mb-20">
      {relatedSections.map((section) => (
        <Card key={section.relationship.id}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{section.relationship.name}</CardTitle>
            {!isMobile && (
              <FieldsConfigDialog
                objectTypeId={section.objectType.id}
                onVisibilityChange={() => {}}
                defaultVisibleFields={section.fields.map(f => f.api_name)}
              />
            )}
          </CardHeader>
          <CardContent className="overflow-x-auto -webkit-overflow-scrolling-touch">
            <div className="table-container">
              <Table>
                <TableHeader>
                  <TableRow>
                    {section.fields.map((field) => (
                      <TableHead key={field.api_name}>{field.name}</TableHead>
                    ))}
                    {!isMobile && (
                      <>
                        <TableHead>Created At</TableHead>
                        <TableHead>Last Modified</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {section.records.map((record) => (
                    <TableRow 
                      key={record.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => window.location.href = `/objects/${section.objectType.id}/${record.id}`}
                    >
                      {section.fields.map((field) => (
                        <EditableCell
                          key={`${record.id}-${field.api_name}`}
                          value={record.field_values?.[field.api_name]}
                          editMode={false}
                          onChange={() => {}}
                          fieldType={field.data_type}
                          isRequired={field.is_required}
                          fieldOptions={field.options}
                        />
                      ))}
                      {!isMobile && (
                        <>
                          <TableCell>{new Date(record.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>{new Date(record.updated_at).toLocaleDateString()}</TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
