
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useLookupFieldData(
  recordId: string | null | undefined,
  fieldApiName: string | null | undefined
) {
  const { user } = useAuth();
  const [lookupData, setLookupData] = useState<Record<string, any> | null>(null);

  // Get the lookup field value (which should be another record's ID)
  const { data: lookupValue } = useQuery({
    queryKey: ["lookup-field-value", recordId, fieldApiName],
    queryFn: async () => {
      if (!recordId || !fieldApiName) return null;

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

      return data?.value;
    },
    enabled: !!user && !!recordId && !!fieldApiName
  });

  // When we have a lookup value (target record ID), fetch its field values
  useEffect(() => {
    const fetchLookupData = async () => {
      if (!lookupValue) {
        setLookupData(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("object_field_values")
          .select("field_api_name, value")
          .eq("record_id", lookupValue);

        if (error) {
          console.error("Error fetching lookup field data:", error);
          setLookupData(null);
          return;
        }

        // Convert to object format
        const fieldData = data.reduce((acc, field) => {
          acc[field.field_api_name] = field.value;
          return acc;
        }, {} as Record<string, any>);

        setLookupData(fieldData);
      } catch (err) {
        console.error("Error in lookup data fetch:", err);
        setLookupData(null);
      }
    };

    fetchLookupData();
  }, [lookupValue]);

  return {
    lookupValue,
    lookupData,
    isLoading: lookupValue && !lookupData
  };
}
