import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { RecordFormData } from "@/types";
import { FilterCondition, ObjectRecord } from "./useObjectRecords";

export function usePaginatedObjectRecords(
  objectTypeId?: string,
  filters: FilterCondition[] = [],
  page: number = 1,
  pageSize: number = 20
) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: result,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["paginated-object-records", objectTypeId, filters, page, pageSize],
    queryFn: async (): Promise<{records: ObjectRecord[], totalCount: number}> => {
      if (!objectTypeId || !user) {
        return { records: [], totalCount: 0 };
      }
      
      console.log(`Fetching paginated records for object type: ${objectTypeId}, page: ${page}, pageSize: ${pageSize}`);
      console.log("Applying filters:", filters);
      
      // First, get the total count
      let countQuery = supabase
        .from("object_records")
        .select("id", { count: "exact" })
        .eq("object_type_id", objectTypeId);
        
      // Apply server-side filters for the count
      filters.forEach(filter => {
        if (filter.fieldApiName === 'created_at' || filter.fieldApiName === 'updated_at') {
          // Apply system field filters directly
          const dateValue = new Date(filter.value);
          if (!isNaN(dateValue.getTime())) {
            switch(filter.operator) {
              case 'before':
                countQuery = countQuery.lt(filter.fieldApiName, filter.value);
                break;
              case 'after':
                countQuery = countQuery.gt(filter.fieldApiName, filter.value);
                break;
              case 'equals':
                // For date equality, we need a range for the whole day
                const nextDay = new Date(dateValue);
                nextDay.setDate(nextDay.getDate() + 1);
                countQuery = countQuery.gte(filter.fieldApiName, filter.value)
                  .lt(filter.fieldApiName, nextDay.toISOString());
                break;
            }
          }
        }
      });
      
      const { count: totalCount, error: countError } = await countQuery;
      
      if (countError) {
        console.error("Error counting records:", countError);
        throw countError;
      }
      
      // Get paginated records
      let recordsQuery = supabase
        .from("object_records")
        .select("*")
        .eq("object_type_id", objectTypeId)
        .range((page - 1) * pageSize, page * pageSize - 1)
        .order('created_at', { ascending: false });
      
      // Apply same filters to records query
      filters.forEach(filter => {
        if (filter.fieldApiName === 'created_at' || filter.fieldApiName === 'updated_at') {
          // Apply system field filters directly
          const dateValue = new Date(filter.value);
          if (!isNaN(dateValue.getTime())) {
            switch(filter.operator) {
              case 'before':
                recordsQuery = recordsQuery.lt(filter.fieldApiName, filter.value);
                break;
              case 'after':
                recordsQuery = recordsQuery.gt(filter.fieldApiName, filter.value);
                break;
              case 'equals':
                // For date equality, we need a range for the whole day
                const nextDay = new Date(dateValue);
                nextDay.setDate(nextDay.getDate() + 1);
                recordsQuery = recordsQuery.gte(filter.fieldApiName, filter.value)
                  .lt(filter.fieldApiName, nextDay.toISOString());
                break;
            }
          }
        }
      });
      
      const { data: recordsData, error: recordsError } = await recordsQuery;
      
      if (recordsError) {
        console.error("Error fetching records:", recordsError);
        throw recordsError;
      }
      
      if (recordsData.length === 0) {
        return { records: [], totalCount: totalCount || 0 };
      }
      
      // Get field values for the fetched records only
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
      const fieldValuesByRecordId = fieldValuesData?.reduce((acc, fieldValue) => {
        if (!acc[fieldValue.record_id]) {
          acc[fieldValue.record_id] = {};
        }
        acc[fieldValue.record_id][fieldValue.field_api_name] = fieldValue.value;
        return acc;
      }, {} as { [key: string]: { [key: string]: any } }) || {};
      
      // Add field values to records
      let recordsWithFieldValues = recordsData.map(record => ({
        ...record,
        field_values: fieldValuesByRecordId[record.id] || {}
      }));
      
      // Apply client-side filtering for complex filters
      if (filters && filters.length > 0) {
        recordsWithFieldValues = recordsWithFieldValues.filter(record => {
          return filters.every(filter => {
            // Skip empty filters and system fields already handled
            if (
              (!filter.value && filter.value !== false) ||
              filter.fieldApiName === 'created_at' ||
              filter.fieldApiName === 'updated_at'
            ) {
              return true;
            }
            
            const fieldValue = record.field_values?.[filter.fieldApiName];
            const filterValue = filter.value;
            
            // Handle system field 'record_id'
            if (filter.fieldApiName === 'record_id') {
              return applyFilterOperator(filter.operator, record.record_id, filterValue);
            }
            
            // Handle regular field values
            return applyFilterOperator(filter.operator, fieldValue, filterValue);
          });
        });
      }
      
      console.log(`Fetched ${recordsWithFieldValues.length} records with field values (page ${page}, pageSize ${pageSize})`);
      return { 
        records: recordsWithFieldValues, 
        totalCount: totalCount || 0 
      };
    },
    enabled: !!objectTypeId && !!user && page > 0 && pageSize > 0,
    staleTime: 30000, // Cache data for 30 seconds
    keepPreviousData: true // Keep previous data while loading new data
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

      // Then, create the field values
      const fieldValues = Object.entries(formData).map(([key, value]) => ({
        record_id: newRecord.id,
        field_api_name: key,
        value: value === null ? null : String(value)
      }));

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
      queryClient.invalidateQueries({ queryKey: ["paginated-object-records", objectTypeId] });
      queryClient.invalidateQueries({ queryKey: ["object-records", objectTypeId] });
    }
  });

  const updateRecord = useMutation({
    mutationFn: async ({ id, field_values }: { id: string, field_values: RecordFormData }) => {
      if (!id || !user) {
        throw new Error("Missing record id or user");
      }
      
      console.log("Updating record:", id, "with data:", field_values);

      // Update the record's timestamp and ensure owner_id is set
      const { error: recordError } = await supabase
        .from("object_records")
        .update({ 
          updated_at: new Date().toISOString(),
          owner_id: user.id,
          last_modified_by: user.id
        })
        .eq("id", id);

      if (recordError) {
        console.error("Error updating record:", recordError);
        throw recordError;
      }

      // For each field value, upsert (update or insert)
      for (const [key, value] of Object.entries(field_values)) {
        const { error } = await supabase
          .from("object_field_values")
          .upsert({
            record_id: id,
            field_api_name: key,
            value: value === null ? null : String(value)
          }, {
            onConflict: 'record_id,field_api_name'
          });

        if (error) {
          console.error(`Error updating field ${key}:`, error);
          throw error;
        }
      }

      return { id, field_values };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paginated-object-records", objectTypeId] });
      queryClient.invalidateQueries({ queryKey: ["object-records", objectTypeId] });
      queryClient.invalidateQueries({ queryKey: ["record-detail", objectTypeId] });
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
      queryClient.invalidateQueries({ queryKey: ["paginated-object-records", objectTypeId] });
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
      queryClient.invalidateQueries({ queryKey: ["paginated-object-records", objectTypeId] });
      queryClient.invalidateQueries({ queryKey: ["object-records", objectTypeId] });
    }
  });

  return {
    records: result?.records || [],
    totalCount: result?.totalCount || 0,
    totalPages: result?.totalCount ? Math.ceil(result.totalCount / pageSize) : 0,
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
