
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
        .select("id")
        .eq("object_type_id", objectTypeId);

      if (error) throw error;

      if (!records || records.length === 0) {
        return [];
      }

      // Find the name field for this object type
      const { data: nameField } = await supabase
        .from("object_fields")
        .select("api_name")
        .eq("object_type_id", objectTypeId)
        .eq("api_name", "name")
        .maybeSingle();

      // Get all field values for these records
      const recordsWithDisplayValue = await Promise.all(records.map(async (record) => {
        const { data: fieldValues } = await supabase
          .from("object_field_values")
          .select("field_api_name, value")
          .eq("record_id", record.id);

        // Find the name field value or use record ID as fallback
        const displayValue = fieldValues?.find(
          f => f.field_api_name === (nameField?.api_name || "name")
        )?.value || record.id;

        return {
          id: record.id,
          display_value: displayValue || record.id
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
