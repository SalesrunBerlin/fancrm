
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
        console.log(`Finding unused picklist values for field ${fieldId} on object ${objectTypeId}`);
        
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
        console.log(`Field API name: ${fieldApiName}`);
        
        // Get all records for this object type
        const { data: records, error: recordsError } = await supabase
          .from("object_records")
          .select(`id, record_field_values!inner(field_id, value)`)
          .eq("object_type_id", objectTypeId);
        
        if (recordsError) {
          console.error("Error fetching records:", recordsError);
          throw recordsError;
        }
        
        console.log(`Found ${records?.length || 0} records for this object type`);
        
        if (!records || records.length === 0) {
          return [];
        }

        // Get field value records for the specific field
        const { data: fieldValues, error: fieldValuesError } = await supabase
          .from("record_field_values")
          .select("value")
          .eq("field_id", fieldId)
          .in("record_id", records.map(record => record.id));
        
        if (fieldValuesError) {
          console.error("Error fetching field values:", fieldValuesError);
          throw fieldValuesError;
        }
        
        console.log(`Found ${fieldValues?.length || 0} field values for this field`);

        // Extract all values from the field values
        const allValues = new Set<string>();
        
        fieldValues?.forEach(fieldValue => {
          if (fieldValue.value && typeof fieldValue.value === 'string' && fieldValue.value.trim() !== '') {
            allValues.add(fieldValue.value.trim());
          }
        });
        
        console.log(`Extracted ${allValues.size} unique values from records`);
        console.log("Values found in records:", Array.from(allValues));
        
        // If there are no existing picklist values, return all values found
        if (!picklistValues || picklistValues.length === 0) {
          console.log("No existing picklist values, returning all found values");
          return Array.from(allValues);
        }
        
        // Filter out values that already exist in the picklist
        const existingValues = new Set(picklistValues.map(pv => pv.value));
        console.log("Existing picklist values:", Array.from(existingValues));
        
        const missingValues = Array.from(allValues).filter(value => !existingValues.has(value));
        console.log(`Found ${missingValues.length} missing values:`, missingValues);
        
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
