
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ObjectLookupRecord {
  id: string;
  display_value: string;
}

export function useObjectLookup(objectTypeId: string | null) {
  const { data: records, isLoading, error } = useQuery({
    queryKey: ["object-lookup", objectTypeId],
    queryFn: async (): Promise<ObjectLookupRecord[]> => {
      if (!objectTypeId) return [];
      
      // Get the object type to find the default display field
      const { data: objectTypeData, error: objectTypeError } = await supabase
        .from("object_types")
        .select("default_field_api_name")
        .eq("id", objectTypeId)
        .single();
      
      if (objectTypeError) throw objectTypeError;
      
      const defaultFieldApiName = objectTypeData?.default_field_api_name || "name";
      
      // Get records with their field values
      const { data: recordsData, error: recordsError } = await supabase
        .from("object_records")
        .select("id")
        .eq("object_type_id", objectTypeId)
        .limit(100);
      
      if (recordsError) throw recordsError;
      
      // Get field values for the default field
      const recordIds = recordsData.map(record => record.id);
      
      if (recordIds.length === 0) return [];
      
      const { data: fieldValuesData, error: fieldValuesError } = await supabase
        .from("object_field_values")
        .select("record_id, value")
        .in("record_id", recordIds)
        .eq("field_api_name", defaultFieldApiName);
      
      if (fieldValuesError) throw fieldValuesError;
      
      // Map records to display values
      return recordsData.map(record => {
        const fieldValue = fieldValuesData?.find(fv => fv.record_id === record.id);
        return {
          id: record.id,
          display_value: fieldValue?.value || `Record ${record.id.slice(0, 8)}`,
        };
      });
    },
    enabled: !!objectTypeId,
  });

  return { records, isLoading, error };
}
