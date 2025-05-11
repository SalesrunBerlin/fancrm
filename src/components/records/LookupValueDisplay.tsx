
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";

// Global cache for lookup values to reduce duplicate requests
const lookupValueCache: Record<string, string> = {};

interface LookupValueDisplayProps {
  value: string;
  fieldOptions: {
    target_object_type_id: string;
    display_field_api_name?: string;
  };
}

// New hook to efficiently fetch lookup display values
export function useLookupDisplayValue(value: string, targetObjectTypeId: string) {
  return useQuery({
    queryKey: ['lookup-display', value, targetObjectTypeId],
    queryFn: async () => {
      if (!value || !targetObjectTypeId) return value;
      
      // Check cache first
      const cacheKey = `${value}:${targetObjectTypeId}`;
      if (lookupValueCache[cacheKey]) {
        return lookupValueCache[cacheKey];
      }
      
      // Use the optimized view instead of joining multiple tables
      const { data, error } = await supabase
        .from("object_lookup_display_values")
        .select("display_value")
        .eq("lookup_record_id", value)
        .eq("target_object_type_id", targetObjectTypeId)
        .maybeSingle();
        
      if (error) {
        console.error("Error fetching lookup display value:", error);
        return value;
      }
      
      const displayValue = data?.display_value || value;
      
      // Update cache
      lookupValueCache[cacheKey] = displayValue;
      return displayValue;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30,   // 30 minutes
    enabled: !!value && !!targetObjectTypeId,
  });
}

export function LookupValueDisplay({ value, fieldOptions }: LookupValueDisplayProps) {
  const { target_object_type_id } = fieldOptions;
  
  const { data: displayValue, isLoading } = useLookupDisplayValue(value, target_object_type_id);
  
  if (isLoading) {
    return <Skeleton className="h-4 w-24" />;
  }
  
  return <span>{displayValue || "-"}</span>;
}
