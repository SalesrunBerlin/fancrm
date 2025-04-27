
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface LookupRecord {
  id: string;
  display_value: string;
}

export function useObjectLookup(objectTypeId: string | undefined) {
  const { user } = useAuth();

  const { data: records, isLoading } = useQuery({
    queryKey: ["object-lookup-records", objectTypeId],
    queryFn: async (): Promise<LookupRecord[]> => {
      if (!objectTypeId) return [];

      // First get records for this object type
      const { data: records, error } = await supabase
        .from("object_records")
        .select("id");

      if (error) throw error;

      if (!records || records.length === 0) {
        return [];
      }

      // Find the display field configuration
      const { data: fields } = await supabase
        .from("object_fields")
        .select(`
          id,
          api_name,
          field_display_configs (
            display_field_api_name
          )
        `)
        .eq("object_type_id", objectTypeId)
        .eq("api_name", "name")
        .single();

      const displayFieldName = fields?.field_display_configs?.display_field_api_name || "name";

      // Get all field values using the correct display field
      const recordsWithDisplayValue = await Promise.all(records.map(async (record) => {
        const { data: fieldValues } = await supabase
          .from("object_field_values")
          .select("field_api_name, value")
          .eq("record_id", record.id);

        // Find the display field value or use record ID as fallback
        const displayValue = fieldValues?.find(
          f => f.field_api_name === displayFieldName
        )?.value || record.id;

        return {
          id: record.id,
          display_value: displayValue
        };
      }));

      return recordsWithDisplayValue;
    },
    enabled: !!user && !!objectTypeId,
  });

  return {
    records,
    isLoading
  };
}
