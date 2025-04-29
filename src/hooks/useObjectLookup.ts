
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
      
      console.log("Fetching lookup records for object type:", objectTypeId);
      
      // Get the object type to find the default field
      const { data: objectType, error: objectTypeError } = await supabase
        .from("object_types")
        .select("default_field_api_name")
        .eq("id", objectTypeId)
        .single();
        
      if (objectTypeError) {
        console.error("Error fetching object type:", objectTypeError);
        throw objectTypeError;
      }
      
      const defaultFieldApiName = objectType?.default_field_api_name;
      console.log("Default field API name:", defaultFieldApiName);
      
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
        let displayValue;
        
        // If there's a default field configured, use that first
        if (defaultFieldApiName) {
          displayValue = record.field_values.find((f: any) => f.field_api_name === defaultFieldApiName)?.value;
        }
        
        // Fallbacks if default field not found or not configured
        if (!displayValue) {
          displayValue = record.field_values.find((f: any) => f.field_api_name === "name")?.value || 
                        [
                          record.field_values.find((f: any) => f.field_api_name === "first_name")?.value,
                          record.field_values.find((f: any) => f.field_api_name === "last_name")?.value
                        ].filter(Boolean).join(" ") || 
                        record.id.substring(0, 8) || 
                        "Unnamed Record";
        }
                      
        console.log(`Record ${record.id} display value:`, displayValue);
        
        return {
          id: record.id,
          display_value: displayValue
        };
      }) as LookupRecord[];
    },
    enabled: !!objectTypeId
  });

  return {
    records,
    isLoading,
    error
  };
}
