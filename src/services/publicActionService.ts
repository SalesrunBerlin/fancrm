
import { supabase } from "@/integrations/supabase/client";

export interface PublicRecordFormData {
  [key: string]: string | null;
}

/**
 * Creates a new record in the database from a public action
 */
export const createPublicRecord = async (
  objectTypeId: string,
  data: PublicRecordFormData
) => {
  console.log("Creating public record with data:", data);
  
  // Create record without owner_id
  const { data: newRecord, error: recordError } = await supabase
    .from("object_records")
    .insert([{ 
      object_type_id: objectTypeId
    }])
    .select()
    .single();
  
  if (recordError) {
    console.error("Error creating public record:", recordError);
    throw recordError;
  }
  
  // Create field values
  const fieldValues = [];
  
  for (const [fieldApiName, value] of Object.entries(data)) {
    if (value !== null && value !== undefined) {
      fieldValues.push({
        record_id: newRecord.id,
        field_api_name: fieldApiName,
        value: value.toString()
      });
    }
  }
  
  if (fieldValues.length > 0) {
    const { error: valuesError } = await supabase
      .from("object_field_values")
      .insert(fieldValues);
    
    if (valuesError) {
      console.error("Error creating field values:", valuesError);
      throw valuesError;
    }
  }
  
  console.log("Successfully created public record with ID:", newRecord.id);
  return newRecord;
};
