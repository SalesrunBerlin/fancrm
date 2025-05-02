
import { useQuery, useQueries } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to efficiently load multiple lookup field values in a single batch
 * 
 * @param lookupFieldValues A mapping of field names to record IDs
 * @returns Object containing the loaded lookup data and loading state
 */
export function useLookupBatchLoader(lookupFieldValues: Record<string, string> = {}) {
  const [combinedData, setCombinedData] = useState<Record<string, Record<string, any>>>({});
  const recordIds = Object.values(lookupFieldValues).filter(Boolean);

  // Turn the object into an array for useQueries
  const lookupQueries = Object.entries(lookupFieldValues)
    .filter(([_, recordId]) => !!recordId)
    .map(([fieldName, recordId]) => {
      return {
        queryKey: ["lookup-batch-data", recordId, fieldName],
        queryFn: async () => {
          console.log(`Batch loading lookup data for field ${fieldName}, record ${recordId}`);
          const { data, error } = await supabase
            .from("object_field_values")
            .select("field_api_name, value")
            .eq("record_id", recordId);

          if (error) {
            console.error(`Error loading lookup data for ${fieldName}:`, error);
            return { fieldName, data: null, error };
          }

          // Convert array of objects to single object with field_api_name as keys
          const formattedData = data.reduce((acc, item) => {
            acc[item.field_api_name] = item.value;
            return acc;
          }, {} as Record<string, any>);

          console.log(`Loaded lookup data for ${fieldName}:`, formattedData);
          return { fieldName, data: formattedData, error: null };
        },
        enabled: !!recordId
      };
    });

  // Execute all queries in parallel
  const results = useQueries({ queries: lookupQueries });

  useEffect(() => {
    // Combine all the results into a single object
    const newData: Record<string, Record<string, any>> = {};
    
    results.forEach(result => {
      if (result.data && result.data.fieldName && result.data.data) {
        newData[result.data.fieldName] = result.data.data;
      }
    });
    
    if (Object.keys(newData).length > 0) {
      console.log("Combined lookup data:", newData);
      setCombinedData(newData);
    }
  }, [results]);

  const isLoading = results.some(r => r.isLoading);
  const isError = results.some(r => r.isError);

  return {
    lookupData: combinedData,
    isLoading,
    isError,
    // Individual results for more granular access
    results
  };
}
