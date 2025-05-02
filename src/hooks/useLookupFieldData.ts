
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useLookupFieldData(
  recordId: string | null | undefined,
  fieldApiName: string | null | undefined,
  options?: {
    enabled?: boolean;
  }
) {
  const { user } = useAuth();
  const [lookupData, setLookupData] = useState<Record<string, any> | null>(null);
  const enabled = options?.enabled !== false && !!user && !!recordId && !!fieldApiName;

  // Get the lookup field value (which should be another record's ID)
  const { data: lookupValue, isLoading: isLoadingLookupValue } = useQuery({
    queryKey: ["lookup-field-value", recordId, fieldApiName],
    queryFn: async () => {
      if (!recordId || !fieldApiName) return null;

      console.log(`Fetching lookup value for record ${recordId}, field ${fieldApiName}`);
      const { data, error } = await supabase
        .from("object_field_values")
        .select("value")
        .eq("record_id", recordId)
        .eq("field_api_name", fieldApiName)
        .single();

      if (error) {
        console.error("Error fetching lookup value:", error);
        return null;
      }

      console.log(`Lookup value for ${fieldApiName}:`, data?.value);
      return data?.value;
    },
    enabled
  });

  // When we have a lookup value (target record ID), fetch its field values
  const { data: fieldValues, isLoading: isLoadingFieldValues } = useQuery({
    queryKey: ["lookup-field-data", lookupValue],
    queryFn: async () => {
      if (!lookupValue) {
        return null;
      }

      console.log(`Fetching field values for lookup record ${lookupValue}`);
      const { data, error } = await supabase
        .from("object_field_values")
        .select("field_api_name, value")
        .eq("record_id", lookupValue);

      if (error) {
        console.error("Error fetching lookup field data:", error);
        return null;
      }

      // Convert to object format
      const fieldData = data.reduce((acc, field) => {
        acc[field.field_api_name] = field.value;
        return acc;
      }, {} as Record<string, any>);

      console.log(`Lookup field data loaded:`, fieldData);
      return fieldData;
    },
    enabled: enabled && !!lookupValue
  });

  // Set the lookupData state when fieldValues change
  useEffect(() => {
    if (fieldValues) {
      setLookupData(fieldValues);
    } else {
      setLookupData(null);
    }
  }, [fieldValues]);

  return {
    lookupValue,
    lookupData,
    isLoading: enabled && (isLoadingLookupValue || (!!lookupValue && isLoadingFieldValues)),
    isError: !lookupData && !!lookupValue && !isLoadingFieldValues
  };
}
