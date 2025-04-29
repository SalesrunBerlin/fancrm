
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface LookupRecord {
  id: string;
  display_value: string;
}

export function useObjectLookup(objectTypeId: string) {
  const { user } = useAuth();

  const { data: records = [], isLoading, error } = useQuery({
    queryKey: ["object-records", objectTypeId],
    queryFn: async () => {
      if (!objectTypeId) {
        throw new Error("Missing target object ID");
      }
      
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
        display_value: record.field_values.find((f: any) => f.field_api_name === "name")?.value || 
                      [
                        record.field_values.find((f: any) => f.field_api_name === "first_name")?.value,
                        record.field_values.find((f: any) => f.field_api_name === "last_name")?.value
                      ].filter(Boolean).join(" ") || 
                      record.id.substring(0, 8) || 
                      "Unnamed Record"
      })) as LookupRecord[];
    },
    enabled: !!user && !!objectTypeId
  });

  return {
    records,
    isLoading,
    error
  };
}
