
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface LookupRecord {
  id: string;
  display_value: string;
}

export function useObjectLookup(objectTypeId: string | undefined) {
  const { user } = useAuth();

  const { data: records = [], isLoading, error } = useQuery({
    queryKey: ["object-records", objectTypeId],
    queryFn: async () => {
      if (!objectTypeId) {
        console.warn("No target object ID provided to useObjectLookup");
        return [];
      }
      
      console.log("Fetching lookup records for object type:", objectTypeId);
      
      const { data: records, error } = await supabase
        .from("object_records")
        .select(`
          id,
          field_values:object_field_values(field_api_name, value)
        `)
        .eq("object_type_id", objectTypeId);

      if (error) {
        console.error("Supabase error fetching lookup records:", error);
        throw error;
      }

      console.log("Lookup records fetched:", records?.length || 0);
      
      return records.map(record => {
        const displayValue = record.field_values.find((f: any) => f.field_api_name === "name")?.value || 
                      [
                        record.field_values.find((f: any) => f.field_api_name === "first_name")?.value,
                        record.field_values.find((f: any) => f.field_api_name === "last_name")?.value
                      ].filter(Boolean).join(" ") || 
                      record.id.substring(0, 8) || 
                      "Unnamed Record";
                      
        console.log(`Record ${record.id} display value:`, displayValue);
        
        return {
          id: record.id,
          display_value: displayValue
        };
      }) as LookupRecord[];
    },
    enabled: !!objectTypeId // Only run query when objectTypeId is provided
  });

  return {
    records,
    isLoading,
    error
  };
}
