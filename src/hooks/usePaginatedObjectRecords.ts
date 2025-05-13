
import { useCallback, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PostgrestFilterBuilder } from "@supabase/postgrest-js";
import { toast } from "sonner";
import { FilterCondition, generateFilterQuery } from "./useObjectRecords";
import { v4 as uuidv4 } from "uuid";
import { RecordUpdateData } from "@/lib/types/records";

interface PaginationOptions {
  page: number;
  pageSize: number;
}

export const usePaginatedObjectRecords = (
  objectTypeId?: string, 
  filters: FilterCondition[] = [], 
  currentPage = 1, 
  pageSize = 10
) => {
  const queryClient = useQueryClient();
  const [totalCount, setTotalCount] = useState<number>(0);
  const [error, setError] = useState<Error | null>(null);

  // Calculate total pages based on item count and page size
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  
  // Key function for consistent cache keys
  const getQueryKey = useCallback((objectId?: string) => 
    ['paginatedObjectRecords', objectId, JSON.stringify(filters), currentPage, pageSize], 
    [filters, currentPage, pageSize]
  );

  const fetchRecords = useCallback(async () => {
    if (!objectTypeId) return [];
    
    try {
      // First query: get total count
      const countQuery = supabase
        .from('object_records')
        .select('id', { count: 'exact' })
        .eq('object_type_id', objectTypeId);
      
      // Apply filters to count query
      const filteredCountQuery = generateFilterQuery(countQuery, filters);
      const { count, error: countError } = await filteredCountQuery;
      
      if (countError) throw new Error(countError.message);
      if (count !== null) setTotalCount(count);
      
      // Second query: get paginated data with field values
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      
      let query = supabase
        .from('object_records')
        .select(`
          id, 
          record_id,
          object_type_id,
          created_at,
          updated_at,
          owner_id,
          created_by,
          last_modified_by
        `)
        .eq('object_type_id', objectTypeId)
        .range(from, to)
        .order('created_at', { ascending: false });
      
      // Apply filters
      const filteredQuery = generateFilterQuery(query, filters);
      const { data: records, error: recordsError } = await filteredQuery;
      
      if (recordsError) throw new Error(recordsError.message);
      
      if (!records) return [];
      
      // Get field values for all fetched records in a single query
      const recordIds = records.map(r => r.id);
      if (recordIds.length === 0) return [];
      
      const { data: fieldValues, error: fieldValuesError } = await supabase
        .from('object_field_values')
        .select('record_id, field_api_name, value')
        .in('record_id', recordIds);
      
      if (fieldValuesError) throw new Error(fieldValuesError.message);
      
      // Organize field values by record
      const fieldValuesByRecord: Record<string, Record<string, any>> = {};
      
      fieldValues?.forEach(fv => {
        if (!fieldValuesByRecord[fv.record_id]) {
          fieldValuesByRecord[fv.record_id] = {};
        }
        fieldValuesByRecord[fv.record_id][fv.field_api_name] = fv.value;
      });
      
      // Combine records with their field values
      return records.map(record => ({
        ...record,
        field_values: fieldValuesByRecord[record.id] || {}
      }));
    } catch (err) {
      console.error('Error fetching paginated records:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch records'));
      return [];
    }
  }, [objectTypeId, filters, currentPage, pageSize]);
  
  const { data: records = [], isLoading, refetch } = useQuery({
    queryKey: getQueryKey(objectTypeId),
    queryFn: fetchRecords,
    enabled: !!objectTypeId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Clone record mutation
  const cloneRecord = useMutation({
    mutationFn: async (recordId: string) => {
      if (!objectTypeId) throw new Error("Object type ID is required");
      
      // 1. Get the record to clone
      const { data: record, error: recordError } = await supabase
        .from('object_records')
        .select(`
          id, 
          object_type_id
        `)
        .eq('id', recordId)
        .single();
        
      if (recordError) throw new Error(recordError.message);
      if (!record) throw new Error("Record not found");
      
      // 2. Get field values for the record
      const { data: fieldValues, error: fieldValuesError } = await supabase
        .from('object_field_values')
        .select('field_api_name, value')
        .eq('record_id', recordId);
        
      if (fieldValuesError) throw new Error(fieldValuesError.message);
      
      // 3. Create new record
      const newRecordId = uuidv4();
      const { data: newRecord, error: newRecordError } = await supabase
        .from('object_records')
        .insert([
          { 
            id: newRecordId,
            object_type_id: record.object_type_id
          }
        ])
        .select('id')
        .single();
        
      if (newRecordError) throw new Error(newRecordError.message);
      
      // 4. Clone field values
      if (fieldValues && fieldValues.length > 0) {
        // Append "_copy" to name field
        const fieldValuesCopy = fieldValues.map(fv => {
          if (fv.field_api_name === 'name' && typeof fv.value === 'string') {
            return { ...fv, value: `${fv.value}_copy` };
          }
          return fv;
        });
        
        const fieldValuesInsert = fieldValuesCopy.map(fv => ({
          record_id: newRecordId,
          field_api_name: fv.field_api_name,
          value: fv.value
        }));
        
        const { error: insertError } = await supabase
          .from('object_field_values')
          .insert(fieldValuesInsert);
          
        if (insertError) throw new Error(insertError.message);
      }
      
      return newRecordId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paginatedObjectRecords', objectTypeId] });
    }
  });

  // Delete record mutation
  const deleteRecord = useMutation({
    mutationFn: async (recordId: string) => {
      // Delete field values first (due to foreign key constraints)
      const { error: fieldValuesError } = await supabase
        .from('object_field_values')
        .delete()
        .eq('record_id', recordId);
      
      if (fieldValuesError) throw new Error(fieldValuesError.message);
      
      // Then delete the record
      const { error: recordError } = await supabase
        .from('object_records')
        .delete()
        .eq('id', recordId);
      
      if (recordError) throw new Error(recordError.message);
      
      return recordId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paginatedObjectRecords', objectTypeId] });
    }
  });

  // Update record mutation
  const updateRecord = useMutation({
    mutationFn: async (data: RecordUpdateData) => {
      const { id, field_values } = data;
      
      // Update each field value
      const promises = Object.entries(field_values).map(async ([field_api_name, value]) => {
        const { error } = await supabase
          .from('object_field_values')
          .upsert(
            { record_id: id, field_api_name, value },
            { onConflict: 'record_id,field_api_name' }
          );
          
        if (error) throw new Error(error.message);
      });
      
      await Promise.all(promises);
      
      // Update the record's updated_at timestamp
      const { error: recordError } = await supabase
        .from('object_records')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', id);
        
      if (recordError) throw new Error(recordError.message);
      
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paginatedObjectRecords', objectTypeId] });
    }
  });

  return {
    records,
    isLoading,
    totalCount,
    totalPages,
    refetch,
    deleteRecord,
    updateRecord,
    cloneRecord,
    error
  };
};
