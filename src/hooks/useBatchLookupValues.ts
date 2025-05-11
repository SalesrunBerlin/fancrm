
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Global cache for lookup values
const lookupValueCache: Record<string, string> = {};

/**
 * Hook for efficiently fetching multiple lookup values in a batch
 * @param recordIds Array of record IDs to fetch lookup display values for
 * @param targetObjectTypeId The object type ID these records belong to
 */
export function useBatchLookupValues(recordIds: string[], targetObjectTypeId?: string) {
  // Filter out any empty record IDs
  const validRecordIds = recordIds.filter(Boolean);
  
  // Create a stable key for the query based on the record IDs
  const recordIdsKey = validRecordIds.sort().join(',');
  
  const { data: lookupValues, isLoading } = useQuery({
    queryKey: ["batch-lookup-values", targetObjectTypeId, recordIdsKey],
    queryFn: async () => {
      if (!validRecordIds.length || !targetObjectTypeId) return {};
      
      // Check cache first for all records
      const cachedValues: Record<string, string> = {};
      const recordsToFetch: string[] = [];
      
      validRecordIds.forEach(recordId => {
        const cacheKey = `${recordId}:${targetObjectTypeId}`;
        if (lookupValueCache[cacheKey]) {
          cachedValues[recordId] = lookupValueCache[cacheKey];
        } else {
          recordsToFetch.push(recordId);
        }
      });
      
      // If all values are cached, return immediately
      if (recordsToFetch.length === 0) {
        return cachedValues;
      }
      
      // Fetch values for records not in cache
      try {
        const { data, error } = await supabase
          .from("object_lookup_display_values")
          .select("lookup_record_id, display_value")
          .eq("target_object_type_id", targetObjectTypeId)
          .in("lookup_record_id", recordsToFetch);
          
        if (error) {
          console.error("Error batch fetching lookup values:", error);
          return cachedValues;
        }
        
        // Process results
        const fetchedValues: Record<string, string> = {};
        if (data) {
          data.forEach(item => {
            const recordId = item.lookup_record_id;
            const displayValue = item.display_value;
            
            // Update both the return object and the global cache
            fetchedValues[recordId] = displayValue;
            lookupValueCache[`${recordId}:${targetObjectTypeId}`] = displayValue;
          });
        }
        
        // Combine cached and freshly fetched values
        return { ...cachedValues, ...fetchedValues };
      } catch (err) {
        console.error("Error in batch lookup fetch:", err);
        return cachedValues;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30,   // 30 minutes
    enabled: validRecordIds.length > 0 && !!targetObjectTypeId,
  });
  
  return {
    lookupValues: lookupValues || {},
    isLoading
  };
}
