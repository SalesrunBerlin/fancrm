
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

      // First get the name field for this object type
      const { data: nameField } = await supabase
        .from("object_fields")
        .select("api_name")
        .eq("object_type_id", objectTypeId)
        .eq("api_name", "name")
        .single();

      // Get all records for this object type
      const { data: records, error } = await supabase
        .from("object_records")
        .select(`
          id,
          field_values:object_field_values(field_api_name, value)
        `)
        .eq("object_type_id", objectTypeId);

      if (error) throw error;

      return records.map(record => ({
        id: record.id,
        display_value: record.field_values.find(
          (f: any) => f.field_api_name === (nameField?.api_name || "name")
        )?.value || record.id
      }));
    },
    enabled: !!user && !!objectTypeId,
  });

  return {
    records,
    isLoading
  };
}
