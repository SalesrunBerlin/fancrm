
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useRecordDetail(objectTypeId?: string, recordId?: string) {
  const { user } = useAuth();

  const { data: record, isLoading } = useQuery({
    queryKey: ["record-detail", objectTypeId, recordId],
    queryFn: async () => {
      if (!objectTypeId || !recordId || !user) {
        return null;
      }

      console.log("Fetching record details:", { objectTypeId, recordId });

      // First check object type ownership to determine visibility rules
      const { data: objectType, error: objectTypeError } = await supabase
        .from("object_types")
        .select("owner_id, is_system, name, default_field_api_name")
        .eq("id", objectTypeId)
        .single();

      if (objectTypeError) {
        console.error("Error fetching object type:", objectTypeError);
        throw objectTypeError;
      }

      // Get the record
      let recordQuery = supabase
        .from("object_records")
        .select("*")
        .eq("id", recordId);
      
      // For non-system objects where user is not the owner, only show if record is owned by the user
      if (!objectType.is_system && objectType.owner_id !== user.id) {
        recordQuery = recordQuery.eq("owner_id", user.id);
      }
        
      const { data: recordData, error: recordError } = await recordQuery.single();

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
      const valuesObject: { [key: string]: string | null } = fieldValues.reduce((acc, curr) => {
        acc[curr.field_api_name] = curr.value;
        return acc;
      }, {} as { [key: string]: string | null });

      // Find display name field if exists
      let displayName = null;
      if (objectType?.default_field_api_name) {
        displayName = valuesObject[objectType.default_field_api_name] || null;
      }

      return {
        ...recordData,
        fieldValues: valuesObject,
        displayName,
        objectName: objectType?.name || 'Object'
      };
    },
    enabled: !!user && !!objectTypeId && !!recordId,
  });

  return {
    record,
    isLoading
  };
}
