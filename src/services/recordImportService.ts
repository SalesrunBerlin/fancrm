
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User } from "@supabase/supabase-js";

export interface RecordFormData {
  [key: string]: string | null;
}

/**
 * Creates a new record in the database
 */
export const createRecord = async (
  objectTypeId: string,
  data: RecordFormData,
  user: User | null
) => {
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  console.log("Creating record with data:", data);
  
  // Create record with owner_id set to current user
  const { data: newRecord, error: recordError } = await supabase
    .from("object_records")
    .insert([{ 
      object_type_id: objectTypeId,
      owner_id: user.id, 
      created_by: user.id,
      last_modified_by: user.id
    }])
    .select()
    .single();
  
  if (recordError) {
    console.error("Error creating record:", recordError);
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
  
  console.log("Successfully created record with ID:", newRecord.id);
  return newRecord;
};

/**
 * Updates an existing record in the database
 */
export const updateRecord = async (
  id: string, 
  data: RecordFormData,
  user: User | null
) => {
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  console.log("Updating record:", id, "with data:", data);

  // Update the record to set last_modified_by and ensure owner_id is set
  const { error: recordError } = await supabase
    .from("object_records")
    .update({ 
      updated_at: new Date().toISOString(),
      owner_id: user.id, // Set owner_id to current user to comply with RLS policies
      last_modified_by: user.id
    })
    .eq("id", id);
  
  if (recordError) {
    console.error("Error updating record:", recordError);
    throw recordError;
  }
  
  // Delete existing values
  const { error: deleteError } = await supabase
    .from("object_field_values")
    .delete()
    .eq("record_id", id);
  
  if (deleteError) {
    console.error("Error deleting field values:", deleteError);
    throw deleteError;
  }
  
  // Insert new values
  const fieldValues = [];
  
  for (const [fieldApiName, value] of Object.entries(data)) {
    if (value !== null && value !== undefined) {
      fieldValues.push({
        record_id: id,
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
  
  return { id };
};

/**
 * Processes multiple records import (create or update)
 */
export const importRecords = async (
  objectTypeId: string,
  importData: { headers: string[], rows: string[][] },
  columnMappings: any[],
  selectedRows: number[],
  duplicates: any[],
  user: User | null
): Promise<{success: number, failures: number}> => {
  if (!user) {
    toast.error("You must be logged in to import records");
    return { success: 0, failures: 0 };
  }
  
  let successCount = 0;
  let failureCount = 0;
  
  try {
    const selectedRowData = importData.rows.filter((_, idx) => selectedRows.includes(idx));
    
    console.log(`Starting import of ${selectedRowData.length} records as user ${user.id}`);
    
    // Process duplicates first based on their action
    const processedRowIndices = new Set<number>();
    
    for (const duplicate of duplicates) {
      if (!selectedRows.includes(duplicate.importRowIndex)) continue;
      
      processedRowIndices.add(duplicate.importRowIndex);
      
      try {
        if (duplicate.action === 'skip') {
          // Skip this record
          console.log(`Skipping duplicate at row ${duplicate.importRowIndex}`);
          continue;
        } else if (duplicate.action === 'update') {
          // Update existing record
          console.log(`Updating record ${duplicate.existingRecord.id} at row ${duplicate.importRowIndex}`);
          await updateRecord(duplicate.existingRecord.id, duplicate.record, user);
          successCount++;
        } else if (duplicate.action === 'create') {
          // Create new record
          console.log(`Creating new record for duplicate at row ${duplicate.importRowIndex}`);
          await createRecord(objectTypeId, duplicate.record, user);
          successCount++;
        }
      } catch (error) {
        console.error(`Error processing duplicate at row ${duplicate.importRowIndex}:`, error);
        failureCount++;
      }
    }
    
    // Process remaining rows
    for (let i = 0; i < selectedRowData.length; i++) {
      const rowIndex = selectedRows[i];
      
      // Skip already processed rows (duplicates)
      if (processedRowIndices.has(rowIndex)) continue;
      
      const row = importData.rows[rowIndex];
      const record: Record<string, string> = {};
      
      // Map columns to field values
      for (const mapping of columnMappings) {
        if (mapping.targetField) {
          record[mapping.targetField.api_name] = row[mapping.sourceColumnIndex] || '';
        }
      }
      
      try {
        console.log(`Creating record for row ${rowIndex}`);
        await createRecord(objectTypeId, record, user);
        successCount++;
      } catch (error) {
        console.error(`Error importing row ${rowIndex}:`, error);
        failureCount++;
      }
    }
    
    toast.success(`Successfully imported ${successCount} records (${failureCount} failed)`);
    
    return { success: successCount, failures: failureCount };
  } catch (error) {
    console.error("Error during import:", error);
    toast.error("Failed to complete import");
    return { success: successCount, failures: failureCount };
  }
};
