
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { trackActivity } from "@/services/ActivityTrackingService";
import { FilterCondition, ObjectRecord, SavedFilter } from "@/types/FilterCondition";
import { useCallback } from "react";

interface RecordData {
  field_values: { [key: string]: any };
  id?: string;
}

export function useObjectRecords(objectTypeId: string | undefined, filters: FilterCondition[] = []) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Build query based on filters
  const buildFilteredQuery = useCallback((baseQuery: any) => {
    let query = baseQuery;
    
    if (filters.length > 0) {
      // Group filters by logical operator
      const andFilters = filters.filter(f => !f.logicalOperator || f.logicalOperator === 'AND');
      const orFilters = filters.filter(f => f.logicalOperator === 'OR');
      
      // Apply AND filters first
      andFilters.forEach(filter => {
        // Apply different operators based on filter type
        switch (filter.operator) {
          case 'equals':
            query = query.eq(`field_values.${filter.fieldApiName}.value`, filter.value);
            break;
          case 'not_equals':
            query = query.neq(`field_values.${filter.fieldApiName}.value`, filter.value);
            break;
          case 'contains':
            query = query.ilike(`field_values.${filter.fieldApiName}.value`, `%${filter.value}%`);
            break;
          case 'starts_with':
            query = query.ilike(`field_values.${filter.fieldApiName}.value`, `${filter.value}%`);
            break;
          case 'ends_with':
            query = query.ilike(`field_values.${filter.fieldApiName}.value`, `%${filter.value}`);
            break;
          case 'greater_than':
            query = query.gt(`field_values.${filter.fieldApiName}.value`, filter.value);
            break;
          case 'less_than':
            query = query.lt(`field_values.${filter.fieldApiName}.value`, filter.value);
            break;
          default:
            // Default to equals if operator is not recognized
            query = query.eq(`field_values.${filter.fieldApiName}.value`, filter.value);
        }
      });
      
      // Apply OR filters with or() function
      if (orFilters.length > 0) {
        const orConditions = orFilters.map(filter => {
          switch (filter.operator) {
            case 'equals':
              return { [`field_values.${filter.fieldApiName}.value`]: filter.value };
            case 'not_equals':
              return { [`field_values.${filter.fieldApiName}.value`]: { $ne: filter.value } };
            case 'contains':
              return { [`field_values.${filter.fieldApiName}.value`]: { $ilike: `%${filter.value}%` } };
            case 'starts_with':
              return { [`field_values.${filter.fieldApiName}.value`]: { $ilike: `${filter.value}%` } };
            case 'ends_with':
              return { [`field_values.${filter.fieldApiName}.value`]: { $ilike: `%${filter.value}` } };
            case 'greater_than':
              return { [`field_values.${filter.fieldApiName}.value`]: { $gt: filter.value } };
            case 'less_than':
              return { [`field_values.${filter.fieldApiName}.value`]: { $lt: filter.value } };
            default:
              return { [`field_values.${filter.fieldApiName}.value`]: filter.value };
          }
        });
        
        query = query.or(orConditions.map(c => JSON.stringify(c)).join(','));
      }
    }
    
    return query;
  }, [filters]);

  // Get all records for an object type
  const {
    data: records,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["object-records", objectTypeId, filters],
    queryFn: async () => {
      if (!objectTypeId) return [];

      let query = supabase
        .from("object_records")
        .select("*, field_values:object_field_values(field_api_name, value)")
        .eq("object_type_id", objectTypeId);
      
      // Apply filters if any
      query = buildFilteredQuery(query);

      const { data, error } = await query;

      if (error) throw error;

      // Track viewing of records if authenticated
      if (user) {
        trackActivity(
          user.id,
          'view_page',
          'Viewed records list',
          'object_type',
          objectTypeId
        );
      }

      return data.map(record => {
        const fieldValues = {};
        record.field_values?.forEach(fv => {
          fieldValues[fv.field_api_name] = fv.value;
        });
        return {
          ...record,
          fieldValues
        };
      });
    },
    enabled: !!objectTypeId
  });

  // Create a new record
  const createRecord = useMutation({
    mutationFn: async (data: RecordData) => {
      if (!objectTypeId) throw new Error("No object type ID provided");

      // Create record in object_records table
      const { data: recordData, error: recordError } = await supabase
        .from("object_records")
        .insert({
          object_type_id: objectTypeId,
          owner_id: user?.id
        })
        .select()
        .single();

      if (recordError) throw recordError;

      // Insert field values
      const fieldValuePromises = Object.entries(data.field_values).map(([key, value]) => {
        return supabase
          .from("object_field_values")
          .insert({
            record_id: recordData.id,
            field_api_name: key,
            value: value?.toString()
          });
      });

      await Promise.all(fieldValuePromises);

      // Track record creation
      if (user) {
        trackActivity(
          user.id,
          'record_create',
          'Created record',
          'object_type',
          objectTypeId,
          { record_id: recordData.id }
        );
      }

      return recordData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["object-records", objectTypeId] });
      toast.success("Record created successfully");
    },
    onError: (error) => {
      console.error("Error creating record:", error);
      toast.error("Failed to create record");
    }
  });

  // Update an existing record
  const updateRecord = useMutation({
    mutationFn: async (data: RecordData) => {
      if (!objectTypeId || !data.id) throw new Error("No object type ID or record ID provided");

      // Update record in object_records table to update the timestamp
      await supabase
        .from("object_records")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", data.id);

      // Update field values
      const fieldValuePromises = Object.entries(data.field_values).map(([key, value]) => {
        return supabase
          .from("object_field_values")
          .upsert({
            record_id: data.id,
            field_api_name: key,
            value: value?.toString()
          }, { 
            onConflict: 'record_id,field_api_name' 
          });
      });

      await Promise.all(fieldValuePromises);

      // Track record update
      if (user) {
        trackActivity(
          user.id,
          'record_update',
          'Updated record',
          'object_type',
          objectTypeId,
          { record_id: data.id }
        );
      }

      return { id: data.id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["object-records", objectTypeId] });
      toast.success("Record updated successfully");
    },
    onError: (error) => {
      console.error("Error updating record:", error);
      toast.error("Failed to update record");
    }
  });

  // Delete a record
  const deleteRecord = useMutation({
    mutationFn: async (recordId: string) => {
      if (!recordId) throw new Error("No record ID provided");
      
      // Delete record in object_records table
      const { error } = await supabase
        .from("object_records")
        .delete()
        .eq("id", recordId);

      if (error) throw error;

      // Track record deletion
      if (user) {
        trackActivity(
          user.id,
          'record_delete',
          'Deleted record',
          'object_type',
          objectTypeId,
          { record_id: recordId }
        );
      }

      return { id: recordId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["object-records", objectTypeId] });
      toast.success("Record deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting record:", error);
      toast.error("Failed to delete record");
    }
  });

  // Clone a record
  const cloneRecord = useMutation({
    mutationFn: async (recordId: string) => {
      if (!recordId || !objectTypeId) throw new Error("Missing recordId or objectTypeId");
      
      // Get the original record data
      const { data: originalRecord, error: fetchError } = await supabase
        .from("object_records")
        .select("*")
        .eq("id", recordId)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Get the original field values
      const { data: fieldValues, error: fieldValuesError } = await supabase
        .from("object_field_values")
        .select("field_api_name, value")
        .eq("record_id", recordId);
        
      if (fieldValuesError) throw fieldValuesError;
      
      // Create the new record
      const { data: newRecord, error: createError } = await supabase
        .from("object_records")
        .insert({
          object_type_id: objectTypeId,
          owner_id: user?.id
        })
        .select()
        .single();
        
      if (createError) throw createError;
      
      // Helper function to append "copy" to name fields
      const appendCopyToValue = (fieldName: string, value: string) => {
        if (fieldName === 'name' || fieldName.endsWith('_name') || fieldName.includes('name')) {
          return `${value}_copy`;
        }
        return value;
      };
      
      // Insert the cloned field values with modification for name fields
      if (fieldValues && fieldValues.length > 0) {
        const fieldValueInserts = fieldValues.map(fv => ({
          record_id: newRecord.id,
          field_api_name: fv.field_api_name,
          value: appendCopyToValue(fv.field_api_name, fv.value)
        }));
        
        const { error: insertError } = await supabase
          .from("object_field_values")
          .insert(fieldValueInserts);
          
        if (insertError) throw insertError;
      }
      
      // Track the cloning
      if (user) {
        trackActivity(
          user.id,
          'record_create',
          'Cloned record',
          'object_type',
          objectTypeId,
          { 
            original_record_id: recordId,
            new_record_id: newRecord.id 
          }
        );
      }
      
      return newRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["object-records", objectTypeId] });
      toast.success("Record cloned successfully");
    },
    onError: (error) => {
      console.error("Error cloning record:", error);
      toast.error("Failed to clone record");
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

// Re-export types for components that need them
export type { FilterCondition, ObjectRecord, SavedFilter };
