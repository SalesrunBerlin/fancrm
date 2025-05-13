
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { RecordFormData } from "@/types";

export interface FilterCondition {
  id: string;
  fieldApiName: string;
  operator: string;
  value: any;
}

export interface ObjectRecord {
  id: string;
  record_id: string | null;
  object_type_id: string;
  created_at: string;
  updated_at: string;
  owner_id: string | null;
  created_by: string | null;
  last_modified_by: string | null;
  field_values?: { [key: string]: any };
  displayName?: string;
}

export function useObjectRecords(
  objectTypeId?: string,
  filters: FilterCondition[] = []
) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: records,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["object-records", objectTypeId, filters],
    queryFn: async (): Promise<ObjectRecord[]> => {
      if (!objectTypeId || !user) {
        return [];
      }
      
      console.log(`Fetching records for object type: ${objectTypeId}`);
      console.log("Applying filters:", filters);
      
      // Get records
      let query = supabase
        .from("object_records")
        .select("*")
        .eq("object_type_id", objectTypeId)
        .limit(100);
      
      // Apply server-side filters if possible
      // Note: For most filter types, we'll use client-side filtering
      // because Supabase doesn't support complex filtering on field_values easily
      
      const { data: recordsData, error: recordsError } = await query;
      
      if (recordsError) {
        console.error("Error fetching records:", recordsError);
        throw recordsError;
      }
      
      if (recordsData.length === 0) {
        return [];
      }
      
      // Get field values for all records
      const recordIds = recordsData.map(record => record.id);
      
      const { data: fieldValuesData, error: fieldValuesError } = await supabase
        .from("object_field_values")
        .select("*")
        .in("record_id", recordIds);
      
      if (fieldValuesError) {
        console.error("Error fetching field values:", fieldValuesError);
        throw fieldValuesError;
      }

      // Group field values by record id
      const fieldValuesByRecordId = fieldValuesData.reduce((acc, fieldValue) => {
        if (!acc[fieldValue.record_id]) {
          acc[fieldValue.record_id] = {};
        }
        acc[fieldValue.record_id][fieldValue.field_api_name] = fieldValue.value;
        return acc;
      }, {} as { [key: string]: { [key: string]: any } });
      
      // Add field values to records
      let recordsWithFieldValues = recordsData.map(record => ({
        ...record,
        field_values: fieldValuesByRecordId[record.id] || {}
      }));
      
      // Apply client-side filtering
      if (filters && filters.length > 0) {
        recordsWithFieldValues = recordsWithFieldValues.filter(record => {
          return filters.every(filter => {
            // Skip empty filters
            if (!filter.value && filter.value !== false) {
              return true;
            }
            
            const fieldValue = record.field_values?.[filter.fieldApiName];
            const filterValue = filter.value;
            
            // Handle system fields
            if (filter.fieldApiName === 'created_at' || filter.fieldApiName === 'updated_at') {
              const dateValue = record[filter.fieldApiName];
              return applyFilterOperator(filter.operator, dateValue, filterValue);
            } else if (filter.fieldApiName === 'record_id') {
              return applyFilterOperator(filter.operator, record.record_id, filterValue);
            }
            
            // Handle regular field values
            return applyFilterOperator(filter.operator, fieldValue, filterValue);
          });
        });
      }
      
      console.log(`Fetched ${recordsWithFieldValues.length} records with field values`);
      return recordsWithFieldValues;
    },
    enabled: !!objectTypeId && !!user,
  });

  const createRecord = useMutation({
    mutationFn: async (formData: RecordFormData) => {
      if (!objectTypeId || !user) {
        throw new Error("Missing objectTypeId or user");
      }
      
      console.log("Creating record with data:", formData);

      // First, create the record with owner_id
      const { data: newRecord, error: recordError } = await supabase
        .from("object_records")
        .insert([{ 
          object_type_id: objectTypeId,
          owner_id: user.id // Add owner_id to comply with RLS policies
        }])
        .select()
        .single();

      if (recordError) {
        console.error("Error creating record:", recordError);
        throw recordError;
      }

      console.log("Created record:", newRecord);

      // Process field values - filter out undefined and null values
      const fieldValues = Object.entries(formData)
        .filter(([_, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => {
          // Only convert to string if it's not already a string
          // Some field types (like numbers, booleans) need their original type preserved
          return {
            record_id: newRecord.id,
            field_api_name: key,
            value: value === null ? null : String(value)
          };
        });
      
      console.log("Field values to insert:", fieldValues);

      if (fieldValues.length > 0) {
        const { error: fieldValuesError } = await supabase
          .from("object_field_values")
          .insert(fieldValues);

        if (fieldValuesError) {
          console.error("Error creating field values:", fieldValuesError);
          throw fieldValuesError;
        }
      }

      return newRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["object-records", objectTypeId] });
    }
  });

  const cloneRecord = useMutation({
    mutationFn: async (recordId: string) => {
      if (!objectTypeId || !user) {
        throw new Error("Missing objectTypeId or user");
      }
      
      console.log("Cloning record:", recordId);
      
      // First, get the record to clone
      const { data: recordData } = await supabase
        .from("object_records")
        .select("*")
        .eq("id", recordId)
        .single();
        
      if (!recordData) {
        throw new Error("Record not found");
      }
      
      // Get field values for the record
      const { data: fieldValues, error: fieldValuesError } = await supabase
        .from("object_field_values")
        .select("*")
        .eq("record_id", recordId);
        
      if (fieldValuesError) {
        console.error("Error fetching field values:", fieldValuesError);
        throw fieldValuesError;
      }
      
      // Create new record
      const { data: newRecord, error: recordError } = await supabase
        .from("object_records")
        .insert([{ 
          object_type_id: objectTypeId,
          owner_id: user.id
        }])
        .select()
        .single();
        
      if (recordError) {
        console.error("Error creating cloned record:", recordError);
        throw recordError;
      }
      
      // Create modified field values for the new record
      // Handle the name field specially to append "_copy"
      const nameFields = ["name", "title", "subject", "display_name"];
      const newFieldValues = fieldValues.map(fv => {
        let value = fv.value;
        
        // Add "_copy" suffix to name fields
        if (fv.value && nameFields.includes(fv.field_api_name.toLowerCase())) {
          value = `${fv.value}_copy`;
        }
        
        return {
          record_id: newRecord.id,
          field_api_name: fv.field_api_name,
          value
        };
      });
      
      // Insert the new field values
      if (newFieldValues.length > 0) {
        const { error: insertError } = await supabase
          .from("object_field_values")
          .insert(newFieldValues);
          
        if (insertError) {
          console.error("Error creating cloned field values:", insertError);
          throw insertError;
        }
      }
      
      return newRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["object-records", objectTypeId] });
    }
  });

  const updateRecord = useMutation({
    mutationFn: async ({ id, field_values }: { id: string, field_values: RecordFormData }) => {
      if (!id || !user) {
        throw new Error("Missing record id or user");
      }
      
      console.log("Updating record:", id, "with data:", field_values);

      try {
        // Update the record's timestamp and ensure owner_id is set
        // Add .select().single() to get feedback and potentially raise errors
        const { data: recordData, error: recordError } = await supabase
          .from("object_records")
          .update({ 
            updated_at: new Date().toISOString(),
            owner_id: user.id, // Set owner_id to current user to comply with RLS policies
            last_modified_by: user.id
          })
          .eq("id", id)
          .select()
          .single();

        if (recordError) {
          console.error("Error updating record timestamp:", recordError);
          throw recordError;
        }

        console.log("Successfully updated record metadata:", recordData);

        // Process field values - handle different data types correctly
        const processFieldValue = (key: string, value: any) => {
          // Skip undefined values, but properly handle null, empty string, 0, and false
          if (value === undefined) return null;
          
          // Handle different data types
          if (typeof value === 'boolean') {
            return String(value); // Convert boolean to "true" or "false"
          } else if (value instanceof Date) {
            return value.toISOString();
          } else if (typeof value === 'number') {
            return String(value); // Convert number to string
          } else if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value);
          }
          
          // Return string values as is, or convert null to empty string
          return value === null ? null : String(value);
        };

        // Track update success for each field
        const fieldUpdateResults = [];

        // For each field value, upsert (update or insert)
        for (const [key, value] of Object.entries(field_values)) {
          console.log(`Processing field ${key} with value:`, value);
          
          const processedValue = processFieldValue(key, value);
          
          console.log(`Processed value for ${key}:`, processedValue);
          
          // Using explicit table aliasing to avoid ambiguous column references
          // Add .select() to get feedback on the operation
          const { data: fieldData, error } = await supabase
            .from("object_field_values")
            .upsert({
              record_id: id,
              field_api_name: key,
              value: processedValue
            }, {
              onConflict: 'record_id,field_api_name'
            })
            .select();

          if (error) {
            console.error(`Error updating field ${key}:`, error);
            throw error;
          }

          fieldUpdateResults.push({ key, fieldData, success: true });
          console.log(`Successfully updated field ${key}:`, fieldData);
        }

        console.log("All field updates completed successfully:", fieldUpdateResults);
        return { id, field_values, fieldUpdateResults };
      } catch (error) {
        console.error("Update record error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Invalidating queries after successful update:", data);
      queryClient.invalidateQueries({ queryKey: ["object-records", objectTypeId] });
      queryClient.invalidateQueries({ queryKey: ["record-detail", objectTypeId] });
    },
    onError: (error) => {
      console.error("Error occurred during record update:", error);
    }
  });

  const deleteRecord = useMutation({
    mutationFn: async (id: string) => {
      if (!id || !user) {
        throw new Error("Missing record id or user");
      }
      
      console.log("Deleting record:", id);

      // First delete all field values
      const { error: fieldValuesError } = await supabase
        .from("object_field_values")
        .delete()
        .eq("record_id", id);

      if (fieldValuesError) {
        console.error("Error deleting field values:", fieldValuesError);
        throw fieldValuesError;
      }

      // Then delete the record
      const { error: recordError } = await supabase
        .from("object_records")
        .delete()
        .eq("id", id);

      if (recordError) {
        console.error("Error deleting record:", recordError);
        throw recordError;
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["object-records", objectTypeId] });
    }
  });

  return {
    records,
    isLoading,
    error,
    refetch,
    createRecord,
    updateRecord,
    deleteRecord,
    cloneRecord
  };
}

// Helper function to apply filter operators
function applyFilterOperator(operator: string, fieldValue: any, filterValue: any): boolean {
  if (fieldValue === undefined || fieldValue === null) {
    // If searching for empty values
    if (filterValue === "" || filterValue === null) {
      return ["equals", "is"].includes(operator);
    }
    return false;
  }

  // Convert both values to strings for text comparisons
  const fieldStr = String(fieldValue).toLowerCase();
  const filterStr = String(filterValue).toLowerCase();

  switch (operator) {
    case "equals":
    case "is":
      return fieldStr === filterStr;
    
    case "notEqual":
    case "isNot":
      return fieldStr !== filterStr;
      
    case "contains":
      return fieldStr.includes(filterStr);
      
    case "startsWith":
      return fieldStr.startsWith(filterStr);
      
    case "greaterThan":
      return Number(fieldValue) > Number(filterValue);
      
    case "lessThan":
      return Number(fieldValue) < Number(filterValue);
      
    case "before":
      return new Date(fieldValue) < new Date(filterValue);
      
    case "after":
      return new Date(fieldValue) > new Date(filterValue);
      
    default:
      return false;
  }
}
