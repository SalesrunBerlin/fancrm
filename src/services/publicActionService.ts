
import { supabase } from "@/integrations/supabase/client";

export const createPublicRecord = async (objectTypeId: string, formData: Record<string, any>) => {
  try {
    // Create the record
    const { data: record, error: recordError } = await supabase
      .from("object_records")
      .insert({
        object_type_id: objectTypeId,
        is_public_submission: true, // Mark as public submission
      })
      .select()
      .single();
    
    if (recordError) throw recordError;
    
    // Create the field values
    const fieldValues = Object.entries(formData).map(([api_name, value]) => ({
      record_id: record.id,
      field_api_name: api_name,
      value: value === undefined || value === null ? null : String(value),
    }));
    
    const { error: valuesError } = await supabase
      .from("object_field_values")
      .insert(fieldValues);
    
    if (valuesError) throw valuesError;
    
    return record;
  } catch (error) {
    console.error("Error creating public record:", error);
    throw error;
  }
};
