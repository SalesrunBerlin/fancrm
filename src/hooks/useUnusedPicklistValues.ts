
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFieldPicklistValues } from "./useFieldPicklistValues";
import { toast } from "sonner";

export function useUnusedPicklistValues(objectTypeId: string, fieldId: string) {
  const { picklistValues, isLoading: loadingPicklistValues } = useFieldPicklistValues(fieldId);
  
  const {
    data: unusedValues,
    isLoading,
    refetch,
    isError,
    error
  } = useQuery({
    queryKey: ["unused-picklist-values", objectTypeId, fieldId],
    queryFn: async (): Promise<string[]> => {
      try {
        // First, get the field details to find its api_name
        const { data: fieldData, error: fieldError } = await supabase
          .from("object_fields")
          .select("api_name")
          .eq("id", fieldId)
          .single();
        
        if (fieldError) {
          console.error("Error fetching field data:", fieldError);
          throw fieldError;
        }
        
        const fieldApiName = fieldData.api_name;
        
        // Get all records for this object type
        const { data: records, error: recordsError } = await supabase
          .from("object_records")
          .select(`id, record_field_values!inner(field_id, value)`)
          .eq("object_type_id", objectTypeId)
          .eq("record_field_values.field_id", fieldId);
        
        if (recordsError) {
          console.error("Error fetching records:", recordsError);
          throw recordsError;
        }
        
        if (!records || records.length === 0) {
          return [];
        }

        // Extract all values from records
        const allValues = new Set<string>();
        
        records.forEach(record => {
          if (record.record_field_values && record.record_field_values.length > 0) {
            record.record_field_values.forEach((fieldValue: any) => {
              if (fieldValue.value && typeof fieldValue.value === 'string' && fieldValue.value.trim() !== '') {
                allValues.add(fieldValue.value.trim());
              }
            });
          }
        });
        
        // If there are no existing picklist values, return all values found
        if (!picklistValues || picklistValues.length === 0) {
          return Array.from(allValues);
        }
        
        // Filter out values that already exist in the picklist
        const existingValues = new Set(picklistValues.map(pv => pv.value));
        const missingValues = Array.from(allValues).filter(value => !existingValues.has(value));
        
        return missingValues;
      } catch (error) {
        console.error("Error in useUnusedPicklistValues:", error);
        throw error;
      }
    },
    enabled: !!objectTypeId && !!fieldId && !loadingPicklistValues,
  });

  return {
    unusedValues: unusedValues || [],
    isLoading,
    refetch,
    isError,
    error
  };
}
