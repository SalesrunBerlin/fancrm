
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useObjectLookup(objectTypeId: string) {
  const { user } = useAuth();

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["object-records", objectTypeId],
    queryFn: async () => {
      const { data: records, error } = await supabase
        .from("object_records")
        .select(`
          id,
          field_values:object_field_values(field_api_name, value)
        `)
        .eq("object_type_id", objectTypeId)
        .eq("owner_id", user?.id);

      if (error) throw error;

      return records.map(record => ({
        id: record.id,
        display_value: record.field_values.find((f: any) => f.field_api_name === "name")?.value || 
                      [
                        record.field_values.find((f: any) => f.field_api_name === "first_name")?.value,
                        record.field_values.find((f: any) => f.field_api_name === "last_name")?.value
                      ].filter(Boolean).join(" ") || 
                      "Unnamed Record"
      }));
    },
    enabled: !!user && !!objectTypeId
  });

  return {
    records,
    isLoading
  };
}
