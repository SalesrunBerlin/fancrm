
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { RecordFormData } from "@/lib/types/records";

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

export function useObjectRecords(objectTypeId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: records,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["object-records", objectTypeId],
    queryFn: async (): Promise<ObjectRecord[]> => {
      if (!objectTypeId || !user) {
        return [];
      }
      
      console.log(`Fetching records for object type: ${objectTypeId}`);
      
      // Get records
      const { data: recordsData, error: recordsError } = await supabase
        .from("object_records")
        .select("*")
        .eq("object_type_id", objectTypeId)
        .limit(100);
      
      if (recordsError) {
        console.error("Error fetching records:", recordsError);
        throw recordsError;
      }
      
      // Get field values for all records
      const recordIds = recordsData.map(record => record.id);
      
      if (recordIds.length === 0) {
        return [];
      }
      
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
      const recordsWithFieldValues = recordsData.map(record => ({
        ...record,
        field_values: fieldValuesByRecordId[record.id] || {}
      }));
      
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
      queryClient.invalidateQueries({ queryKey: ["object-records", objectTypeId] });
    }
  });

  const updateRecord = useMutation({
    mutationFn: async ({ id, field_values }: { id: string, field_values: RecordFormData }) => {
      if (!id || !user) {
        throw new Error("Missing record id or user");
      }
      
      console.log("Updating record:", id, "with data:", field_values);

      // Update the record's timestamp
      const { error: recordError } = await supabase
        .from("object_records")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", id);

      if (recordError) {
        console.error("Error updating record timestamp:", recordError);
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
    deleteRecord
  };
}
