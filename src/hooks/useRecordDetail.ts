
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useRecordDetail(objectTypeId?: string, recordId?: string) {
  const { user } = useAuth();

  const { data: record, isLoading, refetch } = useQuery({
    queryKey: ["record-detail", objectTypeId, recordId],
    queryFn: async () => {
      if (!objectTypeId || !recordId) {
        return null;
      }

      console.log("Fetching record details:", { objectTypeId, recordId });

      // Get the record
      const { data: recordData, error: recordError } = await supabase
        .from("object_records")
        .select("*")
        .eq("id", recordId)
        .single();

      if (recordError) {
        console.error("Error fetching record:", recordError);
        throw recordError;
      }

      // Get field values
      const { data: fieldValues, error: fieldValuesError } = await supabase
        .from("object_field_values")
        .select("field_api_name, value")
        .eq("record_id", recordId);

      if (fieldValuesError) {
        console.error("Error fetching field values:", fieldValuesError);
        throw fieldValuesError;
      }

      console.log("Field values fetched:", fieldValues.length);

      // Convert field values array to object
      const valuesObject = fieldValues.reduce((acc, curr) => {
        acc[curr.field_api_name] = curr.value;
        return acc;
      }, {} as { [key: string]: string | null });

      // Find display name field if exists
      const { data: objectType } = await supabase
        .from("object_types")
        .select("default_field_api_name, name")
        .eq("id", objectTypeId)
        .single();

      let displayName = null;
      if (objectType?.default_field_api_name) {
        displayName = valuesObject[objectType.default_field_api_name] || null;
      }

      // Return the record with both field_values (legacy) and fieldValues (new standardized name)
      return {
        ...recordData,
        field_values: valuesObject, // Keep for backward compatibility
        fieldValues: valuesObject, // New standardized property name
        displayName,
        objectName: objectType?.name || 'Object'
      };
    },
    enabled: !!user && !!objectTypeId && !!recordId,
  });

  return {
    record,
    isLoading,
    refetch
  };
}
