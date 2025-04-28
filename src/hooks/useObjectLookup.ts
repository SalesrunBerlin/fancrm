
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useObjectTypes } from "./useObjectTypes";

interface LookupRecord {
  id: string;
  display_value: string;
}

export function useObjectLookup(objectTypeId: string) {
  const { user } = useAuth();
  const { objectTypes } = useObjectTypes();

  const targetObjectType = objectTypes?.find(obj => obj.id === objectTypeId);
  const defaultField = targetObjectType?.default_field_api_name || 'name';

  const { data: records, isLoading } = useQuery({
    queryKey: ["object-lookup", objectTypeId],
    queryFn: async (): Promise<LookupRecord[]> => {
      const { data: recordsData, error: recordsError } = await supabase
        .from("object_records")
        .select("id")
        .eq("object_type_id", objectTypeId);

      if (recordsError) throw recordsError;
      if (!recordsData || recordsData.length === 0) return [];

      // Get the display field values for all records
      const recordIds = recordsData.map(r => r.id);
      
      const { data: fieldValues, error: fieldValuesError } = await supabase
        .from("object_field_values")
        .select("record_id, value")
        .eq("field_api_name", defaultField)
        .in("record_id", recordIds);

      if (fieldValuesError) throw fieldValuesError;

      // Map the records to include their display values
      return recordsData.map(record => {
        const fieldValue = fieldValues?.find(fv => fv.record_id === record.id);
        return {
          id: record.id,
          display_value: fieldValue?.value || record.id
        };
      });
    },
    enabled: !!user && !!objectTypeId,
  });

  return {
    records,
    isLoading,
  };
}
