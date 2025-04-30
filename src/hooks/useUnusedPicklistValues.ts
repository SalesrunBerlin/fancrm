
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFieldPicklistValues } from "./useFieldPicklistValues";

export function useUnusedPicklistValues(objectTypeId: string | undefined, fieldId: string | undefined) {
  const [isLoading, setIsLoading] = useState(false);
  const { picklistValues } = useFieldPicklistValues(fieldId || '');

  const { data: unusedValues, refetch } = useQuery({
    queryKey: ["unused-picklist-values", objectTypeId, fieldId],
    queryFn: async (): Promise<string[]> => {
      if (!objectTypeId || !fieldId || !picklistValues) return [];
      
      setIsLoading(true);
      try {
        // Get field info to find API name
        const { data: fieldData, error: fieldError } = await supabase
          .from("object_fields")
          .select("api_name")
          .eq("id", fieldId)
          .single();
        
        if (fieldError) throw fieldError;
        if (!fieldData || !fieldData.api_name) return [];
        
        const fieldApiName = fieldData.api_name;
        
        // Get all records for this object type
        const { data: records, error: recordsError } = await supabase
          .from("object_records")
          .select(`id, object_field_values!inner(field_api_name, value)`)
          .eq("object_type_id", objectTypeId)
          .eq("object_field_values.field_api_name", fieldApiName);
        
        if (recordsError) throw recordsError;
        if (!records || records.length === 0) return [];
        
        // Extract all unique values for this field
        const existingValues = new Set(picklistValues.map(pv => pv.value.toLowerCase()));
        const allFieldValues = records
          .flatMap(record => record.object_field_values)
          .filter(fv => fv.field_api_name === fieldApiName && fv.value)
          .map(fv => String(fv.value).trim());
        
        // Find unique values not in the picklist
        const uniqueValues = Array.from(new Set(allFieldValues))
          .filter(value => value && !existingValues.has(value.toLowerCase()));
        
        return uniqueValues;
      } catch (error) {
        console.error("Error fetching unused picklist values:", error);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    enabled: !!objectTypeId && !!fieldId && !!picklistValues,
  });

  return {
    unusedValues: unusedValues || [],
    isLoading,
    refetch
  };
}
